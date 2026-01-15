import { useState, useRef, useLayoutEffect } from 'react';
import type { ChatMessage } from '../lib/openai';
import { FormattedText } from './FormattedText';

interface ChatMessageItemProps {
    msg: ChatMessage;
}

export function ChatMessageItem({ msg }: ChatMessageItemProps) {
    const isUser = msg.role === 'user';
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (isUser && textRef.current) {
            // Check if height exceeds approx 4 lines (line-height ~1.5em => 6em ~ 96px)
            // We'll use a safer threshold of 100px
            const isLong = textRef.current.scrollHeight > 100;
            setIsOverflowing(isLong);
        }
    }, [msg.content, isUser]);

    return (
        <div className={`message-row ${msg.role}`}>
            <div className={`message-container ${isUser ? 'user-layout' : ''}`}>
                {/* Avatar (Hidden for user in new design, or moved) - User requested "right inside of a little field"
                     Usually Gemini/ChatGPT shows user avatar on right or just the bubble. 
                     The code below keeps avatar but we'll reorder via CSS. 
                 */}
                {!isUser && (
                    <div className="message-avatar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                )}

                <div className={`message-content ${isUser ? 'user-bubble' : ''}`}>
                    {isUser && isOverflowing && (
                        <button
                            className="expand-btn-icon"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    )}

                    <div
                        ref={textRef}
                        className={`message-text ${isUser && isOverflowing && !isExpanded ? 'collapsed' : ''}`}
                    >
                        <FormattedText content={msg.content} />
                    </div>
                </div>

                {isUser && (
                    /* Avatar Removed */
                    null
                )}
            </div>
        </div>
    );
}
