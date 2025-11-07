"use client";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { connectWS } from "@/lib/ws";
import type { SocketServerMessage } from "@/lib/types";

export function PresenceBadge() {
    const token = useAuthStore((s) => s.user?.token);
    const [connections, setConn] = useState<number>(0);
    const [latency, setLatency] = useState<number | null>(null);
    const ref = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!token) return;
        ref.current?.close();
        ref.current = connectWS(token, (m: SocketServerMessage) => {
            if (m.type === "welcome") setConn(m.connections);
            if (m.type === "presence") setConn(m.count);
            if (m.type === "pong") setLatency(Date.now() - m.t);
        });
        return () => ref.current?.close();
    }, [token]);

    if (!token) return null;
    return (
        <div className="fixed bottom-4 right-4 text-xs bg-background border rounded px-3 py-2 shadow">
            <div>Connections: {connections}</div>
            <div>Latency: {latency ?? "—"} ms</div>
        </div>
    );
}
