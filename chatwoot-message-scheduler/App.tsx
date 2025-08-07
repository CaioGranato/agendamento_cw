// Adicione no topo do arquivo:
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/pt-br';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('pt-br');
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppContext, Contact, ScheduledMessage, Attachment, ScheduleStatus } from './types';
import { getScheduledMessagesForContact, createScheduledMessage, updateScheduledMessage, deleteScheduledMessage } from './services/schedulingService';
import { sendAlertWebhook, insertInlineMedia } from './services/webhookService';

// --- ICONS ---
const Icon = ({ path, className = 'w-6 h-6' }: { path: string, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d={path} clipRule="evenodd" />
    </svg>
);

const PhoneIcon = () => <Icon path="M6.62 10.79a15.45 15.45 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.02.74-.25 1.02l-2.2 2.2z" />;
const ClockIcon = () => <Icon path="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 mr-1" />;
const PencilIcon = () => <Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" className="w-4 h-4" />;
const TrashIcon = () => <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" className="w-4 h-4" />;

// --- UI COMPONENTS ---

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

// Adicionar no início do arquivo junto com os outros imports
import { useState, useRef, useEffect } from 'react';

// Componente AudioRecorder (já existe, mantido)
const AudioRecorder = ({ onAudioRecorded }: { onAudioRecorded: (audioUrl: string, base64: string) => void }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
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
                    const audioUrl = URL.createObjectURL(audioBlob);
                    onAudioRecorded(audioUrl, base64);
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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center space-x-2">
            {isRecording ? (
                <>
                    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        <span className="animate-pulse text-red-500">REC</span>
                        <span className="text-sm">{formatTime(recordingTime)}</span>
                    </div>
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="text-red-500 hover:text-red-600 transition-colors"
                        title="Parar gravação"
                    >
                        ⏹️
                    </button>
                </>
            ) : (
                <button
                    type="button"
                    onClick={startRecording}
                    className="text-gray-500 hover:text-gray-600 transition-colors"
                    title="Iniciar gravação"
                >
                    🎤
                </button>
            )}
        </div>
    );
};

// Modificar o SchedulerForm para incluir o AudioRecorder
const SchedulerForm = ({ onSubmit, onCancelEdit, editingMessage }: {
    onSubmit: (data: Omit<ScheduledMessage, 'contactId' | 'conversationId'>, createAlert?: boolean) => void;
    onCancelEdit: () => void;
    editingMessage: ScheduledMessage | null;
}) => {
    const [message, setMessage] = useState('');
    const [datetime, setDatetime] = useState('');
    const [createAlert, setCreateAlert] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]); // Restaurar suporte a anexos

    const isEditing = !!editingMessage;

    useEffect(() => {
        if (editingMessage) {
            setMessage(editingMessage.message);
            setDatetime(editingMessage.datetime);
            setAttachments(editingMessage.attachments || []);
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
                    setAttachments(prev => [...prev, { type: file.type, name: file.name, data: reader.result as string }]);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const handleAudioRecorded = (audioUrl: string, base64: string) => {
        setAttachments(prev => [...prev, { type: 'audio/wav', name: 'audio.wav', data: base64 }]);
        // Opcional: Adicionar nota no texto
        setMessage(prev => prev + (prev ? '\n' : '') + '🎵 [Áudio gravado]');
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
            attachments, // Incluir anexos reais
            status: 'Agendado',
            // Preservar campos extras quando editando
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
            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">{isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
            <div className="space-y-4">
                <div>
                    <div className="flex items-center mb-2 space-x-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Mensagem</label>
                        <div className="flex space-x-2">
                            <AudioRecorder onAudioRecorded={handleAudioRecorded} /> {/* Integrar gravador */}
                            <button type="button" onClick={() => handleAttachment('image')} className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded transition" title="Anexar imagem">🖼️ Imagem</button>
                            <button type="button" onClick={() => handleAttachment('file')} className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition" title="Anexar arquivo">📎 Arquivo</button>
                        </div>
                    </div>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Digite sua mensagem... Use os botões acima para inserir mídia inline."
                        className="w-full p-3 border rounded bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        rows={6}
                        required
                    ></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Data e Hora</label>
                    <input
                        type="datetime-local"
                        value={datetime}
                        onChange={e => setDatetime(e.target.value)}
                        className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        required
                    />
                </div>
            </div>
            <div className="space-y-3 mt-6">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="createAlert"
                        checked={createAlert}
                        onChange={(e) => setCreateAlert(e.target.checked)}
                        className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                    />
                    <label htmlFor="createAlert" className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        ⚠️ Criar Alerta
                    </label>
                </div>
                <div className="flex justify-end items-center space-x-2">
                    {isEditing && (
                        <button type="button" onClick={onCancelEdit} className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-semibold transition">Cancelar Edição</button>
                    )}
                    <button type="submit" className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">{isEditing ? 'Atualizar' : 'Agendar'}</button>
                </div>
            </div>
        </form>
    );
};

const StatusBadge = ({ status }: { status: ScheduleStatus }) => {
    const statusClasses: Record<ScheduleStatus, string> = {
        'Agendado': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        'Enviado': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        'Cancelado': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        'Falhou': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status]}`}>{status}</span>;
};

const ScheduledMessageItem = ({ message, onEdit, onCancel }: {
    message: ScheduledMessage;
    onEdit: (id: string) => void;
    onCancel: (id: string) => void;
}) => {
    const { id, datetime, message: text, attachments, status, lastUpdate } = message;

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
                <div>
                    <div className="flex items-center mb-2">
                        <ClockIcon />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{formattedDate}</span>
                        <div className="ml-4">
                            <StatusBadge status={status} />
                        </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{text}</p>
                    {/* Mostra o campo Last update */}
                    {lastUpdate && (
                        <div className="text-xs text-gray-500 mt-2">
                            Last update: {dayjs(lastUpdate).tz('America/Sao_Paulo').format('DD/MM/YYYY - HH:mm:ss')}
                        </div>
                    )}
                </div>
                {canBeModified && (
                    <div className="flex space-x-2 flex-shrink-0 ml-4">
                        <button onClick={() => onEdit(id)} className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="Editar">
                            <PencilIcon />
                        </button>
                        <button onClick={() => onCancel(id)} className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition" title="Cancelar">
                            <TrashIcon />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Alert webhook function
const sendAlertWebhook = async (
    scheduleData: ScheduledMessage,
    contact: Contact,
    conversation: Conversation
): Promise<boolean> => {
    const ALERT_WEBHOOK_URL = 'https://n8n.odtravel.com.br/webhook-test/c34175bd-15ac-4483-8f39-5f23ee4d1a6b';
    
    const nowSaoPaulo = dayjs().tz('America/Sao_Paulo');
    const datetimeSaoPaulo = dayjs.tz(scheduleData.datetime, 'America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');
    
    const payload = {
        schedule: {
            ...scheduleData,
            datetime_sao_paulo: datetimeSaoPaulo,
            lastUpdate: nowSaoPaulo.format('YYYY-MM-DDTHH:mm:ss'),
            lastUpdateUTC: nowSaoPaulo.toISOString(),
            timestamp: nowSaoPaulo.format('YYYY-MM-DDTHH:mm:ss'),
        },
        contact,
        conversation,
    };

    try {
        const response = await fetch(ALERT_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            mode: 'no-cors'
        });
        
        console.log('Alert webhook sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending alert webhook:', error);
        return false;
    }
};

// --- MAIN APP ---
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
                    setScheduledMessages(messages);
                } catch (error) {
                    console.error('Failed to load scheduled messages:', error);
                }
            };
            loadMessages();
        }
    }, [appContext]);

    const sortedMessages = useMemo(() => {
        return [...scheduledMessages].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    }, [scheduledMessages]);

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

        // Se está editando, adicionar edit_id e gerenciar histórico
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
            
            // Send to alert webhook if checkbox is checked
            if (createAlert) {
                await sendAlertWebhook(fullMessage, appContext.contact, appContext.conversation);
            }
            if (isEditing) {
                success = await updateScheduledMessage(fullMessage.id, fullMessage, appContext.contact, appContext.conversation);
            } else {
                success = await createScheduledMessage(fullMessage, appContext.contact, appContext.conversation);
            }

            if (success) {
                // Reload messages from API
                const updatedMessages = await getScheduledMessagesForContact(appContext.contact.id);
                setScheduledMessages(updatedMessages);
                
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
                // Reload messages from API
                const updatedMessages = await getScheduledMessagesForContact(appContext.contact.id);
                setScheduledMessages(updatedMessages);
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

return (
        <div className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen p-4 font-sans">
            <div className="max-w-4xl mx-auto">
                <ContactInfo contact={appContext.contact} />
                <SchedulerForm onSubmit={handleScheduleSubmit} onCancelEdit={handleCancelEdit} editingMessage={editingMessage} />
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Agendamentos</h3>
                    {sortedMessages.length > 0 ? (
                        <div>
                            {sortedMessages.map(msg => (
                                <ScheduledMessageItem key={msg.id} message={msg} onEdit={handleSetEditMode} onCancel={handleCancelSchedule} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <p className="text-slate-500 dark:text-slate-400">Nenhuma mensagem agendada para este contato.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
