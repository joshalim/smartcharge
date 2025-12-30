
# SMART Charge - Local Server Installation

This guide details how to install and configure the SMART Charge OCPP Central System on a fresh Ubuntu Linux server with full security.

## 🛠️ Phase 1: Dependency Installation
Run the automated setup script to install Node.js, InfluxDB, Grafana, and Nginx.
```bash
chmod +x setup.sh
sudo ./setup.sh
```

## 🗄️ Phase 2: InfluxDB v2 Configuration
You must initialize the database to get your security token:
```bash
influx setup \
  --org smartcharge \
  --bucket smartcharge_bucket \
  --username admin \
  --password YOUR_SECURE_PASSWORD \
  --token YOUR_ADMIN_TOKEN \
  --force
```

## 🌐 Phase 3: Nginx Proxy Configuration
Nginx acts as the entry point. It handles SSL and routes traffic.

Create the config:
`sudo nano /etc/nginx/sites-available/smartcharge`

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend & API
    location / {
        proxy_pass http://localhost:3080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # OCPP 1.6J WebSocket
    location /ocpp {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }
}
```

## 🔒 Phase 4: SSL/TLS Security with Certbot
To enable HTTPS (dashboard) and WSS (chargers), run:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```
*Certbot will automatically update your Nginx config with SSL paths.*

## ⚙️ Phase 5: App Deployment
1. Clone your repository to `/var/www/smartcharge`.
2. Create `.env`:
```env
PORT=3080
OCPP_PORT=9000
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=YOUR_INFLUX_TOKEN
INFLUX_ORG=smartcharge
INFLUX_BUCKET=smartcharge_bucket
API_KEY=YOUR_GEMINI_API_KEY
```
3. Install and build:
```bash
npm install
npm run build
```
4. Start with PM2:
```bash
pm2 start server.js --name "smart-charge"
pm2 save
```

## 📊 Phase 6: Grafana Setup
1. Open `https://your-domain.com:3000` (Default: `admin`/`admin`).
2. Add InfluxDB Data Source (Language: Flux, URL: `http://localhost:8086`).
3. Use your generated Token and Org `smartcharge`.

---
**OCPP Connection URL:** `wss://your-domain.com/ocpp/CHARGER_ID`
