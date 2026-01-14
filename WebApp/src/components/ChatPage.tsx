import { useState, useEffect, useRef } from 'react';
import { getStoredApiKey, saveApiKey, validateApiKey, sendChatRequest, clearApiKey } from '../lib/openai';
import type { ChatMessage } from '../lib/openai';
import systemPromptText from '../data/system_prompt.md?raw'; // Vite raw import
import './ChatPage.css';

export default function ChatPage() {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [inputKey, setInputKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [authError, setAuthError] = useState('');

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMsg, setInputMsg] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Load - Check for Key & Document Context
    useEffect(() => {
        const storedKey = getStoredApiKey();
        if (storedKey) {
            setApiKey(storedKey);
            initializeChat();
        }
    }, []);

    // Scroll to bottom effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);


    const initializeChat = () => {
        const docText = sessionStorage.getItem('bloodFullText');

        if (!docText) {
            console.error('Chat context missing: bloodFullText is null');
            // Should not happen if flow is correct, but handle it
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
                content: 'Szia! Én a leleteid szakértője vagyok. Miben segíthetek? Kérdezhetsz bármit az eredményeidről vagy a határértékekről.'
            }
        ];
        setMessages(initialMessages);
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
        setInputMsg(''); // Clear input immediately

        const newHistory: ChatMessage[] = [
            ...messages,
            { role: 'user', content: userMsg }
        ];

        setMessages(newHistory);
        setIsTyping(true);

        try {
            const aiResponse = await sendChatRequest(newHistory, apiKey);
            setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sajnálom, hiba történt a válasz generálása közben. Ellenőrizd az internetkapcsolatot vagy az API kulcsot.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleLogout = () => {
        clearApiKey();
        setApiKey(null);
        setMessages([]);
    }

    // 1. STATE: API Key Entry
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

    // 2. STATE: Chat Interface
    return (
        <div className="chat-page">
            <div className="chat-header">
                <h3>Orvosi Asszisztens</h3>
                <div className="header-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => window.location.hash = 'results'}>Adatok Megtekintése</button>
                    <button className="btn btn-sm btn-ghost" onClick={handleLogout} title="Kulcs törlése">Kilépés</button>
                </div>
            </div>

            <div className="messages-container">
                {messages.filter(m => m.role !== 'system').map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        <div className="message-bubble">
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="message assistant">
                        <div className="message-bubble typing-indicator">
                            <span>.</span><span>.</span><span>.</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <div className="input-wrapper">
                    <textarea
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
                    />
                    <button
                        className="send-btn"
                        onClick={handleSendMessage}
                        disabled={!inputMsg.trim() || isTyping}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
