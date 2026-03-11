import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square, Volume2 } from 'lucide-react';

type VoiceChatProps = {
    onSendMessage: (text: string) => Promise<string | void>;
    disabled?: boolean;
    variant?: 'panel' | 'icon';
    className?: string;
};

type SpeechRecognitionLike = EventTarget & {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onresult: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const AUTO_STOP_DELAY_MS = 2600;
const MIN_WORDS_FOR_AUTO_SEND = 3;

declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}

function mapRecognitionError(error: string) {
    if (error === 'aborted') {
        return '';
    }
    if (error === 'not-allowed' || error === 'service-not-allowed') {
        return 'Microphone permission was denied.';
    }
    if (error === 'no-speech') {
        return 'No speech detected. Please try again.';
    }
    if (error === 'audio-capture') {
        return 'No microphone was found on this device.';
    }
    return 'Voice recognition failed. Please try again.';
}

function pickFemaleVoice(voices: SpeechSynthesisVoice[]) {
    if (!voices.length) return null;
    const femaleHints = ['female', 'woman', 'zira', 'samantha', 'karen', 'susan', 'aria', 'eva', 'jenny'];
    const preferred = voices.find((voice) => {
        const label = `${voice.name} ${voice.voiceURI}`.toLowerCase();
        return femaleHints.some((hint) => label.includes(hint));
    });
    return preferred || voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) || voices[0];
}

export default function VoiceChat({ onSendMessage, disabled = false, variant = 'panel', className = '' }: VoiceChatProps) {
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const silenceTimerRef = useRef<number | null>(null);
    const finalTranscriptRef = useRef('');
    const lastInterimRef = useRef('');
    const shouldSendOnEndRef = useRef(false);
    const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [lastHeardText, setLastHeardText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const isRecognitionSupported = useMemo(() => {
        return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }, []);

    useEffect(() => {
        const loadVoices = () => {
            voicesRef.current = window.speechSynthesis.getVoices();
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const clearSilenceTimer = () => {
        if (silenceTimerRef.current !== null) {
            window.clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    };

    const getCurrentTranscript = () => {
        return `${finalTranscriptRef.current} ${lastInterimRef.current}`.replace(/\s+/g, ' ').trim();
    };

    const getWordCount = (text: string) => {
        if (!text) return 0;
        return text.split(/\s+/).filter(Boolean).length;
    };

    const scheduleAutoStop = () => {
        clearSilenceTimer();
        silenceTimerRef.current = window.setTimeout(() => {
            const transcript = getCurrentTranscript();
            const wordCount = getWordCount(transcript);

            // Prevent accidental one-word sends when users briefly pause mid-sentence.
            if (wordCount > 0 && wordCount < MIN_WORDS_FOR_AUTO_SEND) {
                scheduleAutoStop();
                return;
            }

            recognitionRef.current?.stop();
        }, AUTO_STOP_DELAY_MS);
    };

    const speakResponse = (text: string) => {
        if (!text.trim()) return;
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.lang = 'en-US';
        utterance.voice = pickFemaleVoice(voicesRef.current);

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => {
            setIsSpeaking(false);
            setError('Text-to-speech failed in this browser.');
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const sendFinalTranscript = async () => {
        const transcript = getCurrentTranscript();
        shouldSendOnEndRef.current = false;

        if (!transcript) {
            setError('No speech detected. Please try again.');
            return;
        }

        setLastHeardText(transcript);
        setIsSending(true);
        setError(null);

        try {
            const aiResponse = await onSendMessage(transcript);
            const normalized = (aiResponse || '').trim();
            if (normalized) {
                speakResponse(normalized);
            }
        } catch {
            setError('Failed to send your message. Please try again.');
        } finally {
            setIsSending(false);
            finalTranscriptRef.current = '';
            lastInterimRef.current = '';
        }
    };

    useEffect(() => {
        if (!isRecognitionSupported) return;

        const RecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!RecognitionApi) return;

        const recognition = new RecognitionApi();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setError(null);
            setIsListening(true);
            shouldSendOnEndRef.current = true;
            finalTranscriptRef.current = '';
            lastInterimRef.current = '';
            setLastHeardText('');
            scheduleAutoStop();
        };

        recognition.onend = async () => {
            setIsListening(false);
            clearSilenceTimer();
            if (shouldSendOnEndRef.current) {
                await sendFinalTranscript();
            }
        };

        recognition.onerror = (event: any) => {
            const message = mapRecognitionError(event.error);
            if (message) {
                setError(message);
            }
            setIsListening(false);
            shouldSendOnEndRef.current = false;
            clearSilenceTimer();
        };

        recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const result = event.results[i];
                const chunk = result?.[0]?.transcript || '';
                if (result?.isFinal) {
                    finalTranscriptRef.current = `${finalTranscriptRef.current} ${chunk}`.trim();
                } else {
                    interim = `${interim} ${chunk}`.trim();
                }
            }

            lastInterimRef.current = interim;
            const liveText = `${finalTranscriptRef.current} ${interim}`.replace(/\s+/g, ' ').trim();
            if (liveText) {
                setLastHeardText(liveText);
            }
            scheduleAutoStop();
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
            recognitionRef.current = null;
            clearSilenceTimer();
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
            utteranceRef.current = null;
        };
    }, [isRecognitionSupported, onSendMessage]);

    const requestMicPermission = async () => {
        if (!navigator.mediaDevices?.getUserMedia) return false;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());
            return true;
        } catch {
            setError('Microphone permission is required for voice chat.');
            return false;
        }
    };

    const handleMicClick = async () => {
        if (disabled || isSending) return;

        setError(null);

        if (!isRecognitionSupported) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        if (isListening) {
            shouldSendOnEndRef.current = true;
            recognitionRef.current?.stop();
            return;
        }

        const hasPermission = await requestMicPermission();
        if (!hasPermission) return;

        shouldSendOnEndRef.current = true;
        recognitionRef.current?.start();
    };

    const statusText = isListening ? 'Listening...' : isSending ? 'Sending...' : isSpeaking ? 'AI speaking...' : '';

    const handleStopSpeaking = () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    };

    if (variant === 'icon') {
        return (
            <div className={`relative ${className}`}>
                <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={disabled || isSending}
                    className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                    title={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                    {isListening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                {(statusText || error) && (
                    <div className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-1.5 text-xs text-zinc-200 shadow-xl">
                        {error ? (
                            <span className="text-red-400">{error}</span>
                        ) : (
                            <div className="inline-flex items-center gap-2">
                                <span>{statusText}</span>
                                {isSpeaking && (
                                    <button
                                        type="button"
                                        onClick={handleStopSpeaking}
                                        className="rounded bg-red-500/20 px-2 py-0.5 text-[11px] text-red-300 hover:bg-red-500/30"
                                    >
                                        Stop
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`mt-3 rounded-xl border border-white/10 bg-[#121212] p-3 sm:p-4 ${className}`}>
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={disabled || isSending}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isListening ? 'Stop' : 'Start voice chat'}
                </button>

                <div className="flex items-center gap-4 text-xs sm:text-sm text-zinc-300">
                    {isListening && <span className="text-emerald-400">Listening...</span>}
                    {isSending && <span>Sending...</span>}
                    {isSpeaking && (
                        <div className="inline-flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-indigo-300">
                                <Volume2 className="h-4 w-4" />
                                AI speaking...
                            </span>
                            <button
                                type="button"
                                onClick={handleStopSpeaking}
                                className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300 hover:bg-red-500/30"
                            >
                                Stop
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {lastHeardText && (
                <p className="mt-2 text-xs sm:text-sm text-zinc-400">
                    Heard: <span className="text-zinc-200">{lastHeardText}</span>
                </p>
            )}

            {error && <p className="mt-2 text-xs sm:text-sm text-red-400">{error}</p>}
        </div>
    );
}
