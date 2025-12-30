
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
} else {
  console.log("ℹ️ InfluxDB token missing or default. Operating in MOCK mode.");
}

/**
 * PERSISTENCE HELPERS
 */
async function saveOcppEvent(chargerId, messageType, payload) {
  if (!influxEnabled) return;

  try {
    const point = new Point('logs')
      .tag('chargerId', chargerId)
      .tag('messageType', messageType)
      .stringField('payload', JSON.stringify(payload))
      .timestamp(new Date());
    
    writeApi.writePoint(point);

    // If it's a status or meter value, update the charger state too
    if (messageType === 'StatusNotification') {
       const chargerPoint = new Point('chargers')
        .tag('id', chargerId)
        .stringField('status', payload.status)
        .intField('connectorId', payload.connectorId || 1)
        .timestamp(new Date());
       writeApi.writePoint(chargerPoint);
    }

    if (messageType === 'MeterValues') {
      // Simplistic parsing of meter values
      const power = payload.meterValue?.[0]?.sampledValue?.find(v => v.measurand === 'Power.Active.Import')?.value || 0;
      const energy = payload.meterValue?.[0]?.sampledValue?.find(v => v.measurand === 'Energy.Active.Import.Register')?.value || 0;
      
      const meterPoint = new Point('chargers')
        .tag('id', chargerId)
        .floatField('currentPower', parseFloat(power))
        .floatField('totalEnergy', parseFloat(energy))
        .timestamp(new Date());
      writeApi.writePoint(meterPoint);
    }

    await writeApi.flush();
  } catch (err) {
    console.error("Error writing to InfluxDB:", err);
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
    
    // Map Influx rows back to frontend types if necessary
    return rows.map(row => ({
      ...row,
      id: row.id || row.chargerId, // Handle varying tag names
      location: row.location ? JSON.parse(row.location) : (mockData.find(m => m.id === row.id)?.location || { address: 'Unknown' }),
      connectors: row.connectors ? JSON.parse(row.connectors) : (mockData.find(m => m.id === row.id)?.connectors || [])
    }));
  } catch (e) {
    console.warn(`Query failed for ${measurement}, using mocks.`);
    return mockData;
  }
}

/**
 * EXPRESS API ROUTES
 */
app.use(express.json());

const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// DB Status Endpoint
app.get('/api/system/status', (req, res) => {
  res.json({
    influxConnected: influxEnabled,
    influxUrl: influxUrl,
    bucket: bucket,
    mode: influxEnabled ? 'PRODUCTION' : 'MOCK'
  });
});

app.get('/api/chargers', async (req, res) => {
  const data = await getLatestState('chargers', MOCK_CHARGERS);
  res.json(data);
});

app.get('/api/users', async (req, res) => {
  const data = await getLatestState('users', MOCK_USERS);
  res.json(data);
});

app.get('/api/transactions', async (req, res) => {
  const data = await getLatestState('transactions', MOCK_TRANSACTIONS);
  res.json(data);
});

app.get('/api/logs', async (req, res) => {
  const data = await getLatestState('logs', MOCK_LOGS);
  res.json(data);
});

app.post('/api/chargers/:id/remote-action', (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  console.log(`[OCPP][CMD] Sending ${action} to ${id}`);
  res.json({ status: 'Accepted', message: `Remote ${action} initiated for ${id}` });
});

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
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      // OCPP 1.6J Message format: [MessageTypeId, UniqueId, Action, Payload]
      if (Array.isArray(message) && message.length >= 4) {
        const [type, id, action, payload] = message;
        console.log(`[OCPP][MSG] ${chargerId} -> ${action}`);
        await saveOcppEvent(chargerId, action, payload);
      }
    } catch (e) {
      console.error(`[OCPP][ERR] Failed to parse message from ${chargerId}:`, e.message);
    }
  });

  ws.on('close', () => console.log(`[OCPP][DISC] Charger detached: ${chargerId}`));
});

const server = http.createServer(app);
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 CMS Dashboard active at http://0.0.0.0:${port}`);
});
