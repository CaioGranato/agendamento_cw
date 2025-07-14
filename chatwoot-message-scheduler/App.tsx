import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppContext, Contact, ScheduledMessage, Attachment, ScheduleStatus } from './types';
import { getScheduledMessagesForContact, saveScheduledMessagesForContact, sendToN8n, fileToActionAttachment } from './services/schedulingService';

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

const SchedulerForm = ({ onSubmit, onCancelEdit, editingMessage }: {
    onSubmit: (data: Omit<ScheduledMessage, 'contactId' | 'conversationId'>) => void;
    onCancelEdit: () => void;
    editingMessage: ScheduledMessage | null;
}) => {
    const [message, setMessage] = useState('');
    const [datetime, setDatetime] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEditing = !!editingMessage;

    useEffect(() => {
        if (editingMessage) {
            setMessage(editingMessage.message);
            setDatetime(editingMessage.datetime);
            setAttachments(editingMessage.attachments);
        } else {
            setMessage('');
            setDatetime('');
            setAttachments([]);
        }
    }, [editingMessage]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const filePromises = Array.from(event.target.files).map(fileToActionAttachment);
            const newAttachments = await Promise.all(filePromises);
            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };

    const removeAttachment = (name: string) => {
        setAttachments(prev => prev.filter(att => att.name !== name));
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
        };

        onSubmit(newSchedule);
        
        if (!isEditing) {
            setMessage('');
            setDatetime('');
            setAttachments([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">{isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
            <div className="space-y-4">
                <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    rows={4}
                    required
                ></textarea>
                <input
                    type="datetime-local"
                    value={datetime}
                    onChange={e => setDatetime(e.target.value)}
                    className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                />
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Anexos</label>
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                     {attachments.length > 0 && (
                        <ul className="mt-2 text-sm text-slate-500 dark:text-slate-400 space-y-1">
                            {attachments.map(att => (
                                <li key={att.name} className="flex justify-between items-center">
                                    <span>{att.name}</span>
                                    <button type="button" onClick={() => removeAttachment(att.name)} className="text-red-500 hover:text-red-700">&times;</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <div className="flex justify-end items-center mt-6 space-x-2">
                {isEditing && (
                    <button type="button" onClick={onCancelEdit} className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-semibold transition">Cancelar Edição</button>
                )}
                <button type="submit" className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">{isEditing ? 'Atualizar' : 'Agendar'}</button>
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
    const { id, datetime, message: text, attachments, status } = message;

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
                     {attachments.length > 0 && (
                        <div className="mt-2">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Anexos:</p>
                            <ul className="list-disc list-inside text-sm text-slate-500 dark:text-slate-400">
                                {attachments.map(att => <li key={att.name}>{att.name}</li>)}
                            </ul>
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
                console.warn('[DEBUG] Erro ao processar mensagem:', error);
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
            const messages = getScheduledMessagesForContact(appContext.contact.id);
            setScheduledMessages(messages);
        }
    }, [appContext]);

    const sortedMessages = useMemo(() => {
        return [...scheduledMessages].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    }, [scheduledMessages]);


    const handleScheduleSubmit = useCallback(async (newMessageData: Omit<ScheduledMessage, 'contactId' | 'conversationId'>) => {
        if (!appContext) return;

        const fullMessage: ScheduledMessage = {
            ...newMessageData,
            contactId: appContext.contact.id,
            conversationId: appContext.conversation.id,
        };

        const success = await sendToN8n(fullMessage, appContext.contact, appContext.conversation);

        if (success) {
            let updatedMessages;
            const existingIndex = scheduledMessages.findIndex(m => m.id === fullMessage.id);
            
            if (existingIndex > -1) {
                updatedMessages = [...scheduledMessages];
                updatedMessages[existingIndex] = fullMessage;
                alert('Agendamento atualizado com sucesso!');
            } else {
                updatedMessages = [...scheduledMessages, fullMessage];
                alert('Agendamento realizado com sucesso!');
            }
            
            setScheduledMessages(updatedMessages);
            saveScheduledMessagesForContact(appContext.contact.id, updatedMessages);
            setEditingMessage(null); // Exit editing mode
        } else {
            alert('Erro ao agendar mensagem. Verifique a conexão e tente novamente.');
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

    const handleCancelSchedule = (id: string) => {
        if (!appContext || !window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;
        
        // Here you would ideally also call a webhook to inform n8n of the cancellation.
        // For now, we just update the status locally.
        
        const updatedMessages = scheduledMessages.map(msg => 
            msg.id === id ? { ...msg, status: 'Cancelado' as ScheduleStatus } : msg
        );
        
        setScheduledMessages(updatedMessages);
        saveScheduledMessagesForContact(appContext.contact.id, updatedMessages);
        alert('Agendamento cancelado.');
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
