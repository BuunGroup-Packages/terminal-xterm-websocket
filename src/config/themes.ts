/**
 * Terminal Theme Definitions
 *
 * Each theme provides colors for xterm.js terminal emulator.
 * Themes are stored in localStorage for persistence.
 */

export interface TerminalTheme {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    cursor: string;
    cursorAccent: string;
    selectionBackground: string;
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    brightBlack: string;
    brightRed: string;
    brightGreen: string;
    brightYellow: string;
    brightBlue: string;
    brightMagenta: string;
    brightCyan: string;
    brightWhite: string;
  };
}

export const THEMES: TerminalTheme[] = [
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    colors: {
      background: '#1a1b26',
      foreground: '#a9b1d6',
      cursor: '#c0caf5',
      cursorAccent: '#1a1b26',
      selectionBackground: '#283457',
      black: '#15161e',
      red: '#f7768e',
      green: '#9ece6a',
      yellow: '#e0af68',
      blue: '#7aa2f7',
      magenta: '#bb9af7',
      cyan: '#7dcfff',
      white: '#a9b1d6',
      brightBlack: '#414868',
      brightRed: '#f7768e',
      brightGreen: '#9ece6a',
      brightYellow: '#e0af68',
      brightBlue: '#7aa2f7',
      brightMagenta: '#bb9af7',
      brightCyan: '#7dcfff',
      brightWhite: '#c0caf5',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      background: '#282a36',
      foreground: '#f8f8f2',
      cursor: '#f8f8f2',
      cursorAccent: '#282a36',
      selectionBackground: '#44475a',
      black: '#21222c',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#bd93f9',
      magenta: '#ff79c6',
      cyan: '#8be9fd',
      white: '#f8f8f2',
      brightBlack: '#6272a4',
      brightRed: '#ff6e6e',
      brightGreen: '#69ff94',
      brightYellow: '#ffffa5',
      brightBlue: '#d6acff',
      brightMagenta: '#ff92df',
      brightCyan: '#a4ffff',
      brightWhite: '#ffffff',
    },
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    colors: {
      background: '#0d1117',
      foreground: '#c9d1d9',
      cursor: '#c9d1d9',
      cursorAccent: '#0d1117',
      selectionBackground: '#264f78',
      black: '#484f58',
      red: '#ff7b72',
      green: '#7ee787',
      yellow: '#d29922',
      blue: '#58a6ff',
      magenta: '#bc8cff',
      cyan: '#76e3ea',
      white: '#b1bac4',
      brightBlack: '#6e7681',
      brightRed: '#ffa198',
      brightGreen: '#a5d6ff',
      brightYellow: '#f0b05c',
      brightBlue: '#80ccff',
      brightMagenta: '#d8bcf0',
      brightCyan: '#96e0f0',
      brightWhite: '#f0f6fc',
    },
  },
  {
    id: 'monokai',
    name: 'Monokai Pro',
    colors: {
      background: '#2d2a2e',
      foreground: '#fcfcfa',
      cursor: '#fcfcfa',
      cursorAccent: '#2d2a2e',
      selectionBackground: '#5b595c',
      black: '#2d2a2e',
      red: '#ff6188',
      green: '#a9dc76',
      yellow: '#ffd866',
      blue: '#78dce8',
      magenta: '#ab9df2',
      cyan: '#78dce8',
      white: '#fcfcfa',
      brightBlack: '#727072',
      brightRed: '#ff6188',
      brightGreen: '#a9dc76',
      brightYellow: '#ffd866',
      brightBlue: '#78dce8',
      brightMagenta: '#ab9df2',
      brightCyan: '#78dce8',
      brightWhite: '#fcfcfa',
    },
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    colors: {
      background: '#2b213a',
      foreground: '#f0eff1',
      cursor: '#ff7edb',
      cursorAccent: '#2b213a',
      selectionBackground: '#463465',
      black: '#2b213a',
      red: '#fe4450',
      green: '#72f1b8',
      yellow: '#fede5d',
      blue: '#03edf9',
      magenta: '#ff7edb',
      cyan: '#03edf9',
      white: '#f0eff1',
      brightBlack: '#614d85',
      brightRed: '#fe4450',
      brightGreen: '#72f1b8',
      brightYellow: '#fede5d',
      brightBlue: '#03edf9',
      brightMagenta: '#ff7edb',
      brightCyan: '#03edf9',
      brightWhite: '#ffffff',
    },
  },
  {
    id: 'retro-green',
    name: 'Retro Green',
    colors: {
      background: '#0a0a0a',
      foreground: '#00ff00',
      cursor: '#00ff00',
      cursorAccent: '#0a0a0a',
      selectionBackground: '#003300',
      black: '#0a0a0a',
      red: '#ff0000',
      green: '#00ff00',
      yellow: '#ffff00',
      blue: '#0000ff',
      magenta: '#ff00ff',
      cyan: '#00ffff',
      white: '#ffffff',
      brightBlack: '#555555',
      brightRed: '#ff5555',
      brightGreen: '#55ff55',
      brightYellow: '#ffff55',
      brightBlue: '#5555ff',
      brightMagenta: '#ff55ff',
      brightCyan: '#55ffff',
      brightWhite: '#ffffff',
    },
  },
];

export const DEFAULT_THEME_ID = 'tokyo-night';

export function getThemeById(id: string): TerminalTheme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
