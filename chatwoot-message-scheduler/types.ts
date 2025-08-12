
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
  base64?: string; // base64 with data URI scheme
}

export type ScheduleStatus = 'scheduled' | 'agendado' | 'edited' | 'editado' | 'processing' | 'sent' | 'error' | 'cancelled';

export interface ScheduledMessage {
  schedule_id: string; // UUID from database
  schedule_from: string; // ISO timestamp from database
  message: string;
  attachments: any[]; // JSON array from database
  status: ScheduleStatus;
  contactid: number; // From database (lowercase)
  conversationid: number; // From database (lowercase) 
  alert?: boolean;
  alert_from?: string;
  comment?: string;
  lastupdate?: string;
  edit_id?: string;
  previous_edit_ids?: string[];
  
  // Computed fields for UI compatibility
  id?: string; // Maps to schedule_id
  datetime?: string; // Maps to schedule_from
  contactId?: number; // Maps to contactid
  conversationId?: number; // Maps to conversationid
  lastUpdate?: string; // Maps to lastupdate
  hasAlert?: boolean; // Maps to alert
}
