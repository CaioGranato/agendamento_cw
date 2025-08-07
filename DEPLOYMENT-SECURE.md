# 🔒 Deployment Seguro - Sem Exposição de Credenciais

## ⚠️ **IMPORTANTE: Nunca commite credenciais no GitHub!**

### 🎯 **Opção 1: Variáveis de Ambiente no Servidor**
```bash
# No servidor de produção (não no código):
export DATABASE_URL="postgresql://user:password@postgres:5432/database"
export N8N_WEBHOOK_URL="https://webhookn8n.odtravel.com.br/webhook/your-id"
export N8N_ALERT_WEBHOOK_URL="https://n8n.odtravel.com.br/webhook-test/your-alert-id"
export GEMINI_API_KEY="your-gemini-api-key"
export CORS_ORIGIN="https://agendamento.odmax.com.br"

# Deploy sem arquivo .env
docker stack deploy -c docker-compose.production.yml agendamento-cw
```

### 🛡️ **Opção 2: Docker Secrets (Recomendado)**
```bash
# 1. Criar secrets no Docker Swarm
echo "postgresql://user:pass@postgres:5432/db" | docker secret create database_url -
echo "https://webhookn8n.odtravel.com.br/webhook/your-id" | docker secret create n8n_webhook_url -
echo "https://n8n.odtravel.com.br/webhook-test/your-alert-id" | docker secret create n8n_alert_webhook_url -
echo "your-gemini-api-key" | docker secret create gemini_api_key -

# 2. Deploy com secrets
docker stack deploy -c docker-compose.secrets.yml agendamento-cw

# 3. Verificar secrets
docker secret ls
```

### 🔧 **Opção 3: Arquivo .env Local (Apenas no Servidor)**
```bash
# No servidor, criar arquivo local (nunca no Git):
cat > .env.production << EOF
DATABASE_URL=postgresql://user:password@postgres:5432/database
N8N_WEBHOOK_URL=https://webhookn8n.odtravel.com.br/webhook/your-id
N8N_ALERT_WEBHOOK_URL=https://n8n.odtravel.com.br/webhook-test/your-alert-id
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGIN=https://agendamento.odmax.com.br
EOF

# Deploy com arquivo local
docker stack deploy -c docker-compose.production.yml --env-file .env.production agendamento-cw
```

## 🚨 **Segurança Crítica**

### ✅ **O QUE FAZER:**
- Usar variáveis de ambiente no servidor
- Usar Docker Secrets para dados sensíveis
- Manter credenciais fora do repositório
- Rotacionar chaves regularmente

### ❌ **O QUE NUNCA FAZER:**
- Commitar arquivos `.env` com dados reais
- Hardcoded credentials no código
- Expor senhas em logs
- Compartilhar credenciais por email/chat

## 🔍 **Verificar Segurança**
```bash
# Verificar se não há credenciais no Git
git log --all -S "password" --source --all
git log --all -S "api" --source --all

# Verificar arquivos ignorados
cat .gitignore | grep -E "\.env|secret|key"
```

## 📝 **Arquivos que DEVEM estar no .gitignore**
```gitignore
# Environment files
.env
.env.local
.env.production
.env.staging

# Secrets
secrets/
*.key
*.pem

# Logs com possíveis credenciais
logs/
*.log
npm-debug.log*
```

## 🎯 **Recomendação Final**

Use a **Opção 2 (Docker Secrets)** para produção:
- Mais seguro
- Integrado ao Docker Swarm
- Rotação automática
- Auditoria completa