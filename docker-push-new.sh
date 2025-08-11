#!/bin/bash

echo "🔨 Building API image..."
cd api
docker build -t granatocaio/agendamento-cw-api:latest .

echo "🔨 Building Frontend image..."  
cd ../chatwoot-message-scheduler
docker build -t granatocaio/agendamento-cw-frontend:latest .

echo "🚀 Pushing API image..."
cd ..
docker push granatocaio/agendamento-cw-api:latest

echo "🚀 Pushing Frontend image..."
docker push granatocaio/agendamento-cw-frontend:latest

echo "✅ Done! Images pushed successfully."