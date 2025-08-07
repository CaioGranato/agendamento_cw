import { ScheduledMessage, Contact, Conversation } from '../types';

const API_BASE_URL = process.env.API_BASE_URL || 'https://your-api-domain.com/api';

class ApiService {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getScheduledMessagesForContact(contactId: number): Promise<ScheduledMessage[]> {
    try {
      return await this.makeRequest(`/schedules/${contactId}`);
    } catch (error) {
      console.error('Failed to fetch scheduled messages:', error);
      // Fallback to localStorage if API fails
      return this.getLocalStorageBackup(contactId);
    }
  }

  async saveScheduledMessage(
    scheduleData: ScheduledMessage,
    contact: Contact,
    conversation: Conversation
  ): Promise<boolean> {
    try {
      await this.makeRequest('/schedules', {
        method: 'POST',
        body: JSON.stringify({
          scheduleData,
          contact,
          conversation
        })
      });
      return true;
    } catch (error) {
      console.error('Failed to save scheduled message:', error);
      // Fallback to localStorage if API fails
      this.saveToLocalStorageBackup(scheduleData, contact.id);
      return false;
    }
  }

  async updateScheduledMessage(
    id: string,
    scheduleData: Partial<ScheduledMessage>,
    contact?: Contact,
    conversation?: Conversation
  ): Promise<boolean> {
    try {
      await this.makeRequest(`/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          scheduleData,
          contact,
          conversation
        })
      });
      return true;
    } catch (error) {
      console.error('Failed to update scheduled message:', error);
      return false;
    }
  }

  async deleteScheduledMessage(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/schedules/${id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Failed to delete scheduled message:', error);
      return false;
    }
  }

  async getScheduledMessageById(id: string): Promise<ScheduledMessage | null> {
    try {
      return await this.makeRequest(`/schedules/single/${id}`);
    } catch (error) {
      console.error('Failed to fetch scheduled message by ID:', error);
      return null;
    }
  }

  // Backup methods for localStorage fallback
  private getStorageKey(contactId: number): string {
    return `chatwoot_scheduled_messages_${contactId}`;
  }

  private getLocalStorageBackup(contactId: number): ScheduledMessage[] {
    if (typeof window === 'undefined') return [];
    try {
      const storedMessages = localStorage.getItem(this.getStorageKey(contactId));
      if (storedMessages) {
        return JSON.parse(storedMessages);
      }
      return [];
    } catch (error) {
      console.error("Failed to parse scheduled messages from localStorage:", error);
      return [];
    }
  }

  private saveToLocalStorageBackup(scheduleData: ScheduledMessage, contactId: number): void {
    if (typeof window === 'undefined') return;
    try {
      const existingMessages = this.getLocalStorageBackup(contactId);
      const updatedMessages = [...existingMessages, scheduleData];
      localStorage.setItem(this.getStorageKey(contactId), JSON.stringify(updatedMessages));
    } catch (error) {
      console.error("Failed to save scheduled messages to localStorage:", error);
    }
  }
}

export const apiService = new ApiService();