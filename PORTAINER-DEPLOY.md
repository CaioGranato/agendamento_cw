# 🐳 Deploy via Portainer - Sem Arquivos .env

## 🎯 **Vantagens desta Abordagem:**
- ✅ Zero arquivos de configuração
- ✅ Tudo gerenciado via interface Portainer
- ✅ Variáveis seguras no ambiente
- ✅ Fácil atualização e rollback
- ✅ Sem risco de exposição no GitHub

## 📋 **Passo a Passo no Portainer:**

### 1. **Acessar Portainer**
- Login no Portainer
- Ir para **Stacks**

### 2. **Atualizar Stack Existente**
- Selecionar stack `agendamento-cw-api`
- Clicar em **Editor**
- Colar o conteúdo do `docker-compose.portainer.yml`

### 3. **Configurar Environment Variables**
Adicionar estas variáveis na seção **Environment variables**:

```env
DATABASE_URL=postgresql://postgres:66f26cf0a1b545cfb04266ee8c678016@postgres:5432/postgres
N8N_WEBHOOK_URL=https://webhookn8n.odtravel.com.br/webhook/71686ca7-d62c-43ed-8d6b-9930609ef6a9
N8N_ALERT_WEBHOOK_URL=https://n8n.odtravel.com.br/webhook-test/c34175bd-15ac-4483-8f39-5f23ee4d1a6b
GEMINI_API_KEY=AIzaSyD_lF9jCzGKoT2fB5apsiNbGBq7fJj8T5I
CORS_ORIGIN=*
```

### 4. **Deploy**
- Clicar em **Update the stack**
- Aguardar o deploy completar

## 🔍 **Verificar Deploy:**

### Via Portainer:
- **Containers** → Verificar se ambos containers estão "running"
- **Logs** → Verificar logs dos containers

### Via curl:
```bash
curl https://apiag.odmax.com.br/health
curl https://agendamento.odmax.com.br/health
```

## 🚀 **Benefícios:**

### **Segurança:**
- Variáveis ficam apenas no Portainer
- Não há arquivos sensíveis no repositório
- Interface web segura para gestão

### **Manutenção:**
- Fácil atualização via interface
- Rollback com um clique
- Logs centralizados

### **Simplicidade:**
- Uma única stack gerencia tudo
- Não precisa SSH no servidor
- Deploy com interface gráfica

## 🔄 **Para Futuras Atualizações:**

1. **Código atualizado automaticamente** (git clone no container)
2. **Forçar rebuild**: 
   - Portainer → Stack → **Update** 
   - Marcar "Re-pull image"
3. **Rollback**: Um clique em "Previous version"

## 📊 **Monitoramento via Portainer:**
- **Dashboard**: Status dos containers
- **Stats**: CPU/Memory usage
- **Logs**: Debug em tempo real
- **Console**: Acesso direto aos containers

## 🎉 **Resultado Final:**
- **API**: `https://apiag.odmax.com.br`
- **Frontend**: `https://agendamento.odmax.com.br`
- **Zero configuração manual no servidor**
- **100% gerenciado via Portainer**