
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { WebSocketServer } from 'ws';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import dotenv from 'dotenv';

// Import mock data for failover if DB is empty
import { MOCK_CHARGERS, MOCK_USERS, MOCK_TRANSACTIONS, MOCK_LOGS } from './services/mockData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3080;
const ocppPort = process.env.OCPP_PORT || 9000;

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
} else {
  console.warn("⚠️ INFLUX_TOKEN missing. Running in Mock Mode (Data won't persist).");
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
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// API: List Chargers
app.get('/api/chargers', async (req, res) => {
  try {
    const chargers = await getLatestState('chargers', MOCK_CHARGERS);
    res.json(chargers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: List Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await getLatestState('users', MOCK_USERS);
    res.json(users);
  } catch (err) {
    res.json(MOCK_USERS);
  }
});

// API: Transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const txs = await getLatestState('transactions', MOCK_TRANSACTIONS);
    res.json(txs);
  } catch (e) {
    res.json(MOCK_TRANSACTIONS);
  }
});

// API: Logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await getLatestState('logs', MOCK_LOGS);
    res.json(logs);
  } catch (e) {
    res.json(MOCK_LOGS);
  }
});

// API: Remote Actions (Start/Reset)
app.post('/api/chargers/:id/remote-action', (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  console.log(`[CMD] Sending ${action} to ${id}`);
  
  // In a real implementation, we would find the WebSocket for this charger and send the message
  // For now, we simulate success
  res.json({ status: 'Accepted', message: `Remote ${action} initiated` });
});

// API: Pricing Updates
app.post('/api/chargers/:id/pricing', (req, res) => {
  const { id } = req.params;
  const { connectors } = req.body;
  
  if (influxEnabled) {
    connectors.forEach(c => {
      const p = new Point('charger_pricing')
        .tag('chargerId', id)
        .tag('connectorId', c.connectorId.toString())
        .floatField('pricePerKwh', c.pricePerKwh)
        .floatField('pricePerMinute', c.pricePerMinute);
      writeApi.writePoint(p);
    });
    writeApi.flush();
  }
  res.json({ success: true });
});

// API: Payment Intent Simulation
app.post('/api/payments/create-intent', (req, res) => {
  const { userId, amount } = req.body;
  res.json({ paymentId: `PAY-${Math.random().toString(36).substr(2, 9)}`, amount });
});

app.post('/api/payments/verify', (req, res) => {
  res.json({ status: 'approved' });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

/**
 * OCPP 1.6J WebSocket Server
 */
const wss = new WebSocketServer({ port: ocppPort }, () => {
  console.log(`🔌 OCPP Server listening on port ${ocppPort}`);
});

wss.on('connection', (ws, req) => {
  const chargerId = req.url.split('/').pop() || 'Unknown';
  console.log(`[OCPP][CONN] Charger attached: ${chargerId}`);

  if (influxEnabled) {
    const bootPoint = new Point('chargers')
      .tag('id', chargerId)
      .stringField('status', 'Available')
      .stringField('lastHeartbeat', new Date().toISOString());
    writeApi.writePoint(bootPoint);
  }

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log(`[OCPP][MSG][${chargerId}]`, JSON.stringify(msg));

      if (influxEnabled) {
        const logPoint = new Point('logs')
          .tag('chargerId', chargerId)
          .tag('direction', 'IN')
          .tag('messageType', msg[2] || 'Response')
          .stringField('payload', JSON.stringify(msg));
        writeApi.writePoint(logPoint);
        writeApi.flush();
      }

      // Simple Auto-Responder for Boot and Heartbeat
      const [type, id, action] = msg;
      if (action === 'BootNotification') {
        ws.send(JSON.stringify([3, id, { status: 'Accepted', currentTime: new Date().toISOString(), interval: 300 }]));
      } else if (action === 'Heartbeat') {
        ws.send(JSON.stringify([3, id, { currentTime: new Date().toISOString() }]));
      }
    } catch (e) {
      console.error(`[OCPP][ERR]`, e.message);
    }
  });
});

const server = http.createServer(app);
server.listen(port, () => {
  console.log(`🚀 CMS Dashboard active at http://localhost:${port}`);
});
