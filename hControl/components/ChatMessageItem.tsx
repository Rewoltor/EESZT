'use client';

import { useState } from 'react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/types/llm';

export function ChatMessageItem({ msg }: { msg: ChatMessage }) {
    const isAssistant = msg.role === 'assistant';
    const [isExpanded, setIsExpanded] = useState(false);

    // Heuristic: check if message is "long". 
    // We can assume > 300 chars or > 5 newlines is potentially long enough to collapse.
    const isLongMessage = !isAssistant && (msg.content.length > 300 || (msg.content.match(/\n/g) || []).length > 5);

    return (
        <div className={`flex w-full mb-6 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
            <div className={`relative flex flex-col max-w-[90%] md:max-w-[75%] ${isAssistant ? 'items-start' : 'items-end'}`}>
                {/* Message Content */}
                <div className={`px-4 py-3 rounded-2xl text-base leading-relaxed break-words ${isAssistant
                    ? 'bg-transparent text-gray-900 dark:text-gray-100 px-0'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-3xl w-fit'
                    }`}>
                    {isAssistant ? (
                        <div className="prose prose-base dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className={`whitespace-pre-wrap ${!isExpanded && isLongMessage ? 'line-clamp-5' : ''}`}>
                                {msg.content}
                            </div>

                            {/* Expand/Collapse Button for User Messages */}
                            {isLongMessage && (
                                <div className="mt-2 flex justify-end">
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                                    >
                                        {isExpanded ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6" /></svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 9 6 6 6-6" /></svg>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
