
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const ocppPort = process.env.OCPP_PORT || 9000;

// Production Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback: Routes all requests to index.html for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Create the main HTTP server for the Dashboard
const server = http.createServer(app);

// Create the OCPP WebSocket Server
const wss = new WebSocket.Server({ port: ocppPort }, () => {
  console.log('--------------------------------------------------');
  console.log('⚡ SMART CHARGE - CENTRAL SYSTEM STANDBY');
  console.log(`📡 OCPP WS: ws://localhost:${ocppPort}`);
  console.log(`🌐 CMS WEB: http://localhost:${port}`);
  console.log('--------------------------------------------------');
});

wss.on('connection', (ws, req) => {
  const chargerId = req.url.substring(1) || 'Unknown-Station';
  console.log(`[OCPP] New Connection Request: ${chargerId} from ${req.socket.remoteAddress}`);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[OCPP][IN][${chargerId}]`, JSON.stringify(message));
      
      // Simple OCPP 1.6 BootNotification Mock Response
      if (message[2] === 'BootNotification') {
        const response = [3, message[1], {
          status: 'Accepted',
          currentTime: new Date().toISOString(),
          interval: 300
        }];
        ws.send(JSON.stringify(response));
        console.log(`[OCPP][OUT][${chargerId}] Accepted BootNotification`);
      }
    } catch (e) {
      console.error(`[OCPP][ERR][${chargerId}] Invalid Message Frame`);
    }
  });

  ws.on('close', () => {
    console.log(`[OCPP] Charger Disconnected: ${chargerId}`);
  });
});

server.listen(port, () => {
  console.log(`Dashboard serving from: /var/www/smart-charge/dist`);
});
