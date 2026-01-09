/**
 * Terminal Backend Server
 *
 * Features:
 * - JWT token authentication
 * - Docker container per session
 * - Shell type selection (bash, sh, zsh)
 * - Process list endpoint
 * - Auto-cleanup on session expiry
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Docker from 'dockerode';

// Configuration
const PORT = parseInt(process.env.PORT || '3001', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const SESSION_DURATION_MS = parseInt(process.env.SESSION_DURATION_MS || '300000', 10);
const SESSION_IMAGE = process.env.SESSION_IMAGE || 'terminal-session:latest';
const SESSION_MEMORY_LIMIT = process.env.SESSION_MEMORY_LIMIT || '256m';
const SESSION_CPU_LIMIT = parseFloat(process.env.SESSION_CPU_LIMIT || '0.5');
const HEARTBEAT_INTERVAL = 30000;

// Shell commands mapping
const SHELL_COMMANDS: Record<string, string> = {
  bash: '/bin/bash',
  sh: '/bin/sh',
  zsh: '/bin/zsh',
};

// Docker client
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Token payload interface
interface TokenPayload {
  sessionId: string;
  expiresAt: number;
  iat: number;
}

// Process info interface
interface ProcessInfo {
  pid: string;
  user: string;
  cpu: string;
  mem: string;
  command: string;
}

// Session tracking
interface Session {
  sessionId: string;
  ws: WebSocket;
  containerId: string;
  execStream: NodeJS.ReadWriteStream | null;
  shellType: string;
  expiresAt: number;
  expiryTimeout: ReturnType<typeof setTimeout>;
  heartbeat: ReturnType<typeof setInterval>;
}

const sessions = new Map<string, Session>();

// Parse memory limit to bytes
function parseMemoryLimit(limit: string): number {
  const match = limit.match(/^(\d+)([kmg]?)$/i);
  if (!match) return 256 * 1024 * 1024;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'k': return value * 1024;
    case 'm': return value * 1024 * 1024;
    case 'g': return value * 1024 * 1024 * 1024;
    default: return value;
  }
}

// Generate JWT token
function generateToken(): { token: string; expiresAt: number; sessionId: string } {
  const sessionId = uuidv4();
  const expiresAt = Date.now() + SESSION_DURATION_MS;

  const payload: TokenPayload = {
    sessionId,
    expiresAt,
    iat: Date.now(),
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: Math.floor(SESSION_DURATION_MS / 1000),
  });

  return { token, expiresAt, sessionId };
}

// Verify JWT token
function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (payload.expiresAt < Date.now()) {
      console.log(`Token expired for session ${payload.sessionId}`);
      return null;
    }
    return payload;
  } catch (err) {
    console.error('Token verification failed:', err);
    return null;
  }
}

// Create a container for a session
async function createSessionContainer(sessionId: string): Promise<string> {
  // Use timestamp suffix to avoid name conflicts during StrictMode double-mount
  const containerName = `term-${sessionId.slice(0, 8)}-${Date.now().toString(36)}`;

  console.log(`[${sessionId}] Creating container: ${containerName}`);

  const container = await docker.createContainer({
    Image: SESSION_IMAGE,
    name: containerName,
    Tty: true,
    OpenStdin: true,
    StdinOnce: false,
    HostConfig: {
      Memory: parseMemoryLimit(SESSION_MEMORY_LIMIT),
      NanoCpus: Math.floor(SESSION_CPU_LIMIT * 1e9),
      AutoRemove: true,
      NetworkMode: 'none',
    },
    Labels: {
      'terminal.session': sessionId,
      'terminal.created': new Date().toISOString(),
    },
  });

  await container.start();

  console.log(`[${sessionId}] Container started: ${container.id.slice(0, 12)}`);

  return container.id;
}

// Destroy a session container
async function destroySessionContainer(sessionId: string, containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect().catch(() => null);

    if (info && info.State.Running) {
      console.log(`[${sessionId}] Stopping container: ${containerId.slice(0, 12)}`);
      await container.stop({ t: 2 });
    }
  } catch (err) {
    console.log(`[${sessionId}] Container cleanup: ${(err as Error).message}`);
  }
}

// Get process list from container
async function getContainerProcesses(containerId: string): Promise<ProcessInfo[]> {
  try {
    const container = docker.getContainer(containerId);

    // Run ps command in container (use full path for procps-ng on Alpine)
    const exec = await container.exec({
      Cmd: ['/bin/ps', 'aux', '--no-headers'],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    return new Promise((resolve) => {
      let output = '';
      const processes: ProcessInfo[] = [];

      stream.on('data', (chunk: Buffer) => {
        // Docker stream has 8-byte header, skip it for stdout
        const data = chunk.toString();
        output += data;
      });

      stream.on('end', () => {
        // Clean output - remove any control characters
        const cleanOutput = output.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
        const lines = cleanOutput.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          // Parse ps aux output: USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 11) {
            processes.push({
              pid: parts[1],
              user: parts[0],
              cpu: parts[2],
              mem: parts[3],
              command: parts.slice(10).join(' '),
            });
          }
        }

        console.log(`[getContainerProcesses] Found ${processes.length} processes`);
        resolve(processes);
      });

      stream.on('error', (err) => {
        console.error('[getContainerProcesses] Stream error:', err);
        resolve([]);
      });

      // Timeout after 3 seconds
      setTimeout(() => {
        if (processes.length === 0) {
          console.log('[getContainerProcesses] Timeout, returning empty');
        }
        resolve(processes);
      }, 3000);
    });
  } catch (err) {
    console.error('Failed to get container processes:', err);
    return [];
  }
}

// Clean up session
async function cleanupSession(sessionId: string, reason: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) return;

  console.log(`[${sessionId}] Cleaning up session: ${reason}`);

  clearTimeout(session.expiryTimeout);
  clearInterval(session.heartbeat);

  if (session.execStream) {
    try {
      session.execStream.end();
    } catch {}
  }

  await destroySessionContainer(sessionId, session.containerId);

  if (session.ws.readyState === WebSocket.OPEN) {
    session.ws.send(JSON.stringify({ type: 'session_expired', reason }));
    session.ws.close(4001, reason);
  }

  sessions.delete(sessionId);
  console.log(`[${sessionId}] Session cleaned up. Active sessions: ${sessions.size}`);
}

// Attach to container and create interactive shell
async function attachToContainer(
  sessionId: string,
  containerId: string,
  ws: WebSocket,
  shellType: string,
  cols: number,
  rows: number
): Promise<NodeJS.ReadWriteStream | null> {
  const container = docker.getContainer(containerId);
  const shellCmd = SHELL_COMMANDS[shellType] || SHELL_COMMANDS.bash;

  console.log(`[${sessionId}] Starting shell: ${shellCmd}`);

  const exec = await container.exec({
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    Cmd: [shellCmd],
    Env: [
      `TERM=xterm-256color`,
      `COLUMNS=${cols}`,
      `LINES=${rows}`,
      `SHELL=${shellCmd}`,
    ],
  });

  const stream = await exec.start({
    hijack: true,
    stdin: true,
    Tty: true,
  });

  stream.on('data', (chunk: Buffer) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data: chunk.toString() }));
    }
  });

  stream.on('end', () => {
    console.log(`[${sessionId}] Exec stream ended`);
    cleanupSession(sessionId, 'Shell exited');
  });

  stream.on('error', (err: Error) => {
    console.error(`[${sessionId}] Exec stream error:`, err);
    cleanupSession(sessionId, 'Stream error');
  });

  return stream;
}

// Resize terminal in container
async function resizeExec(containerId: string, cols: number, rows: number): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.resize({ h: rows, w: cols });
  } catch {}
}

// HTTP Server
const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', activeSessions: sessions.size }));
    return;
  }

  // Token generation endpoint
  if (url.pathname === '/api/token' && req.method === 'POST') {
    const { token, expiresAt, sessionId } = generateToken();
    console.log(`[${sessionId}] Token generated, expires at ${new Date(expiresAt).toISOString()}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ token, expiresAt, sessionId }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// WebSocket Server
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const token = url.searchParams.get('token');
  const shellType = url.searchParams.get('shell') || 'bash';

  // Validate token
  if (!token) {
    console.log('Connection rejected: No token provided');
    ws.close(4000, 'No token provided');
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    console.log('Connection rejected: Invalid or expired token');
    ws.close(4001, 'Invalid or expired token');
    return;
  }

  const { sessionId, expiresAt } = payload;

  // If session already exists, close the old connection and allow the new one
  // This handles React StrictMode double-mount and page refreshes
  if (sessions.has(sessionId)) {
    console.log(`[${sessionId}] Replacing existing session (StrictMode or reconnect)`);
    const existingSession = sessions.get(sessionId)!;

    // Clear timeouts
    clearTimeout(existingSession.expiryTimeout);
    clearInterval(existingSession.heartbeat);

    // Close old exec stream
    if (existingSession.execStream) {
      try { existingSession.execStream.end(); } catch {}
    }

    // Close old WebSocket without triggering cleanup
    if (existingSession.ws.readyState === WebSocket.OPEN) {
      existingSession.ws.close(4002, 'Replaced by new connection');
    }

    // Destroy old container
    destroySessionContainer(sessionId, existingSession.containerId).catch(() => {});

    // Remove from sessions
    sessions.delete(sessionId);
  }

  console.log(`[${sessionId}] Client connected. Shell: ${shellType}. Expires: ${new Date(expiresAt).toISOString()}`);

  let containerId: string;
  let execStream: NodeJS.ReadWriteStream | null = null;

  try {
    containerId = await createSessionContainer(sessionId);

    let isAlive = true;
    ws.on('pong', () => { isAlive = true; });

    const heartbeat = setInterval(() => {
      if (!isAlive) {
        console.log(`[${sessionId}] Client unresponsive, terminating`);
        cleanupSession(sessionId, 'Client unresponsive');
        return;
      }
      isAlive = false;
      ws.ping();
    }, HEARTBEAT_INTERVAL);

    const timeUntilExpiry = expiresAt - Date.now();
    const expiryTimeout = setTimeout(() => {
      cleanupSession(sessionId, 'Session expired');
    }, timeUntilExpiry);

    const session: Session = {
      sessionId,
      ws,
      containerId,
      execStream: null,
      shellType,
      expiresAt,
      expiryTimeout,
      heartbeat,
    };
    sessions.set(sessionId, session);

    ws.send(JSON.stringify({
      type: 'session_started',
      sessionId,
      expiresAt,
      containerId: containerId.slice(0, 12),
      shell: shellType,
    }));

    execStream = await attachToContainer(sessionId, containerId, ws, shellType, 80, 24);
    session.execStream = execStream;

  } catch (err) {
    console.error(`[${sessionId}] Failed to create container:`, err);
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to create session container' }));
    ws.close(4003, 'Container creation failed');
    return;
  }

  // Handle messages from client
  ws.on('message', async (message: Buffer) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    try {
      const msg = JSON.parse(message.toString());

      switch (msg.type) {
        case 'input':
          if (session.execStream && typeof msg.data === 'string') {
            session.execStream.write(msg.data);
          }
          break;

        case 'resize':
          if (typeof msg.cols === 'number' && typeof msg.rows === 'number') {
            await resizeExec(session.containerId, msg.cols, msg.rows);
          }
          break;

        case 'get_processes':
          const processes = await getContainerProcesses(session.containerId);
          ws.send(JSON.stringify({ type: 'processes', processes }));
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          console.warn(`[${sessionId}] Unknown message type: ${msg.type}`);
      }
    } catch (err) {
      console.error(`[${sessionId}] Error handling message:`, err);
    }
  });

  ws.on('close', (code) => {
    console.log(`[${sessionId}] Client disconnected (code: ${code})`);
    cleanupSession(sessionId, 'Client disconnected');
  });

  ws.on('error', (err) => {
    console.error(`[${sessionId}] WebSocket error:`, err);
    cleanupSession(sessionId, 'WebSocket error');
  });
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}?token=<jwt>&shell=<bash|sh|zsh>`);
  console.log(`Token endpoint: POST http://localhost:${PORT}/api/token`);
  console.log(`Session image: ${SESSION_IMAGE}`);
  console.log(`Session duration: ${SESSION_DURATION_MS / 1000}s`);
});

// Graceful shutdown
async function shutdown() {
  console.log('\nShutting down...');

  const cleanupPromises: Promise<void>[] = [];
  sessions.forEach((_, sessionId) => {
    cleanupPromises.push(cleanupSession(sessionId, 'Server shutting down'));
  });

  await Promise.all(cleanupPromises);

  wss.close(() => {
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
