# 📋 Instruções para Deploy no Portainer

## 🚀 Passo a Passo

### 1. Acesse o Portainer
- Vá em **Stacks** → **Add Stack**
- Nome da stack: `agendamento-cw`

### 2. Cole o código da stack
Use o conteúdo do arquivo `docker-compose.production-fixed.yml`

### 3. Configure as Variáveis de Ambiente
Na seção **Environment variables**, adicione:

```bash
# Backend API Configuration
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://usuario:senha@host:5432/database
N8N_WEBHOOK_URL=https://seu-n8n-domain.com/webhook/your-webhook-id
N8N_ALERT_WEBHOOK_URL=https://seu-n8n-domain.com/webhook-test/your-alert-webhook
GEMINI_API_KEY=sua_chave_gemini_api_aqui
CORS_ORIGIN=*

# Frontend Configuration  
API_BASE_URL=https://sua-api-domain.com/api

# Domains (Traefik)
API_DOMAIN=sua-api-domain.com
FRONTEND_DOMAIN=seu-frontend-domain.com
```

### 4. Substitua pelos seus valores reais
- `DATABASE_URL`: String de conexão do seu PostgreSQL
- `N8N_WEBHOOK_URL`: URL do seu webhook N8N
- `N8N_ALERT_WEBHOOK_URL`: URL do webhook de alertas
- `GEMINI_API_KEY`: Sua chave da API do Google Gemini
- `API_DOMAIN`: Domínio da sua API (ex: apiag.seudominio.com)
- `FRONTEND_DOMAIN`: Domínio do frontend (ex: agendamento.seudominio.com)
- `API_BASE_URL`: URL completa da API (ex: https://apiag.seudominio.com/api)

### 5. Deploy
Clique em **Deploy the stack**

## 🔍 Verificação

### Health Checks
```bash
# Verificar API
curl https://sua-api-domain.com/health

# Verificar Frontend
curl https://seu-frontend-domain.com/health
```

### Logs
```bash
# Ver logs da API
docker service logs agendamento-cw_agendamento-cw-api

# Ver logs do Frontend
docker service logs agendamento-cw_agendamento-cw-frontend
```

## ⚠️ Importante

- **NUNCA** commite as chaves e URLs reais no repositório
- Use apenas as variáveis de ambiente do Portainer
- Verifique se a rede `odmaxnet` existe
- Confirme se o PostgreSQL está acessível na URL configurada

## 🆘 Troubleshooting

Se os containers não iniciarem:
1. Verifique os logs dos serviços
2. Confirme se todas as variáveis estão definidas
3. Teste a conectividade com banco de dados
4. Verifique se os domínios estão configurados no Cloudflare/DNS