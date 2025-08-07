
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

export type ScheduleStatus = 'Agendado' | 'Enviado' | 'Cancelado' | 'Falhou';

export interface ScheduledMessage {
  id: string; // Using UUID for unique ID
  datetime: string; // ISO string for datetime-local
  message: string;
  attachments: Attachment[];
  status: ScheduleStatus;
  contactId: number;
  conversationId: number;
  lastUpdate?: string; // Novo campo para a última atualização (ISO string)
  edit_id?: string; // ID gerado quando o agendamento é editado
  previous_edit_ids?: string[]; // Array com histórico de edit_ids anteriores
  exc_id?: string; // ID gerado quando o agendamento é cancelado
  scheduled_for?: string; // Horário agendado em São Paulo (YYYY-MM-DD HH:mm:ss)
  hasAlert?: boolean; // Campo para indicar se o alerta foi ativado
}
