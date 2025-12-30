
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';

// Import initial mock data
import { MOCK_CHARGERS as initialChargers, MOCK_USERS as initialUsers, MOCK_TRANSACTIONS as initialTransactions, MOCK_LOGS as initialLogs } from './services/mockData.js';

dotenv.config();

// Local state for Mock Mode persistence
let chargersStore = [...initialChargers];
let usersStore = [...initialUsers];
let transactionsStore = [...initialTransactions];
let logsStore = [...initialLogs];

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

if (token && token !== 'PASTE_YOUR_INFLUX_TOKEN') {
  try {
    const influxDB = new InfluxDB({ url: influxUrl, token });
    writeApi = influxDB.getWriteApi(org, bucket, 'ns');
    queryApi = influxDB.getQueryApi(org);
    influxEnabled = true;
    console.log(`📡 TSDB Connected: ${influxUrl}`);
  } catch (e) {
    console.error("⚠️ InfluxDB Connection Failed. Running in Mock Mode.", e.message);
  }
}

/**
 * PERSISTENCE HELPERS
 */
async function saveEntity(measurement, tags, fields) {
  if (!influxEnabled) return;
  try {
    const point = new Point(measurement);
    Object.entries(tags).forEach(([k, v]) => point.tag(k, String(v)));
    Object.entries(fields).forEach(([k, v]) => {
      if (typeof v === 'number') point.floatField(k, v);
      else if (typeof v === 'boolean') point.booleanField(k, v);
      else if (v === null || v === undefined) return;
      else point.stringField(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    });
    writeApi.writePoint(point);
    await writeApi.flush();
  } catch (err) {
    console.error(`Error writing ${measurement} to InfluxDB:`, err);
  }
}

async function getLatestState(measurement, localStore) {
  if (!influxEnabled) return localStore;
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r["_measurement"] == "${measurement}")
      |> last()
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;
  try {
    const rows = await queryApi.collectRows(fluxQuery);
    if (rows.length === 0) return localStore;
    
    return rows.map(row => {
      const parsed = { ...row };
      // Parse specific object fields if they were stringified
      ['location', 'connectors', 'payload'].forEach(field => {
        if (parsed[field] && typeof parsed[field] === 'string') {
          try { parsed[field] = JSON.parse(parsed[field]); } catch(e) {}
        }
      });
      return parsed;
    });
  } catch (e) {
    return localStore;
  }
}

app.use(express.json());
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// DB Status
app.get('/api/system/status', (req, res) => res.json({ 
  influxConnected: influxEnabled, 
  mode: influxEnabled ? 'PRODUCTION' : 'MOCK',
  bucket: bucket
}));

// Charger Endpoints
app.get('/api/chargers', async (req, res) => res.json(await getLatestState('chargers', chargersStore)));

app.post('/api/chargers', async (req, res) => {
  const charger = req.body;
  // Update local memory
  const index = chargersStore.findIndex(c => c.id === charger.id);
  if (index !== -1) chargersStore[index] = { ...chargersStore[index], ...charger };
  else chargersStore.push(charger);
  
  // Update InfluxDB
  await saveEntity('chargers', { id: charger.id }, charger);
  res.status(201).json(charger);
});

app.put('/api/chargers/:id', async (req, res) => {
  const charger = req.body;
  const id = req.params.id;
  
  // Update local memory
  const index = chargersStore.findIndex(c => c.id === id);
  if (index !== -1) chargersStore[index] = { ...chargersStore[index], ...charger };
  
  // Update InfluxDB
  await saveEntity('chargers', { id }, charger);
  res.json(charger);
});

// User Endpoints
app.get('/api/users', async (req, res) => res.json(await getLatestState('users', usersStore)));

app.post('/api/users', async (req, res) => {
  const user = req.body;
  // Update local memory
  const index = usersStore.findIndex(u => u.id === user.id);
  if (index !== -1) usersStore[index] = { ...usersStore[index], ...user };
  else usersStore.push(user);
  
  // Update InfluxDB
  await saveEntity('users', { id: user.id }, user);
  res.status(201).json(user);
});

app.put('/api/users/:id', async (req, res) => {
  const user = req.body;
  const id = req.params.id;
  
  // Update local memory
  const index = usersStore.findIndex(u => u.id === id);
  if (index !== -1) usersStore[index] = { ...usersStore[index], ...user };
  
  // Update InfluxDB
  await saveEntity('users', { id }, user);
  res.json(user);
});

// Other Endpoints
app.get('/api/transactions', async (req, res) => res.json(await getLatestState('transactions', transactionsStore)));
app.get('/api/logs', async (req, res) => res.json(await getLatestState('logs', logsStore)));
app.post('/api/chargers/:id/remote-action', (req, res) => res.json({ status: 'Accepted' }));

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback if dist doesn't exist yet
    res.sendFile(path.resolve(__dirname, 'index.html'));
  }
});

/**
 * OCPP WebSocket Server
 */
const wss = new WebSocketServer({ port: ocppPort, host: '0.0.0.0' }, () => console.log(`🔌 OCPP Server: ${ocppPort}`));
wss.on('connection', (ws, req) => {
  const chargerId = req.url.split('/').pop() || 'Unknown';
  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (Array.isArray(msg) && msg.length >= 4) {
        const [type, id, action, payload] = msg;
        const logEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: new Date().toISOString(),
          direction: 'IN',
          messageType: action,
          payload: payload
        };
        logsStore.unshift(logEntry);
        logsStore = logsStore.slice(0, 100); // Keep last 100
        
        if (influxEnabled) {
          await saveEntity('logs', { chargerId, messageType: action }, { payload });
        }
      }
    } catch (e) {}
  });
});

const server = http.createServer(app);
server.listen(port, '0.0.0.0', () => console.log(`🚀 CMS Dashboard: http://localhost:${port}`));
