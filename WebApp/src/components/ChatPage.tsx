import { useState, useEffect, useRef } from 'react';
import { getStoredApiKey, saveApiKey, validateApiKey, sendChatStream, clearApiKey } from '../lib/openai';
import type { ChatMessage } from '../lib/openai';
import { storage } from '../lib/storage';
import { ChatMessageItem } from './ChatMessageItem';
import systemPromptText from '../data/system_prompt.md?raw';
import './ChatPage.css';

export default function ChatPage() {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [inputKey, setInputKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [authError, setAuthError] = useState('');
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMsg, setInputMsg] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showExpandButton, setShowExpandButton] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedKey = getStoredApiKey();
        if (storedKey) {
            setApiKey(storedKey);
            initializeChat();
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Save messages to storage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            storage.saveChatHistory(messages);
        }
    }, [messages]);

    const initializeChat = async () => {
        // Try to load existing chat history first
        const storedHistory = await storage.getChatHistory();
        if (storedHistory && storedHistory.length > 0) {
            setMessages(storedHistory);
            return;
        }

        // If no history, load full text and start fresh
        const docText = await storage.getFullText();

        if (!docText) {
            console.error('Chat context missing: bloodFullText is null');
            setMessages([{ role: 'assistant', content: 'Hiba: Nem található dokumentum tartalom. Kérlek töltsd fel újra a fájlokat.' }]);
            return;
        }

        console.log(`Chat context loaded: ${docText.length} characters.`);
        console.log('Preview:', docText.substring(0, 100));

        const initialMessages: ChatMessage[] = [
            {
                role: 'system',
                content: `${systemPromptText}\n\nDOCUMENT CONTEXT:\n${docText}`
            },
            {
                role: 'assistant',
                content: 'Szia! Én a személyes AI orvosod vagyok. Elolvastam az összes EESZT dokumentumodat. Miben segíthetek? Kérdezhetsz bármit az eredményeidről vagy a határértékekről.'
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
            saveApiKey(inputKey);
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

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            setShowExpandButton(false);
            setIsExpanded(false);
        }

        const newHistory: ChatMessage[] = [
            ...messages,
            { role: 'user', content: userMsg }
        ];

        // Add user message immediately
        setMessages(newHistory);
        setIsTyping(true);

        try {
            await sendChatStream(newHistory, apiKey, (chunk) => {
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];

                    // If the last message is already from the assistant, append to it
                    if (lastMsg && lastMsg.role === 'assistant') {
                        const updatedMsg = { ...lastMsg, content: lastMsg.content + chunk };
                        return [...prev.slice(0, -1), updatedMsg];
                    }

                    // Otherwise, this is the first chunk, so append a new assistant message
                    return [...prev, { role: 'assistant', content: chunk }];
                });
            });
        } catch (error) {
            console.error(error);
            setMessages(prev => {
                // Remove the empty assistant message if it failed immediately after adding
                const last = prev[prev.length - 1];
                if (last.role === 'assistant' && last.content === '') {
                    return [...prev.slice(0, -1), { role: 'assistant', content: 'Sajnálom, hiba történt a válasz generálása közben.' }];
                }
                return [...prev, { role: 'assistant', content: 'Sajnálom, hiba történt a válasz generálása közben.' }];
            });
        } finally {
            setIsTyping(false);
        }
    };

    // Auto-resize logic
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = 'auto'; // Reset to calculate scrollHeight

        const lineHeight = 24; // Approximate line height in pixels
        const threeLinesHeight = lineHeight * 3;
        const maxExpandedHeight = lineHeight * 15;

        const currentScrollHeight = textarea.scrollHeight;

        if (currentScrollHeight > threeLinesHeight) {
            setShowExpandButton(true);
            if (isExpanded) {
                textarea.style.height = `${maxExpandedHeight}px`; // Fixed full height
            } else {
                textarea.style.height = `${Math.min(currentScrollHeight, threeLinesHeight)}px`; // Capped at 3 lines
            }
        } else {
            setShowExpandButton(false);
            textarea.style.height = `${currentScrollHeight}px`;
        }
    }, [inputMsg, isExpanded]);

    const handleExitClick = () => {
        setIsExitModalOpen(true);
    };

    const confirmExit = async () => {
        clearApiKey();
        setApiKey(null);
        setMessages([]);
        await storage.clear();
        setIsExitModalOpen(false);
    };

    const cancelExit = () => {
        setIsExitModalOpen(false);
    };

    // API Key Entry State
    if (!apiKey) {
        return (
            <div className="chat-auth-container">
                <div className="auth-card">
                    <h2>OpenAI API Kulcs Szükséges</h2>
                    <p>
                        A csevegéshez szükség van egy érvényes OpenAI API kulcsra.
                        <br /><small className="text-muted">A kulcsot kizárólag a böngésződben tároljuk, sosem küldjük el a szerverünkre.</small>
                    </p>

                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="sk-..."
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleKeySubmit()}
                            className="api-input"
                        />
                    </div>

                    {authError && <div className="error-msg">{authError}</div>}

                    <button
                        className="btn btn-full"
                        onClick={handleKeySubmit}
                        disabled={isValidating}
                    >
                        {isValidating ? 'Ellenőrzés...' : 'Belépés'}
                    </button>

                    <div className="help-text">
                        <p>Nincs még kulcsod? <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">Kérj egyet itt</a>.</p>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <a href="#choice" className="link-muted">Vissza</a>
                    </div>
                </div>
            </div>
        );
    }

    // Chat Interface (ChatGPT-style)
    return (
        <div className="chat-container">
            {/* Minimal Header */}
            <header className="chat-header-minimal">
                <div className="header-left">
                    <button className="icon-btn" onClick={() => window.location.hash = 'choice'} title="Vissza">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7 7-7-7 7-7" />
                        </svg>
                    </button>
                    <h1>Orvosi Asszisztens</h1>
                </div>
                <div className="header-right">
                    <button className="icon-btn with-text" onClick={() => window.location.hash = 'results'} title="Adatok megtekintése">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Eredmények</span>
                    </button>
                    <button className="icon-btn" onClick={handleExitClick} title="Kilépés">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Messages Area */}
            <div className="messages-wrapper">
                <div className="messages-content">
                    {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                        <ChatMessageItem key={idx} msg={msg} />
                    ))}

                    {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
                        <div className="message-row assistant">
                            <div className="message-container">
                                <div className="message-avatar">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area (sticky bottom, centered) */}
            <div className="input-area-wrapper">
                <div className="input-area-container">
                    <div className="input-box">
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
                            className={showExpandButton ? "has-expand-btn" : ""}
                        />

                        {showExpandButton && (
                            <button
                                className="input-expand-btn"
                                onClick={() => setIsExpanded(!isExpanded)}
                                title={isExpanded ? "Összecsukás" : "Teljes nézet"}
                            >
                                {isExpanded ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 9 6 6 6-6" /></svg>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                )}
                            </button>
                        )}

                        <button
                            className="send-button"
                            onClick={handleSendMessage}
                            disabled={!inputMsg.trim() || isTyping}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right-icon lucide-arrow-right"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                        </button>
                    </div>
                    <div className="disclaimer">
                        A mesterséges intelligencia hibázhat. Súlyos egészségügyi kérdésekben mindig konzultálj orvosoddal.
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {isExitModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass">
                        <h3>Biztosan kilépsz?</h3>
                        <p>
                            Ez a művelet <strong>törli az összes beszélgetést és a feltöltött adatokat</strong> a jelenlegi munkamenetből.
                            <br />Az adatok véglegesen elvesznek.
                        </p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={cancelExit}>
                                Mégse
                            </button>
                            <button className="btn btn-danger" onClick={confirmExit}>
                                Kilépés és Törlés
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
