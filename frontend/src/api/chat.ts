import api from './client';

export interface ChatSessionDto {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessageDto {
  id?: string;
  role?: 'user' | 'assistant';
  content?: string;
  created_at?: string;
  timestamp?: string;
  text?: string;
  sender?: 'user' | 'assistant' | 'ai';
  createdAt?: string;
}

export interface CreateMessageResponse {
  ok: boolean;
  chatId: string;
  message: {
    id: string;
    text: string;
    sender: 'user' | 'assistant' | 'ai';
    createdAt: string;
    chatId: string;
  };
}

export const getSessions = async (): Promise<ChatSessionDto[]> => {
  const res = await api.get('/chat/sessions');
  return res.data || [];
};

export const getSessionMessages = async (sessionId: string): Promise<ChatMessageDto[]> => {
  const res = await api.get(`/chat/${sessionId}`);
  return res.data?.messages || [];
};

export const createChatMessage = async (payload: { sessionId?: string | null; text: string }): Promise<CreateMessageResponse> => {
  const res = await api.post('/chat/messages', payload);
  return res.data;
};

export const deleteSession = async (sessionId: string) => {
  const res = await api.delete(`/chat/session/${sessionId}`);
  return res.data;
};
