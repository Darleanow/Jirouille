/**
 * Security helpers:
 * - Input validation schema using Zod
 * - String sanitization
 * - Simple in-memory rate limiter per IP
 */

import { z } from "zod";
import { Request, Response, NextFunction } from "express";

// Credential validation schema
export const credsSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(4).max(200),
});

// Basic sanitization (trim + remove control chars)
export function sanitizeStr(s: string) {
    return s.trim().replace(/[\u0000-\u001F\u007F]/g, "");
}

// In-memory rate limiter (IP → count/reset)
const windowMs = 10_000; // 10 seconds
const maxPerWindow = 30;
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(req: Request, res: Response, next: NextFunction) {
    const ip =
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress ||
        "unknown";

    const now = Date.now();
    const hit = hits.get(ip) ?? { count: 0, reset: now + windowMs };
    if (now > hit.reset) {
        hit.count = 0;
        hit.reset = now + windowMs;
    }
    hit.count++;
    hits.set(ip, hit);

    if (hit.count > maxPerWindow) {
        return res.status(429).json({ error: "rate_limited" });
    }

    next();
}
