"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { TasksAPI, Task } from "@/lib/api/tasks";
import { connectWS } from "@/lib/ws";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SocketServerMessage } from "@/lib/types";

export default function DashboardPage() {
    const { user, logout, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [wsConnected, setWsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    const loadTasks = useCallback(async () => {
        if (!user) return;
        try {
            const data = await TasksAPI.list(user.token);
            setTasks(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;

        const handleMessage = (message: SocketServerMessage) => {
            switch (message.type) {
                case "welcome":
                    setWsConnected(true);
                    console.log("Connected as:", message.you.username);
                    break;

                case "task-created":
                    console.log("Task created:", message.task);
                    setTasks((prev) => {
                        if (prev.some((t) => t.id === message.task.id))
                            return prev;
                        return [message.task, ...prev];
                    });
                    break;

                case "task-updated":
                    console.log("Task updated:", message.task);
                    setTasks((prev) =>
                        prev.map((t) =>
                            t.id === message.task.id ? message.task : t
                        )
                    );
                    break;

                case "task-deleted":
                    console.log("Task deleted:", message.taskId);
                    setTasks((prev) =>
                        prev.filter((t) => t.id !== message.taskId)
                    );
                    break;

                case "presence":
                    console.log("Connected users:", message.count);
                    break;
            }
        };

        const ws = connectWS(user.token, handleMessage);
        wsRef.current = ws;

        return () => {
            setWsConnected(false);
            ws.close();
        };
    }, [user]);

    useEffect(() => {
        if (!_hasHydrated) return;
        if (!user) {
            router.push("/login");
            return;
        }
        loadTasks();
    }, [loadTasks, router, _hasHydrated, user]);

    const createTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title.trim()) return;
        try {
            await TasksAPI.create({ title, description }, user.token);
            setTitle("");
            setDescription("");
        } catch (e) {
            console.error(e);
        }
    };

    const updateStatus = async (id: string, status: Task["status"]) => {
        if (!user) return;
        try {
            await TasksAPI.update(id, { status }, user.token);
        } catch (e) {
            console.error(e);
        }
    };

    const deleteTask = async (id: string) => {
        if (!user) return;
        try {
            await TasksAPI.delete(id, user.token);
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    if (!_hasHydrated || !user) return null;

    return (
        <main className="min-h-screen bg-muted p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Welcome, {user.username}
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <div
                                className={`w-2 h-2 rounded-full ${
                                    wsConnected ? "bg-green-500" : "bg-red-500"
                                }`}
                            />
                            <span className="text-sm text-muted-foreground">
                                {wsConnected
                                    ? "Real-time sync active"
                                    : "Connecting..."}
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>

                <form
                    onSubmit={createTask}
                    className="bg-white p-6 rounded-lg shadow mb-8"
                >
                    <h2 className="text-xl font-semibold mb-4">Create Task</h2>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Task title"
                        className="mb-3"
                        required
                    />
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="mb-3"
                    />
                    <Button type="submit">Add Task</Button>
                </form>

                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Tasks</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : tasks.length === 0 ? (
                        <p className="text-muted-foreground">No tasks yet</p>
                    ) : (
                        tasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-white p-4 rounded-lg shadow"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-medium">
                                        {task.title}
                                    </h3>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => deleteTask(task.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                                {task.description && (
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {task.description}
                                    </p>
                                )}
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant={
                                            task.status === "todo"
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() =>
                                            updateStatus(task.id, "todo")
                                        }
                                    >
                                        Todo
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={
                                            task.status === "in_progress"
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() =>
                                            updateStatus(task.id, "in_progress")
                                        }
                                    >
                                        In Progress
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={
                                            task.status === "done"
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() =>
                                            updateStatus(task.id, "done")
                                        }
                                    >
                                        Done
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
