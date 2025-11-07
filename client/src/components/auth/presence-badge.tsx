"use client";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { connectWS } from "@/lib/ws";
import type { SocketServerMessage } from "@/lib/types";

type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

export function PresenceBadge() {
    const token = useAuthStore((s) => s.user?.token);
    const [connections, setConn] = useState<number>(0);
    const [latency, setLatency] = useState<number | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const disconnectRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!token) return;

        if (disconnectRef.current) {
            disconnectRef.current();
        }

        const handleMessage = (m: SocketServerMessage) => {
            if (m.type === "welcome") setConn(m.connections);
            if (m.type === "presence") setConn(m.count);
            if (m.type === "pong") setLatency(Date.now() - m.t);
        };

        const handleStatusChange = (newStatus: ConnectionStatus) => {
            setStatus(newStatus);
        };

        const { disconnect } = connectWS(
            token,
            handleMessage,
            handleStatusChange
        );
        disconnectRef.current = disconnect;

        return () => {
            disconnect();
        };
    }, [token]);

    if (!token) return null;

    const statusConfig = {
        connected: { color: "bg-green-500", text: "Connected" },
        reconnecting: { color: "bg-yellow-500", text: "Reconnecting..." },
        disconnected: { color: "bg-red-500", text: "Disconnected" },
    };

    const currentStatus = statusConfig[status];

    return (
        <div className="fixed bottom-4 right-4 text-xs bg-background border rounded px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
                <div
                    className={`w-2 h-2 rounded-full ${currentStatus.color}`}
                />
                <span className="font-medium">{currentStatus.text}</span>
            </div>
            <div className="text-muted-foreground">
                <div>Users: {connections}</div>
                <div>Latency: {latency ?? "—"} ms</div>
            </div>
        </div>
    );
}
