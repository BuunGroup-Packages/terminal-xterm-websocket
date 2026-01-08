import { WebSocketServer, WebSocket } from 'ws';
import * as pty from 'node-pty';
import { platform } from 'os';
import { accessSync } from 'fs';

const PORT = 3001;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Choose shell - handles Docker Alpine (no bash) and allows override via env
const getShell = () => {
  if (process.env.SHELL_PATH) return process.env.SHELL_PATH;
  if (platform() === 'win32') return 'powershell.exe';
  try {
    accessSync('/bin/bash');
    return '/bin/bash';
  } catch {
    return '/bin/sh'; // Fallback for Alpine Linux
  }
};
const shell = getShell();

const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server running on ws://localhost:${PORT}`);
console.log(`Using shell: ${shell}`);

// Validate terminal dimensions to prevent abuse
function validateResize(cols: number, rows: number): boolean {
  return (
    Number.isInteger(cols) &&
    Number.isInteger(rows) &&
    cols >= 1 && cols <= 500 &&
    rows >= 1 && rows <= 200
  );
}

// Track active connections for logging
let connectionCount = 0;

wss.on('connection', (ws: WebSocket) => {
  connectionCount++;
  const connectionId = connectionCount;
  console.log(`[${connectionId}] Client connected (${wss.clients.size} total)`);

  // Heartbeat tracking
  let isAlive = true;

  ws.on('pong', () => {
    isAlive = true;
  });

  // Heartbeat interval - ping client every 30 seconds
  const heartbeat = setInterval(() => {
    if (!isAlive) {
      console.log(`[${connectionId}] Client unresponsive, terminating`);
      ws.terminate();
      return;
    }
    isAlive = false;
    ws.ping();
  }, HEARTBEAT_INTERVAL);

  // Spawn PTY process
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME || process.cwd(),
    env: process.env as Record<string, string>,
  });

  console.log(`[${connectionId}] PTY spawned (PID: ${ptyProcess.pid})`);

  // Send PTY output to client
  ptyProcess.onData((data: string) => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data }));
      }
    } catch (err) {
      console.error(`[${connectionId}] Error sending data:`, err);
    }
  });

  // Handle PTY exit
  ptyProcess.onExit(({ exitCode, signal }) => {
    console.log(`[${connectionId}] PTY exited (code: ${exitCode}, signal: ${signal})`);
    clearInterval(heartbeat);
    ws.close();
  });

  // Handle messages from client
  ws.on('message', (message: Buffer) => {
    try {
      const msg = JSON.parse(message.toString());

      switch (msg.type) {
        case 'input':
          // Write user input to PTY
          if (typeof msg.data === 'string') {
            ptyProcess.write(msg.data);
          }
          break;

        case 'resize':
          // Validate and resize PTY
          if (validateResize(msg.cols, msg.rows)) {
            ptyProcess.resize(msg.cols, msg.rows);
          } else {
            console.warn(`[${connectionId}] Invalid resize request: ${msg.cols}x${msg.rows}`);
          }
          break;

        default:
          console.warn(`[${connectionId}] Unknown message type: ${msg.type}`);
      }
    } catch (err) {
      console.error(`[${connectionId}] Error parsing message:`, err);
    }
  });

  // Handle client disconnect
  ws.on('close', (code, reason) => {
    console.log(`[${connectionId}] Client disconnected (code: ${code}, reason: ${reason || 'none'})`);
    clearInterval(heartbeat);
    ptyProcess.kill();
  });

  // Handle errors
  ws.on('error', (err) => {
    console.error(`[${connectionId}] WebSocket error:`, err);
    clearInterval(heartbeat);
    ptyProcess.kill();
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  wss.clients.forEach((client) => {
    client.close(1001, 'Server shutting down');
  });
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down...');
  wss.clients.forEach((client) => {
    client.close(1001, 'Server shutting down');
  });
  wss.close(() => {
    process.exit(0);
  });
});
