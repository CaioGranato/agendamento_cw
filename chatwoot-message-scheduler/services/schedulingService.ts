import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');
dayjs.extend(utc);
dayjs.extend(timezone);

import { ScheduledMessage, Contact, Conversation, Attachment } from '../types';

// Corrigir a inconsistência nos URLs do webhook
const N8N_WEBHOOK_URL = 'https://webhookn8n.odtravel.com.br/webhook/71686ca7-d62c-43ed-8d6b-9930609ef6a9';

const getStorageKey = (contactId: number): string => `chatwoot_scheduled_messages_${contactId}`;

export const getScheduledMessagesForContact = (contactId: number): ScheduledMessage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const storedMessages = localStorage.getItem(getStorageKey(contactId));
    if (storedMessages) {
      return JSON.parse(storedMessages);
    }
    return [];
  } catch (error) {
    console.error("Failed to parse scheduled messages from localStorage:", error);
    return [];
  }
};

export const saveScheduledMessagesForContact = (contactId: number, messages: ScheduledMessage[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(contactId), JSON.stringify(messages));
  } catch (error) {
    console.error("Failed to save scheduled messages to localStorage:", error);
  }
};

export const sendToN8n = async (
  scheduleData: ScheduledMessage,
  contact: Contact,
  conversation: Conversation
): Promise<boolean> => {
  // Garante que o campo lastUpdate está sempre presente e usado como timestamp principal
  const nowSaoPaulo = dayjs().tz('America/Sao_Paulo');
  
  
  // Calcular datetime_sao_paulo automaticamente baseado no datetime original
  const datetimeSaoPaulo = dayjs.tz(scheduleData.datetime, 'America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss');
  
  const payload = {
    schedule: {
      ...scheduleData,
      datetime_sao_paulo: datetimeSaoPaulo, // Novo campo com horário de São Paulo
      lastUpdate: nowSaoPaulo.format('YYYY-MM-DDTHH:mm:ss'), // São Paulo local time
      lastUpdateUTC: nowSaoPaulo.toISOString(), // UTC (opcional)
      timestamp: nowSaoPaulo.format('YYYY-MM-DDTHH:mm:ss'), // São Paulo local time
    },
    contact,
    conversation,
  };
  

  try {
    // Usar o URL correto diretamente sem proxy
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });
    
    // Como estamos usando mode: 'no-cors', não podemos verificar response.ok
    // Vamos considerar que a requisição foi bem-sucedida se não lançou exceção
    return true;
  } catch (error) {
    console.error('Error sending schedule to n8n:', error);
    alert('Erro de conexão ao enviar para o n8n.');
    return false;
  }
};

export const fileToActionAttachment = (file: File): Promise<Attachment> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const content = result.split(',')[1];
      resolve({
        name: file.name,
        type: file.type,
        content: content,
      });
    };
    reader.onerror = error => reject(error);
  });
};
