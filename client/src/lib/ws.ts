import type { SocketServerMessage, WebSocketIncomingMessage } from "./types";

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";

type MessageHandler = (message: SocketServerMessage) => void;
type ConnectionStatusHandler = (
    status: "connected" | "disconnected" | "reconnecting"
) => void;

const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000];
const MAX_RETRY_ATTEMPTS = 5;

export function connectWS(
    token?: string,
    onMessage?: MessageHandler,
    onStatusChange?: ConnectionStatusHandler
): {
    ws: WebSocket | null;
    disconnect: () => void;
    forceDisconnect: () => void;
} {
    let ws: WebSocket | null = null;
    let retryCount = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let pingIntervalId: ReturnType<typeof setInterval> | null = null;
    let intentionallyClosed = false;

    function getRetryDelay(): number {
        const delay =
            RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)];
        return delay;
    }

    function cleanup() {
        if (pingIntervalId) {
            clearInterval(pingIntervalId);
            pingIntervalId = null;
        }
        if (retryTimeout) {
            clearTimeout(retryTimeout);
            retryTimeout = null;
        }
    }

    function connect() {
        if (intentionallyClosed) return;

        const url = token
            ? `${WS_BASE_URL}?token=${encodeURIComponent(token)}`
            : WS_BASE_URL;

        ws = new WebSocket(url);

        const sendPing = () => {
            const message: WebSocketIncomingMessage = {
                type: "ping",
                t: Date.now(),
            };
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        };

        ws.onopen = () => {
            console.log("WebSocket connected");
            retryCount = 0;
            onStatusChange?.("connected");
            pingIntervalId = setInterval(sendPing, 5000);
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected");
            cleanup();
            onStatusChange?.("disconnected");

            if (!intentionallyClosed && retryCount < MAX_RETRY_ATTEMPTS) {
                const delay = getRetryDelay();
                console.log(
                    `Reconnecting in ${delay}ms (attempt ${
                        retryCount + 1
                    }/${MAX_RETRY_ATTEMPTS})...`
                );
                onStatusChange?.("reconnecting");

                retryTimeout = setTimeout(() => {
                    retryCount++;
                    connect();
                }, delay);
            } else if (retryCount >= MAX_RETRY_ATTEMPTS) {
                console.error("Max retry attempts reached. Giving up.");
                onStatusChange?.("disconnected");
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.onmessage = (event: MessageEvent) => {
            try {
                const parsedMessage = JSON.parse(
                    event.data
                ) as SocketServerMessage;
                onMessage?.(parsedMessage);
            } catch {}
        };
    }

    function disconnect() {
        intentionallyClosed = true;
        cleanup();
        if (ws) {
            ws.close();
            ws = null;
        }
    }

    function forceDisconnect() {
        cleanup();
        if (ws) {
            ws.close();
        }
    }

    connect();

    return { ws, disconnect, forceDisconnect };
}
