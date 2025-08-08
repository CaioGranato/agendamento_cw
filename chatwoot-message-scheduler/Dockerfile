# Etapa 1: Build da aplicação React
FROM node:18-alpine AS build

WORKDIR /app

# Copia os arquivos de manifesto de pacote
COPY package*.json ./

# Instala TODAS as dependências, incluindo devDependencies como o Vite
# Usamos 'npm install' em vez de 'npm ci' para garantir que as devDependencies sejam instaladas
RUN npm install

# Copia o resto do código da aplicação
COPY . .

# Define o argumento de build para a URL da API
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Executa o build
RUN npm run build

# Etapa 2: Servir os arquivos estáticos com Nginx
FROM nginx:alpine

# Copia os arquivos construídos da etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Adiciona um endpoint de healthcheck para o Nginx
RUN echo "server { listen 80; location /health { return 200 'ok'; } }" > /etc/nginx/conf.d/healthcheck.conf

# Copia a configuração principal do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
