import type { Session, Settings, Message } from './types';

const SESSIONS_KEY = 'hush:sessions';
const SETTINGS_KEY = 'hush:settings';
const ACTIVE_KEY = 'hush:activeSession';

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: Session[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { apiKey: '', model: 'anthropic/claude-sonnet-4', themeMode: 'dark' };
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadActiveSession(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveSession(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createSession(title = 'New chat'): Session {
  return {
    id: genId(),
    title,
    messages: [],
    createdAt: Date.now(),
  };
}

export function createMessage(role: Message['role'], content: string): Message {
  return { id: genId(), role, content, createdAt: Date.now() };
}
