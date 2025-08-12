import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');
dayjs.extend(utc);
dayjs.extend(timezone);

import { ScheduledMessage, Contact, Conversation, Attachment } from '../types';
import { apiService } from './apiService';

// Transform API response to frontend format
const transformScheduledMessage = (apiMessage: any): ScheduledMessage => {
  return {
    ...apiMessage,
    // Map database fields to UI-compatible fields
    id: apiMessage.schedule_id,
    datetime: apiMessage.schedule_from,
    contactId: apiMessage.contactid,
    conversationId: apiMessage.conversationid,
    lastUpdate: apiMessage.lastupdate,
    hasAlert: apiMessage.alert || false,
    // Ensure attachments is an array
    attachments: Array.isArray(apiMessage.attachments) ? apiMessage.attachments : []
  };
};

// Transform UI message to API format  
const transformToApiFormat = (uiMessage: ScheduledMessage): any => {
  return {
    schedule_id: uiMessage.schedule_id || uiMessage.id,
    schedule_from: uiMessage.schedule_from || uiMessage.datetime,
    message: uiMessage.message,
    attachments: uiMessage.attachments || [],
    status: uiMessage.status,
    alert: uiMessage.alert || uiMessage.hasAlert || false,
    alert_from: uiMessage.alert_from,
    comment: uiMessage.comment,
    contactid: uiMessage.contactid || uiMessage.contactId,
    conversationid: uiMessage.conversationid || uiMessage.conversationId
  };
};

// Backward compatibility - these functions now use the API service
export const getScheduledMessagesForContact = async (contactId: number): Promise<ScheduledMessage[]> => {
  const apiMessages = await apiService.getScheduledMessagesForContact(contactId);
  return apiMessages.map(transformScheduledMessage);
};

export const saveScheduledMessagesForContact = async (
  contactId: number, 
  messages: ScheduledMessage[]
): Promise<void> => {
  // This function is deprecated in favor of individual CRUD operations
  console.warn('saveScheduledMessagesForContact is deprecated. Use individual CRUD operations instead.');
};

export const sendToN8n = async (
  scheduleData: ScheduledMessage,
  contact: Contact,
  conversation: Conversation
): Promise<boolean> => {
  // Now handled by the API service
  return await apiService.saveScheduledMessage(scheduleData, contact, conversation);
};

// New API-based functions
export const createScheduledMessage = async (
  scheduleData: ScheduledMessage,
  contact: Contact,
  conversation: Conversation
): Promise<boolean> => {
  const apiData = transformToApiFormat(scheduleData);
  return await apiService.saveScheduledMessage(apiData, contact, conversation);
};

export const updateScheduledMessage = async (
  id: string,
  scheduleData: Partial<ScheduledMessage>,
  contact?: Contact,
  conversation?: Conversation
): Promise<boolean> => {
  return await apiService.updateScheduledMessage(id, scheduleData, contact, conversation);
};

export const deleteScheduledMessage = async (id: string, contactId?: number): Promise<boolean> => {
  return await apiService.deleteScheduledMessage(id, contactId);
};

export const getScheduledMessageById = async (id: string): Promise<ScheduledMessage | null> => {
  return await apiService.getScheduledMessageById(id);
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
