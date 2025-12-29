
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;
const ocppPort = process.env.OCPP_PORT || 9000;

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback for React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = http.createServer(app);

// Simple OCPP WebSocket Server Skeleton
const wss = new WebSocket.Server({ port: ocppPort }, () => {
  console.log(`OCPP WebSocket Server running on port ${ocppPort}`);
});

wss.on('connection', (ws, req) => {
  const chargerId = req.url.substring(1); // Typically ws://server:9000/CHARGER_ID
  console.log(`Charger connected: ${chargerId}`);

  ws.on('message', (message) => {
    console.log(`Received from ${chargerId}: ${message}`);
    // Handle OCPP logic here
    // Example: BootNotification -> [3, "messageId", {"status": "Accepted", "currentTime": "..."}]
  });

  ws.on('close', () => {
    console.log(`Charger disconnected: ${chargerId}`);
  });
});

server.listen(port, () => {
  console.log(`Dashboard Web Server running on port ${port}`);
});
