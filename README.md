# Browser Terminal

A fully functional terminal emulator running in your browser, built with **xterm.js**, **WebSocket**, and **node-pty**.

![Terminal Demo](https://buungroup.com/og-image.png)

## Features

- Real terminal emulation with xterm.js
- WebSocket connection to backend shell
- Automatic reconnection with exponential backoff
- Resize handling
- Docker support for the backend
- WSL2 compatible

## Tutorial

This is the companion repository for the Buun Group tutorial:

**[Build a Browser Terminal with xterm.js and WebSocket](https://buungroup.com/blog/browser-terminal-xterm-websocket-tutorial-2026)**

The tutorial covers:
- Setting up xterm.js with React
- Building a WebSocket + node-pty backend
- Handling reconnection logic
- Docker deployment
- Security considerations

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for backend)

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install
```

### 2. Start the Backend (Docker)

```bash
docker compose up -d --build
```

### 3. Start the Frontend

```bash
npm run dev
```

### 4. Open Browser

Navigate to [http://localhost:5173](http://localhost:5173)

## Project Structure

```
terminal-app/
├── src/
│   ├── components/
│   │   └── Terminal.tsx      # xterm.js React component
│   ├── hooks/
│   │   └── useWebSocket.ts   # WebSocket with auto-reconnect
│   ├── styles/
│   │   └── terminal.css      # Terminal styling
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── index.ts              # WebSocket + node-pty server
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── package.json
```

## Configuration

### Environment Variables

Create a `.env` file:

```bash
# WebSocket URL (default: ws://localhost:3001)
VITE_WS_URL=ws://localhost:3001
```

### WSL2 Users

If running on WSL2 with native Docker (not Docker Desktop), you may need to use your WSL2 IP:

```bash
# Get WSL2 IP
hostname -I | awk '{print $1}'

# Update .env
VITE_WS_URL=ws://YOUR_WSL2_IP:3001
```

## Docker Commands

```bash
# Start backend
docker compose up -d --build

# View logs
docker compose logs -f backend

# Stop
docker compose down

# Full cleanup
docker compose down --rmi all -v
```

## Tech Stack

- **Frontend:** React, TypeScript, Vite, xterm.js
- **Backend:** Node.js, WebSocket (ws), node-pty
- **Container:** Docker, Alpine Linux

## License

MIT

## Author

[Buun Group](https://buungroup.com) - Brisbane, Australia
