import { create } from './store';
import { streamChat } from './openrouter';
import type { Session, Settings, Message } from './types';
import {
  loadSessions, saveSessions,
  loadSettings, saveSettings,
  loadActiveSession, saveActiveSession,
  createSession, createMessage,
} from './storage';

interface AppState {
  sessions: Session[];
  activeSessionId: string | null;
  settings: Settings;
  isStreaming: boolean;
  isSettingsOpen: boolean;

  // derived
  activeSession: () => Session | undefined;

  // actions
  newSession: () => void;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  sendMessage: (text: string) => Promise<void>;
  stopStreaming: () => void;
  updateSettings: (partial: Partial<Settings>) => void;
  setSettingsOpen: (open: boolean) => void;
}

let abortController: AbortController | null = null;

export const useStore = create<AppState>((set, get) => ({
  sessions: loadSessions(),
  activeSessionId: loadActiveSession(),
  settings: loadSettings(),
  isStreaming: false,
  isSettingsOpen: false,

  activeSession: () => {
    const { sessions, activeSessionId } = get();
    return sessions.find((s) => s.id === activeSessionId);
  },

  newSession: () => {
    const session = createSession();
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: session.id,
    }));
    saveActiveSession(session.id);
    saveSessions(get().sessions);
  },

  selectSession: (id) => {
    set({ activeSessionId: id });
    saveActiveSession(id);
  },

  deleteSession: (id) => {
    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== id);
      const activeSessionId =
        state.activeSessionId === id
          ? (sessions[0]?.id ?? null)
          : state.activeSessionId;
      saveSessions(sessions);
      saveActiveSession(activeSessionId);
      return { sessions, activeSessionId };
    });
  },

  renameSession: (id, title) => {
    set((state) => {
      const sessions = state.sessions.map((s) =>
        s.id === id ? { ...s, title } : s,
      );
      saveSessions(sessions);
      return { sessions };
    });
  },

  sendMessage: async (text) => {
    const state = get();
    let session = state.activeSession();

    // Create session if none active
    if (!session) {
      session = createSession(text.slice(0, 40) || 'New chat');
      set((s) => ({
        sessions: [session!, ...s.sessions],
        activeSessionId: session!.id,
      }));
      saveActiveSession(session.id);
    }

    const userMsg = createMessage('user', text);
    const assistantMsg = createMessage('assistant', '');

    // Auto-title from first message
    const shouldRetitle =
      session.messages.length === 0 && session.title === 'New chat';
    const title = shouldRetitle ? text.slice(0, 40) : session.title;

    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === session!.id
          ? {
              ...sess,
              title,
              messages: [...sess.messages, userMsg, assistantMsg],
            }
          : sess,
      ),
      isStreaming: true,
    }));

    abortController = new AbortController();
    const sessionId = session.id;

    try {
      const allMessages = [...session.messages, userMsg];
      await streamChat(
        allMessages,
        get().settings,
        (token) => {
          set((s) => ({
            sessions: s.sessions.map((sess) =>
              sess.id === sessionId
                ? {
                    ...sess,
                    messages: sess.messages.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, content: m.content + token }
                        : m,
                    ),
                  }
                : sess,
            ),
          }));
        },
        abortController.signal,
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const errorText = `Error: ${(err as Error).message}`;
      set((s) => ({
        sessions: s.sessions.map((sess) =>
          sess.id === sessionId
            ? {
                ...sess,
                messages: sess.messages.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: errorText }
                    : m,
                ),
              }
            : sess,
        ),
      }));
    } finally {
      set({ isStreaming: false });
      abortController = null;
      saveSessions(get().sessions);
    }
  },

  stopStreaming: () => {
    abortController?.abort();
    set({ isStreaming: false });
  },

  updateSettings: (partial) => {
    set((state) => {
      const settings = { ...state.settings, ...partial };
      saveSettings(settings);
      return { settings };
    });
  },

  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
}));
