import api from './client';

export const askAI = async (message: string, sessionId?: string | null) => {
  const res = await api.post('/ai/ask', { message, sessionId });
  return res.data;
};

export default askAI;
