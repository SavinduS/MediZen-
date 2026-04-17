import React, { useState, useEffect, useRef } from 'react';
import { useUser } from "@clerk/clerk-react";
import { checkSymptoms } from '../services/api';
import { Bot, User, Send, Loader2, Info } from 'lucide-react';

const SymptomChecker = () => {
    const { user } = useUser();
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            content: "Hello! I'm your MediZen AI Assistant. How are you feeling today? Please describe your symptoms in detail (at least 10 characters).",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || input.length < 10 || isLoading) return;

        const userMessage = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await checkSymptoms({
                symptoms: input,
                clerkId: user?.id
            });

            const botMessage = {
                role: 'bot',
                content: response.data.ai_suggestion,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMessage = {
                role: 'bot',
                content: error.response?.data?.message || "I'm sorry, I encountered an error. Please try again later.",
                isError: true,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 p-4 flex items-center gap-3 text-white">
                <div className="bg-blue-500 p-2 rounded-lg">
                    <Bot size={24} />
                </div>
                <div>
                    <h2 className="font-bold text-lg">AI Symptom Checker</h2>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Always Online | MediZen AI
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800'
                            }`}>
                                {msg.role === 'user' ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
                            </div>
                            <div className={`p-4 rounded-2xl shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : msg.isError 
                                    ? 'bg-red-50 border border-red-100 text-red-700 rounded-tl-none'
                                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                            }`}>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                <span className={`text-[10px] mt-2 block ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                <Bot size={18} className="text-white" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm rounded-tl-none flex items-center gap-2">
                                <Loader2 size={18} className="animate-spin text-blue-600" />
                                <span className="text-sm text-slate-500 italic">MediZen is thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 px-4 py-2 border-y border-amber-100 flex items-start gap-2">
                <Info size={14} className="text-amber-600 mt-1 flex-shrink-0" />
                <p className="text-[11px] text-amber-700 italic">
                    Disclaimer: This AI tool provides suggestions based on symptoms but is NOT a medical diagnosis. Always consult a qualified healthcare professional for medical advice.
                </p>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white">
                <div className="flex gap-3 bg-slate-100 p-2 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your symptoms here..."
                        className="flex-grow bg-transparent border-none focus:ring-0 text-slate-700 px-3 py-2 text-sm"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || input.length < 10 || isLoading}
                        className={`p-2 rounded-lg transition-all ${
                            !input.trim() || input.length < 10 || isLoading
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                        }`}
                    >
                        <Send size={20} />
                    </button>
                </div>
                <div className="flex justify-between items-center mt-2 px-1">
                    <p className={`text-[10px] ${input.length > 0 && input.length < 10 ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                        {input.length > 0 && input.length < 10 ? `Min 10 characters required (${input.length}/10)` : 'Describe your health concerns clearly.'}
                    </p>
                    <p className="text-[10px] text-slate-400">Powered by Gemini AI</p>
                </div>
            </form>
        </div>
    );
};

export default SymptomChecker;
