# 🚀 Deploy Automático - Agendamento Chatwoot

## 📋 Stack Atual no Portainer

Use o arquivo `docker-compose.dockerhub.yml` que contém a stack completa com:

### 🔧 Configurações
- **API**: `granatocaio/agendamento-cw-api:latest`
- **Frontend**: `granatocaio/agendamento-cw-frontend:latest`
- **Rede**: `odmaxnet`
- **Domínios**: 
  - API: `apiag.odmax.com.br`
  - Frontend: `agcw.odmax.com.br`

### 🌐 Variáveis de Ambiente Configuradas
```yaml
# Supabase
DATABASE_URL=postgresql://postgres.gxbddlgvbzeyidbqyvcg:UoKbaKsC7s3waGEa@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://gxbddlgvbzeyidbqyvcg.supabase.co
SUPABASE_ANON_KEY=sb_publishable_N-CZvYtuBDy_JPune_OggA_1eA4OOAt

# N8N Webhooks
N8N_WEBHOOK_URL=https://webhookn8n.odtravel.com.br/webhook/71686ca7-d62c-43ed-8d6b-9930609ef6a9
N8N_ALERT_WEBHOOK_URL=https://webhookn8n.odtravel.com.br/webhook/c34175bd-15ac-4483-8f39-5f23ee4d1a6b

# Gemini API
GEMINI_API_KEY=AIzaSyD_lF9jCzGKoT2fB5apsiNbGBq7fJj8T5I
```

## 🔄 Fluxo de Deploy Automático

### 1. **GitHub Actions** ✅
- **Trigger**: Push na branch `main`
- **Jobs**: Build Frontend + API em paralelo
- **Output**: Imagens no Docker Hub
- **Cache**: GitHub Actions cache habilitado

### 2. **Docker Hub** ✅
- `granatocaio/agendamento-cw-api:latest`
- `granatocaio/agendamento-cw-frontend:latest`
- Auto-build configurado

### 3. **Portainer Deploy** 🔄
Para atualizar a stack:
1. Copie `docker-compose.dockerhub.yml`
2. Cole no Portainer Stack Editor
3. Deploy/Update Stack
4. Aguarde pull das novas imagens

## 🎯 Benefícios da Configuração Atual

### ✅ **Segurança**
- Todas as credenciais visíveis apenas no Portainer
- Nenhuma informação sensível no GitHub
- SSL/TLS configurado via Traefik

### ✅ **Performance**
- Build cache otimizado
- Imagens Docker multi-stage
- Healthchecks configurados
- Resources limits definidos

### ✅ **Automação**
- Deploy automático após commit
- Rollback automático em caso de falha
- Update strategy: stop-first
- Zero downtime deployment

## 🔍 Monitoramento

### **Endpoints de Health**
- API: `https://apiag.odmax.com.br/health`
- Frontend: `https://agcw.odmax.com.br/health`

### **Logs no Portainer**
- Visualize logs em tempo real
- Filtros por serviço
- Histórico de deployments

## 🛠️ Troubleshooting

### **Se o deploy falhar:**
1. Verifique logs no Portainer
2. Confirme se imagens Docker Hub foram atualizadas
3. Verifique GitHub Actions status
4. Teste endpoints de health

### **Para rollback:**
1. No Portainer: Stack → Update → Previous Version
2. Ou mude tag para versão anterior: `:{{sha-anterior}}`

## 📱 Como Testar

1. **Faça um commit** neste repositório
2. **Monitore GitHub Actions**: `Actions` tab
3. **Aguarde build** (~2-3 minutos)
4. **Update no Portainer** (manual ou webhook)
5. **Teste**: `https://agcw.odmax.com.br`

---

**🎉 Setup Completo! Deploy automático GitHub → Docker Hub → Portainer funcionando!**