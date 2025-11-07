import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { credsSchema, sanitizeStr } from "./security";
import { db } from "./db";
import { log } from "./logger";
import { crdtIncrementAuth } from "./crdt";
import type { AuthRequest, AuthResponse } from "./types";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function signToken(id: string, username: string) {
    return jwt.sign({ sub: id, username }, JWT_SECRET, { expiresIn: "7d" });
}

/** POST /auth/register */
router.post("/register", async (req, res) => {
    try {
        const { username, password } = credsSchema.parse(
            req.body as AuthRequest
        );
        const clean = sanitizeStr(username);
        const passhash = await bcrypt.hash(password, 10);
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        await db.run(
            "INSERT INTO users(id, username, passhash, createdAt) VALUES(?,?,?,?)",
            id,
            clean,
            passhash,
            createdAt
        );

        const response: AuthResponse = {
            id,
            username: clean,
            token: signToken(id, clean),
        };
        crdtIncrementAuth(); // CRDT auth event
        log("auth", "info", "user_registered", { id, username: clean });
        res.json(response);
    } catch (e: any) {
        log("auth", "warn", "register_failed", { error: e.message });
        if (String(e.message).includes("UNIQUE"))
            return res.status(409).json({ error: "username_taken" });
        res.status(400).json({ error: e.message });
    }
});

/** POST /auth/login */
router.post("/login", async (req, res) => {
    try {
        const { username, password } = credsSchema.parse(
            req.body as AuthRequest
        );
        const clean = sanitizeStr(username);
        const row = await db.get(
            "SELECT * FROM users WHERE username = ?",
            clean
        );
        if (!row) return res.status(401).json({ error: "invalid_credentials" });

        const ok = await bcrypt.compare(password, row.passhash);
        if (!ok) return res.status(401).json({ error: "invalid_credentials" });

        const response: AuthResponse = {
            id: row.id,
            username: row.username,
            token: signToken(row.id, row.username),
        };
        crdtIncrementAuth(); // CRDT auth event
        log("auth", "info", "user_login", { id: row.id });
        res.json(response);
    } catch (e: any) {
        log("auth", "warn", "login_failed", { error: e.message });
        res.status(400).json({ error: e.message });
    }
});

/** GET /auth/me */
router.get("/me", async (req, res) => {
    try {
        const auth = req.headers.authorization || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        const payload = jwt.verify(token, JWT_SECRET) as any;

        const row = await db.get(
            "SELECT id, username FROM users WHERE id = ?",
            payload.sub
        );
        if (!row) return res.status(401).json({ error: "unauthorized" });

        const response: AuthResponse = {
            id: row.id,
            username: row.username,
            token,
        };
        res.json(response);
    } catch {
        res.status(401).json({ error: "unauthorized" });
    }
});

export default router;
