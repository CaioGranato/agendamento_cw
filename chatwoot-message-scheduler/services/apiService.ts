import { ScheduledMessage, Contact, Conversation } from '../types';

// Lista de URLs da API para tentar (em ordem de prioridade)
const API_URLS = [
  process.env.API_BASE_URL,
  'https://apiag.odmax.com.br/api',
  'https://apiag.odmax.com.br',
  // Fallback para localhost em desenvolvimento
  'http://localhost:3001/api'
].filter(Boolean); // Remove valores undefined

class ApiService {
  private currentApiIndex = 0;
  private hasValidConnection = false;

  private get currentApiUrl(): string {
    return API_URLS[this.currentApiIndex] || API_URLS[0];
  }

  private async testApiConnection(baseUrl: string): Promise<boolean> {
    try {
      // Tenta acessar o health endpoint primeiro
      const healthEndpoints = ['/health', '/', '/api/health'];
      
      for (const endpoint of healthEndpoints) {
        try {
          const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            timeout: 5000
          } as RequestInit);
          
          if (response.ok || response.status === 404) {
            return true; // 404 pode ser normal se health endpoint não existir
          }
        } catch (e) {
          continue; // Tenta próximo endpoint
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  private async findWorkingApi(): Promise<string> {
    if (this.hasValidConnection) {
      return this.currentApiUrl;
    }

    // Testa cada URL da lista
    for (let i = 0; i < API_URLS.length; i++) {
      const apiUrl = API_URLS[i];
      console.log(`🔍 Testando conexão com API: ${apiUrl}`);
      
      if (await this.testApiConnection(apiUrl)) {
        console.log(`✅ Conexão estabelecida com: ${apiUrl}`);
        this.currentApiIndex = i;
        this.hasValidConnection = true;
        return apiUrl;
      } else {
        console.warn(`❌ Falha ao conectar com: ${apiUrl}`);
      }
    }

    console.error('⚠️ Nenhuma API disponível. Usando fallback para localStorage.');
    throw new Error('API não disponível - usando fallback local');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 segundos timeout
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      const baseUrl = await this.findWorkingApi();
      const url = `${baseUrl}${endpoint}`;
      
      console.log(`📡 API Request: ${requestOptions.method || 'GET'} ${url}`);
      
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        console.error(`❌ HTTP error! status: ${response.status} - ${response.statusText}`);
        
        // Se for erro 401/403, pode ser problema de autenticação
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Erro de autenticação: ${response.status}`);
        }
        
        // Se for erro 404, pode ser endpoint inexistente
        if (response.status === 404) {
          throw new Error(`Endpoint não encontrado: ${endpoint}`);
        }
        
        // Se for erro 500+, pode ser problema do servidor
        if (response.status >= 500) {
          throw new Error(`Erro do servidor: ${response.status}`);
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`✅ API Response: ${requestOptions.method || 'GET'} ${url} - Success`);
      return result;
      
    } catch (error) {
      console.error('💥 API request failed:', error);
      
      // Marca a conexão como inválida para tentar próxima URL
      this.hasValidConnection = false;
      
      // Se ainda há outras APIs para tentar e este foi um erro de conectividade
      if (this.currentApiIndex < API_URLS.length - 1 && 
          (error instanceof TypeError || error.message.includes('fetch'))) {
        console.log('🔄 Tentando próxima API...');
        this.currentApiIndex++;
        return this.makeRequest(endpoint, options); // Recursive retry
      }
      
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
      
      // Fallback para localStorage se houver dados do contato
      if (contact?.id && scheduleData) {
        console.log('📱 Usando fallback localStorage para atualização');
        try {
          this.updateLocalStorageBackup(id, scheduleData, contact.id);
          return false; // Retorna false para indicar que foi salvo localmente
        } catch (localError) {
          console.error('Erro ao salvar no localStorage:', localError);
        }
      }
      
      return false;
    }
  }

  async deleteScheduledMessage(id: string, contactId?: number): Promise<boolean> {
    try {
      await this.makeRequest(`/schedules/${id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Failed to delete scheduled message:', error);
      
      // Fallback para localStorage se houver contactId
      if (contactId) {
        console.log('📱 Usando fallback localStorage para exclusão');
        try {
          this.deleteFromLocalStorageBackup(id, contactId);
          return false; // Retorna false para indicar que foi removido localmente
        } catch (localError) {
          console.error('Erro ao remover do localStorage:', localError);
        }
      }
      
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

  private updateLocalStorageBackup(
    id: string, 
    scheduleData: Partial<ScheduledMessage>, 
    contactId: number
  ): void {
    if (typeof window === 'undefined') return;
    try {
      const existingMessages = this.getLocalStorageBackup(contactId);
      const updatedMessages = existingMessages.map(msg => 
        msg.id === id ? { ...msg, ...scheduleData } : msg
      );
      localStorage.setItem(this.getStorageKey(contactId), JSON.stringify(updatedMessages));
      console.log('✅ Agendamento atualizado no localStorage');
    } catch (error) {
      console.error("Failed to update scheduled messages in localStorage:", error);
    }
  }

  private deleteFromLocalStorageBackup(id: string, contactId: number): void {
    if (typeof window === 'undefined') return;
    try {
      const existingMessages = this.getLocalStorageBackup(contactId);
      const updatedMessages = existingMessages.filter(msg => msg.id !== id);
      localStorage.setItem(this.getStorageKey(contactId), JSON.stringify(updatedMessages));
      console.log('✅ Agendamento removido do localStorage');
    } catch (error) {
      console.error("Failed to delete scheduled message from localStorage:", error);
    }
  }
}

export const apiService = new ApiService();