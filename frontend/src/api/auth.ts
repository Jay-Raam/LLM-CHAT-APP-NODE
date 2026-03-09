import api from './client';

export const register = async (payload: { name?: string; email: string; password: string }) => {
    const res = await api.post('/auth/register', payload);
    console.log('res', res);
    
  return res.data;
};

export const login = async (payload: { email: string; password: string }) => {
  const res = await api.post('/auth/login', payload);
  return res.data;
};

export const refresh = async () => {
  const res = await api.post('/auth/refresh');
  return res.data;
};

export const logout = async () => {
  const res = await api.post('/auth/logout');
  return res.data;
};

export default { register, login, refresh, logout };
