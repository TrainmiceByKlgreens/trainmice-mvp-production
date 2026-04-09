import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { apiClient } from '../../lib/api-client';
import { MessageSquare, Send, Paperclip, X, Download, FileText } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { useRealtime } from '../../hooks/useRealtime';

interface Message {
    id: string;
    senderType: 'TRAINER' | 'ADMIN';
    senderId: string;
    message: string;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    isRead: boolean;
    createdAt: string;
}

export function MessagesView() {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user?.id) {
            fetchMessageThread();
        }
    }, [user?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessageThread = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await apiClient.getMessageThread();
            setMessages(response.messages || []);
            window.dispatchEvent(new CustomEvent('message:read'));
        } catch (error) {
            console.error('Error fetching message thread:', error);
        } finally {
            setLoading(false);
        }
    };

    useRealtime((payload: any) => {
        const payloadTrainerId = payload.data?.trainerId || payload.data?.trainer_id;

        if (
            ['messages', 'trainer_messages', 'message_threads'].includes(payload.table) &&
            ['CREATE', 'UPDATE'].includes(payload.action) &&
            payloadTrainerId === user?.id
        ) {
            fetchMessageThread(true);
        }
    });

    const handleSendMessage = async () => {
        if (!message.trim() || !user?.id) return;

        try {
            setSending(true);
            await apiClient.sendMessageToAdmin({
                message: message.trim(),
                subject: 'Message from Trainer',
                attachment: attachment || undefined,
            });

            setSuccess(true);
            setMessage('');
            setAttachment(null);
            await fetchMessageThread();
            window.dispatchEvent(new CustomEvent('message:read'));

            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (error: any) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const truncateFileName = (name: string, maxLen: number = 24) => {
        if (!name || name.length <= maxLen) return name;
        const parts = name.split('.');
        const ext = parts.pop();
        const rest = parts.join('.');
        if (rest.length <= maxLen - 8) return name;
        return rest.substring(0, maxLen - 8) + '...' + (ext ? `.${ext}` : '');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-corporate-50/20">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-corporate-100">
                            <MessageSquare className="w-8 h-8 text-corporate-300" />
                        </div>
                        <h3 className="text-sm font-black text-corporate-900 uppercase tracking-widest text-sm">No Messages</h3>
                        <p className="text-xs text-corporate-500 mt-2 max-w-[240px] font-medium leading-relaxed">Direct encrypted interface ready for inquiry injection.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((msg) => {
                            const isTrainer = msg.senderType === 'TRAINER';
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isTrainer ? 'justify-end' : 'justify-start'} animate-fade-in`}
                                >
                                    <div className={`flex flex-col ${isTrainer ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                        <div
                                            className={`px-4 py-3 shadow-sm break-words w-full ${isTrainer
                                                ? 'bg-accent-600 rounded-2xl rounded-tr-none text-white'
                                                : 'bg-white border border-corporate-100 rounded-2xl rounded-tl-none text-corporate-800'
                                                }`}
                                        >
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed tracking-tight font-medium break-words">{msg.message}</p>

                                            {msg.attachmentUrl && (
                                                <div className={`mt-3 p-3 rounded-xl flex items-center gap-3 border ${isTrainer
                                                        ? 'bg-white/10 border-white/20'
                                                        : 'bg-corporate-50 border-corporate-100'
                                                    }`}>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isTrainer ? 'bg-white/20' : 'bg-white shadow-sm'
                                                        }`}>
                                                        <FileText className={`w-4 h-4 ${isTrainer ? 'text-white' : 'text-accent-600'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[10px] font-black uppercase tracking-widest truncate ${isTrainer ? 'text-white/80' : 'text-corporate-500'
                                                            }`} title={msg.attachmentName || 'Attachment'}>
                                                            {truncateFileName(msg.attachmentName || 'Attachment')}
                                                        </p>
                                                    </div>
                                                    <a
                                                        href={apiClient.resolveImageUrl(msg.attachmentUrl) || '#'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`p-1.5 rounded-lg transition-colors ${isTrainer
                                                                ? 'hover:bg-white/20 text-white'
                                                                : 'hover:bg-corporate-100 text-corporate-400 hover:text-accent-600'
                                                            }`}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`flex items-center gap-2 mt-2 px-1 ${isTrainer ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <span className="text-[9px] font-black text-corporate-400 uppercase tracking-widest">
                                                {isTrainer ? 'YOU' : 'ADMIN'}
                                            </span>
                                            <span className="text-[9px] font-bold text-corporate-300 tabular-nums">
                                                {formatDate(msg.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Form */}
            <div className="p-6 border-t border-corporate-100 bg-white shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="space-y-4">
                    {success && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
                            <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest">✓ TRANSMITTED</span>
                        </div>
                    )}

                    <div className="relative group">
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type message..."
                            rows={3}
                            disabled={sending}
                            className="w-full resize-none border-corporate-100 focus:border-accent-500 focus:ring-4 focus:ring-accent-500/5 transition-all duration-300 rounded-xl p-4 text-sm font-medium bg-corporate-50/50"
                        />
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4">
                                <span className="text-[9px] font-black text-corporate-400 uppercase tracking-widest">
                                    {message.length} BYTES
                                </span>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        id="chat-attachment"
                                        className="hidden"
                                        onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                    />
                                    {attachment ? (
                                        <div className="flex items-center gap-2 bg-accent-50 text-accent-700 px-2 py-1 rounded-lg border border-accent-100 animate-fade-in text-[9px] font-black uppercase tracking-tighter">
                                            <FileText className="w-3 h-3" />
                                            <span className="max-w-[120px] truncate" title={attachment.name}>
                                                {truncateFileName(attachment.name, 20)}
                                            </span>
                                            <button onClick={() => setAttachment(null)} className="hover:text-red-500 transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor="chat-attachment"
                                            className="flex items-center gap-1.5 text-corporate-400 hover:text-accent-500 cursor-pointer transition-colors text-[9px] font-black uppercase tracking-widest"
                                        >
                                            <Paperclip className="w-3 h-3" />
                                            ATTACH
                                        </label>
                                    )}
                                </div>
                            </div>
                            <Button
                                onClick={handleSendMessage}
                                disabled={!message.trim() || sending || success}
                                size="sm"
                                variant="gold-black"
                                className="rounded-xl px-6 h-9"
                            >
                                <div className="flex items-center gap-2">
                                    <Send className={`w-3 h-3 ${sending ? 'animate-bounce' : ''}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{sending ? 'Wait' : 'Send'}</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
