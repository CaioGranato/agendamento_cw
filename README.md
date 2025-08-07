# ChatWoot Message Scheduler

Sistema de agendamento de mensagens para ChatWoot com API backend integrada ao PostgreSQL.

## Estrutura do Projeto

```
.
├── api/                          # API Backend (Node.js/Express)
│   ├── db/connection.js         # Conexão e queries do PostgreSQL
│   ├── routes/schedules.js      # Rotas da API
│   ├── server.js               # Servidor principal
│   ├── package.json            # Dependências da API
│   └── Dockerfile              # Container da API
├── chatwoot-message-scheduler/  # Frontend (React/TypeScript)
│   ├── services/
│   │   ├── apiService.ts       # Cliente da API
│   │   └── schedulingService.ts # Lógica de agendamento
│   ├── App.tsx                 # Componente principal
│   └── ...
├── docker-compose.yml          # Stack para deploy
└── .env.example               # Variáveis de ambiente
```

## Deploy no Portainer

### 1. Preparar o Repositório
```bash
git add .
git commit -m "Add API backend and PostgreSQL integration"
git push origin main
```

### 2. Configurar CNAME no Cloudflare
- Domínio: `apiag.odmax.com`
- Tipo: CNAME
- Valor: seu domínio da VPS
- Proxy: **DESATIVADO**

### 3. Deploy via Portainer
1. Acesse o Portainer
2. Vá em **Stacks** → **Add Stack**
3. Nome: `agendamento-cw`
4. Cole o conteúdo do `docker-compose.yml`
5. Deploy

### 4. Verificar Deploy
```bash
# Health check da API
curl https://apiag.odmax.com/health

# Verificar logs
docker service logs agendamento-cw_agendamento-cw-api
```

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check |
| GET | `/api/schedules/:contactId` | Buscar agendamentos por contato |
| POST | `/api/schedules` | Criar agendamento |
| PUT | `/api/schedules/:id` | Atualizar agendamento |
| DELETE | `/api/schedules/:id` | Deletar agendamento |
| GET | `/api/schedules/single/:id` | Buscar agendamento por ID |

## Variáveis de Ambiente

```env
# API Configuration
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://username:password@host:5432/database
N8N_WEBHOOK_URL=https://your-n8n-domain.com/webhook/your-webhook-id
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGIN=*
TZ=America/Sao_Paulo
```

## Estrutura da Tabela PostgreSQL

```sql
CREATE TABLE schedule_msg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'scheduled',
  edit_id UUID,
  previous_edit_ids JSONB DEFAULT '[]'::jsonb,
  contactid INTEGER NOT NULL,
  conversationid INTEGER NOT NULL,
  lastupdate TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  lastupdateutc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  scheduled_for TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Desenvolvimento Local

### Backend
```bash
cd api
npm install
npm run dev
```

### Frontend
```bash
cd chatwoot-message-scheduler
npm install
npm run dev
```

## Funcionalidades

✅ **Migração do localStorage para PostgreSQL**  
✅ **API REST completa com CRUD**  
✅ **Fallback para localStorage em caso de falha da API**  
✅ **Integração com N8N via webhook**  
✅ **Docker deployment com Traefik**  
✅ **SSL automático via Let's Encrypt**  
✅ **Timezone São Paulo configurado**  
✅ **Health checks e monitoramento**

## Recursos de Segurança

- Variáveis de ambiente para credenciais
- Container não-root
- Health checks
- Rate limiting implícito via Traefik
- CORS configurável

## Monitoramento

- Health endpoint: `/health`
- Logs via `docker service logs`
- Métricas via Traefik dashboard