import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import { initDB } from "./db";
import { rateLimit } from "./security";
import authRoutes from "./auth";
import taskRoutes from "./tasks";
import monitoringRoutes from "./monitoring";
import { attachWebSocket } from "./ws";

dotenv.config();
const PORT = Number(process.env.PORT || 3001);

async function main() {
    await initDB();

    const app = express();

    app.use(
        cors({
            origin: "http://localhost:3000",
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
        })
    );

    app.use(express.json({ limit: "10kb" }));

    app.use(rateLimit);

    app.get("/health", (_req, res) =>
        res.json({ ok: true, uptime: process.uptime() })
    );

    app.use("/auth", authRoutes);
    app.use("/tasks", taskRoutes);
    app.use("/monitoring", monitoringRoutes);

    const server = http.createServer(app);
    attachWebSocket(server);

    server.listen(PORT, () =>
        console.log(`API + WS server running on http://localhost:${PORT}`)
    );
}

main().catch((err) => {
    console.error("Fatal init error:", err);
    process.exit(1);
});
