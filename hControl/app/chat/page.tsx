'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { ChatMessageItem } from '@/components/ChatMessageItem';
import { storage } from '@/lib/storage';
import { validateApiKey, sendChatStream } from '@/lib/llm/openai';
import { SYSTEM_PROMPT } from '@/lib/llm/systemPrompt';
import type { ChatMessage, LLMSettings } from '@/types/llm';
import { ApiKeyInstructions } from '@/components/ApiKeyInstructions';

export default function ChatPage() {
    const router = useRouter();
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [inputKey, setInputKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [authError, setAuthError] = useState('');
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [hasClickedLink, setHasClickedLink] = useState(false);
    const [isKeyValid, setIsKeyValid] = useState(false);

    useEffect(() => {
        const validate = async () => {
            if (inputKey.length > 10 && inputKey.startsWith('sk-')) {
                setIsValidating(true);
                const valid = await validateApiKey(inputKey);
                setIsKeyValid(valid);
                setIsValidating(false);
            } else {
                setIsKeyValid(false);
            }
        };

        const timer = setTimeout(() => {
            if (inputKey) validate();
        }, 800);

        return () => clearTimeout(timer);
    }, [inputKey]);


    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMsg, setInputMsg] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showExpandButton, setShowExpandButton] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check if data exists first
        const checkData = async () => {
            const hasData = await storage.hasData();
            if (!hasData) {
                router.push('/');
                return;
            }

            // Load API Key
            const settings = await storage.getLLMSettings();
            if (settings?.apiKey) {
                setApiKey(settings.apiKey);
                initializeChat();
            }
        };
        checkData();
    }, [router]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Save messages to storage
    useEffect(() => {
        if (messages.length > 0) {
            storage.saveChatHistory(messages);
        }
    }, [messages]);

    const initializeChat = async () => {
        const storedHistory = await storage.getChatHistory();
        if (storedHistory && storedHistory.length > 0) {
            setMessages(storedHistory);
            return;
        }

        const docText = await storage.getFullText();
        if (!docText) {
            setMessages([{ role: 'assistant', content: 'Hiba: Nem található dokumentum tartalom. Kérlek töltsd fel újra a fájlokat.', timestamp: new Date().toISOString() }]);
            return;
        }

        const initialMessages: ChatMessage[] = [
            {
                role: 'system',
                content: `${SYSTEM_PROMPT}\n\nDOCUMENT CONTEXT:\n${docText}`,
                timestamp: new Date().toISOString()
            },
            {
                role: 'assistant',
                content: 'Szia! Én a személyes AI orvosod vagyok. Elolvastam az összes EESZT dokumentumodat. Miben segíthetek? Kérdezhetsz bármit az eredményeidről vagy a határértékekről.',
                timestamp: new Date().toISOString()
            }
        ];
        setMessages(initialMessages);
        await storage.saveChatHistory(initialMessages);
    };

    const handleKeySubmit = async () => {
        if (!inputKey.trim()) return;

        setIsValidating(true);
        setAuthError('');

        const valid = await validateApiKey(inputKey);

        if (valid) {
            const settings: LLMSettings = {
                provider: 'openai',
                apiKey: inputKey
            };
            await storage.saveLLMSettings(settings);
            setApiKey(inputKey);
            initializeChat();
        } else {
            setAuthError('Érvénytelen API kulcs. Kérlek ellenőrizd és próbáld újra.');
        }
        setIsValidating(false);
    };

    const handleSendMessage = async () => {
        if (!inputMsg.trim() || !apiKey || isTyping) return;

        const userMsg = inputMsg;
        setInputMsg('');

        // Reset textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            setShowExpandButton(false);
            setIsExpanded(false);
        }

        const newHistory: ChatMessage[] = [
            ...messages,
            { role: 'user', content: userMsg, timestamp: new Date().toISOString() }
        ];

        setMessages(newHistory);
        setIsTyping(true);

        try {
            await sendChatStream(newHistory, apiKey, (chunk) => {
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];

                    if (lastMsg && lastMsg.role === 'assistant') {
                        const updatedMsg = { ...lastMsg, content: lastMsg.content + chunk };
                        return [...prev.slice(0, -1), updatedMsg];
                    }

                    return [...prev, { role: 'assistant', content: chunk, timestamp: new Date().toISOString() }];
                });
            });
        } catch (error) {
            console.error(error);
            setMessages(prev => {
                return [...prev, { role: 'assistant', content: 'Sajnálom, hiba történt a válasz generálása közben.', timestamp: new Date().toISOString() }];
            });
        } finally {
            setIsTyping(false);
        }
    };

    // Auto-resize logic
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = 'auto';
        const lineHeight = 24;
        const paddingY = 24; // py-3 = 12px top + 12px bottom
        const expandThresholdLines = 3;
        const autoLimitLines = 7;
        const manualFixedLines = 19;

        const expandThresholdHeight = (lineHeight * expandThresholdLines) + paddingY;
        const autoLimitHeight = (lineHeight * autoLimitLines) + paddingY;
        const manualFixedHeight = (lineHeight * manualFixedLines) + paddingY;

        const currentScrollHeight = textarea.scrollHeight;

        if (currentScrollHeight > expandThresholdHeight) {
            setShowExpandButton(true);
        } else {
            setShowExpandButton(false);
        }

        if (isExpanded) {
            textarea.style.height = `${manualFixedHeight}px`;
            textarea.style.overflowY = 'auto';
        } else {
            const targetHeight = Math.min(currentScrollHeight, autoLimitHeight);
            textarea.style.height = `${targetHeight}px`;
            textarea.style.overflowY = currentScrollHeight > autoLimitHeight ? 'auto' : 'hidden';
        }
    }, [inputMsg, isExpanded]);

    const handleDelete = async () => {
        await storage.deleteAllData();
        router.push('/');
    };



    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) setInputKey(text);
        } catch (err) {
            console.error('Failed to read clipboard', err);
        }
    };

    // ...

    if (!apiKey) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-4xl">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                        <div className="text-center mb-8">
                            <ApiKeyInstructions
                                onSlideChange={setCurrentSlide}
                                onLinkClick={() => setHasClickedLink(true)}
                            />
                        </div>

                        {currentSlide === 4 && hasClickedLink && (
                            <div className="max-w-md mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key-round-icon lucide-key-round">
                                                <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" /><circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                                            </svg>
                                        </div>
                                        <input
                                            type="password"
                                            placeholder="sk-..."
                                            value={inputKey}
                                            onChange={(e) => setInputKey(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && isKeyValid && handleKeySubmit()}
                                            className="w-full pl-12 pr-14 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 text-lg placeholder-gray-400 font-mono tracking-wide shadow-sm hover:border-gray-300 dark:hover:border-gray-600"
                                        />
                                        <button
                                            onClick={handlePaste}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                                            title="Beillesztés"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {isValidating && (
                                    <div className="text-center text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                                        Kulcs ellenőrzése...
                                    </div>
                                )}

                                {authError && !isValidating && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm text-center flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {authError}
                                    </div>
                                )}

                                <Button
                                    fullWidth
                                    onClick={handleKeySubmit}
                                    disabled={!isKeyValid || isValidating}
                                    className="h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    Belépés
                                </Button>

                                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                                    Nincs még kulcsod? <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline cursor-pointer inline">Kérj egyet itt</a>.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const hasStarted = messages.some(m => m.role === 'user');

    return (
        <div className={`flex flex-col flex-1 ${!hasStarted ? 'justify-center' : ''}`}>

            {/* Messages Area - Only show if conversation started */}
            {hasStarted && (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="container max-w-4xl mx-auto px-4 py-6">
                        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                            <ChatMessageItem key={idx} msg={msg} />
                        ))}

                        {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
                            <div className="flex w-full mb-6 justify-start">
                                <div className="flex flex-col items-start max-w-[90%] md:max-w-[80%]">
                                    <div className="px-4 py-3 rounded-2xl bg-transparent text-gray-500 dark:text-gray-400">
                                        <div className="flex space-x-1 h-5 items-center">
                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* Empty State Greeting */}
            {!hasStarted && (
                <div className="container max-w-3xl mx-auto px-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        {/* <span className="text-2xl">✨</span> */}
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">Szia!</span>
                    </div>
                    <p className="text-m text-gray-500 dark:text-gray-400 font-normal leading-relaxed">
                        Én a személyes AI orvosod vagyok. Elolvastam az összes EESZT dokumentumodat. Miben segíthetek? Kérdezhetsz bármit az eredményeidről vagy a határértékekről.
                    </p>
                </div>
            )}

            {/* Input Area */}
            <div className={`${hasStarted ? 'sticky bottom-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4' : 'w-full px-4 pb-32'}`}>
                <div className={`${hasStarted ? 'container max-w-4xl mx-auto' : 'container max-w-3xl mx-auto'}`}>
                    <div className="relative flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-[2rem] shadow-sm transition-shadow">
                        <textarea
                            ref={textareaRef}
                            value={inputMsg}
                            onChange={(e) => setInputMsg(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Írj egy üzenetet..."
                            rows={1}
                            className="w-full py-4 pl-6 pr-14 bg-transparent border-none focus:ring-0 focus:outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
                            style={{ minHeight: '56px' }}
                        />

                        {showExpandButton && (
                            <div className="absolute right-2 top-2">
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-0 border-none outline-none"
                                >
                                    {isExpanded ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 9 6 6 6-6" /></svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6" /></svg>
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="absolute right-2 bottom-2">
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputMsg.trim() || isTyping}
                                className="p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    {hasStarted && (
                        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                            A mesterséges intelligencia hibázhat. Súlyos egészségügyi kérdésekben mindig konzultálj orvosoddal.
                        </p>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={isExitModalOpen}
                onClose={() => setIsExitModalOpen(false)}
                onConfirm={handleDelete}
                title="Kilépés és adatok törlése"
                message="Biztosan ki szeretnél lépni? Ez törli a böngészőből az összes feltöltött dokumentumot és eredményt."
                confirmText="Kilépés"
                cancelText="Mégsem"
                variant="danger"
            />
        </div>
    );
}
