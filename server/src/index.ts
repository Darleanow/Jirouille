import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

// --- Express Server Setup ---
const app = express();
app.use(express.json());

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// --- HTTP Server (required for WebSocket) ---
const server = http.createServer(app);

// --- WebSocket Server ---
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message: string) => {
    console.log('Received:', message);
    // Echo back
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

