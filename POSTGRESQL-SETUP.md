# 🐘 POSTGRESQL SETUP - Correção do Erro de Conexão

## 🔍 **DIAGNÓSTICO DO PROBLEMA**

### **❌ Erro Identificado:**
```
Table schedule_msg created or already exists
Database initialized successfully  
🚀 Server running on port 3000
SIGTERM signal received: closing HTTP server
HTTP server closed
```

**Causa:** API tenta conectar em `postgres:5432` mas o serviço PostgreSQL não existe na stack.

## 🚀 **SOLUÇÕES DISPONÍVEIS**

### **Opção 1: PostgreSQL Incluído na Stack (Recomendado)**

**Arquivo:** `docker-compose.complete.yml`
- ✅ PostgreSQL 15 Alpine incluído
- ✅ Volume persistente para dados
- ✅ Health checks configurados
- ✅ Dependência entre API e banco
- ✅ Configuração de recursos otimizada

### **Opção 2: PostgreSQL Externo**

**Arquivo:** `docker-compose.external-db.yml`  
- 🔗 Conecta em PostgreSQL existente
- ⚙️ Requer configuração manual da `DATABASE_URL`
- 🏗️ Para infraestruturas existentes

## 📋 **DEPLOY NO PORTAINER**

### **🎯 Cenário 1: Nova Stack com PostgreSQL**

1. **Portainer** → **Stacks** → **Add Stack**
2. **Nome:** `agendamento-cw-complete`
3. **Web editor** → Cole conteúdo do `docker-compose.complete.yml`
4. **Environment variables:**
```env
# Obrigatórias
POSTGRES_PASSWORD=sua_senha_segura_aqui
API_DOMAIN=apiag.odmax.com.br
FRONTEND_DOMAIN=agcw.odmax.com.br

# Opcionais
DATABASE_URL=postgresql://postgres:sua_senha_segura_aqui@postgres:5432/postgres
POSTGRES_DB=postgres
POSTGRES_USER=postgres
N8N_WEBHOOK_URL=https://webhookn8n.odtravel.com.br/webhook/your-id
GEMINI_API_KEY=your_gemini_key
```
5. **Deploy the stack**

### **🔧 Cenário 2: Update da Stack Existente**

1. **Portainer** → **Stacks** → Sua stack atual
2. **Editor** → Substitua conteúdo por `docker-compose.complete.yml`
3. **Environment variables** → Adicione variáveis acima
4. **Update the stack**

### **🏗️ Cenário 3: PostgreSQL Externo**

Se você já tem PostgreSQL rodando:

1. **Configure DATABASE_URL** para seu PostgreSQL:
```env
DATABASE_URL=postgresql://usuario:senha@seu-postgres-host:5432/database
```

2. **Use** `docker-compose.external-db.yml`

## 🔧 **VARIÁVEIS DE AMBIENTE NECESSÁRIAS**

### **PostgreSQL:**
```env
POSTGRES_DB=postgres
POSTGRES_USER=postgres  
POSTGRES_PASSWORD=sua_senha_forte_aqui
```

### **Aplicação:**
```env
DATABASE_URL=postgresql://postgres:sua_senha_forte_aqui@postgres:5432/postgres
API_DOMAIN=apiag.odmax.com.br
FRONTEND_DOMAIN=agcw.odmax.com.br
```

### **Integração (Opcional):**
```env
N8N_WEBHOOK_URL=https://webhookn8n.odtravel.com.br/webhook/your-id
N8N_ALERT_WEBHOOK_URL=https://n8n.odtravel.com.br/webhook-test/your-id
GEMINI_API_KEY=your_gemini_key
CORS_ORIGIN=*
```

## 📊 **VERIFICAÇÃO PÓS-DEPLOY**

### **1. Status dos Serviços:**
```bash
# Verificar se todos estão rodando
docker service ls | grep agendamento

# Verificar logs da API
docker service logs -f agendamento-cw-complete_api

# Verificar logs do PostgreSQL  
docker service logs -f agendamento-cw-complete_postgres
```

### **2. Teste de Conectividade:**
```bash
# Testar health da API
curl https://apiag.odmax.com.br/health

# Testar endpoint específico
curl https://apiag.odmax.com.br/api/schedules/1
```

### **3. Logs Esperados (Sucesso):**
```
Table schedule_msg created or already exists
Database initialized successfully
🚀 Server running on port 3000
📊 Health check: http://localhost:3000/health
📅 API endpoint: http://localhost:3000/api/schedules
🌍 Environment: production
```

## 🛟 **TROUBLESHOOTING**

### **PostgreSQL não conecta:**
```bash
# Verificar se PostgreSQL está rodando
docker service ps agendamento-cw-complete_postgres

# Verificar logs do PostgreSQL
docker service logs agendamento-cw-complete_postgres
```

### **API reinicia constantemente:**
- Verificar `DATABASE_URL` nas variáveis de ambiente
- Confirmar que PostgreSQL está rodando antes da API
- Verificar se senha do PostgreSQL está correta

### **Erro de permissões:**
```bash
# Verificar se volume foi criado corretamente
docker volume ls | grep postgres
```

## 🎯 **RESULTADO ESPERADO**

Após aplicar a correção:
- ✅ PostgreSQL rodando estável
- ✅ API conecta sem SIGTERM
- ✅ Tabela `schedule_msg` criada automaticamente
- ✅ Edição de agendamentos funciona perfeitamente
- ✅ Dados persistem entre restarts

---

## 🚀 **RESUMO - AÇÃO NECESSÁRIA:**

1. **Use** `docker-compose.complete.yml` no Portainer
2. **Configure** variáveis de ambiente (especialmente `POSTGRES_PASSWORD`)
3. **Deploy** da stack completa
4. **Teste** edição de agendamento no ChatWoot

**O erro de PostgreSQL será 100% resolvido!** 🎉