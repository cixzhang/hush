import { defineTheme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';

export type ThemeName = 'midnight-oil' | 'cold-cathode' | 'paper-bleed' | 'violet-hour';

export const THEME_NAMES: ThemeName[] = ['midnight-oil', 'cold-cathode', 'paper-bleed', 'violet-hour'];

export const THEME_LABELS: Record<ThemeName, string> = {
  'midnight-oil': 'Midnight Oil',
  'cold-cathode': 'Cold Cathode',
  'paper-bleed': 'Paper Bleed',
  'violet-hour': 'Violet Hour',
};

// 1. Midnight Oil — warm darkness, amber accent
export const midnightOilTheme = defineTheme({
  name: 'midnight-oil',
  extends: neutralTheme,
  tokens: {
    '--color-background-body': ['#F5F0E8', '#0E0C0A'],
    '--color-background-surface': ['#FFFCF5', '#1A1714'],
    '--color-background-card': ['#FFFCF5', '#211D19'],
    '--color-background-popover': ['#FFFCF5', '#28221D'],
    '--color-background-muted': ['#E8E0D433', '#1111127F'],
    '--color-text-primary': ['#1A1612', '#E8E0D4'],
    '--color-text-secondary': ['#5C5045', '#A89B89'],
    '--color-text-disabled': ['#9C8E7E', '#6B5F52'],
    '--color-text-accent': ['#B8702A', '#D4A055'],
    '--color-accent': ['#B8702A', '#D4A055'],
    '--color-accent-muted': ['#D4A05533', '#D4A0553F'],
    '--color-icon-accent': ['#B8702A', '#D4A055'],
    '--color-icon-primary': ['#1A1612', '#E8E0D4'],
    '--color-icon-secondary': ['#5C5045', '#A89B89'],
    '--color-border': ['#1A16121A', '#E8E0D419'],
    '--color-border-emphasized': ['#C4B8A8', '#4A4035'],
    '--color-overlay': ['#0E0C0A66', '#0E0C0A99'],
    '--color-shadow': ['rgba(26, 22, 18, 0.08)', 'rgba(0, 0, 0, 0.4)'],
  },
});

// 2. Cold Cathode — terminal green on blue-black
export const coldCathodeTheme = defineTheme({
  name: 'cold-cathode',
  extends: neutralTheme,
  tokens: {
    '--color-background-body': ['#F0F2EE', '#0A0E0A'],
    '--color-background-surface': ['#FAFCF8', '#111611'],
    '--color-background-card': ['#FAFCF8', '#161C16'],
    '--color-background-popover': ['#FAFCF8', '#1A211A'],
    '--color-background-muted': ['#E0E8DC33', '#1111127F'],
    '--color-text-primary': ['#0A1A0A', '#C8D0C5'],
    '--color-text-secondary': ['#4A5F4A', '#7A8A7A'],
    '--color-text-disabled': ['#8AA08A', '#4A5F4A'],
    '--color-text-accent': ['#2D7A2D', '#4ADE80'],
    '--color-accent': ['#2D7A2D', '#4ADE80'],
    '--color-accent-muted': ['#4ADE8033', '#4ADE803F'],
    '--color-icon-accent': ['#2D7A2D', '#4ADE80'],
    '--color-icon-primary': ['#0A1A0A', '#C8D0C5'],
    '--color-icon-secondary': ['#4A5F4A', '#7A8A7A'],
    '--color-border': ['#0A1A0A1A', '#C8D0C519'],
    '--color-border-emphasized': ['#B0C0B0', '#3A4A3A'],
    '--color-overlay': ['#0A0E0A66', '#0A0E0A99'],
    '--color-shadow': ['rgba(10, 26, 10, 0.08)', 'rgba(0, 0, 0, 0.4)'],
  },
});

// 3. Paper Bleed — warm paper, burnt sienna ink
export const paperBleedTheme = defineTheme({
  name: 'paper-bleed',
  extends: neutralTheme,
  tokens: {
    '--color-background-body': ['#EDE6D8', '#1A1612'],
    '--color-background-surface': ['#F5F0E8', '#221C16'],
    '--color-background-card': ['#FAF5EC', '#2A2218'],
    '--color-background-popover': ['#FAF5EC', '#2E2519'],
    '--color-background-muted': ['#E0D8C833', '#1111127F'],
    '--color-text-primary': ['#1A1208', '#E8DDC8'],
    '--color-text-secondary': ['#5C4A35', '#A89878'],
    '--color-text-disabled': ['#9C8868', '#6B5A45'],
    '--color-text-accent': ['#B8390E', '#E8651E'],
    '--color-accent': ['#B8390E', '#E8651E'],
    '--color-accent-muted': ['#E8651E33', '#E8651E3F'],
    '--color-icon-accent': ['#B8390E', '#E8651E'],
    '--color-icon-primary': ['#1A1208', '#E8DDC8'],
    '--color-icon-secondary': ['#5C4A35', '#A89878'],
    '--color-border': ['#1A12081A', '#E8DDC819'],
    '--color-border-emphasized': ['#C0B098', '#4A3D2E'],
    '--color-overlay': ['#1A120866', '#1A120899'],
    '--color-shadow': ['rgba(26, 18, 8, 0.1)', 'rgba(0, 0, 0, 0.4)'],
  },
});

// 4. Violet Hour — soft purple atmospheric dark
export const violetHourTheme = defineTheme({
  name: 'violet-hour',
  extends: neutralTheme,
  tokens: {
    '--color-background-body': ['#F4F0F7', '#0F0B14'],
    '--color-background-surface': ['#FFFFFF', '#1A1521'],
    '--color-background-card': ['#FFFFFF', '#211B29'],
    '--color-background-popover': ['#FFFFFF', '#271F30'],
    '--color-background-muted': ['#E8E0F033', '#1111127F'],
    '--color-text-primary': ['#1A1020', '#E4DFEB'],
    '--color-text-secondary': ['#5C4A6E', '#9C8FB0'],
    '--color-text-disabled': ['#9C8AAE', '#6B5C7E'],
    '--color-text-accent': ['#7C3AED', '#A78BFA'],
    '--color-accent': ['#7C3AED', '#A78BFA'],
    '--color-accent-muted': ['#A78BFA33', '#A78BFA3F'],
    '--color-icon-accent': ['#7C3AED', '#A78BFA'],
    '--color-icon-primary': ['#1A1020', '#E4DFEB'],
    '--color-icon-secondary': ['#5C4A6E', '#9C8FB0'],
    '--color-border': ['#1A10201A', '#E4DFEB19'],
    '--color-border-emphasized': ['#C8BCD8', '#3D3450'],
    '--color-overlay': ['#0F0B1466', '#0F0B1499'],
    '--color-shadow': ['rgba(26, 16, 32, 0.08)', 'rgba(0, 0, 0, 0.4)'],
  },
});

export const THEMES: Record<ThemeName, typeof neutralTheme> = {
  'midnight-oil': midnightOilTheme,
  'cold-cathode': coldCathodeTheme,
  'paper-bleed': paperBleedTheme,
  'violet-hour': violetHourTheme,
};
