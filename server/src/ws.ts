import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "./db";
import { log } from "./logger";
import type {
    SocketServerMessage,
    WebSocketIncomingMessage,
    WebSocketPresence,
    WebSocketWelcome,
    WebSocketPong,
} from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

type Client = {
    ws: WebSocket;
    sessionId: string;
    userId?: string;
    username?: string;
};
const clients = new Set<Client>();

function broadcast(msg: SocketServerMessage) {
    const json = JSON.stringify(msg);
    for (const c of clients)
        if (c.ws.readyState === WebSocket.OPEN) c.ws.send(json);
}

function presence(): WebSocketPresence {
    return {
        type: "presence",
        count: clients.size,
        users: Array.from(clients).map((c) => ({
            sessionId: c.sessionId,
            userId: c.userId ?? null,
            username: c.username ?? "guest",
        })),
    };
}

export function attachWebSocket(server: any) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", async (ws, req) => {
        const sessionId = crypto.randomUUID();
        let userId: string | undefined;
        let username: string | undefined;

        try {
            const url = new URL(req.url ?? "", "http://localhost");
            const token = url.searchParams.get("token");
            if (token) {
                const p = jwt.verify(token, JWT_SECRET) as any;
                userId = String(p.sub);
                username = String(p.username);
            }
        } catch {
            /* ignore invalid token */
        }

        const client: Client = { ws, sessionId, userId, username };
        clients.add(client);

        await db.run(
            "INSERT INTO ws_sessions(id, userId, connectedAt) VALUES(?,?,?)",
            sessionId,
            userId ?? null,
            new Date().toISOString()
        );
        log("ws", "info", "connection_open", { sessionId, userId });

        const welcome: WebSocketWelcome = {
            type: "welcome",
            connections: clients.size,
            you: { sessionId, userId, username: username ?? "guest" },
        };
        ws.send(JSON.stringify(welcome));
        broadcast(presence());

        ws.on("message", async (raw: Buffer) => {
            try {
                const msg = JSON.parse(
                    raw.toString()
                ) as WebSocketIncomingMessage;
                if (msg.type === "ping") {
                    const pong: WebSocketPong = { type: "pong", t: msg.t };
                    ws.send(JSON.stringify(pong));
                    await db.run(
                        "UPDATE ws_sessions SET lastLatencyMs = ? WHERE id = ?",
                        Date.now() - msg.t,
                        sessionId
                    );
                }
            } catch {
                /* ignore invalid payload */
            }
        });

        ws.on("close", async () => {
            clients.delete(client);
            await db.run(
                "UPDATE ws_sessions SET disconnectedAt = ? WHERE id = ?",
                new Date().toISOString(),
                sessionId
            );
            log("ws", "info", "connection_closed", { sessionId });
            broadcast(presence());
        });
    });
}
