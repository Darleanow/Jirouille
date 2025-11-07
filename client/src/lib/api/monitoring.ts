const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function createBasicAuth(username: string, password: string): string {
    return `Basic ${btoa(`${username}:${password}`)}`;
}

async function request<T>(
    path: string,
    username: string,
    password: string
): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: {
            Authorization: createBasicAuth(username, password),
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
    }

    return res.json() as Promise<T>;
}

export type MonitoringStats = {
    activeConnections: number;
    totalUsers: number;
    totalTasks: number;
    recentLogs: number;
    averageLatency: number;
    crdtAuthEvents: number;
};

export type SessionData = {
    id: string;
    userId: string | null;
    username: string | null;
    connectedAt: string;
    lastLatencyMs: number | null;
    disconnectedAt: string | null;
};

export type UserData = {
    id: string;
    username: string;
    createdAt: string;
    taskCount: number;
    sessionCount: number;
    lastSeen: string | null;
};

export type LogData = {
    id: number;
    at: string;
    level: "info" | "warn" | "error";
    scope: string;
    message: string;
    meta: string | null;
};

export type LatencyData = {
    id: string;
    userId: string | null;
    lastLatencyMs: number;
    connectedAt: string;
    disconnectedAt: string | null;
};

export type LiveLatencyData = {
    id: string;
    userId: string | null;
    username: string | null;
    lastLatencyMs: number;
    connectedAt: string;
};

export const MonitoringAPI = {
    getStats: (username: string, password: string) =>
        request<MonitoringStats>("/monitoring/stats", username, password),

    getSessions: (username: string, password: string) =>
        request<SessionData[]>("/monitoring/sessions", username, password),

    getUsers: (username: string, password: string) =>
        request<UserData[]>("/monitoring/users", username, password),

    getLogs: (
        username: string,
        password: string,
        params?: { limit?: number; scope?: string; level?: string }
    ) => {
        const query = new URLSearchParams();
        if (params?.limit) query.set("limit", String(params.limit));
        if (params?.scope) query.set("scope", params.scope);
        if (params?.level) query.set("level", params.level);
        const queryString = query.toString();
        return request<LogData[]>(
            `/monitoring/logs${queryString ? `?${queryString}` : ""}`,
            username,
            password
        );
    },

    getLatency: (username: string, password: string) =>
        request<LatencyData[]>("/monitoring/latency", username, password),

    getLiveLatency: (username: string, password: string) =>
        request<LiveLatencyData[]>(
            "/monitoring/latency/live",
            username,
            password
        ),
};
