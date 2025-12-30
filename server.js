
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';

// Import mock data (Ensure this file is .js for Node compatibility)
import { MOCK_CHARGERS, MOCK_USERS, MOCK_TRANSACTIONS, MOCK_LOGS } from './services/mockData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3080', 10);
const ocppPort = parseInt(process.env.OCPP_PORT || '9000', 10);

/**
 * INFLUXDB v2 ENGINE
 */
const influxUrl = process.env.INFLUX_URL || 'http://localhost:8086';
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG || 'smartcharge';
const bucket = process.env.INFLUX_BUCKET || 'smartcharge_bucket';

let influxEnabled = false;
let writeApi, queryApi;

if (token) {
  try {
    const influxDB = new InfluxDB({ url: influxUrl, token });
    writeApi = influxDB.getWriteApi(org, bucket);
    queryApi = influxDB.getQueryApi(org);
    influxEnabled = true;
    console.log(`📡 TSDB Connected: ${influxUrl}`);
  } catch (e) {
    console.error("⚠️ InfluxDB Connection Failed. Running in Mock Mode.");
  }
}

/**
 * DATA RETRIEVAL HELPERS
 */
async function getLatestState(measurement, mockData) {
  if (!influxEnabled) return mockData;
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r["_measurement"] == "${measurement}")
      |> last()
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;
  try {
    const rows = await queryApi.collectRows(fluxQuery);
    return rows.length > 0 ? rows : mockData;
  } catch (e) {
    return mockData;
  }
}

/**
 * EXPRESS API ROUTES
 */
app.use(express.json());

// Verify dist directory
const distPath = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.warn(`❌ WARNING: 'dist' folder not found at ${distPath}. Run 'npm run build'`);
}

// Static files
app.use(express.static(distPath));

// API Endpoints
app.get('/api/chargers', async (req, res) => {
  try {
    const chargers = await getLatestState('chargers', MOCK_CHARGERS);
    res.json(chargers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await getLatestState('users', MOCK_USERS);
    res.json(users);
  } catch (err) {
    res.json(MOCK_USERS);
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const txs = await getLatestState('transactions', MOCK_TRANSACTIONS);
    res.json(txs);
  } catch (e) {
    res.json(MOCK_TRANSACTIONS);
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await getLatestState('logs', MOCK_LOGS);
    res.json(logs);
  } catch (e) {
    res.json(MOCK_LOGS);
  }
});

app.post('/api/chargers/:id/remote-action', (req, res) => {
  res.json({ status: 'Accepted', message: `Remote action initiated` });
});

// Catch-all
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Frontend build not found. Please run 'npm run build'.");
  }
});

/**
 * OCPP WebSocket Server
 */
const wss = new WebSocketServer({ port: ocppPort, host: '0.0.0.0' }, () => {
  console.log(`🔌 OCPP Server listening on 0.0.0.0:${ocppPort}`);
});

wss.on('connection', (ws, req) => {
  const chargerId = req.url.split('/').pop() || 'Unknown';
  console.log(`[OCPP][CONN] Charger attached: ${chargerId}`);
  ws.on('message', (data) => console.log(`[OCPP][MSG] ${chargerId}: ${data}`));
});

const server = http.createServer(app);

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`❌ ERROR: Port ${port} is already in use. Check for other running instances.`);
    process.exit(1);
  } else {
    console.error("❌ Server Error:", e);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 CMS Dashboard active at http://0.0.0.0:${port}`);
  console.log(`📂 Serving static files from: ${distPath}`);
});
