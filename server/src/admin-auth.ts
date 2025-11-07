import { Request, Response, NextFunction } from "express";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

export function adminAuth(req: Request, res: Response, next: NextFunction) {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Basic ")) {
        return res.status(401).json({ error: "unauthorized" });
    }

    try {
        const base64 = auth.slice(6);
        const decoded = Buffer.from(base64, "base64").toString();
        const [username, password] = decoded.split(":");

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            return next();
        }

        res.status(401).json({ error: "invalid_credentials" });
    } catch {
        res.status(401).json({ error: "invalid_auth_header" });
    }
}
