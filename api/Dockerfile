FROM node:18-alpine

# Instalar wget para healthcheck
RUN apk add --no-cache wget

WORKDIR /usr/src/app

# Copiar arquivos de dependências primeiro para melhor cache
COPY package*.json ./

# Instalar dependências com output verbose para debug
RUN npm install --verbose && npm cache clean --force

# Copiar código da aplicação
COPY . .

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /usr/src/app

USER nextjs

EXPOSE 3000

# Health check interno
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]