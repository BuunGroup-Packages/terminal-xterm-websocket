# Build stage
FROM node:20-alpine AS builder

# Install build dependencies for node-pty
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install runtime dependencies for node-pty and bash for better shell experience
RUN apk add --no-cache python3 make g++ bash

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S terminal && \
    adduser -S terminal -u 1001 -G terminal

# Change ownership
RUN chown -R terminal:terminal /app

# Switch to non-root user
USER terminal

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3001', (r) => process.exit(r.statusCode === 426 ? 0 : 1)).on('error', () => process.exit(1))"

# Start server
CMD ["node", "dist/index.js"]
