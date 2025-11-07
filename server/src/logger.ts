import { db } from "./db";

export async function log(
    scope: string,
    level: "info" | "warn" | "error",
    message: string,
    meta?: unknown
) {
    try {
        await db.run(
            "INSERT INTO logs(at, level, scope, message, meta) VALUES(?,?,?,?,?)",
            new Date().toISOString(),
            level,
            scope,
            message,
            meta ? JSON.stringify(meta) : null
        );
    } catch (e) {
        console.error("[log-failed]", e);
    }
}
