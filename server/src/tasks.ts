import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { db } from "./db";
import { log } from "./logger";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const taskSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(["todo", "in_progress", "done"]).default("todo"),
});

function getUserFromToken(authHeader?: string): string | null {
    try {
        if (!authHeader?.startsWith("Bearer ")) return null;
        const token = authHeader.slice(7);
        const payload = jwt.verify(token, JWT_SECRET) as any;
        return payload.sub;
    } catch {
        return null;
    }
}

router.get("/", async (req, res) => {
    const userId = getUserFromToken(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const tasks = await db.all(
        "SELECT * FROM tasks WHERE userId = ? ORDER BY createdAt DESC",
        userId
    );
    res.json(tasks);
});

router.post("/", async (req, res) => {
    const userId = getUserFromToken(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    try {
        const data = taskSchema.parse(req.body);
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await db.run(
            "INSERT INTO tasks(id, userId, title, description, status, createdAt, updatedAt) VALUES(?,?,?,?,?,?,?)",
            id,
            userId,
            data.title,
            data.description || null,
            data.status,
            now,
            now
        );

        const task = await db.get("SELECT * FROM tasks WHERE id = ?", id);
        log("tasks", "info", "task_created", { id, userId });
        res.json(task);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.put("/:id", async (req, res) => {
    const userId = getUserFromToken(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    try {
        const data = taskSchema.partial().parse(req.body);
        const task = await db.get(
            "SELECT * FROM tasks WHERE id = ? AND userId = ?",
            req.params.id,
            userId
        );
        if (!task) return res.status(404).json({ error: "not_found" });

        const now = new Date().toISOString();
        await db.run(
            "UPDATE tasks SET title = ?, description = ?, status = ?, updatedAt = ? WHERE id = ?",
            data.title ?? task.title,
            data.description ?? task.description,
            data.status ?? task.status,
            now,
            req.params.id
        );

        const updated = await db.get(
            "SELECT * FROM tasks WHERE id = ?",
            req.params.id
        );
        log("tasks", "info", "task_updated", { id: req.params.id, userId });
        res.json(updated);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.delete("/:id", async (req, res) => {
    const userId = getUserFromToken(req.headers.authorization);
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const task = await db.get(
        "SELECT * FROM tasks WHERE id = ? AND userId = ?",
        req.params.id,
        userId
    );
    if (!task) return res.status(404).json({ error: "not_found" });

    await db.run("DELETE FROM tasks WHERE id = ?", req.params.id);
    log("tasks", "info", "task_deleted", { id: req.params.id, userId });
    res.json({ ok: true });
});

export default router;
