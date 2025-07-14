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

// --- MAIN APP ---
export default function App() {
    const [appContext, setAppContext] = useState<AppContext | null>(null);
    const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'waiting'>('loading');
    const [editingMessage, setEditingMessage] = useState<ScheduledMessage | null>(null);

    useEffect(() => {
    console.log('[DEBUG] Iniciando listener de mensagens do Chatwoot');

    const handleChatwootMessage = (event: MessageEvent) => {
        try {
            console.log('[DEBUG] Mensagem recebida:', event.data);
            if (typeof event.data !== 'string') return;

            const data = JSON.parse(event.data);
            if (data.event === 'appContext') {
                console.log('[DEBUG] appContext recebido:', data.data);
                setAppContext(data.data as AppContext);
                setStatus('ready');
            }
        } catch (error) {
            console.warn('[DEBUG] Erro ao processar mensagem:', error);
        }
    };

    window.addEventListener('message', handleChatwootMessage);
    console.log('[DEBUG] Enviando solicitação para Chatwoot...');
    window.parent.postMessage('chatwoot-dashboard-app:fetch-info', '*');

    const timer = setTimeout(() => {
        setStatus(currentStatus => {
            if (currentStatus === 'loading' && !appContext) {
                console.log('[DEBUG] Nenhuma resposta do Chatwoot após 3s');
                return 'waiting';
            }
            return currentStatus;
        });
    }, 3000);

    return () => {
        window.removeEventListener('message', handleChatwootMessage);
        clearTimeout(timer);
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
