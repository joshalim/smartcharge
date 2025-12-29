
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
 * INFLUXDB v2 CONFIGURATION
 */
const url = process.env.INFLUX_URL || 'http://localhost:8086';
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG || 'smartcharge';
const bucket = process.env.INFLUX_BUCKET || 'smartcharge_bucket';

// Initial verification
if (!token) {
  console.warn("⚠️  WARNING: INFLUX_TOKEN is missing in .env. Persistence will fail.");
}

const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket);
const queryApi = influxDB.getQueryApi(org);

console.log(`✅ InfluxDB 2.x Engine Connected [Bucket: ${bucket}]`);

async function getLatestState(measurement, tagKey = 'id') {
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
    console.error(`Error querying ${measurement}:`, e.message);
    return [];
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// API Endpoints
app.get('/api/chargers', async (req, res) => {
  try {
    const chargers = await getLatestState('chargers');
    const pricingData = await getLatestState('charger_pricing', 'chargerId');
    
    const enriched = chargers.map(c => {
      const pricing = pricingData.filter(p => p.chargerId === c.id);
      return {
        ...c,
        connectors: pricing.length > 0 ? pricing.map(p => ({
          connectorId: parseInt(p.connectorId),
          pricePerKwh: p.pricePerKwh,
          pricePerMinute: p.pricePerMinute,
          status: c.status 
        })) : [{ connectorId: 1, pricePerKwh: 1000, pricePerMinute: 0, status: c.status }]
      };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chargers" });
  }
});

app.post('/api/chargers/:id/remote-action', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  try {
    const logPoint = new Point('logs')
      .tag('chargerId', id)
      .tag('direction', 'OUT')
      .tag('messageType', action === 'reset' ? 'Reset' : 'RemoteStartTransaction')
      .stringField('payload', JSON.stringify({ 
        type: action === 'reset' ? 'Soft' : 'Start',
        timestamp: new Date().toISOString()
      }));

    if (action === 'reset') {
       const chargerPoint = new Point('chargers')
         .tag('id', id)
         .stringField('status', 'Available');
       writeApi.writePoint(chargerPoint);
    }

    writeApi.writePoint(logPoint);
    await writeApi.flush();
    res.json({ success: true, message: `Command ${action} sent to ${id}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    const txs = await queryApi.collectRows(fluxQuery);
    res.json(txs);
  } catch (e) {
    res.json([]);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = http.createServer(app);

// OCPP WebSocket Server
const wss = new WebSocket.Server({ port: ocppPort }, () => {
  console.log(`📡 OCPP WebSocket Server running on port ${ocppPort}`);
});

wss.on('connection', async (ws, req) => {
  const rawPath = req.url;
  const chargerId = rawPath.replace('/ocpp/', '').replace('/', '') || 'Unknown-Station';
  
  console.log(`[OCPP] Connection request for ID: ${chargerId}`);
  
  const regPoint = new Point('chargers')
    .tag('id', chargerId)
    .stringField('status', 'Available')
    .stringField('lastHeartbeat', new Date().toISOString());
  writeApi.writePoint(regPoint);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      const [type, id, action, payload] = message;
      
      const logPoint = new Point('logs')
        .tag('chargerId', chargerId)
        .tag('direction', 'IN')
        .tag('messageType', action || 'Unknown')
        .stringField('payload', JSON.stringify(payload || message[2]));
      writeApi.writePoint(logPoint);

      if (action === 'BootNotification') {
        const response = [3, id, {
          status: 'Accepted',
          currentTime: new Date().toISOString(),
          interval: 300
        }];
        ws.send(JSON.stringify(response));
      }
      
      if (action === 'Heartbeat') {
        ws.send(JSON.stringify([3, id, { currentTime: new Date().toISOString() }]));
      }

      await writeApi.flush();
    } catch (e) {
      console.error(`[OCPP][ERR][${chargerId}]`, e.message);
    }
  });
});

server.listen(port, () => {
  console.log(`🚀 Management Dashboard API: http://localhost:${port}`);
});
