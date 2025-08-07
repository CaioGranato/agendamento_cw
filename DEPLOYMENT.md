# Agendamento CW - Production Deployment Guide

## 🚀 Quick Deployment

### Prerequisites
- Docker Swarm enabled
- Traefik reverse proxy configured
- External network `odmaxnet` created
- PostgreSQL database running

### 1. Environment Setup
```bash
# Copy and configure environment variables
cp .env.production.template .env.production
nano .env.production  # Fill with actual values
```

### 2. Deploy Stack
```bash
# Deploy with environment file
docker stack deploy -c docker-compose.production.yml --env-file .env.production agendamento-cw

# Or export variables and deploy
export DATABASE_URL="postgresql://user:pass@postgres:5432/db"
export N8N_WEBHOOK_URL="https://webhookn8n.odtravel.com.br/webhook/your-id"
export N8N_ALERT_WEBHOOK_URL="https://n8n.odtravel.com.br/webhook-test/your-alert-id"
export GEMINI_API_KEY="your-api-key"
export CORS_ORIGIN="https://agendamento.odmax.com.br"

docker stack deploy -c docker-compose.production.yml agendamento-cw
```

### 3. Verify Deployment
```bash
# Check services
docker service ls | grep agendamento-cw

# Check logs
docker service logs agendamento-cw_agendamento-cw-api
docker service logs agendamento-cw_agendamento-cw-frontend

# Health checks
curl https://apiag.odmax.com.br/health
curl https://agendamento.odmax.com.br/health
```

## 🏗️ Architecture Overview

### Services
- **agendamento-cw-api**: Node.js Express API backend
- **agendamento-cw-frontend**: Nginx serving React SPA

### Domains
- **API**: `https://apiag.odmax.com.br`
- **Frontend**: `https://agendamento.odmax.com.br`

### Key Features
- ✅ Health checks for both services
- ✅ Automatic SSL certificates via Traefik
- ✅ Security headers
- ✅ Optimized caching
- ✅ Zero-downtime deployments
- ✅ Resource limits and reservations
- ✅ Auto-restart on failure

## 🔧 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check service status
docker service ps agendamento-cw_agendamento-cw-api --no-trunc

# Check logs
docker service logs agendamento-cw_agendamento-cw-api --tail 50
```

#### Build Fails
- Ensure GitHub repository is accessible
- Check if all required files exist in the repo
- Verify Node.js dependencies in package.json

#### Database Connection Issues
- Verify DATABASE_URL format
- Check if PostgreSQL service is running
- Ensure network connectivity between containers

#### SSL Certificate Issues
- Verify domain DNS points to server
- Check Traefik configuration
- Ensure port 80/443 are accessible

### Scaling
```bash
# Scale API service
docker service scale agendamento-cw_agendamento-cw-api=2

# Scale frontend service  
docker service scale agendamento-cw_agendamento-cw-frontend=2
```

### Updates
```bash
# Force update (pulls latest code)
docker service update --force agendamento-cw_agendamento-cw-api
docker service update --force agendamento-cw_agendamento-cw-frontend
```

### Rolling Back
```bash
# Rollback to previous version
docker service rollback agendamento-cw_agendamento-cw-api
```

## 📊 Monitoring

### Health Endpoints
- API: `https://apiag.odmax.com.br/health`
- Frontend: `https://agendamento.odmax.com.br/health`

### Service Status
```bash
# Watch service status
watch 'docker service ls | grep agendamento-cw'

# Monitor resource usage
docker stats $(docker ps --format "table {{.Names}}" | grep agendamento-cw)
```

## 🔒 Security Notes

1. **Never commit sensitive data** - Use environment variables
2. **Rotate secrets regularly** - Update API keys and passwords
3. **Monitor logs** - Check for suspicious activity
4. **Keep dependencies updated** - Regular security patches
5. **Use HTTPS only** - All traffic encrypted

## 📝 Maintenance

### Regular Tasks
- Monitor resource usage
- Check logs for errors
- Update dependencies
- Backup database
- Monitor SSL certificate expiration

### Performance Optimization
- Enable gzip compression in Nginx
- Implement CDN for static assets
- Add database connection pooling
- Configure Redis for caching