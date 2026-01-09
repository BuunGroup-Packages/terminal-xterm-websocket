/**
 * Shared TypeScript types for the terminal application
 */

// Shell configuration
export type ShellType = 'bash' | 'sh' | 'zsh';

export interface ShellConfig {
  id: ShellType;
  name: string;
  command: string;
  icon: string;
}

// Process information from container
export interface ProcessInfo {
  pid: string;
  user: string;
  cpu: string;
  mem: string;
  command: string;
}

// Terminal session state
export interface TerminalSession {
  id: string;
  token: string;
  sessionId: string;
  expiresAt: Date;
  name: string;
  isActive: boolean;
  isExpired: boolean;
  isConnected: boolean;
  shellType: ShellType;
  containerId?: string;
}

// WebSocket message types
export interface WsMessage {
  type: string;
  data?: string;
  reason?: string;
  sessionId?: string;
  expiresAt?: number;
  containerId?: string;
  processes?: ProcessInfo[];
  shell?: ShellType;
}

// Token response from API
export interface TokenResponse {
  token: string;
  sessionId: string;
  expiresAt: number;
}
