# Configuração HTTPS/WSS para Produção

## Visão Geral

O servidor NeuroOne WebSocket suporta conexões seguras HTTPS/WSS quando certificados SSL são configurados. Em desenvolvimento, o servidor roda em HTTP/WS, mas em produção **é obrigatório** usar HTTPS/WSS para segurança.

## Requisitos

- Certificados SSL válidos (recomendado: Let's Encrypt)
- Domínio registrado
- Servidor com acesso SSH (VPS, Cloud)

## Opção 1: Let's Encrypt (Recomendado - Gratuito)

### Passo 1: Instalar Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot
```

### Passo 2: Obter Certificados

```bash
sudo certbot certonly --standalone -d seu-dominio.com.br -d www.seu-dominio.com.br
```

Certificados serão salvos em:
- **Chave privada**: `/etc/letsencrypt/live/seu-dominio.com.br/privkey.pem`
- **Certificado completo**: `/etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem`

### Passo 3: Configurar Variáveis de Ambiente

Edite `.env` no servidor:

```env
SSL_KEY_PATH=/etc/letsencrypt/live/seu-dominio.com.br/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem
```

### Passo 4: Reiniciar Servidor

```bash
pm2 restart neuroone-backend
```

### Renovação Automática

Let's Encrypt certificados expiram a cada 90 dias. Configure renovação automática:

```bash
# Adicionar ao crontab
sudo crontab -e

# Adicionar linha (renova todo dia às 3h da manhã)
0 3 * * * certbot renew --quiet && pm2 restart neuroone-backend
```

## Opção 2: Nginx Reverse Proxy (Recomendado para Produção)

### Vantagens
- Gerenciamento centralizado de SSL
- Load balancing
- Compressão gzip
- Cache estático

### Configuração Nginx

```nginx
# /etc/nginx/sites-available/neuroone

server {
    listen 80;
    server_name seu-dominio.com.br;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com.br;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # WebSocket Configuration
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;

        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for WebSocket
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

### Ativar Configuração

```bash
sudo ln -s /etc/nginx/sites-available/neuroone /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Configurar Backend

Quando usando Nginx como proxy reverso, o backend pode rodar em HTTP:

```env
# .env - Backend roda em HTTP localmente
PORT=3001
# SSL_KEY_PATH e SSL_CERT_PATH não são necessários
```

## Opção 3: Cloudflare SSL (Fácil)

### Vantagens
- Configuração simples
- SSL gratuito
- DDoS protection
- CDN global

### Passos

1. Adicionar domínio ao Cloudflare
2. Atualizar nameservers no registrador
3. Ativar SSL/TLS no Cloudflare Dashboard:
   - SSL/TLS → Overview → **Full (strict)**
4. Configurar Cloudflare Origin Certificate:
   - SSL/TLS → Origin Server → Create Certificate
   - Baixar `cert.pem` e `key.pem`
5. Configurar `.env`:

```env
SSL_KEY_PATH=/caminho/para/key.pem
SSL_CERT_PATH=/caminho/para/cert.pem
```

## Frontend Configuration

Atualizar `.env` no frontend para usar WSS:

```env
# Desenvolvimento
VITE_WS_URL=http://localhost:3001

# Produção
VITE_WS_URL=https://seu-dominio.com.br
```

**IMPORTANTE**: Socket.io detecta automaticamente WSS quando a URL usa `https://`.

## Verificação

### Testar Certificado SSL

```bash
openssl s_client -connect seu-dominio.com.br:443 -servername seu-dominio.com.br
```

### Testar WebSocket Seguro

```javascript
// Console do navegador
const socket = io('https://seu-dominio.com.br', {
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('WSS conectado!');
});
```

## Troubleshooting

### Erro: "EACCES: permission denied"

Certificados Let's Encrypt exigem root. Soluções:

**Opção A**: Copiar certificados para diretório acessível

```bash
sudo cp /etc/letsencrypt/live/seu-dominio.com.br/privkey.pem /home/usuario/certs/
sudo cp /etc/letsencrypt/live/seu-dominio.com.br/fullchain.pem /home/usuario/certs/
sudo chown usuario:usuario /home/usuario/certs/*
```

**Opção B**: Rodar backend como root (NÃO recomendado)

**Opção C**: Usar Nginx reverse proxy (RECOMENDADO)

### Erro: "certificate has expired"

Renovar certificado:

```bash
sudo certbot renew
pm2 restart neuroone-backend
```

## Segurança Adicional

### Rate Limiting (já implementado)

O backend já possui rate limiting. Para HTTPS, adicione rate limiting no Nginx:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location / {
    limit_req zone=api burst=20;
    # ... resto da config
}
```

### HSTS Headers

Adicionar ao Nginx:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3001/tcp  # Backend não deve ser acessível externamente
sudo ufw enable
```

## Custos

- **Let's Encrypt**: Gratuito
- **Cloudflare Free**: Gratuito (com limitações)
- **Nginx**: Gratuito (open-source)
- **Certificado Comercial**: R$ 200-2000/ano (desnecessário)

## Recomendação Final

Para produção do NeuroOne:

1. **Use Nginx como reverse proxy** (melhor performance e flexibilidade)
2. **Certificados Let's Encrypt** (gratuito e confiável)
3. **Renovação automática via crontab**
4. **Backend roda em HTTP localhost** (Nginx faz SSL termination)
5. **Firewall bloqueia porta 3001** (apenas Nginx acessa backend)

Esta configuração é usada por 90% dos apps Node.js em produção.
