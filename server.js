
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

// Enriched mock users with passwords and roles for auth demo
const ENRICHED_USERS = initialUsers.map(u => ({
  ...u,
  password: u.email === 'alex.r@voltmail.com' ? 'password123' : (u.password || 'password123'),
  role: u.id === 'USR-ADMIN' ? 'admin' : 'driver'
}));

// Add a default admin if not present
if (!ENRICHED_USERS.find(u => u.role === 'admin')) {
  ENRICHED_USERS.push({
    id: 'USR-ADMIN',
    name: 'Main Admin',
    email: 'admin@smartcharge.com',
    password: 'admin',
    role: 'admin',
    phoneNumber: '0',
    placa: 'ADMIN',
    cedula: '0',
    rfidTag: 'ADMIN_001',
    rfidExpiration: new Date(Date.now() + 315360000000).toISOString(),
    status: 'Active',
    joinedDate: new Date().toISOString(),
    balance: 0
  });
}

// Local state for Mock Mode persistence
let chargersStore = [...initialChargers];
let usersStore = [...ENRICHED_USERS];
let transactionsStore = [...initialTransactions];
let logsStore = [...initialLogs];
let settingsStore = {
  customLogo: null, 
  payuEnabled: true,
  currency: 'COP',
  theme: 'slate'
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3080', 10);
const ocppPort = parseInt(process.env.OCPP_PORT || '9000', 10);

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

// Increase JSON limit for base64 images and large CSV imports
app.use(express.json({ limit: '20mb' }));
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Auth Endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  const user = usersStore.find(u => u.email === email && u.password === password && u.role === role);
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name, placa, role } = req.body;
  
  if (usersStore.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const newUser = {
    id: `USR-${Math.floor(Math.random() * 10000)}`,
    name,
    email,
    password,
    role,
    phoneNumber: '',
    placa,
    cedula: '',
    rfidTag: `RFID-${Math.floor(Math.random() * 1000000)}`,
    rfidExpiration: new Date(Date.now() + 31536000000).toISOString(),
    status: 'Active',
    joinedDate: new Date().toISOString(),
    balance: 0
  };

  usersStore.push(newUser);
  saveEntity('users', { id: newUser.id }, newUser);
  
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

app.post('/api/auth/change-password', (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  const userIndex = usersStore.findIndex(u => u.id === userId);
  
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
  
  const user = usersStore[userIndex];
  if (user.password !== currentPassword) {
    return res.status(401).json({ error: 'Incorrect current password' });
  }
  
  usersStore[userIndex].password = newPassword;
  saveEntity('users', { id: userId }, usersStore[userIndex]);
  
  res.json({ message: 'Password updated successfully' });
});

app.get('/api/system/status', (req, res) => res.json({ 
  influxConnected: influxEnabled, 
  mode: influxEnabled ? 'PRODUCTION' : 'MOCK',
  bucket: bucket
}));

app.get('/api/settings', (req, res) => res.json(settingsStore));
app.post('/api/settings', (req, res) => {
  settingsStore = { ...settingsStore, ...req.body };
  res.json(settingsStore);
});

app.get('/api/chargers', async (req, res) => res.json(await getLatestState('chargers', chargersStore)));
app.post('/api/chargers', async (req, res) => {
  const charger = req.body;
  const index = chargersStore.findIndex(c => c.id === charger.id);
  if (index !== -1) chargersStore[index] = { ...chargersStore[index], ...charger };
  else chargersStore.push(charger);
  await saveEntity('chargers', { id: charger.id }, charger);
  res.status(201).json(charger);
});
app.put('/api/chargers/:id', async (req, res) => {
  const charger = req.body;
  const id = req.params.id;
  const index = chargersStore.findIndex(c => c.id === id);
  if (index !== -1) chargersStore[index] = { ...chargersStore[index], ...charger };
  await saveEntity('chargers', { id }, charger);
  res.json(charger);
});
app.delete('/api/chargers/:id', (req, res) => {
  const id = req.params.id;
  chargersStore = chargersStore.filter(c => c.id !== id);
  res.status(204).send();
});

app.get('/api/users', async (req, res) => res.json(await getLatestState('users', usersStore)));
app.post('/api/users', async (req, res) => {
  const user = req.body;
  const index = usersStore.findIndex(u => u.id === user.id);
  if (index !== -1) usersStore[index] = { ...usersStore[index], ...user };
  else usersStore.push(user);
  await saveEntity('users', { id: user.id }, user);
  res.status(201).json(user);
});
app.put('/api/users/:id', async (req, res) => {
  const user = req.body;
  const id = req.params.id;
  const index = usersStore.findIndex(u => u.id === id);
  if (index !== -1) usersStore[index] = { ...usersStore[index], ...user };
  await saveEntity('users', { id }, user);
  res.json(user);
});
app.delete('/api/users/:id', (req, res) => {
  const id = req.params.id;
  usersStore = usersStore.filter(u => u.id !== id);
  res.status(204).send();
});

// Bulk User Import Endpoint
app.post('/api/users/bulk', async (req, res) => {
  const usersToImport = req.body;
  if (!Array.isArray(usersToImport)) return res.status(400).json({ error: 'Expected an array of users' });

  let count = 0;
  for (const user of usersToImport) {
    const index = usersStore.findIndex(u => u.rfidTag === user.rfidTag || u.id === user.id);
    if (index !== -1) {
      usersStore[index] = { ...usersStore[index], ...user };
    } else {
      usersStore.push(user);
    }
    await saveEntity('users', { id: user.id }, user);
    count++;
  }
  res.json({ count });
});

app.get('/api/transactions', async (req, res) => res.json(await getLatestState('transactions', transactionsStore)));
app.get('/api/logs', async (req, res) => res.json(await getLatestState('logs', logsStore)));
app.post('/api/chargers/:id/remote-action', (req, res) => res.json({ status: 'Accepted' }));

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.sendFile(path.resolve(__dirname, 'index.html'));
});

const wss = new WebSocketServer({ port: ocppPort, host: '0.0.0.0' }, () => console.log(`🔌 OCPP Server: ${ocppPort}`));
wss.on('connection', (ws, req) => {
  const chargerId = req.url.split('/').pop() || 'Unknown';
  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (Array.isArray(msg) && msg.length >= 4) {
        const [type, id, action, payload] = msg;
        const logEntry = { id: `log-${Date.now()}`, timestamp: new Date().toISOString(), direction: 'IN', messageType: action, payload };
        logsStore.unshift(logEntry);
        logsStore = logsStore.slice(0, 100);
      }
    } catch (e) {}
  });
});

const server = http.createServer(app);
server.listen(port, '0.0.0.0', () => console.log(`🚀 CMS Dashboard: http://localhost:${port}`));
