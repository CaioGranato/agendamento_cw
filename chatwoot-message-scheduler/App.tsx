
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppContext, Contact, ScheduledMessage, Attachment, ScheduleStatus } from './types';
import { getScheduledMessagesForContact, saveScheduledMessagesForContact, sendToN8n, fileToActionAttachment } from './services/schedulingService';

// --- ICONS ---
const Icon = ({ path, className = 'w-6 h-6' }: { path: string, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d={path} clipRule="evenodd" />
    </svg>
);

const UserCircleIcon = () => <Icon path="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636M12 21a9 9 0 110-18 9 9 0 010 18z" />;
const PhoneIcon = () => <Icon path="M6.62 10.79a15.45 15.45 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.02.74-.25 1.02l-2.2 2.2z" />;
const ClockIcon = () => <Icon path="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 mr-1" />;
const PencilIcon = () => <Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" className="w-4 h-4" />;
const TrashIcon = () => <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" className="w-4 h-4" />;
const AttachmentIcon = ({type}: {type: string}) => {
    const iconMap: {[key:string]: React.ReactNode} = {
        'image': <Icon path="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" className="w-4 h-4 mr-1"/>,
        'audio': <Icon path="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m12 0v-1.5a6 6 0 00-12 0v1.5m12 0v-1.5a6 6 0 00-12 0v1.5" className="w-4 h-4 mr-1"/>,
        'file': <Icon path="M18.375 12.735l-1.135-1.136a1.5 1.5 0 00-2.121 0l-1.136 1.136-2.121-2.122 1.136-1.135a1.5 1.5 0 000-2.121l-1.135-1.136a1.5 1.5 0 00-2.121 0l-1.136 1.135-2.47-2.471a1.5 1.5 0 00-2.121 0l-1.136 1.135a1.5 1.5 0 000 2.121l1.135 1.136 2.121 2.121-1.135 1.136a1.5 1.5 0 000 2.121l1.135 1.136a1.5 1.5 0 002.121 0l1.136-1.135 2.121 2.121-1.136 1.135a1.5 1.5 0 000 2.121l1.135 1.136a1.5 1.5 0 002.121 0l1.136-1.135 2.47 2.47a1.5 1.5 0 002.121 0l1.136-1.135a1.5 1.5 0 000-2.121l-1.135-1.136-2.121-2.121 1.135-1.136a1.5 1.5 0 000-2.121z" className="w-4 h-4 mr-1"/>
    };
    const typeKey = Object.keys(iconMap).find(key => type.startsWith(key)) || 'file';
    return <>{iconMap[typeKey]}</>;
}

// --- SUB-COMPONENTS ---
const ContactInfo = React.memo(({ contact }: { contact: Contact }) => {
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    return (
        <div className="flex items-center p-3 mb-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <div className="flex-shrink-0 mr-4">
                {contact.thumbnail ? (
                    <img className="w-12 h-12 rounded-full" src={contact.thumbnail} alt={contact.name} />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">
                        {getInitials(contact.name)}
                    </div>
                )}
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{contact.name}</h2>
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <PhoneIcon />
                    <span className="ml-1">{contact.phone_number || 'N/A'}</span>
                </div>
            </div>
        </div>
    );
});

interface FileChipProps {
    attachment: Attachment;
    onRemove: () => void;
}

const FileChip: React.FC<FileChipProps> = ({ attachment, onRemove }) => (
    <div className="flex items-center bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium mr-2 mb-2 px-2.5 py-1 rounded-full">
        <AttachmentIcon type={attachment.type} />
        <span className="truncate max-w-xs">{attachment.name}</span>
        <button onClick={onRemove} className="ml-2 -mr-1 p-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800">
            <Icon path="M6 18L18 6M6 6l12 12" className="w-3 h-3" />
        </button>
    </div>
);


const SchedulerForm = ({ onSubmit, onCancelEdit, editingMessage }: { onSubmit: (message: Omit<ScheduledMessage, 'contactId' | 'conversationId'>) => Promise<void>, onCancelEdit: () => void, editingMessage: ScheduledMessage | null }) => {
    const [datetime, setDatetime] = useState('');
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingMessage) {
            setDatetime(editingMessage.datetime);
            setMessage(editingMessage.message);
            setAttachments(editingMessage.attachments);
        } else {
            // Reset form
            const now = new Date();
            now.setMinutes(now.getMinutes() + 5); // Default to 5 mins in the future
            now.setSeconds(0);
            setDatetime(now.toISOString().slice(0, 16));
            setMessage('');
            setAttachments([]);
        }
    }, [editingMessage]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            try {
                const newAttachments = await Promise.all(files.map(fileToActionAttachment));
                setAttachments(prev => [...prev, ...newAttachments]);
            } catch (error) {
                console.error("Error processing files:", error);
                alert("Erro ao processar um dos arquivos.");
            }
        }
    };
    
    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() && attachments.length === 0) {
            alert("A mensagem não pode estar vazia sem anexos.");
            return;
        }
        setIsSubmitting(true);
        const scheduleData = {
            id: editingMessage?.id || crypto.randomUUID(),
            datetime,
            message,
            attachments,
            status: 'Agendado' as ScheduleStatus,
        };
        await onSubmit(scheduleData);
        setIsSubmitting(false);
        if (!editingMessage) {
            setMessage('');
            setAttachments([]);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm space-y-4">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{editingMessage ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
            <div>
                <label htmlFor="scheduleTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data e Hora do Envio</label>
                <input
                    type="datetime-local"
                    id="scheduleTime"
                    value={datetime}
                    onChange={e => setDatetime(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div>
                 <label htmlFor="messageContent" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mensagem</label>
                 <div className="relative">
                    <textarea
                        id="messageContent"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={4}
                        placeholder="Escreva sua mensagem..."
                        className="w-full p-2 pr-12 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute top-2 right-2">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" />
                         <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                             <Icon path="M18.375 12.735l-1.135-1.136a1.5 1.5 0 00-2.121 0l-1.136 1.136-2.121-2.122 1.136-1.135a1.5 1.5 0 000-2.121l-1.135-1.136a1.5 1.5 0 00-2.121 0l-1.136 1.135-2.47-2.471a1.5 1.5 0 00-2.121 0l-1.136 1.135a1.5 1.5 0 000 2.121l1.135 1.136 2.121 2.121-1.135 1.136a1.5 1.5 0 000 2.121l1.135 1.136a1.5 1.5 0 002.121 0l1.136-1.135 2.121 2.121-1.136 1.135a1.5 1.5 0 000 2.121l1.135 1.136a1.5 1.5 0 002.121 0l1.136-1.135 2.47 2.47a1.5 1.5 0 002.121 0l1.136-1.135a1.5 1.5 0 000-2.121l-1.135-1.136-2.121-2.121 1.135-1.136a1.5 1.5 0 000-2.121z" className="w-6 h-6"/>
                         </button>
                    </div>
                 </div>
            </div>
             {attachments.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Anexos:</p>
                    <div className="flex flex-wrap">
                        {attachments.map((att, index) => <FileChip key={index} attachment={att} onRemove={() => removeAttachment(index)} />)}
                    </div>
                </div>
            )}
            <div className="flex justify-end space-x-2">
                {editingMessage && (
                    <button type="button" onClick={onCancelEdit} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-transparent rounded-md hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                        Cancelar Edição
                    </button>
                )}
                <button type="submit" disabled={isSubmitting} className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Agendando...' : (editingMessage ? 'Atualizar Agendamento' : 'Agendar Mensagem')}
                </button>
            </div>
        </form>
    );
};

interface ScheduledMessageItemProps {
    message: ScheduledMessage;
    onEdit: (id: string) => void;
    onCancel: (id: string) => void;
}

const ScheduledMessageItem: React.FC<ScheduledMessageItemProps> = ({ message, onEdit, onCancel }) => {
    const statusClasses: Record<ScheduleStatus, string> = {
        Agendado: 'bg-blue-100 text-blue-800 border-blue-500 dark:bg-blue-900/50 dark:text-blue-300',
        Enviado: 'bg-green-100 text-green-800 border-green-500 dark:bg-green-900/50 dark:text-green-300',
        Cancelado: 'bg-yellow-100 text-yellow-800 border-yellow-500 dark:bg-yellow-900/50 dark:text-yellow-300',
        Falhou: 'bg-red-100 text-red-800 border-red-500 dark:bg-red-900/50 dark:text-red-300',
    };
    
    return (
        <div className={`p-3 my-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border-l-4 ${statusClasses[message.status]}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <ClockIcon />
                        <span>{new Date(message.datetime).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 break-words">{message.message}</p>
                    {message.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                           {message.attachments.map((att, i) => (
                               <div key={i} className="flex items-center text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                   <AttachmentIcon type={att.type} />
                                   <span className="truncate max-w-xs">{att.name}</span>
                               </div>
                           ))}
                        </div>
                    )}
                </div>
                {message.status === 'Agendado' && (
                    <div className="flex space-x-2">
                        <button onClick={() => onEdit(message.id)} className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"><PencilIcon /></button>
                        <button onClick={() => onCancel(message.id)} className="p-1 text-slate-500 hover:text-red-600 dark:hover:text-red-400"><TrashIcon /></button>
                    </div>
                )}
            </div>
            <div className="mt-2 text-right">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusClasses[message.status]}`}>{message.status}</span>
            </div>
        </div>
    );
};


// --- MAIN APP ---
export default function App() {
    const [appContext, setAppContext] = useState<AppContext | null>(null);
    const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'waiting'>('loading');
    const [editingMessage, setEditingMessage] = useState<ScheduledMessage | null>(null);

    useEffect(() => {
        const handleChatwootMessage = (event: MessageEvent) => {
            try {
                if (typeof event.data !== 'string') return;
                const data = JSON.parse(event.data);
                if (data.event === 'appContext') {
                    setAppContext(data.data as AppContext);
                    setStatus('ready');
                }
            } catch (error) {
                // Ignore non-JSON messages
            }
        };

        window.addEventListener('message', handleChatwootMessage);
        window.parent.postMessage('chatwoot-dashboard-app:fetch-info', '*');
        
        // Timeout to handle case where chatwoot context is not received
        const timer = setTimeout(() => {
            if (status === 'loading') {
                setStatus('waiting');
            }
        }, 3000);

        return () => {
            window.removeEventListener('message', handleChatwootMessage);
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (status === 'loading') {
        return <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-500">Carregando...</div>;
    }
    
    if (status === 'waiting') {
        return <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-500 p-4 text-center">Aguardando informações do Chatwoot. Certifique-se de que o app está sendo executado em uma conversa.</div>;
    }

    if (!appContext) {
        return <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-red-500">Não foi possível carregar os dados do contato.</div>;
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
