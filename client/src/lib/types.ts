/** Shared application types (frontend + backend). */

/** User payloads */
export type User = {
    id: string;
    username: string;
    createdAt?: string; // optional when returned by /me
};

export type AuthRequest = {
    username: string;
    password: string;
};

export type AuthResponse = {
    id: string;
    username: string;
    token: string;
};

/** Task types */
export type Task = {
    id: string;
    userId: string;
    title: string;
    description?: string;
    status: "todo" | "in_progress" | "done";
    createdAt: string;
    updatedAt: string;
};

/** WebSocket presence + latency */
export type WebSocketWelcome = {
    type: "welcome";
    connections: number;
    you: { sessionId: string; userId?: string; username: string };
};

export type WebSocketPresence = {
    type: "presence";
    count: number;
    users: Array<{
        sessionId: string;
        userId: string | null;
        username: string;
    }>;
};

export type WebSocketPong = { type: "pong"; t: number };
export type WebSocketIncomingMessage = { type: "ping"; t: number };

/** Task sync events */
export type WebSocketTaskCreated = {
    type: "task-created";
    task: Task;
};

export type WebSocketTaskUpdated = {
    type: "task-updated";
    task: Task;
};

export type WebSocketTaskDeleted = {
    type: "task-deleted";
    taskId: string;
};

export type SocketServerMessage =
    | WebSocketWelcome
    | WebSocketPresence
    | WebSocketPong
    | WebSocketTaskCreated
    | WebSocketTaskUpdated
    | WebSocketTaskDeleted;

/** Minimal CRDT (G-Counter) for auth events (monotonic). */
export type GCounter = {
    /** Per-node map: nodeId -> count */
    counts: Record<string, number>;
};

export type CRDTAuthSummary = {
    type: "crdt-auth-summary";
    /** Total increments across merged counters */
    total: number;
    /** Raw state (for visualization/debug) */
    state: GCounter;
};
