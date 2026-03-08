export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  initialized?: boolean;
  loading: boolean;
  error: string | null;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: Message[];
  loading: boolean;
  streaming: boolean;
  error: string | null;
}
