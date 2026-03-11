import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
    setSessions,
    setActiveSession,
    setMessages,
    addMessage,
    setLoading,
    setStreaming,
    setError,
} from '../store/chatSlice';
import { askAI } from '../api/ai';
import { createChatMessage, getSessionMessages, getSessions } from '../api/chat';
import { getNewsSuggestions } from '../api/news';
import VoiceChat from '../components/VoiceChat';
import { io } from 'socket.io-client';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Coins } from 'lucide-react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

function MessageSkeleton() {
    return (
        <div className="flex gap-4 max-w-4xl mx-auto w-full animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 shrink-0" />
            <div className="flex flex-col space-y-3 flex-1">
                <div className="h-4 bg-zinc-800 rounded-md w-3/4" />
                <div className="h-4 bg-zinc-800 rounded-md w-1/2" />
            </div>
        </div>
    );
}

function estimateTokens(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    // Lightweight approximation: ~1 token per 4 characters for mixed English/code text.
    return Math.ceil(trimmed.length / 4);
}

export default function Dashboard() {
    const dispatch = useAppDispatch();
    const { messages, activeSessionId, loading, streaming, error } = useAppSelector((state) => state.chat);
    const { isAuthenticated, initialized } = useAppSelector((state) => state.auth);

    const [input, setInput] = useState('');
    const [showTypingPreview, setShowTypingPreview] = useState(false);
    const [pendingPrompt, setPendingPrompt] = useState('');
    const [typingPreviewText, setTypingPreviewText] = useState('');
    const [newsSuggestions, setNewsSuggestions] = useState<string[]>([]);
    const typingPreviewActiveRef = useRef(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sessionTokenEstimate = useMemo(() => {
        return messages.reduce((total, m) => total + estimateTokens(m.content || ''), 0);
    }, [messages]);

    const loadSessions = async (preferredSessionId?: string) => {
        try {
            const response = await getSessions();
            const nextSessions = (response || []).map((s: any) => ({
                id: String(s.id),
                title: s.title,
                createdAt: s.created_at || s.createdAt,
                updatedAt: s.updated_at || s.updatedAt,
            }));

            dispatch(setSessions(nextSessions));

            const nextActiveId = preferredSessionId || activeSessionId || nextSessions[0]?.id || null;
            if (nextActiveId && nextActiveId !== activeSessionId) {
                dispatch(setActiveSession(nextActiveId));
            }
        } catch (err) {
            console.error('Failed to fetch sessions', err);
        }
    };

    const loadMessages = async (sessionId: string) => {
        dispatch(setLoading(true));
        try {
            const rows = await getSessionMessages(sessionId);
            const msgs = (rows || []).map((m: any, idx: number) => ({
                id: m.id || `${Date.now()}-${idx}`,
                role: m.role,
                content: m.content || m.text || '',
                timestamp: m.created_at || m.timestamp || new Date().toISOString(),
            }));
            dispatch(setMessages(msgs));
        } catch (err) {
            dispatch(setError('Failed to load messages'));
        } finally {
            dispatch(setLoading(false));
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadSessions();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        let isMounted = true;

        const loadNewsSuggestions = async () => {
            try {
                const rows = await getNewsSuggestions(4);
                if (!isMounted) return;
                setNewsSuggestions(rows.map((r) => r.title));
            } catch (err) {
                console.warn('Failed to load NewsData suggestions', err);
                if (!isMounted) return;
                setNewsSuggestions([
                    'Latest technology trends in India',
                    'Education policy updates this week',
                    'Healthy lifestyle ideas for busy days',
                    'Food innovation news highlights',
                ]);
            }
        };

        loadNewsSuggestions();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!initialized || !isAuthenticated) return;

        const envSocket = (import.meta as any).env?.VITE_SOCKET_URL;
        const backendOrigin =
            (import.meta as any).env?.VITE_BACKEND_URL || (import.meta as any).env?.VITE_API_BACKEND || 'http://localhost:4000';

        const socket = io(envSocket || backendOrigin, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            autoConnect: true,
            path: '/socket.io',
        });

        socket.on('connect', () => console.log('socket connected', socket.id));
        socket.on('connect_error', (err: any) => console.warn('socket connect_error', err));
        socket.on('error', (err: any) => console.warn('socket error', err));

        socket.on('newMessage', (payload: any) => {
            const role = payload.sender === 'ai' || payload.sender === 'assistant' ? 'assistant' : 'user';
            if (role !== 'assistant') return;

            typingPreviewActiveRef.current = false;
            setShowTypingPreview(false);
            setTypingPreviewText('');
            setPendingPrompt('');

            const mapped: Message = {
                id: payload.id,
                role,
                content: payload.text,
                timestamp: payload.createdAt,
            };
            dispatch(addMessage(mapped));
        });

        return () => {
            socket.disconnect();
        };
    }, [initialized, isAuthenticated]);

    useEffect(() => {
        if (activeSessionId) {
            loadMessages(activeSessionId);
        } else {
            dispatch(setMessages([]));
        }
    }, [activeSessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading, streaming, showTypingPreview, typingPreviewText]);

    useEffect(() => {
        if (!showTypingPreview) {
            setTypingPreviewText('');
            return;
        }

        const normalized = pendingPrompt.replace(/\s+/g, ' ').trim();
        const snippet = normalized.length > 56 ? `${normalized.slice(0, 56)}...` : normalized;
        const target = snippet ? `Thinking about: "${snippet}"` : 'Thinking...';

        let i = 0;
        const intervalId = window.setInterval(() => {
            i += 1;
            setTypingPreviewText(target.slice(0, i));
            if (i >= target.length) {
                window.clearInterval(intervalId);
            }
        }, 24);

        return () => window.clearInterval(intervalId);
    }, [showTypingPreview, pendingPrompt]);

    const sendPrompt = async (text: string) => {
        const normalizedText = text.trim();
        if (!normalizedText || streaming) return '';

        dispatch(setStreaming(true));
        dispatch(setError(null));
        typingPreviewActiveRef.current = true;
        setPendingPrompt(normalizedText);
        setShowTypingPreview(true);

        try {
            const saved = await createChatMessage({ sessionId: activeSessionId, text: normalizedText });
            if (saved?.message) {
                dispatch(
                    addMessage({
                        id: String(saved.message.id),
                        role: 'user',
                        content: saved.message.text,
                        timestamp: saved.message.createdAt || new Date().toISOString(),
                    })
                );
            }

            const resolvedSessionId = saved?.chatId ? String(saved.chatId) : activeSessionId;
            if (resolvedSessionId && resolvedSessionId !== activeSessionId) {
                await loadSessions(resolvedSessionId);
            } else {
                await loadSessions();
            }

            const aiResponse = await askAI(normalizedText, resolvedSessionId || undefined);
            const content =
                aiResponse?.data?.content ||
                aiResponse?.data?.rawSecond?.choices?.[0]?.message?.content ||
                aiResponse?.data?.rawFirst?.choices?.[0]?.message?.content ||
                '';

            // Fallback to API payload if socket delivery fails, preventing a stuck preview bubble.
            if (typingPreviewActiveRef.current && content) {
                dispatch(
                    addMessage({
                        id: `fallback-${Date.now()}`,
                        role: 'assistant',
                        content,
                        timestamp: new Date().toISOString(),
                    })
                );
                typingPreviewActiveRef.current = false;
                setShowTypingPreview(false);
                setTypingPreviewText('');
                setPendingPrompt('');
            }

            return content;
        } catch (err: any) {
            dispatch(setError('Something went wrong. Please try again.'));
            typingPreviewActiveRef.current = false;
            setShowTypingPreview(false);
            setTypingPreviewText('');
            setPendingPrompt('');
            console.error(err);
            return '';
        } finally {
            dispatch(setStreaming(false));
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || streaming) return;

        setInput('');
        await sendPrompt(text);
    };

    return (
        <div className="flex flex-col h-full">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 pb-24 sm:pb-8 space-y-5 sm:space-y-8 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {loading && messages.length === 0 && (
                        <motion.div
                            key="skeletons"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-8"
                        >
                            <MessageSkeleton />
                            <MessageSkeleton />
                            <MessageSkeleton />
                        </motion.div>
                    )}

                    {messages.length === 0 && !loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] sm:h-full text-center max-w-2xl mx-auto px-2"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-indigo-600/10 flex items-center justify-center mb-5 sm:mb-6">
                                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-500" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">How can I help you today?</h2>
                            <p className="text-zinc-400 text-sm sm:text-lg leading-relaxed">
                                Nexus AI is your production-grade assistant. Ask me anything from complex coding problems to creative writing.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-8 sm:mt-12 w-full">
                                {newsSuggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setInput(suggestion)}
                                        className="p-3 sm:p-4 min-h-14 text-left text-xs sm:text-sm bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-indigo-500/30 transition-all"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn('flex gap-2 sm:gap-4 max-w-4xl mx-auto', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                        >
                            <div
                                className={cn(
                                    'w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shrink-0 flex items-center justify-center',
                                    message.role === 'user' ? 'bg-indigo-600' : 'bg-zinc-800 border border-white/10'
                                )}
                            >
                                {message.role === 'user' ? <User className="w-4 h-4 sm:w-6 sm:h-6 text-white" /> : <Bot className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-400" />}
                            </div>
                            <div className={cn('flex flex-col space-y-2 max-w-[90%] sm:max-w-[85%]', message.role === 'user' ? 'items-end' : 'items-start')}>
                                <div
                                    className={cn(
                                        'px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-[13px] sm:text-sm leading-relaxed',
                                        message.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-[#1A1A1A] text-zinc-200 border border-white/5 rounded-tl-none'
                                    )}
                                >
                                    {message.role === 'assistant' && message.content === '' && streaming ? (
                                        <div className="flex flex-col space-y-2 w-64 animate-pulse">
                                            <div className="h-3 bg-zinc-700 rounded w-full" />
                                            <div className="h-3 bg-zinc-700 rounded w-5/6" />
                                            <div className="h-3 bg-zinc-700 rounded w-4/6" />
                                        </div>
                                    ) : (
                                        <div className="markdown-body">
                                            <ReactMarkdown>{message.content}</ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {showTypingPreview && (
                        <motion.div
                            key="typing-preview"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="flex gap-2 sm:gap-4 max-w-4xl mx-auto"
                        >
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shrink-0 flex items-center justify-center bg-zinc-800 border border-white/10">
                                <Bot className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-400" />
                            </div>
                            <div className="flex flex-col space-y-2 max-w-[90%] sm:max-w-[85%] items-start">
                                <div className="px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-[13px] sm:text-sm leading-relaxed bg-[#1A1A1A] text-zinc-200 border border-white/5 rounded-tl-none min-w-44 sm:min-w-55">
                                    <div className="flex items-center gap-1.5 text-zinc-300">
                                        <span>{typingPreviewText || 'Thinking'}</span>
                                        <span className="inline-flex gap-1" aria-hidden="true">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="sticky bottom-0 p-3 sm:p-4 lg:p-8 pt-2 sm:pt-0 bg-linear-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent backdrop-blur-sm">
                <div className="max-w-4xl mx-auto relative">
                    <form onSubmit={handleSendMessage} className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Message Nexus AI..."
                            disabled={streaming}
                            className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-4 sm:pl-6 pr-40 sm:pr-44 text-sm sm:text-base text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 shadow-2xl"
                        />
                        <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
                            <div className="relative group">
                                <button
                                    type="button"
                                    className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                                    aria-label="Session token usage"
                                >
                                    <Coins className="w-4 h-4" />
                                </button>
                                <div className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-2 text-xs text-zinc-200 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                                    {sessionTokenEstimate.toLocaleString()} tokens used in this session (approx)
                                </div>
                            </div>
                            <VoiceChat onSendMessage={sendPrompt} disabled={streaming} variant="icon" />
                            <button
                                type="submit"
                                disabled={!input.trim() || streaming}
                                className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:bg-zinc-800 transition-all"
                            >
                                {streaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                    </form>
                    <p className="hidden sm:block mt-3 text-center text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
                        Nexus AI can make mistakes. Check important info.
                    </p>
                </div>
            </div>
        </div>
    );
}
