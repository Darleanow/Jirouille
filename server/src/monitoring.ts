import { Router } from "express";
import { db } from "./db";
import { adminAuth } from "./admin-auth";
import { crdtSnapshot, crdtTotal } from "./crdt";

const router = Router();

router.use(adminAuth);

/** GET /monitoring/stats - Vue d'ensemble */
router.get("/stats", async (_req, res) => {
    try {
        // Count active WebSocket sessions
        const activeSessions = await db.get(
            "SELECT COUNT(*) as count FROM ws_sessions WHERE disconnectedAt IS NULL"
        );

        // Count total users
        const totalUsers = await db.get("SELECT COUNT(*) as count FROM users");

        // Count total tasks
        const totalTasks = await db.get("SELECT COUNT(*) as count FROM tasks");

        // Get recent logs count
        const recentLogs = await db.get(
            "SELECT COUNT(*) as count FROM logs WHERE at > datetime('now', '-1 hour')"
        );

        // Average latency from last 100 sessions
        const avgLatency = await db.get(
            "SELECT AVG(lastLatencyMs) as avg FROM ws_sessions WHERE lastLatencyMs IS NOT NULL ORDER BY connectedAt DESC LIMIT 100"
        );

        res.json({
            activeConnections: activeSessions.count,
            totalUsers: totalUsers.count,
            totalTasks: totalTasks.count,
            recentLogs: recentLogs.count,
            averageLatency: Math.round(avgLatency.avg || 0),
            crdtAuthEvents: crdtTotal(),
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /monitoring/sessions - Active WebSocket sessions */
router.get("/sessions", async (_req, res) => {
    try {
        const sessions = await db.all(`
            SELECT
                ws.id,
                ws.userId,
                u.username,
                ws.connectedAt,
                ws.lastLatencyMs,
                ws.disconnectedAt
            FROM ws_sessions ws
            LEFT JOIN users u ON ws.userId = u.id
            WHERE ws.disconnectedAt IS NULL
            ORDER BY ws.connectedAt DESC
            LIMIT 100
        `);
        res.json(sessions);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /monitoring/users - All users with stats */
router.get("/users", async (_req, res) => {
    try {
        const users = await db.all(`
            SELECT
                u.id,
                u.username,
                u.createdAt,
                COUNT(DISTINCT t.id) as taskCount,
                COUNT(DISTINCT ws.id) as sessionCount,
                MAX(ws.connectedAt) as lastSeen
            FROM users u
            LEFT JOIN tasks t ON t.userId = u.id
            LEFT JOIN ws_sessions ws ON ws.userId = u.id
            GROUP BY u.id
            ORDER BY u.createdAt DESC
        `);
        res.json(users);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /monitoring/logs - Recent logs */
router.get("/logs", async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 100, 500);
        const scope = req.query.scope as string | undefined;
        const level = req.query.level as string | undefined;

        let query = "SELECT * FROM logs WHERE 1=1";
        const params: any[] = [];

        if (scope) {
            query += " AND scope = ?";
            params.push(scope);
        }

        if (level) {
            query += " AND level = ?";
            params.push(level);
        }

        query += " ORDER BY at DESC LIMIT ?";
        params.push(limit);

        const logs = await db.all(query, ...params);
        res.json(logs);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /monitoring/latency - Latency history */
router.get("/latency", async (_req, res) => {
    try {
        const latency = await db.all(`
            SELECT
                id,
                userId,
                lastLatencyMs,
                connectedAt,
                disconnectedAt
            FROM ws_sessions
            WHERE lastLatencyMs IS NOT NULL
            ORDER BY connectedAt DESC
            LIMIT 200
        `);
        res.json(latency);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /monitoring/latency/live - Current latency of active sessions */
router.get("/latency/live", async (_req, res) => {
    try {
        const liveLatency = await db.all(`
            SELECT
                ws.id,
                ws.userId,
                u.username,
                ws.lastLatencyMs,
                ws.connectedAt
            FROM ws_sessions ws
            LEFT JOIN users u ON ws.userId = u.id
            WHERE ws.disconnectedAt IS NULL
            AND ws.lastLatencyMs IS NOT NULL
            ORDER BY ws.lastLatencyMs DESC
        `);
        res.json(liveLatency);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

/** GET /monitoring/crdt-auth - CRDT auth counter */
router.get("/crdt-auth", (_req, res) => {
    res.json({
        type: "crdt-auth-summary",
        total: crdtTotal(),
        state: crdtSnapshot(),
    });
});

export default router;
