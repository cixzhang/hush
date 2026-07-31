import { THEME_PERSONAS, type ThemeName } from './themes';

export function getPersona(themeName: string): string {
  return THEME_PERSONAS[themeName as ThemeName] ?? THEME_PERSONAS['midnight-oil'];
}
