
export interface Contact {
  id: number;
  name: string;
  phone_number: string;
  email?: string | null;
  thumbnail?: string;
}

export interface Conversation {
  id: number;
}

export interface AppContext {
  contact: Contact;
  conversation: Conversation;
}

export interface Attachment {
  name: string;
  type: string; // MIME type
  content: string; // base64 encoded string
}

export type ScheduleStatus = 'Agendado' | 'Enviado' | 'Cancelado' | 'Falhou';

export interface ScheduledMessage {
  id: string; // Using UUID for unique ID
  datetime: string; // ISO string for datetime-local
  message: string;
  attachments: Attachment[];
  status: ScheduleStatus;
  contactId: number;
  conversationId: number;
}
