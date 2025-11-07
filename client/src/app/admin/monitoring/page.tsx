"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MonitoringAPI } from "@/lib/api/monitoring";
import { LatencyMonitor } from "@/components/admin/latency-monitor";
import type {
    MonitoringStats,
    SessionData,
    UserData,
    LogData,
    LatencyData,
    LiveLatencyData,
} from "@/lib/api/monitoring";

function getCredentials(): [string, string] | null {
    const auth = sessionStorage.getItem("admin_auth");
    if (!auth) return null;
    try {
        const decoded = atob(auth);
        const [username, password] = decoded.split(":");
        return [username, password];
    } catch {
        return null;
    }
}

export default function MonitoringPage() {
    const router = useRouter();
    const [stats, setStats] = useState<MonitoringStats | null>(null);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [logs, setLogs] = useState<LogData[]>([]);
    const [latency, setLatency] = useState<LatencyData[]>([]);
    const [liveLatency, setLiveLatency] = useState<LiveLatencyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<
        "stats" | "sessions" | "users" | "logs" | "latency"
    >("stats");

    useEffect(() => {
        const creds = getCredentials();
        if (!creds) {
            router.push("/admin/login");
            return;
        }
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [router]);

    const loadData = async () => {
        const creds = getCredentials();
        if (!creds) return;

        const [username, password] = creds;

        try {
            const [
                statsData,
                sessionsData,
                usersData,
                logsData,
                latencyData,
                liveLatencyData,
            ] = await Promise.all([
                MonitoringAPI.getStats(username, password),
                MonitoringAPI.getSessions(username, password),
                MonitoringAPI.getUsers(username, password),
                MonitoringAPI.getLogs(username, password, { limit: 50 }),
                MonitoringAPI.getLatency(username, password),
                MonitoringAPI.getLiveLatency(username, password),
            ]);

            setStats(statsData);
            setSessions(sessionsData);
            setUsers(usersData);
            setLogs(logsData);
            setLatency(latencyData);
            setLiveLatency(liveLatencyData);
            setError("");
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("admin_auth");
        document.cookie = "admin_auth=; path=/; max-age=0";
        router.push("/admin/login");
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-muted p-8">
                <div className="max-w-7xl mx-auto">
                    <p>Loading monitoring data...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-muted p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-red-600">Error: {error}</p>
                    <Button onClick={handleLogout} className="mt-4">
                        Logout
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-muted p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">
                        Admin Monitoring Dashboard
                    </h1>
                    <Button variant="outline" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>

                {/* Stats Overview */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <StatCard
                            title="Active Connections"
                            value={stats.activeConnections}
                            color="bg-green-100"
                        />
                        <StatCard
                            title="Total Users"
                            value={stats.totalUsers}
                            color="bg-blue-100"
                        />
                        <StatCard
                            title="Total Tasks"
                            value={stats.totalTasks}
                            color="bg-purple-100"
                        />
                        <StatCard
                            title="Recent Logs"
                            value={stats.recentLogs}
                            color="bg-yellow-100"
                        />
                        <StatCard
                            title="Avg Latency"
                            value={`${stats.averageLatency}ms`}
                            color="bg-orange-100"
                        />
                        <StatCard
                            title="Auth Events"
                            value={stats.crdtAuthEvents}
                            color="bg-red-100"
                        />
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    <TabButton
                        active={activeTab === "stats"}
                        onClick={() => setActiveTab("stats")}
                    >
                        Stats
                    </TabButton>
                    <TabButton
                        active={activeTab === "sessions"}
                        onClick={() => setActiveTab("sessions")}
                    >
                        Sessions ({sessions.length})
                    </TabButton>
                    <TabButton
                        active={activeTab === "users"}
                        onClick={() => setActiveTab("users")}
                    >
                        Users ({users.length})
                    </TabButton>
                    <TabButton
                        active={activeTab === "logs"}
                        onClick={() => setActiveTab("logs")}
                    >
                        Logs ({logs.length})
                    </TabButton>
                    <TabButton
                        active={activeTab === "latency"}
                        onClick={() => setActiveTab("latency")}
                    >
                        Latency ({liveLatency.length} live)
                    </TabButton>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-lg shadow p-6">
                    {activeTab === "stats" && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">
                                System Overview
                            </h2>
                            <p className="text-muted-foreground">
                                Real-time monitoring via ping/pong WebSocket
                            </p>
                            {stats && (
                                <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                                    {JSON.stringify(stats, null, 2)}
                                </pre>
                            )}
                        </div>
                    )}

                    {activeTab === "sessions" && (
                        <SessionsTable sessions={sessions} />
                    )}

                    {activeTab === "users" && <UsersTable users={users} />}

                    {activeTab === "logs" && <LogsTable logs={logs} />}

                    {activeTab === "latency" && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold">
                                Live Latency Monitor (Ping/Pong)
                            </h2>
                            <LatencyMonitor data={liveLatency} />
                            <hr className="my-6" />
                            <h2 className="text-xl font-semibold mt-6">
                                Historical Data
                            </h2>
                            <LatencyHistoryTable latency={latency} />
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function StatCard({
    title,
    value,
    color,
}: {
    title: string;
    value: string | number;
    color: string;
}) {
    return (
        <div className={`${color} rounded-lg shadow p-4`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{title}</div>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <Button
            variant={active ? "default" : "outline"}
            onClick={onClick}
            className="whitespace-nowrap"
        >
            {children}
        </Button>
    );
}

function SessionsTable({ sessions }: { sessions: SessionData[] }) {
    if (sessions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No active sessions
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Active WebSocket Sessions</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left p-2">Session ID</th>
                            <th className="text-left p-2">Username</th>
                            <th className="text-left p-2">Connected</th>
                            <th className="text-left p-2">
                                Latency (Ping/Pong)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((s) => (
                            <tr key={s.id} className="border-b">
                                <td className="p-2 font-mono text-xs">
                                    {s.id.slice(0, 8)}...
                                </td>
                                <td className="p-2">{s.username || "Guest"}</td>
                                <td className="p-2">
                                    {new Date(s.connectedAt).toLocaleString()}
                                </td>
                                <td className="p-2">
                                    {s.lastLatencyMs !== null
                                        ? `${s.lastLatencyMs}ms`
                                        : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function UsersTable({ users }: { users: UserData[] }) {
    if (users.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No users found
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Users</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left p-2">Username</th>
                            <th className="text-left p-2">Created</th>
                            <th className="text-left p-2">Tasks</th>
                            <th className="text-left p-2">Sessions</th>
                            <th className="text-left p-2">Last Seen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} className="border-b">
                                <td className="p-2 font-semibold">
                                    {u.username}
                                </td>
                                <td className="p-2">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-2">{u.taskCount}</td>
                                <td className="p-2">{u.sessionCount}</td>
                                <td className="p-2">
                                    {u.lastSeen
                                        ? new Date(u.lastSeen).toLocaleString()
                                        : "Never"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function LogsTable({ logs }: { logs: LogData[] }) {
    const levelColors = {
        info: "text-blue-600",
        warn: "text-yellow-600",
        error: "text-red-600",
    };

    function formatMeta(meta: string | null): string {
        if (!meta) return "—";
        try {
            const parsed = JSON.parse(meta);
            return JSON.stringify(parsed);
        } catch {
            return meta;
        }
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No logs found
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Logs</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left p-2">Time</th>
                            <th className="text-left p-2">Level</th>
                            <th className="text-left p-2">Scope</th>
                            <th className="text-left p-2">Message</th>
                            <th className="text-left p-2">Meta</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} className="border-b">
                                <td className="p-2 text-xs">
                                    {new Date(log.at).toLocaleTimeString()}
                                </td>
                                <td
                                    className={`p-2 font-semibold ${
                                        levelColors[log.level]
                                    }`}
                                >
                                    {log.level}
                                </td>
                                <td className="p-2">{log.scope}</td>
                                <td className="p-2">{log.message}</td>
                                <td className="p-2 text-xs">
                                    {formatMeta(log.meta)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function LatencyHistoryTable({ latency }: { latency: LatencyData[] }) {
    if (latency.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No latency data
            </div>
        );
    }

    const avgLatency =
        latency.reduce((sum, l) => sum + l.lastLatencyMs, 0) / latency.length;

    return (
        <div className="space-y-4">
            <div>
                <p className="text-sm text-muted-foreground">
                    Historical Average: {Math.round(avgLatency)}ms
                </p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left p-2">Session</th>
                            <th className="text-left p-2">Latency</th>
                            <th className="text-left p-2">Connected</th>
                            <th className="text-left p-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {latency.slice(0, 50).map((l) => (
                            <tr key={l.id} className="border-b">
                                <td className="p-2 font-mono text-xs">
                                    {l.id.slice(0, 8)}...
                                </td>
                                <td className="p-2 font-semibold">
                                    {l.lastLatencyMs}ms
                                </td>
                                <td className="p-2 text-xs">
                                    {new Date(l.connectedAt).toLocaleString()}
                                </td>
                                <td className="p-2">
                                    {l.disconnectedAt ? (
                                        <span className="text-red-600">
                                            Disconnected
                                        </span>
                                    ) : (
                                        <span className="text-green-600">
                                            Active
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
