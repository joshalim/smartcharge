
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const ocppPort = process.env.OCPP_PORT || 9000;

/**
 * INFLUXDB v2 ENGINE
 */
const influxUrl = process.env.INFLUX_URL || 'http://localhost:8086';
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG || 'smartcharge';
const bucket = process.env.INFLUX_BUCKET || 'smartcharge_bucket';

if (!token) {
  console.error("❌ ERROR: INFLUX_TOKEN is missing. Application cannot persist data.");
}

const influxDB = new InfluxDB({ url: influxUrl, token });
const writeApi = influxDB.getWriteApi(org, bucket);
const queryApi = influxDB.getQueryApi(org);

console.log(`📡 TSDB Connected: ${influxUrl} (Bucket: ${bucket})`);

/**
 * DATA RETRIEVAL
 */
async function getLatestState(measurement) {
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r["_measurement"] == "${measurement}")
      |> last()
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;
  try {
    return await queryApi.collectRows(fluxQuery);
  } catch (e) {
    console.error(`[TSDB][QUERY_ERR] ${measurement}:`, e.message);
    return [];
  }
}

/**
 * MIDDLEWARE & ROUTES
 */
app.use(express.json());

// Serve static files from the 'dist' directory created by 'npm run build'
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// API: List Chargers
app.get('/api/chargers', async (req, res) => {
  try {
    const chargers = await getLatestState('chargers');
    const pricing = await getLatestState('charger_pricing');
    
    const enriched = chargers.map(c => {
      const p = pricing.find(item => item.chargerId === c.id);
      return {
        ...c,
        connectors: p ? [{
          connectorId: 1,
          pricePerKwh: p.pricePerKwh,
          pricePerMinute: p.pricePerMinute,
          status: c.status
        }] : [{ connectorId: 1, pricePerKwh: 1000, pricePerMinute: 0, status: c.status }]
      };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Transactions
app.get('/api/transactions', async (req, res) => {
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r["_measurement"] == "transactions")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 50)
  `;
  try {
    const rows = await queryApi.collectRows(fluxQuery);
    res.json(rows);
  } catch (e) {
    res.json([]);
  }
});

// Fallback to index.html for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

/**
 * OCPP 1.6J WebSocket Server
 */
const wss = new WebSocket.Server({ port: ocppPort }, () => {
  console.log(`🔌 OCPP Server listening on port ${ocppPort}`);
});

wss.on('connection', (ws, req) => {
  // Extract Charger ID from URL: /ocpp/CP_001
  const chargerId = req.url.split('/').pop() || 'Unknown';
  console.log(`[OCPP][CONN] Charger attached: ${chargerId}`);

  // Update TSDB status
  const bootPoint = new Point('chargers')
    .tag('id', chargerId)
    .stringField('status', 'Available')
    .stringField('lastHeartbeat', new Date().toISOString());
  writeApi.writePoint(bootPoint);

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const [type, id, action, payload] = msg;

      // Log all messages to TSDB
      const logPoint = new Point('logs')
        .tag('chargerId', chargerId)
        .tag('direction', 'IN')
        .tag('messageType', action || 'Response')
        .stringField('payload', JSON.stringify(payload || msg[2]));
      writeApi.writePoint(logPoint);

      // Simple OCPP 1.6 Response Logic
      if (action === 'BootNotification') {
        ws.send(JSON.stringify([3, id, {
          status: 'Accepted',
          currentTime: new Date().toISOString(),
          interval: 300
        }]));
      } else if (action === 'Heartbeat') {
        ws.send(JSON.stringify([3, id, { currentTime: new Date().toISOString() }]));
      }

      await writeApi.flush();
    } catch (e) {
      console.error(`[OCPP][ERR][${chargerId}]`, e.message);
    }
  });

  ws.on('close', () => {
    console.log(`[OCPP][DISC] Charger offline: ${chargerId}`);
    const offlinePoint = new Point('chargers')
      .tag('id', chargerId)
      .stringField('status', 'Unavailable');
    writeApi.writePoint(offlinePoint);
  });
});

/**
 * START DASHBOARD SERVER
 */
const server = http.createServer(app);
server.listen(port, () => {
  console.log(`🚀 CMS Dashboard active at http://localhost:${port}`);
});
