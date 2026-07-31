export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface Settings {
  apiKey: string;
  model: string;
  themeMode: 'light' | 'dark';
  themeName: string;
}
