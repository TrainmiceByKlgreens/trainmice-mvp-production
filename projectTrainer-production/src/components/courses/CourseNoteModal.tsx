import { useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { TextareaWithLimit } from '../ui/TextareaWithLimit';
import { apiClient } from '../../lib/api-client';

import { Course } from '../../types/database';

interface CourseNoteModalProps {
    course: Course;
    onClose: () => void;
    onRefresh?: () => void;
}

export function CourseNoteModal({ course, onClose, onRefresh }: CourseNoteModalProps) {
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!note.trim()) {
            setError('Note cannot be empty');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await apiClient.post('/course-notes', {
                courseId: course.id,
                note: note.trim(),
            });
            alert('Note sent to admin successfully!');
            if (onRefresh) onRefresh();
            onClose();
        } catch (err: any) {
            console.error('Error sending note:', err);
            setError(err.message || 'Failed to send note');
        } finally {
            setSaving(false);
        }
    };

    // Combine and sort notes chronologically
    const allNotes = [
        ...(course.courseNotes || []).map((n) => ({
            ...n,
            isFromTrainer: true,
            timestamp: new Date(n.createdAt || n.created_at || new Date()).getTime(),
        })),
        ...(course.adminCourseNotes || [])
            .filter((n) => n.type === 'TO_TRAINER')
            .map((n) => ({
                ...n,
                isFromTrainer: false,
                timestamp: new Date(n.createdAt || n.created_at || new Date()).getTime(),
            })),
    ].sort((a, b) => a.timestamp - b.timestamp);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Communication with Admin</h2>
                        <p className="text-sm text-gray-500 mt-1">{course.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </CardHeader>

                <CardContent className="pt-6">
                    <div className="space-y-6">
                        {/* Conversation History */}
                        <div className="space-y-4 max-h-[40vh] overflow-y-auto px-1 custom-scrollbar">
                            {allNotes.length === 0 ? (
                                <div className="text-center py-8">
                                    <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No messages yet. Send a note to start the conversation.</p>
                                </div>
                            ) : (
                                allNotes.map((msg, idx) => (
                                    <div
                                        key={msg.id || idx}
                                        className={`flex flex-col ${msg.isFromTrainer ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                                msg.isFromTrainer
                                                    ? 'bg-mustard-50 border border-mustard-200 text-mustard-900 rounded-br-sm'
                                                    : 'bg-blue-50 border border-blue-200 text-blue-900 rounded-bl-sm'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.note}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1 mx-1">
                                            {msg.isFromTrainer ? 'You' : 'Admin'} • {new Date(msg.timestamp as number).toLocaleString()}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Compose New Note */}
                        <div className="border-t border-gray-100 pt-4">
                        <TextareaWithLimit
                            label="Trainer Note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Enter your note to the administrator regarding this course..."
                            rows={6}
                            wordLimit={300}
                        />

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</p>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={saving || !note.trim()}
                                className="bg-mustard-600 hover:bg-mustard-700"
                            >
                                {saving ? (
                                    'Sending...'
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Note
                                    </>
                                )}
                            </Button>
                        </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
