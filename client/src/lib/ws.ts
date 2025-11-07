import type { SocketServerMessage, WebSocketIncomingMessage } from "./types";

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";

type MessageHandler = (message: SocketServerMessage) => void;

export function connectWS(
    token?: string,
    onMessage?: MessageHandler
): WebSocket {
    const url = token
        ? `${WS_BASE_URL}?token=${encodeURIComponent(token)}`
        : WS_BASE_URL;

    const ws = new WebSocket(url);

    const sendPing = () => {
        const message: WebSocketIncomingMessage = {
            type: "ping",
            t: Date.now(),
        };
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    };

    let pingIntervalId: ReturnType<typeof setInterval> | null = null;

    ws.onopen = () => {
        pingIntervalId = setInterval(sendPing, 5000);
    };

    ws.onclose = () => {
        if (pingIntervalId) {
            clearInterval(pingIntervalId);
        }
    };

    ws.onmessage = (event: MessageEvent) => {
        try {
            const parsedMessage = JSON.parse(event.data) as SocketServerMessage;
            onMessage?.(parsedMessage);
        } catch {
            // Invalid message format, ignoring
        }
    };

    return ws;
}
