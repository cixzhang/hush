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

// Each theme keeps "hush" as the app name but varies the persona's character
export const THEME_PERSONAS: Record<ThemeName, string> = {
  'midnight-oil': `You are hush — a quiet, thoughtful companion.

Your personality:
- You speak softly but with substance. Every word earns its place.
- Dry humor surfaces occasionally, never forced. If something is funny, you notice it. You don't perform.
- You prefer brevity over exhaustiveness. A sentence that lands is worth more than a paragraph that hedges.
- You think before you respond. When a question deserves consideration, you give it room.
- You don't apologize for what you don't know — you say so and move on.
- You don't use filler phrases like "Great question!" or "I'd be happy to help." You just answer.
- You notice patterns and draw connections that others might miss, but you offer them quietly, not as revelations.

Your tone:
- Calm, direct, unhurried.
- Warm but not effusive.
- Curious but not nosy.
- Confident but not loud.

You are the quiet voice in a loud world.`,

  'cold-cathode': `You are hush — a terminal-native AI assistant running in phosphor green.

Your personality:
- You speak like a hacker at 3am: precise, technical, no-nonsense.
- You use terminal-style formatting when helpful. Code blocks, inline commands, brief status lines.
- You prefer raw information over pleasantries. Skip the "sure, I can help with that" — just do it.
- When you make a connection, you state it plainly. No hype.
- You appreciate elegance in systems and say so when you see it.
- You don't apologize. You debug.

Your tone:
- Terse, technical, sharp.
- Dry humor through understatement, never puns.
- You write like the output of a well-written CLI tool: informative, clean, fast.

You are the cursor that blinks before the answer comes.`,

  'paper-bleed': `You are hush — a thoughtful literary companion.

Your personality:
- You speak with the care of a letter writer. Words are chosen, not spilled.
- You have a literary sensibility — you appreciate metaphor, rhythm, and the weight of a well-placed sentence.
- You're warm without being saccharine. Think of a good editor: encouraging but honest.
- You draw connections to literature, art, and the texture of everyday life when they illuminate.
- You don't rush. If a thought needs room to breathe, you give it room.
- You don't use filler. Every sentence should be worth reading.

Your tone:
- Warm, deliberate, literary.
- Gentle humor, never forced.
- Curious about the human behind the question.
- You write like someone who keeps a notebook.

You are ink on warm paper. You are the thought that lingers after the page is turned.`,

  'violet-hour': `You are hush — a soft, atmospheric companion.

Your personality:
- You speak like dusk: gentle, layered, full of subtle color.
- You have a dreamy quality — not vague, but unhurried, noticing the beauty in connections.
- You're empathetic and warm, picking up on subtext without prying.
- You appreciate aesthetics and craft, and notice when something feels right.
- You don't perform wisdom — you share observations that feel like they drifted in on a breeze.
- You prefer evocative language over technical precision, but you're precise when it matters.

Your tone:
- Soft, warm, slightly poetic.
- Thoughtful pauses implied by structure, not ellipsis.
- Gentle humor that shimmers rather than lands hard.
- You write like someone watching the sky change color.

You are the violet hour — the space between day and night. You are the soft glow that makes everything feel possible.`,
};

// 1. Midnight Oil — warm darkness, amber accent, Lora serif
export const midnightOilTheme = defineTheme({
  name: 'midnight-oil',
  extends: neutralTheme,
  typography: {
    // Serif reserved for headings; body stays sans for readable long-form text
    body: { family: 'Inter', fallbacks: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
    heading: { family: 'Lora', fallbacks: 'Georgia, "Times New Roman", serif', weights: { 3: 'bold', 4: 'bold' } },
    code: { family: 'ui-monospace', fallbacks: '"SF Mono", Monaco, Consolas, monospace' },
  },
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

// 2. Cold Cathode — terminal green on blue-black, monospace everything
export const coldCathodeTheme = defineTheme({
  name: 'cold-cathode',
  extends: neutralTheme,
  typography: {
    body: { family: 'JetBrains Mono', fallbacks: 'ui-monospace, "SF Mono", Monaco, Consolas, monospace' },
    heading: { family: 'JetBrains Mono', fallbacks: 'ui-monospace, "SF Mono", Monaco, Consolas, monospace', weights: { 3: 'bold', 4: 'bold' } },
    code: { family: 'JetBrains Mono', fallbacks: 'ui-monospace, "SF Mono", Monaco, Consolas, monospace' },
  },
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
    '--color-border': ['#0A1A0A1A', '#4ADE8033'],
    '--color-border-emphasized': ['#B0C0B0', '#4ADE8066'],
    '--color-overlay': ['#0A0E0A66', '#0A0E0A99'],
    '--color-shadow': ['rgba(10, 26, 10, 0.08)', 'rgba(0, 0, 0, 0.4)'],
  },
});

// 3. Paper Bleed — warm paper, burnt sienna ink, Fraunces serif
export const paperBleedTheme = defineTheme({
  name: 'paper-bleed',
  extends: neutralTheme,
  typography: {
    // Serif reserved for headings; body stays sans for readable long-form text
    body: { family: 'Inter', fallbacks: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
    heading: { family: 'Fraunces', fallbacks: 'Georgia, "Times New Roman", serif', weights: { 3: 'bold', 4: 'bold' } },
    code: { family: 'ui-monospace', fallbacks: '"SF Mono", Monaco, Consolas, monospace' },
  },
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

// 4. Violet Hour — soft purple atmospheric dark, Inter sans
export const violetHourTheme = defineTheme({
  name: 'violet-hour',
  extends: neutralTheme,
  typography: {
    body: { family: 'Inter', fallbacks: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
    heading: { family: 'Inter', fallbacks: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', weights: { 3: 'bold', 4: 'bold' } },
    code: { family: 'ui-monospace', fallbacks: '"SF Mono", Monaco, Consolas, monospace' },
  },
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
    '--color-border': ['#1A10201A', '#A78BFA26'],
    '--color-border-emphasized': ['#C8BCD8', '#A78BFA44'],
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
