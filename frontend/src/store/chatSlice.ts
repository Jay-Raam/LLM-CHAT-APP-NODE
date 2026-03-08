import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatState, ChatSession, Message } from '../types';

const initialState: ChatState = {
  sessions: [],
  activeSessionId: null,
  messages: [],
  loading: false,
  streaming: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<ChatSession[]>) => {
      state.sessions = action.payload;
    },
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(s => s.id !== action.payload);
      if (state.activeSessionId === action.payload) {
        state.activeSessionId = null;
        state.messages = [];
      }
    },
    setActiveSession: (state, action: PayloadAction<string | null>) => {
      state.activeSessionId = action.payload;
      state.messages = [];
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    updateLastMessage: (state, action: PayloadAction<string>) => {
      if (state.messages.length > 0) {
        state.messages[state.messages.length - 1].content = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setStreaming: (state, action: PayloadAction<boolean>) => {
      state.streaming = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSessions,
  removeSession,
  setActiveSession,
  setMessages,
  addMessage,
  updateLastMessage,
  setLoading,
  setStreaming,
  setError,
} = chatSlice.actions;
export default chatSlice.reducer;
