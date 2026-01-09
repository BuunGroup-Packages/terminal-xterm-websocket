/**
 * Quick Actions Configuration
 *
 * Predefined commands for common terminal operations.
 * Organized by category for easy access.
 */

import type { IconType } from 'react-icons';
import {
  FiCpu,
  FiTerminal,
  FiGitBranch,
  FiFolder,
  FiFileText,
  FiGlobe,
  FiServer,
  FiActivity,
  FiHardDrive,
  FiUsers,
  FiClock,
  FiSearch,
} from 'react-icons/fi';
import { VscTerminalBash } from 'react-icons/vsc';

export type ActionCategory =
  | 'System'
  | 'Shell'
  | 'Utilities'
  | 'Development'
  | 'Git'
  | 'Networking'
  | 'Monitoring';

export interface QuickAction {
  id: string;
  name: string;
  command: string;
  icon: IconType;
  category: ActionCategory;
  description?: string;
  keywords?: string[];
}

export const QUICK_ACTIONS: QuickAction[] = [
  // System
  {
    id: 'disk_usage',
    name: 'Disk Usage',
    command: 'df -h\n',
    icon: FiHardDrive,
    category: 'System',
    description: 'Display disk space usage',
    keywords: ['df', 'disk', 'storage', 'space'],
  },
  {
    id: 'memory_usage',
    name: 'Memory Usage',
    command: 'free -m\n',
    icon: FiCpu,
    category: 'System',
    description: 'Show memory usage in MB',
    keywords: ['free', 'memory', 'ram'],
  },
  {
    id: 'system_uptime',
    name: 'System Uptime',
    command: 'uptime\n',
    icon: FiClock,
    category: 'System',
    description: 'Show system uptime and load',
    keywords: ['uptime', 'load', 'running'],
  },
  {
    id: 'active_users',
    name: 'Active Users',
    command: 'who\n',
    icon: FiUsers,
    category: 'System',
    description: 'Show logged-in users',
    keywords: ['who', 'users', 'logged'],
  },

  // Shell
  {
    id: 'bash_shell',
    name: 'Start Bash',
    command: 'bash\n',
    icon: VscTerminalBash,
    category: 'Shell',
    description: 'Start a Bash session',
    keywords: ['bash', 'shell'],
  },
  {
    id: 'zsh_shell',
    name: 'Start Zsh',
    command: 'zsh\n',
    icon: FiTerminal,
    category: 'Shell',
    description: 'Start a Zsh session',
    keywords: ['zsh', 'shell'],
  },
  {
    id: 'exit_shell',
    name: 'Exit Shell',
    command: 'exit\n',
    icon: FiTerminal,
    category: 'Shell',
    description: 'Exit current shell',
    keywords: ['exit', 'quit'],
  },

  // Utilities
  {
    id: 'list_files',
    name: 'List Files',
    command: 'ls -lah\n',
    icon: FiFolder,
    category: 'Utilities',
    description: 'List files with details',
    keywords: ['ls', 'files', 'directory'],
  },
  {
    id: 'find_large_files',
    name: 'Find Large Files',
    command: 'find . -type f -size +100M 2>/dev/null | head -20\n',
    icon: FiSearch,
    category: 'Utilities',
    description: 'Find files >100MB',
    keywords: ['find', 'large', 'size'],
  },
  {
    id: 'current_dir',
    name: 'Current Directory',
    command: 'pwd\n',
    icon: FiFolder,
    category: 'Utilities',
    description: 'Print working directory',
    keywords: ['pwd', 'directory', 'path'],
  },

  // Development
  {
    id: 'env_vars',
    name: 'Environment Variables',
    command: 'env | sort\n',
    icon: FiFileText,
    category: 'Development',
    description: 'Show all env variables',
    keywords: ['env', 'variables', 'environment'],
  },
  {
    id: 'show_path',
    name: 'Show PATH',
    command: 'echo $PATH | tr ":" "\\n"\n',
    icon: FiFileText,
    category: 'Development',
    description: 'Display PATH directories',
    keywords: ['path', 'environment'],
  },
  {
    id: 'node_version',
    name: 'Node.js Version',
    command: 'node --version 2>/dev/null || echo "Node.js not installed"\n',
    icon: FiServer,
    category: 'Development',
    description: 'Check Node.js version',
    keywords: ['node', 'version', 'javascript'],
  },
  {
    id: 'python_version',
    name: 'Python Version',
    command: 'python3 --version 2>/dev/null || python --version 2>/dev/null || echo "Python not installed"\n',
    icon: FiServer,
    category: 'Development',
    description: 'Check Python version',
    keywords: ['python', 'version'],
  },

  // Git
  {
    id: 'git_status',
    name: 'Git Status',
    command: 'git status 2>/dev/null || echo "Not a git repository"\n',
    icon: FiGitBranch,
    category: 'Git',
    description: 'Show git status',
    keywords: ['git', 'status'],
  },
  {
    id: 'git_branch',
    name: 'Git Branch',
    command: 'git branch -a 2>/dev/null || echo "Not a git repository"\n',
    icon: FiGitBranch,
    category: 'Git',
    description: 'List all branches',
    keywords: ['git', 'branch'],
  },
  {
    id: 'git_log',
    name: 'Git Log',
    command: 'git log --oneline -10 2>/dev/null || echo "Not a git repository"\n',
    icon: FiGitBranch,
    category: 'Git',
    description: 'Show recent commits',
    keywords: ['git', 'log', 'history'],
  },

  // Networking
  {
    id: 'check_ip',
    name: 'Public IP',
    command: 'curl -s ifconfig.me 2>/dev/null || echo "Unable to fetch IP"\n',
    icon: FiGlobe,
    category: 'Networking',
    description: 'Get public IP address',
    keywords: ['ip', 'public', 'address'],
  },
  {
    id: 'ping_google',
    name: 'Ping Google',
    command: 'ping -c 4 google.com\n',
    icon: FiGlobe,
    category: 'Networking',
    description: 'Test internet connectivity',
    keywords: ['ping', 'network', 'test'],
  },
  {
    id: 'listening_ports',
    name: 'Listening Ports',
    command: 'ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null || echo "ss/netstat not available"\n',
    icon: FiServer,
    category: 'Networking',
    description: 'Show listening TCP ports',
    keywords: ['ports', 'listening', 'tcp'],
  },

  // Monitoring
  {
    id: 'top_processes',
    name: 'Top Processes',
    command: 'ps aux --sort=-%cpu | head -10\n',
    icon: FiActivity,
    category: 'Monitoring',
    description: 'Top 10 CPU processes',
    keywords: ['top', 'processes', 'cpu'],
  },
  {
    id: 'htop',
    name: 'System Monitor',
    command: 'htop 2>/dev/null || top\n',
    icon: FiActivity,
    category: 'Monitoring',
    description: 'Interactive system monitor',
    keywords: ['htop', 'top', 'monitor'],
  },
];

export const ACTION_CATEGORIES: ActionCategory[] = [
  'System',
  'Shell',
  'Utilities',
  'Development',
  'Git',
  'Networking',
  'Monitoring',
];

export function getActionsByCategory(category: ActionCategory): QuickAction[] {
  return QUICK_ACTIONS.filter((action) => action.category === category);
}

export function searchActions(query: string): QuickAction[] {
  const lowerQuery = query.toLowerCase();
  return QUICK_ACTIONS.filter(
    (action) =>
      action.name.toLowerCase().includes(lowerQuery) ||
      action.command.toLowerCase().includes(lowerQuery) ||
      action.description?.toLowerCase().includes(lowerQuery) ||
      action.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery))
  );
}
