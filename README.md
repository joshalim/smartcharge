# SMART Charge - Industrial OCPP Central System

A robust, high-performance EV charging management system (CMS) optimized for Ubuntu Server. This system uses **InfluxDB 3.0 (IOx)** architecture for telemetry and **Grafana** for professional-grade visualization.

---

## 🛠️ Full Installation Workflow

### 1. Automated System Setup
Download the provided `setup.sh` and run it to prepare your Ubuntu environment:
```bash
chmod +x setup.sh
./setup.sh
```

### 2. InfluxDB Initialization
You must set up your initial organization and bucket. InfluxDB 3.0 API is fully compatible with the v2 CLI:
```bash
influx setup \
  --org smartcharge \
  --bucket smartcharge_bucket \
  --username admin \
  --password YOUR_SECURE_PASSWORD \
  --token YOUR_PERMANENT_TOKEN \
  --force
```
*Save the **Token** for your `.env` file.*

### 3. Configure Grafana (Embedding)
The dashboard UI embeds Grafana via iframe. You must allow this in the config:
1. `sudo nano /etc/grafana/grafana.ini`
2. Change `;allow_embedding = false` to `allow_embedding = true`.
3. Restart: `sudo systemctl restart grafana-server`.

### 4. Nginx Reverse Proxy (OCPP + UI)
To run on port 80 and handle OCPP WebSockets securely:
`sudo nano /etc/nginx/sites-available/smartcharge`

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend Dashboard & API
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # OCPP 1.6J WebSocket (Chargers connect to ws://your-domain.com/ocpp)
    location /ocpp {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```
`sudo ln -s /etc/nginx/sites-available/smartcharge /etc/nginx/sites-enabled/`
`sudo systemctl restart nginx`

### 5. Application Launch
```bash
npm install
npm run build
pm2 start server.js --name "smart-charge"
pm2 save
```

---

## 🛡️ Firewall (UFW)
Open the required ports:
```bash
sudo ufw allow 80/tcp    # HTTP (Nginx)
sudo ufw allow 9000/tcp  # OCPP Direct (if not using Nginx)
sudo ufw allow 3000/tcp  # Dashboard Direct (if not using Nginx)
```

## 🧠 AI Analyst
The system uses **Gemini 3 Pro** via `@google/genai`. 
- Ensure `process.env.API_KEY` is set in your `.env`.
- The AI analyzes raw OCPP logs stored in InfluxDB to predict component failure.

## 💳 Payment Gateway
Supports Nequi, PayPal, and Bre-B. Configuration is available in the **Settings** tab of the dashboard.

## License
MIT