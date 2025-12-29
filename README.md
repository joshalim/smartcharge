# SMART Charge - Production Deployment Guide (InfluxDB v2)

This guide provides the exact commands needed to host the OCPP Central System and Dashboard on a standard Ubuntu Linux server using InfluxDB v2 OSS.

## 🏗️ 1. Initial Server Setup
Upload the `setup.sh` script to your server and run:
```bash
chmod +x setup.sh
sudo ./setup.sh
```

## 🗄️ 2. Database Initialization (v2 Standard)
Once InfluxDB is installed, run the setup wizard to generate your token:
```bash
influx setup \
  --org smartcharge \
  --bucket smartcharge_bucket \
  --username admin \
  --password YOUR_SECURE_PASSWORD \
  --token YOUR_PERMANENT_TOKEN \
  --force
```
*Note: Save your token; you will need it for the `.env` file.*

## 🌐 3. Nginx Reverse Proxy (Critical for OCPP)
Create a new site configuration:
`sudo nano /etc/nginx/sites-available/smartcharge`

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

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
Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/smartcharge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## ⚙️ 4. Environment Configuration
Create a `.env` file in the root of the project:
```env
PORT=3000
OCPP_PORT=9000
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=PASTE_YOUR_GENERATED_V2_TOKEN
INFLUX_ORG=smartcharge
INFLUX_BUCKET=smartcharge_bucket
API_KEY=YOUR_GEMINI_API_KEY
```

## 🚀 5. Launch Application
```bash
npm install
npm run build
pm2 start server.js --name "smart-charge"
pm2 save
pm2 startup
```

## 📊 6. Grafana Data Source
1. Login to Grafana at `http://YOUR_IP:3000` (Default: admin/admin).
2. Go to **Connections > Data Sources > Add data source**.
3. Select **InfluxDB**.
4. Query Language: **Flux**.
5. URL: `http://localhost:8086`.
6. Organization: `smartcharge`.
7. Token: `YOUR_V2_TOKEN`.
8. Default Bucket: `smartcharge_bucket`.

---
**Troubleshooting:** If the backend cannot connect, ensure InfluxDB is running with `sudo systemctl status influxdb`.
