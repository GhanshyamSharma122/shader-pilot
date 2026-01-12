/**
 * Chat Panel Component
 * In-game text chat with team colors
 */

import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
    playerName: string;
    message: string;
    timestamp: number;
    team?: 'red' | 'blue';
    isSystem?: boolean;
}

interface ChatPanelProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isVisible: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isVisible }) => {
    const [inputValue, setInputValue] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !isInputFocused && isVisible) {
                e.preventDefault();
                inputRef.current?.focus();
                setIsInputFocused(true);
            }
            if (e.key === 'Escape' && isInputFocused) {
                inputRef.current?.blur();
                setIsInputFocused(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isInputFocused, isVisible]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 left-6 z-40 w-80">
            {/* Messages */}
            <div
                className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-gray-700/30 overflow-hidden"
                style={{ maxHeight: '200px' }}
            >
                <div className="overflow-y-auto p-3 space-y-1" style={{ maxHeight: '160px' }}>
                    {messages.slice(-20).map((msg, index) => (
                        <div key={msg.timestamp + index} className="text-sm font-mono">
                            {msg.isSystem ? (
                                <span className="text-yellow-500 italic">{msg.message}</span>
                            ) : (
                                <>
                                    <span
                                        className={
                                            msg.team === 'red' ? 'text-red-400' :
                                                msg.team === 'blue' ? 'text-blue-400' :
                                                    'text-cyan-400'
                                        }
                                    >
                                        {msg.playerName}:
                                    </span>
                                    <span className="text-gray-300 ml-2">{msg.message}</span>
                                </>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="mt-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value.slice(0, 150))}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder={isInputFocused ? "Type message..." : "Press Enter to chat"}
                    maxLength={150}
                    className={`w-full px-3 py-2 bg-gray-900/80 border rounded-lg text-sm text-white font-mono placeholder-gray-500 focus:outline-none transition-all ${isInputFocused
                            ? 'border-cyan-500 shadow-glow-cyan'
                            : 'border-gray-700/50'
                        }`}
                />
            </form>
        </div>
    );
};
