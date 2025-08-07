import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/pt-br';
import { AppContext, Contact, Conversation, ScheduledMessage, Attachment, ScheduleStatus } from './types';
import { getScheduledMessagesForContact, createScheduledMessage, updateScheduledMessage, deleteScheduledMessage } from './services/schedulingService';
import { sendAlertWebhook, insertInlineMedia } from './services/webhookService';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('pt-br');

// --- ICONS ---
const Icon = ({ path, className = 'w-5 h-5' }: { path: string, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d={path} clipRule="evenodd" />
    </svg>
);

const PhoneIcon = () => <Icon path="M6.62 10.79a15.45 15.45 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.02.74-.25 1.02l-2.2 2.2z" />;
const ClockIcon = () => <Icon path="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 mr-1" />;
const PencilIcon = () => <Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" className="w-4 h-4" />;
const TrashIcon = () => <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" className="w-4 h-4" />;

// Formatting Icons
const BoldIcon = () => <Icon path="M15 18H7.5c-2.5 0-4.5-2-4.5-4.5S5 9 7.5 9H15" className="w-4 h-4" />;
const ItalicIcon = () => <Icon path="M9 5h6M7 19h6m2-14l-4 14" className="w-4 h-4" />;
const StrikeIcon = () => <Icon path="M9 5h6m-6 14h6m-6-7h6" className="w-4 h-4" />;
const ListIcon = () => <Icon path="M8 4a4 4 0 100 8 4 4 0 000-8zM6 4a2 2 0 11-4 0 2 2 0 014 0zM6 20a2 2 0 11-4 0 2 2 0 014 0zM8 18a4 4 0 100-8 4 4 0 000 8z" className="w-4 h-4" />;
const CaseIcon = () => <Icon path="M4 6h16M4 12h16M4 18h16" className="w-4 h-4" />;

// Media Icons  
const MicIcon = () => <Icon path="M12 2a3 3 0 013 3v6a3 3 0 11-6 0V5a3 3 0 013-3z M8 11a4 4 0 108 0" className="w-4 h-4" />;
const ImageIcon = () => <Icon path="M20.25 10.25V4.25A2.25 2.25 0 0018 2H6a2.25 2.25 0 00-2.25 2.25v15.5A2.25 2.25 0 006 22h12a2.25 2.25 0 002.25-2.25V13.5H15a2.25 2.25 0 01-2.25-2.25V8.25A2.25 2.25 0 0115 6h3.25z" className="w-4 h-4" />;
const AttachIcon = () => <Icon path="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 119.547 7.417l-10.833 10.833a1.5 1.5 0 002.122 2.121L18.375 12.74z" className="w-4 h-4" />;
const EmojiIcon = () => <Icon path="M15.75 9.75a3 3 0 11-6 0 3 3 0 016 0zM8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" className="w-4 h-4" />;
const PlayIcon = () => <Icon path="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" className="w-4 h-4" />;
const StopIcon = () => <Icon path="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" className="w-4 h-4" />;

// Contact Info Component
const ContactInfo = ({ contact }: { contact: Contact }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{contact.name}</h2>
        {contact.phone_number && (
            <div className="flex items-center mt-2 text-slate-600 dark:text-slate-400">
                <PhoneIcon />
                <span className="ml-2">{contact.phone_number}</span>
            </div>
        )}
    </div>
);

// Audio Recorder Component
const AudioRecorder = ({ onAudioRecorded }: { onAudioRecorded: (audioUrl: string, base64: string) => void }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    const url = URL.createObjectURL(audioBlob);
                    setAudioUrl(url);
                };
                reader.readAsDataURL(audioBlob);
                stream.getTracks().forEach(track => track.stop());
                setRecordingTime(0);
                if (timerRef.current) clearInterval(timerRef.current);
            };

            mediaRecorder.start();
            setIsRecording(true);
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Erro ao acessar microfone:', error);
            alert('Erro ao acessar o microfone. Verifique as permissões.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendAudio = () => {
        if (audioUrl) {
            // Convert blob URL to base64
            fetch(audioUrl)
                .then(res => res.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result as string;
                        onAudioRecorded(audioUrl, base64);
                        setAudioUrl(null);
                    };
                    reader.readAsDataURL(blob);
                });
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center space-x-2">
            {isRecording ? (
                <>
                    <div className="flex items-center space-x-2 bg-red-100 dark:bg-red-900 px-3 py-1 rounded-full">
                        <span className="animate-pulse text-red-500">REC</span>
                        <span className="text-sm">{formatTime(recordingTime)}</span>
                    </div>
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="p-2 text-red-500 hover:text-red-600 transition-colors rounded"
                        title="Parar gravação"
                    >
                        <StopIcon />
                    </button>
                </>
            ) : audioUrl ? (
                <>
                    <audio controls className="h-8">
                        <source src={audioUrl} type="audio/wav" />
                    </audio>
                    <button
                        type="button"
                        onClick={sendAudio}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        title="Enviar áudio"
                    >
                        Enviar
                    </button>
                    <button
                        type="button"
                        onClick={() => setAudioUrl(null)}
                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                        title="Cancelar"
                    >
                        Cancelar
                    </button>
                </>
            ) : (
                <button
                    type="button"
                    onClick={startRecording}
                    className="p-2 text-gray-500 hover:text-gray-600 transition-colors rounded"
                    title="Gravar áudio"
                >
                    <MicIcon />
                </button>
            )}
        </div>
    );
};

// Text Formatting Component
const TextFormatting = ({ textareaRef, onTextChange }: { 
    textareaRef: React.RefObject<HTMLTextAreaElement>; 
    onTextChange: (text: string) => void;
}) => {
    const applyFormatting = (prefix: string, suffix?: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const beforeText = textarea.value.substring(0, start);
        const afterText = textarea.value.substring(end);

        let newText = '';
        if (suffix) {
            newText = beforeText + prefix + selectedText + suffix + afterText;
        } else {
            newText = beforeText + prefix + selectedText + afterText;
        }

        onTextChange(newText);
        
        // Restore cursor position
        setTimeout(() => {
            const newCursorPos = start + prefix.length + selectedText.length + (suffix?.length || 0);
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
        }, 0);
    };

    const toggleCase = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        if (!selectedText) return;

        const beforeText = textarea.value.substring(0, start);
        const afterText = textarea.value.substring(end);
        
        // Toggle between upper and lower case
        const newSelectedText = selectedText === selectedText.toUpperCase() 
            ? selectedText.toLowerCase() 
            : selectedText.toUpperCase();

        const newText = beforeText + newSelectedText + afterText;
        onTextChange(newText);
        
        setTimeout(() => {
            textarea.setSelectionRange(start, start + newSelectedText.length);
            textarea.focus();
        }, 0);
    };

    const applyList = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const beforeText = textarea.value.substring(0, start);
        const afterText = textarea.value.substring(end);

        const listItem = '\n• ';
        const newText = beforeText + listItem + afterText;
        onTextChange(newText);

        setTimeout(() => {
            textarea.setSelectionRange(start + listItem.length, start + listItem.length);
            textarea.focus();
        }, 0);
    };

    return (
        <div className="flex items-center space-x-1 mb-2">
            <button
                type="button"
                onClick={() => applyFormatting('**', '**')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="Negrito"
            >
                <BoldIcon />
            </button>
            <button
                type="button"
                onClick={() => applyFormatting('_', '_')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="Itálico"
            >
                <ItalicIcon />
            </button>
            <button
                type="button"
                onClick={() => applyFormatting('~~', '~~')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="Tachado"
            >
                <StrikeIcon />
            </button>
            <button
                type="button"
                onClick={toggleCase}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="Maiúsculas/Minúsculas"
            >
                <span className="text-xs font-bold">Aa</span>
            </button>
            <button
                type="button"
                onClick={applyList}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="Lista"
            >
                <ListIcon />
            </button>
        </div>
    );
};

// Media Buttons Component
const MediaButtons = ({ onAudioRecorded, onImageSelect, onFileSelect, onEmojiSelect }: {
    onAudioRecorded: (audioUrl: string, base64: string) => void;
    onImageSelect: () => void;
    onFileSelect: () => void;
    onEmojiSelect: (emoji: string) => void;
}) => {
    const commonEmojis = ['😀', '😂', '😍', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯'];

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    return (
        <div className="flex items-center justify-between p-2 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-2">
                <AudioRecorder onAudioRecorded={onAudioRecorded} />
                <button
                    type="button"
                    onClick={onImageSelect}
                    className="p-2 text-gray-500 hover:text-gray-600 transition-colors rounded"
                    title="Imagem"
                >
                    <ImageIcon />
                </button>
                <button
                    type="button"
                    onClick={onFileSelect}
                    className="p-2 text-gray-500 hover:text-gray-600 transition-colors rounded"
                    title="Arquivo"
                >
                    <AttachIcon />
                </button>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-gray-500 hover:text-gray-600 transition-colors rounded"
                        title="Emoji"
                    >
                        <EmojiIcon />
                    </button>
                    {showEmojiPicker && (
                        <div className="absolute bottom-12 left-0 bg-white dark:bg-slate-700 border rounded-lg shadow-lg p-2 grid grid-cols-5 gap-1 z-10">
                            {commonEmojis.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                        onEmojiSelect(emoji);
                                        setShowEmojiPicker(false);
                                    }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 rounded text-lg"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Scheduler Form Component
const SchedulerForm = ({ onSubmit, onCancelEdit, editingMessage }: {
    onSubmit: (data: Omit<ScheduledMessage, 'contactId' | 'conversationId'>, createAlert?: boolean) => void;
    onCancelEdit: () => void;
    editingMessage: ScheduledMessage | null;
}) => {
    const [message, setMessage] = useState('');
    const [datetime, setDatetime] = useState('');
    const [createAlert, setCreateAlert] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isEditing = !!editingMessage;

    useEffect(() => {
        if (editingMessage) {
            setMessage(editingMessage.message);
            setDatetime(editingMessage.datetime);
            setAttachments(editingMessage.attachments || []);
            setCreateAlert(editingMessage.hasAlert || false);
        } else {
            setMessage('');
            setDatetime('');
            setCreateAlert(false);
            setAttachments([]);
        }
    }, [editingMessage]);

    const handleAttachment = (type: 'image' | 'file') => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = type === 'image' ? 'image/*' : '*/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    const content = result.split(',')[1];
                    setAttachments(prev => [...prev, { type: file.type, name: file.name, content }]);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const handleAudioRecorded = (audioUrl: string, base64: string) => {
        const content = base64.split(',')[1];
        setAttachments(prev => [...prev, { type: 'audio/wav', name: 'audio.wav', content }]);
        setMessage(prev => prev + (prev ? '\n' : '') + '🎵 [Áudio gravado]');
    };

    const handleEmojiSelect = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const beforeText = textarea.value.substring(0, start);
        const afterText = textarea.value.substring(end);
        
        const newText = beforeText + emoji + afterText;
        setMessage(newText);
        
        setTimeout(() => {
            textarea.setSelectionRange(start + emoji.length, start + emoji.length);
            textarea.focus();
        }, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message || !datetime) {
            alert('Por favor, preencha a mensagem e a data/hora.');
            return;
        }

        const newSchedule: Omit<ScheduledMessage, 'contactId' | 'conversationId'> = {
            id: editingMessage?.id || window.crypto.randomUUID(),
            datetime,
            message,
            attachments,
            status: 'Agendado',
            hasAlert: createAlert,
            ...(editingMessage && {
                edit_id: editingMessage.edit_id,
                previous_edit_ids: editingMessage.previous_edit_ids,
                exc_id: editingMessage.exc_id,
                scheduled_for: editingMessage.scheduled_for,
            }),
        };

        onSubmit(newSchedule, createAlert);

        if (!isEditing) {
            setMessage('');
            setDatetime('');
            setCreateAlert(false);
            setAttachments([]);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
                {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Mensagem
                    </label>
                    <TextFormatting 
                        textareaRef={textareaRef} 
                        onTextChange={setMessage}
                    />
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Digite sua mensagem... Use os botões acima para inserir mídia inline."
                            className="w-full p-3 border rounded-t bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                            rows={6}
                            required
                        />
                        <MediaButtons
                            onAudioRecorded={handleAudioRecorded}
                            onImageSelect={() => handleAttachment('image')}
                            onFileSelect={() => handleAttachment('file')}
                            onEmojiSelect={handleEmojiSelect}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Data e Hora
                    </label>
                    <input
                        type="datetime-local"
                        value={datetime}
                        onChange={e => setDatetime(e.target.value)}
                        className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        required
                    />
                </div>
            </div>

            <div className="flex justify-between items-center mt-6">
                <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Ativar Alerta
                    </span>
                    <button
                        type="button"
                        onClick={() => setCreateAlert(!createAlert)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            createAlert 
                                ? 'bg-green-600 focus:ring-green-500' 
                                : 'bg-red-600 focus:ring-red-500'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                createAlert ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                    {createAlert && (
                        <span className="text-yellow-500 text-lg">⚠️</span>
                    )}
                </div>

                <div className="flex space-x-2">
                    {isEditing && (
                        <button 
                            type="button" 
                            onClick={onCancelEdit} 
                            className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-semibold transition"
                        >
                            Cancelar Edição
                        </button>
                    )}
                    <button 
                        type="submit" 
                        className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                    >
                        {isEditing ? 'Atualizar' : 'Agendar'}
                    </button>
                </div>
            </div>
        </form>
    );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: ScheduleStatus }) => {
    const statusClasses: Record<ScheduleStatus, string> = {
        'Agendado': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'Enviado': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'Cancelado': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        'Falhou': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status]}`}>
            {status}
        </span>
    );
};

// Scheduled Message Item Component
const ScheduledMessageItem = ({ message, onEdit, onCancel, isToday, hasAlert }: {
    message: ScheduledMessage;
    onEdit: (id: string) => void;
    onCancel: (id: string) => void;
    isToday: boolean;
    hasAlert: boolean;
}) => {
    const { id, datetime, message: text, status, lastUpdate } = message;

    const formattedDate = new Date(datetime).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const canBeModified = status === 'Agendado';

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm mb-3 transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center mb-2 space-x-2">
                        <ClockIcon />
                        <span 
                            className={`font-semibold ${
                                isToday 
                                    ? 'text-yellow-500' 
                                    : 'text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            {formattedDate}
                        </span>
                        <StatusBadge status={status} />
                        {hasAlert && (
                            <span className="text-yellow-500 text-lg" title="Alerta ativo">⚠️</span>
                        )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap text-sm">
                        {text.length > 150 ? `${text.substring(0, 150)}...` : text}
                    </p>
                    {lastUpdate && (
                        <div className="text-xs text-gray-500 mt-2">
                            Last update: {dayjs(lastUpdate).tz('America/Sao_Paulo').format('DD/MM/YYYY - HH:mm:ss')}
                        </div>
                    )}
                </div>
                {canBeModified && (
                    <div className="flex space-x-2 flex-shrink-0 ml-4">
                        <button 
                            onClick={() => onEdit(id)} 
                            className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition" 
                            title="Editar"
                        >
                            <PencilIcon />
                        </button>
                        <button 
                            onClick={() => onCancel(id)} 
                            className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition" 
                            title="Cancelar"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Main App Component
export default function App() {
    const [appContext, setAppContext] = useState<AppContext | null>(null);
    const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
    const [editingMessage, setEditingMessage] = useState<ScheduledMessage | null>(null);

    useEffect(() => {
        const handleChatwootMessage = (event: MessageEvent) => {
            try {
                if (typeof event.data !== 'string') return;
                const data = JSON.parse(event.data);
                if (data.event === 'appContext') {
                    setAppContext(data.data as AppContext);
                }
            } catch (error) {
                console.warn('Erro ao processar mensagem:', error);
            }
        };

        window.addEventListener('message', handleChatwootMessage);
        window.parent.postMessage('chatwoot-dashboard-app:fetch-info', '*');

        return () => {
            window.removeEventListener('message', handleChatwootMessage);
        };
    }, []);

    useEffect(() => {
        if (appContext?.contact) {
            const loadMessages = async () => {
                try {
                    const messages = await getScheduledMessagesForContact(appContext.contact.id);
                    // Filter out cancelled/deleted messages
                    const activeMessages = messages.filter(msg => msg.status !== 'Cancelado');
                    setScheduledMessages(activeMessages);
                } catch (error) {
                    console.error('Failed to load scheduled messages:', error);
                }
            };
            loadMessages();
        }
    }, [appContext]);

    // Sort messages by datetime (closest first), then organize into two columns
    const sortedMessages = useMemo(() => {
        const now = new Date();
        return [...scheduledMessages]
            .filter(msg => msg.status !== 'Cancelado') // Ensure no cancelled messages
            .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    }, [scheduledMessages]);

    const leftColumn = sortedMessages.filter((_, index) => index % 2 === 0);
    const rightColumn = sortedMessages.filter((_, index) => index % 2 === 1);

    const handleScheduleSubmit = useCallback(async (newMessageData: Omit<ScheduledMessage, 'contactId' | 'conversationId'>, createAlert = false) => {
        if (!appContext) return;

        const existingMessage = scheduledMessages.find(m => m.id === newMessageData.id);
        const isEditing = !!existingMessage;

        const nowSaoPaulo = dayjs().tz('America/Sao_Paulo').toISOString();
        const scheduledForSaoPaulo = dayjs.tz(newMessageData.datetime, 'YYYY-MM-DDTHH:mm', 'America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');

        let fullMessage: ScheduledMessage = {
            ...newMessageData,
            datetime: dayjs.tz(newMessageData.datetime, 'YYYY-MM-DDTHH:mm', 'America/Sao_Paulo').format('YYYY-MM-DDTHH:mm:ss'),
            contactId: appContext.contact.id,
            conversationId: appContext.conversation.id,
            lastUpdate: nowSaoPaulo,
            scheduled_for: scheduledForSaoPaulo,
        };

        if (isEditing && existingMessage) {
            const newEditId = window.crypto.randomUUID();
            const previousEditIds = existingMessage.previous_edit_ids || [];
            if (existingMessage.edit_id) {
                previousEditIds.push(existingMessage.edit_id);
            }
            
            fullMessage = {
                ...fullMessage,
                edit_id: newEditId,
                previous_edit_ids: previousEditIds,
            };
        }

        try {
            let success;
            
            if (createAlert) {
                await sendAlertWebhook(fullMessage, appContext.contact, appContext.conversation);
            }
            
            if (isEditing) {
                success = await updateScheduledMessage(fullMessage.id, fullMessage, appContext.contact, appContext.conversation);
            } else {
                success = await createScheduledMessage(fullMessage, appContext.contact, appContext.conversation);
            }

            if (success) {
                const updatedMessages = await getScheduledMessagesForContact(appContext.contact.id);
                const activeMessages = updatedMessages.filter(msg => msg.status !== 'Cancelado');
                setScheduledMessages(activeMessages);
                
                alert(isEditing ? 'Agendamento atualizado com sucesso!' : 'Agendamento realizado com sucesso!');
                setEditingMessage(null);
            } else {
                alert('Erro ao salvar agendamento. Verifique a conexão e tente novamente.');
            }
        } catch (error) {
            console.error('Error submitting schedule:', error);
            alert('Erro ao salvar agendamento. Verifique a conexão e tente novamente.');
        }
    }, [appContext, scheduledMessages]);

    const handleSetEditMode = (id: string) => {
        const messageToEdit = scheduledMessages.find(m => m.id === id);
        if (messageToEdit) {
            setEditingMessage(messageToEdit);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
    };

    const handleCancelSchedule = async (id: string) => {
        if (!appContext || !window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;

        try {
            const success = await deleteScheduledMessage(id);
            
            if (success) {
                const updatedMessages = await getScheduledMessagesForContact(appContext.contact.id);
                const activeMessages = updatedMessages.filter(msg => msg.status !== 'Cancelado');
                setScheduledMessages(activeMessages);
                alert('Agendamento cancelado com sucesso.');
            } else {
                alert('Erro ao cancelar agendamento. Verifique a conexão e tente novamente.');
            }
        } catch (error) {
            console.error('Error canceling schedule:', error);
            alert('Erro ao cancelar agendamento. Verifique a conexão e tente novamente.');
        }
    };

    if (!appContext) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-red-500">
                Não foi possível carregar os dados do contato.
            </div>
        );
    }

    const today = dayjs().format('YYYY-MM-DD');

    return (
        <div className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen p-4 font-sans">
            <div className="max-w-6xl mx-auto">
                <ContactInfo contact={appContext.contact} />
                <SchedulerForm 
                    onSubmit={handleScheduleSubmit} 
                    onCancelEdit={handleCancelEdit} 
                    editingMessage={editingMessage} 
                />
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
                        Agendamentos
                    </h3>
                    {sortedMessages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                {leftColumn.map(msg => {
                                    const messageDate = dayjs(msg.datetime).format('YYYY-MM-DD');
                                    const isToday = messageDate === today;
                                    // Check if this message was created with alert (you might want to store this flag)
                                    const hasAlert = msg.hasAlert || false;
                                    
                                    return (
                                        <ScheduledMessageItem 
                                            key={msg.id} 
                                            message={msg} 
                                            onEdit={handleSetEditMode} 
                                            onCancel={handleCancelSchedule}
                                            isToday={isToday}
                                            hasAlert={hasAlert}
                                        />
                                    );
                                })}
                            </div>
                            <div className="space-y-3">
                                {rightColumn.map(msg => {
                                    const messageDate = dayjs(msg.datetime).format('YYYY-MM-DD');
                                    const isToday = messageDate === today;
                                    const hasAlert = msg.hasAlert || false;
                                    
                                    return (
                                        <ScheduledMessageItem 
                                            key={msg.id} 
                                            message={msg} 
                                            onEdit={handleSetEditMode} 
                                            onCancel={handleCancelSchedule}
                                            isToday={isToday}
                                            hasAlert={hasAlert}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <p className="text-slate-500 dark:text-slate-400">
                                Nenhuma mensagem agendada para este contato.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}