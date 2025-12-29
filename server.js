
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
 * INFLUXDB 3.0 (IOx) CONFIGURATION
 * Optimized for high-frequency EV telemetry
 */
const url = process.env.INFLUX_URL || 'http://localhost:8086';
const token = process.env.INFLUX_TOKEN || 'your-super-secret-token';
const org = process.env.INFLUX_ORG || 'smartcharge';
const bucket = process.env.INFLUX_BUCKET || 'smartcharge_bucket';

// For InfluxDB 3.0 Serverless/Dedicated, use standard Flight SQL for complex queries if needed.
// For writes and simple Flux, the standard client remains highly efficient.
const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket);
const queryApi = influxDB.getQueryApi(org);

console.log(`✅ InfluxDB 3.0 Engine Connected [Bucket: ${bucket}]`);

// Helper to query latest state of entities
async function getLatestState(measurement, tagKey = 'id') {
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r["_measurement"] == "${measurement}")
      |> last()
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;
  
  try {
    const rows = await queryApi.collectRows(fluxQuery);
    return rows;
  } catch (e) {
    console.error(`Error querying ${measurement}:`, e.message);
    return [];
  }
}

// Production Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// API Endpoints
app.get('/api/chargers', async (req, res) => {
  const chargers = await getLatestState('chargers');
  res.json(chargers);
});

app.get('/api/users', async (req, res) => {
  const users = await getLatestState('users');
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  try {
    const id = `USR-${Math.floor(Math.random() * 1000)}`;
    const { name, email, phoneNumber, placa, cedula, rfidTag, rfidExpiration } = req.body;
    
    const point = new Point('users')
      .tag('id', id)
      .tag('rfidTag', rfidTag)
      .stringField('name', name)
      .stringField('email', email)
      .stringField('phoneNumber', phoneNumber)
      .stringField('placa', placa)
      .stringField('cedula', cedula)
      .stringField('rfidExpiration', rfidExpiration)
      .stringField('status', 'Active')
      .floatField('balance', 0);
    
    writeApi.writePoint(point);
    await writeApi.flush();
    res.json({ id, ...req.body, status: 'Active', balance: 0 });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const point = new Point('users').tag('id', id);
    Object.entries(req.body).forEach(([key, value]) => {
      if (typeof value === 'number') point.floatField(key, value);
      else point.stringField(key, String(value));
    });
    writeApi.writePoint(point);
    await writeApi.flush();
    res.json({ id, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
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
  const txs = await queryApi.collectRows(fluxQuery);
  res.json(txs);
});

app.get('/api/logs', async (req, res) => {
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -24h)
      |> filter(fn: (r) => r["_measurement"] == "logs")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 100)
  `;
  const logs = await queryApi.collectRows(fluxQuery);
  res.json(logs);
});

app.post('/api/users/topup', async (req, res) => {
  const { userId, amount } = req.body;
  const users = await getLatestState('users');
  const user = users.find(u => u.id === userId);
  const newBalance = (user?.balance || 0) + amount;
  
  const point = new Point('users')
    .tag('id', userId)
    .floatField('balance', newBalance);
  
  writeApi.writePoint(point);
  await writeApi.flush();
  res.json({ userId, balance: newBalance });
});

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = http.createServer(app);

// OCPP WebSocket Server
const wss = new WebSocket.Server({ port: ocppPort }, () => {
  console.log('--------------------------------------------------');
  console.log('⚡ SMART CHARGE - CENTRAL SYSTEM (INFLUXDB 3.0)');
  console.log(`📡 OCPP WS: ws://localhost:${ocppPort}`);
  console.log('--------------------------------------------------');
});

wss.on('connection', async (ws, req) => {
  const chargerId = req.url.substring(1) || 'Unknown-Station';
  console.log(`[OCPP] New Connection: ${chargerId}`);

  // Register charger presence
  const regPoint = new Point('chargers')
    .tag('id', chargerId)
    .stringField('status', 'Available')
    .stringField('lastHeartbeat', new Date().toISOString());
  writeApi.writePoint(regPoint);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      const [type, id, action, payload] = message;

      // Log Message
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
        
        const chargerPoint = new Point('chargers')
          .tag('id', chargerId)
          .stringField('status', 'Available')
          .stringField('model', payload.chargePointModel)
          .stringField('firmware', payload.firmwareVersion);
        writeApi.writePoint(chargerPoint);
      }

      if (action === 'StatusNotification') {
        const { status } = payload;
        const statusPoint = new Point('chargers')
          .tag('id', chargerId)
          .stringField('status', status);
        writeApi.writePoint(statusPoint);
      }

      if (action === 'Authorize') {
        const { idTag } = payload;
        const fluxQuery = `
          from(bucket: "${bucket}")
            |> range(start: -30d)
            |> filter(fn: (r) => r["_measurement"] == "users" and r["rfidTag"] == "${idTag}")
            |> last()
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        `;
        const userResults = await queryApi.collectRows(fluxQuery);
        const user = userResults[0];
        
        let status = 'Invalid';
        if (user) {
          const now = new Date();
          const isExpired = user.rfidExpiration && new Date(user.rfidExpiration) < now;
          if (user.status === 'Active' && !isExpired) {
            status = 'Accepted';
          } else if (isExpired) {
            status = 'Expired';
          }
        }
        const response = [3, id, { idTagInfo: { status } }];
        ws.send(JSON.stringify(response));
      }
      
      await writeApi.flush();
    } catch (e) {
      console.error(`[OCPP][ERR][${chargerId}]`, e.message);
    }
  });
});

server.listen(port, () => {
  console.log(`Dashboard serving from: http://localhost:${port}`);
});
