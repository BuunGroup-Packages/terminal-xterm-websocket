/**
 * Shell configuration for terminal sessions
 */

import type { ShellType } from '../types';

export interface ShellConfig {
  id: ShellType;
  name: string;
  command: string;
}

export const SHELLS: ShellConfig[] = [
  {
    id: 'bash',
    name: 'Bash',
    command: '/bin/bash',
  },
  {
    id: 'sh',
    name: 'Shell',
    command: '/bin/sh',
  },
  {
    id: 'zsh',
    name: 'Zsh',
    command: '/bin/zsh',
  },
];

export const DEFAULT_SHELL: ShellType = 'bash';

export function getShellById(id: ShellType): ShellConfig {
  return SHELLS.find((s) => s.id === id) || SHELLS[0];
}

export function getShellCommand(id: ShellType): string {
  return getShellById(id).command;
}
