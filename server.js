
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';

// Import mock data for failover
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
      else point.stringField(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    });
    writeApi.writePoint(point);
    await writeApi.flush();
  } catch (err) {
    console.error(`Error writing ${measurement} to InfluxDB:`, err);
  }
}

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
    if (rows.length === 0) return mockData;
    return rows.map(row => ({
      ...row,
      id: row.id || row.chargerId,
      location: row.location ? JSON.parse(row.location) : (mockData.find(m => m.id === (row.id || row.chargerId))?.location || { address: 'Unknown' }),
      connectors: row.connectors ? JSON.parse(row.connectors) : (mockData.find(m => m.id === (row.id || row.chargerId))?.connectors || [])
    }));
  } catch (e) {
    return mockData;
  }
}

app.use(express.json());
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// DB Status
app.get('/api/system/status', (req, res) => res.json({ influxConnected: influxEnabled, mode: influxEnabled ? 'PRODUCTION' : 'MOCK' }));

// Charger Endpoints
app.get('/api/chargers', async (req, res) => res.json(await getLatestState('chargers', MOCK_CHARGERS)));
app.post('/api/chargers', async (req, res) => {
  const charger = req.body;
  await saveEntity('chargers', { id: charger.id }, charger);
  res.status(201).json(charger);
});
app.put('/api/chargers/:id', async (req, res) => {
  const charger = req.body;
  await saveEntity('chargers', { id: req.params.id }, charger);
  res.json(charger);
});

// User Endpoints
app.get('/api/users', async (req, res) => res.json(await getLatestState('users', MOCK_USERS)));
app.post('/api/users', async (req, res) => {
  const user = req.body;
  await saveEntity('users', { id: user.id }, user);
  res.status(201).json(user);
});
app.put('/api/users/:id', async (req, res) => {
  const user = req.body;
  await saveEntity('users', { id: req.params.id }, user);
  res.json(user);
});

// Other Endpoints
app.get('/api/transactions', async (req, res) => res.json(await getLatestState('transactions', MOCK_TRANSACTIONS)));
app.get('/api/logs', async (req, res) => res.json(await getLatestState('logs', MOCK_LOGS)));
app.post('/api/chargers/:id/remote-action', (req, res) => res.json({ status: 'Accepted' }));

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(fs.existsSync(indexPath) ? indexPath : path.resolve(__dirname, 'index.html'));
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
        if (influxEnabled) {
          const point = new Point('logs').tag('chargerId', chargerId).tag('messageType', action).stringField('payload', JSON.stringify(payload)).timestamp(new Date());
          writeApi.writePoint(point);
          await writeApi.flush();
        }
      }
    } catch (e) {}
  });
});

const server = http.createServer(app);
server.listen(port, '0.0.0.0', () => console.log(`🚀 CMS Dashboard: http://localhost:${port}`));
