#!/bin/bash

echo "🐳 Docker Push Script - Emoji Picker Fix"
echo "==========================================="
echo ""

# Verificar se Docker está rodando
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

echo "✅ Docker está rodando"

# Verificar se a imagem existe
if ! docker image inspect granatocaio/agendamento-cw-frontend:latest > /dev/null 2>&1; then
    echo "❌ Imagem não encontrada. Execute primeiro:"
    echo "docker build -t granatocaio/agendamento-cw-frontend:latest ./chatwoot-message-scheduler"
    exit 1
fi

echo "✅ Imagem encontrada: granatocaio/agendamento-cw-frontend:latest"

# Fazer login no Docker Hub
echo ""
echo "🔐 Fazendo login no Docker Hub..."
if ! docker login --username granatocaio; then
    echo "❌ Falha no login. Verifique suas credenciais."
    exit 1
fi

echo "✅ Login realizado com sucesso"

# Fazer push da imagem
echo ""
echo "📤 Fazendo push da imagem..."
if docker push granatocaio/agendamento-cw-frontend:latest; then
    echo ""
    echo "🎉 SUCCESS! Imagem enviada com sucesso para Docker Hub!"
    echo ""
    echo "🔍 Verificar no Docker Hub:"
    echo "https://hub.docker.com/r/granatocaio/agendamento-cw-frontend/tags"
    echo ""
    echo "🚀 Próximo passo: Atualizar no Portainer"
    echo "1. Acesse seu Portainer"
    echo "2. Vá em Stacks → agendamento-cw → Editor"
    echo "3. Marque 'Re-pull image and redeploy'"
    echo "4. Clique em 'Update the stack'"
    echo ""
    echo "✨ O emoji picker agora abrirá à direita sem ultrapassar os limites!"
else
    echo "❌ Erro no push. Verifique:"
    echo "1. Se você tem permissão no repositório granatocaio/agendamento-cw-frontend"
    echo "2. Se o repositório existe no Docker Hub"
    echo "3. Se suas credenciais estão corretas"
fi