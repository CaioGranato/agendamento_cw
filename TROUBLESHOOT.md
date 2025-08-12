# 🔧 Troubleshooting - Agendamento Chatwoot

## 🚨 Problema: Container API "exited - code 0"

### **Causa Identificada:**
SIGTERM enviado ao container - geralmente por falha no healthcheck

### **✅ Correções Aplicadas:**

1. **Healthcheck Otimizado:**
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
  interval: 30s
  timeout: 15s
  retries: 5
  start_period: 90s
```

2. **Recursos Aumentados:**
```yaml
resources:
  limits:
    cpus: "1.5"
    memory: 1536M
  reservations:
    cpus: "0.3"
    memory: 512M
```

## 🗄️ Problema: Agendamentos de Cache

### **Causa:**
Frontend usando fallback localStorage quando API indisponível

### **✅ Correções Aplicadas:**

1. **Limpeza Automática de Cache:**
   - Método `clearLocalStorageCache()` adicionado
   - Executa quando API conecta com sucesso
   - Remove todas as chaves `chatwoot_scheduled_messages_*`

2. **Validação de Datas:**
   - Função `validateDate()` para evitar "Invalid Date"
   - Fallback para data atual em caso de erro
   - Validação em `transformScheduledMessage()`

## 🔧 Como Aplicar as Correções:

### **1. Atualizar Stack no Portainer:**
```bash
# Use o arquivo docker-compose.dockerhub.yml atualizado
# Cole no Portainer Stack Editor e clique "Update Stack"
```

### **2. Fazer Commit e Push:**
```bash
git add .
git commit -m "🔧 Fix: Container healthcheck + localStorage cache"
git push origin main
```

### **3. Aguardar GitHub Actions:**
- Monitore a aba "Actions" no GitHub
- Aguarde build das novas imagens (~2-3 min)

### **4. Update Stack no Portainer:**
- Stacks → agendamento-cw → Update
- As novas imagens serão baixadas automaticamente

## 🔍 Verificações Pós-Deploy:

### **1. Container API Status:**
```bash
# No Portainer, verificar se API está "healthy" (verde)
# Se vermelho, verificar logs
```

### **2. Endpoints de Health:**
```bash
curl https://apiag.odmax.com.br/health
# Deve retornar: {"status":"healthy",...}

curl https://agcw.odmax.com.br/health
# Deve retornar: "healthy"
```

### **3. Limpar Cache do Navegador:**
```bash
# No DevTools (F12):
# Application → Storage → Clear Site Data
# Ou Ctrl+Shift+Delete
```

### **4. Testar Agendamentos:**
1. Abrir Chatwoot
2. Ir para conversa
3. Abrir aba "Agendamento"
4. Criar novo agendamento
5. Verificar se aparece apenas dados da API (não cache)

## ⚠️ Se Problemas Persistirem:

### **Container API ainda com erro:**
1. Verificar logs no Portainer
2. Aumentar `start_period` para 120s
3. Verificar recursos disponíveis no servidor

### **Cache ainda aparecendo:**
1. Forçar refresh: Ctrl+F5
2. Limpar localStorage manualmente:
```javascript
// No DevTools Console:
Object.keys(localStorage)
  .filter(key => key.startsWith('chatwoot_scheduled_messages_'))
  .forEach(key => localStorage.removeItem(key));
```

### **"Invalid Date" ainda aparecendo:**
1. Verificar formato de datas no banco Supabase
2. Confirmar timezone configurado como America/Sao_Paulo

## 📋 Logs Úteis:

### **Container API:**
```
🚀 Server running on port 3000
✅ Conexão estabelecida com Supabase
🧹 Cache localStorage limpo após conexão com API
```

### **Frontend:**
```
🔍 Testando conexão com API: http://localhost:3000/api
✅ Conexão estabelecida com: http://localhost:3000/api
🧹 Cache localStorage limpo após conexão com API
```

---

**🎯 Objetivo:** Container API estável + Dados apenas da API (sem cache localStorage)