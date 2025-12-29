
# SMART Charge - Local Server Installation

This guide details how to install and configure the SMART Charge OCPP Central System on a fresh Ubuntu Linux server.

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
*Save the token securely. You will need it for the `.env` file.*

## 🌐 Phase 3: Nginx Proxy Configuration
Nginx acts as the entry point. It routes browser traffic to the dashboard and charger traffic to the OCPP server.

Create the config:
`sudo nano /etc/nginx/sites-available/smartcharge`

Paste this configuration:
```nginx
server {
    listen 80;
    server_name your-domain-or-ip.com;

    # Frontend Dashboard & API (Moved to 3080 to avoid Grafana conflict)
    location / {
        proxy_pass http://localhost:3080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # OCPP 1.6J WebSocket (Chargers)
    # Target URL for chargers: ws://your-ip/ocpp/CHARGER_ID
    location /ocpp {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```
Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/smartcharge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## ⚙️ Phase 4: App Deployment
1. Clone your repository to `/var/www/smartcharge`.
2. Create `.env`:
```env
PORT=3080
OCPP_PORT=9000
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=PASTE_YOUR_INFLUX_TOKEN
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
pm2 startup
```

## 📊 Phase 5: Grafana Setup
1. Open `http://YOUR_SERVER_IP:3000` (Default login: `admin`/`admin`).
2. Add Data Source -> **InfluxDB**.
3. Query Language: **Flux**.
4. URL: `http://localhost:8086`.
5. Basic Auth: Off.
6. Organization: `smartcharge`.
7. Token: `YOUR_INFLUX_TOKEN`.
8. Default Bucket: `smartcharge_bucket`.

---
**Security Note:** For production, always run `sudo certbot --nginx` to enable HTTPS and WSS (WebSocket Secure).
