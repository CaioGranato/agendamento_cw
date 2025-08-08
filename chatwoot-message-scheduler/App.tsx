import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/pt-br';
import { AppContext, Contact, ScheduledMessage, Attachment, ScheduleStatus } from './types';
import { getScheduledMessagesForContact, createScheduledMessage, updateScheduledMessage, deleteScheduledMessage } from './services/schedulingService';
import { sendAlertWebhook } from './services/webhookService';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('pt-br');

// --- SIMPLE SVG ICONS ---
const PhoneIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
);

const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12,6 12,12 16,14"/>
    </svg>
);

const PencilIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m18 2 4 4-14 14H4v-4L18 2z"/>
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3,6 5,6 21,6"/>
        <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
);

// Formatting Icons
const BoldIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
    </svg>
);

const ItalicIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="19" y1="4" x2="10" y2="4"/>
        <line x1="14" y1="20" x2="5" y2="20"/>
        <line x1="15" y1="4" x2="9" y2="20"/>
    </svg>
);

const StrikeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 4H9a3 3 0 0 0-2.83 4"/>
        <path d="M14 12a4 4 0 0 1 0 8H6"/>
        <line x1="4" y1="12" x2="20" y2="12"/>
    </svg>
);

const ListIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
);

// Media Icons  
const MicIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
);

const ImageIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
);

const AttachIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
);

const EmojiIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
);


const StopIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="6" width="12" height="12" rx="2"/>
    </svg>
);

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
    const timerRef = useRef<NodeJS.Timeout | null>(null);

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
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                stream.getTracks().forEach(track => track.stop());
                setRecordingTime(0);
                if (timerRef.current) clearInterval(timerRef.current);
            };

            mediaRecorder.start();
            setIsRecording(true);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Erro ao acessar microfone:', error);
            
            // Fallback para seleção de arquivo
            const useFileSelection = confirm('Não foi possível acessar o microfone. Deseja selecionar um arquivo de áudio?');
            
            if (useFileSelection) {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'audio/*,video/*';
                input.style.display = 'none';
                
                input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64 = reader.result as string;
                            onAudioRecorded(URL.createObjectURL(file), base64);
                        };
                        reader.readAsDataURL(file);
                    }
                    document.body.removeChild(input);
                };
                
                document.body.appendChild(input);
                input.click();
            }
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
                        <span className="animate-pulse text-red-500 text-sm font-bold">REC</span>
                        <span className="text-sm text-red-600">{formatTime(recordingTime)}</span>
                    </div>
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="p-2 text-red-500 hover:text-red-600 transition-colors rounded hover:bg-red-50"
                        title="Parar gravação"
                    >
                        <StopIcon />
                    </button>
                </>
            ) : audioUrl ? (
                <>
                    <audio controls className="h-8 max-w-48">
                        <source src={audioUrl} type="audio/wav" />
                    </audio>
                    <button
                        type="button"
                        onClick={sendAudio}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        title="Enviar áudio"
                    >
                        Enviar
                    </button>
                    <button
                        type="button"
                        onClick={() => setAudioUrl(null)}
                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                        title="Cancelar"
                    >
                        Cancelar
                    </button>
                </>
            ) : (
                <button
                    type="button"
                    onClick={startRecording}
                    className="p-2 text-gray-500 hover:text-gray-600 transition-colors rounded hover:bg-gray-100"
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
    textareaRef: React.RefObject<HTMLTextAreaElement | null>; 
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
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                title="Negrito"
            >
                <BoldIcon />
            </button>
            <button
                type="button"
                onClick={() => applyFormatting('_', '_')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                title="Itálico"
            >
                <ItalicIcon />
            </button>
            <button
                type="button"
                onClick={() => applyFormatting('~~', '~~')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                title="Tachado"
            >
                <StrikeIcon />
            </button>
            <button
                type="button"
                onClick={toggleCase}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                title="Maiúsculas/Minúsculas"
            >
                <span className="text-xs font-bold">Aa</span>
            </button>
            <button
                type="button"
                onClick={applyList}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeCategory, setActiveCategory] = useState('faces');
    
    const emojiCategories = {
        faces: {
            name: '😊 Rostos',
            emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '🥹', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😮‍💨', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓']
        },
        gestures: {
            name: '👍 Gestos',
            emojis: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '🫵', '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏']
        },
        hearts: {
            name: '❤️ Corações',
            emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💖', '💝', '💗', '💓', '💞', '💕', '💘', '💌', '💟', '♥️', '💔', '❤️‍🔥', '❤️‍🩹', '💋', '🫶']
        },
        objects: {
            name: '⭐ Objetos',
            emojis: ['🔥', '💯', '💢', '💨', '💫', '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔸', '🔹', '🔶', '🔷', '💠', '🌀', '🕳️', '💤', '🎉', '🎊', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉']
        },
        travel: {
            name: '🚗 Viagem',
            emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️', '🚢', '⛵', '🛶', '🏖️', '🏝️', '🗺️']
        },
        food: {
            name: '🍕 Comida',
            emojis: ['🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕']
        },
        nature: {
            name: '🌺 Natureza',
            emojis: ['🌱', '🌿', '☘️', '🍀', '🎍', '🪴', '🎋', '🍃', '🍂', '🍁', '🪸', '🪷', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '🪐', '💫', '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '💧', '💦', '🫧', '☔', '☂️', '🌊', '🌫️']
        }
    };

    const categoryKeys = Object.keys(emojiCategories) as Array<keyof typeof emojiCategories>;

    return (
        <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-slate-700 rounded-b">
            <div className="flex items-center space-x-3">
                <AudioRecorder onAudioRecorded={onAudioRecorded} />
                <button
                    type="button"
                    onClick={onImageSelect}
                    className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded"
                    title="Imagem"
                >
                    <ImageIcon />
                </button>
                <button
                    type="button"
                    onClick={onFileSelect}
                    className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded"
                    title="Arquivo"
                >
                    <AttachIcon />
                </button>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors rounded"
                        title="Emoji"
                    >
                        <EmojiIcon />
                    </button>
                    {showEmojiPicker && (
                        <>
                            {/* Overlay para fechar clicando fora */}
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowEmojiPicker(false)}
                            />
                            {/* Emoji picker expandido e responsivo */}
                            <div className="absolute bottom-12 right-0 bg-white dark:bg-slate-600 border rounded-lg shadow-xl z-50 w-80 max-w-[95vw] sm:w-80">
                                {/* Header com categorias */}
                                <div className="border-b border-gray-200 dark:border-gray-600 p-2">
                                    <div className="flex space-x-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                                        {categoryKeys.map(key => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setActiveCategory(key)}
                                                className={`px-2 py-1 rounded text-xs sm:text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                                                    activeCategory === key 
                                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 shadow-sm' 
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                                title={emojiCategories[key].name}
                                            >
                                                {emojiCategories[key].name.split(' ')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Grid de emojis responsivo */}
                                <div className="p-3 max-h-64 overflow-y-auto">
                                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                                        {emojiCategories[activeCategory].emojis.map(emoji => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => {
                                                    onEmojiSelect(emoji);
                                                    setShowEmojiPicker(false);
                                                }}
                                                className="p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-slate-500 rounded text-base sm:text-lg transition-colors w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:scale-110 active:scale-95"
                                                title={emoji}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Footer com contador */}
                                <div className="border-t border-gray-200 dark:border-gray-600 p-2 text-center">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {emojiCategories[activeCategory].name}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {emojiCategories[activeCategory].emojis.length} emojis
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
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
        input.style.display = 'none';
    
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    const content = result.split(',')[1];
                    setAttachments(prev => [...prev, { type: file.type, name: file.name, content, base64: result }]);
                    
                    const fileTypeText = type === 'image' ? 'imagem' : 'arquivo';
                    setMessage(prev => prev + (prev ? '\n' : '') + `[${fileTypeText}: ${file.name}]`);
                };
                reader.readAsDataURL(file);
            }
            document.body.removeChild(input);
        };
    
        document.body.appendChild(input);
        input.click();
    };

    const handleAudioRecorded = (audioUrl: string, base64: string) => {
        const content = base64.split(',')[1];
        setAttachments(prev => [...prev, { type: 'audio/wav', name: 'audio.wav', content, base64 }]);
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

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
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
                            placeholder="Digite sua mensagem... Use os botões abaixo para anexar mídia."
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
                    {attachments.length > 0 && (
                        <div className="mt-2 p-2 border-t border-gray-200 dark:border-gray-600">
                            <h4 className="text-sm font-semibold mb-2">Anexos:</h4>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((att, index) => (
                                    <div key={index} className="relative group bg-gray-100 dark:bg-gray-700 rounded p-1">
                                        {att.type.startsWith('image/') ? (
                                            <img src={att.base64} alt={att.name} className="h-16 w-16 object-cover rounded" />
                                        ) : (
                                            <div className="h-16 w-16 flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-600 rounded">
                                                <span className="text-xs truncate">{att.name}</span>
                                                <span className="text-xs text-gray-500">{att.type}</span>
                                            </div>
                                        )}
                                        <button 
                                            type="button"
                                            onClick={() => removeAttachment(index)}
                                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            X
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Layout horizontal: Data/Hora | Alerta | Botão */}
                <div className="flex items-end space-x-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Data e Hora
                        </label>
                        <input
                            type="datetime-local"
                            value={datetime}
                            onChange={e => setDatetime(e.target.value)}
                            className="w-full p-3 border rounded bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            required
                        />
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Ativar Alerta
                        </span>
                        <div className="flex items-center space-x-2">
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
                    </div>

                    <div className="flex flex-col space-y-2">
                        {isEditing && (
                            <button 
                                type="button" 
                                onClick={onCancelEdit} 
                                className="px-4 py-3 rounded bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-semibold transition"
                            >
                                Cancelar Edição
                            </button>
                        )}
                        <button 
                            type="submit" 
                            className="px-6 py-3 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                        >
                            {isEditing ? 'Atualizar' : 'Agendar'}
                        </button>
                    </div>
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
                                    ? 'text-yellow-600 dark:text-yellow-400' 
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
                    const activeMessages = messages.filter(msg => msg.status !== 'Cancelado');
                    setScheduledMessages(activeMessages);
                } catch (error) {
                    console.error('Failed to load scheduled messages:', error);
                }
            };
            loadMessages();
        }
    }, [appContext]);

    const sortedMessages = useMemo(() => {
        return [...scheduledMessages]
            .filter(msg => msg.status !== 'Cancelado')
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
                                    const hasAlert = msg.hasAlert || false;
                                    
                                    return (
                                        <ScheduledMessageItem 
                                            key={msg.id} 
                                            message={msg} 
                                            onEdit={handleSetEditMode} 
                                            onCancel={(id: string) => handleCancelSchedule(id)}
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
                                            onCancel={(id: string) => handleCancelSchedule(id)}
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