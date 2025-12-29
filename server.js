
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const ocppPort = process.env.OCPP_PORT || 9000;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartcharge';

// MongoDB Connection
mongoose.connect(mongoUri)
  .then(() => console.log('✅ Connected to MongoDB local instance'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Schemas
const ChargerSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: String,
  status: { type: String, default: 'Available' },
  location: { lat: Number, lng: Number, address: String },
  lastHeartbeat: { type: Date, default: Date.now },
  model: String,
  firmware: String,
  currentPower: { type: Number, default: 0 },
  totalEnergy: { type: Number, default: 0 }
});

const UserSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: String,
  email: String,
  phoneNumber: String,
  placa: String,
  cedula: String,
  rfidTag: { type: String, unique: true },
  rfidExpiration: Date,
  status: { type: String, default: 'Active' },
  joinedDate: { type: Date, default: Date.now },
  balance: { type: Number, default: 0 }
});

const TransactionSchema = new mongoose.Schema({
  id: String,
  chargerId: String,
  userId: String,
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  energyConsumed: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  status: { type: String, default: 'Active' }
});

const LogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  direction: String,
  messageType: String,
  payload: mongoose.Schema.Types.Mixed,
  chargerId: String
});

const Charger = mongoose.model('Charger', ChargerSchema);
const User = mongoose.model('User', UserSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Log = mongoose.model('Log', LogSchema);

// Production Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// API Endpoints
app.get('/api/chargers', async (req, res) => {
  const chargers = await Charger.find();
  res.json(chargers);
});

app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  try {
    const userId = `USR-${Math.floor(Math.random() * 1000)}`;
    const user = await User.create({ ...req.body, id: userId });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  const txs = await Transaction.find().sort({ startTime: -1 }).limit(100);
  res.json(txs);
});

app.get('/api/logs', async (req, res) => {
  const logs = await Log.find().sort({ timestamp: -1 }).limit(200);
  res.json(logs);
});

app.post('/api/users/topup', async (req, res) => {
  const { userId, amount } = req.body;
  const user = await User.findOneAndUpdate({ id: userId }, { $inc: { balance: amount } }, { new: true });
  res.json(user);
});

app.post('/api/users/status', async (req, res) => {
  const { userId, status } = req.body;
  const user = await User.findOneAndUpdate({ id: userId }, { status }, { new: true });
  res.json(user);
});

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = http.createServer(app);

// OCPP WebSocket Server
const wss = new WebSocket.Server({ port: ocppPort }, () => {
  console.log('--------------------------------------------------');
  console.log('⚡ SMART CHARGE - CENTRAL SYSTEM STANDBY');
  console.log(`📡 OCPP WS: ws://localhost:${ocppPort}`);
  console.log('--------------------------------------------------');
});

wss.on('connection', async (ws, req) => {
  const chargerId = req.url.substring(1) || 'Unknown-Station';
  console.log(`[OCPP] New Connection: ${chargerId}`);

  // Auto-register or update charger in DB
  await Charger.findOneAndUpdate(
    { id: chargerId },
    { lastHeartbeat: new Date() },
    { upsert: true }
  );

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      const [type, id, action, payload] = message;

      // Save Log
      await Log.create({
        chargerId,
        direction: 'IN',
        messageType: action || 'Unknown',
        payload: payload || message[2]
      });

      // Simple Handlers
      if (action === 'BootNotification') {
        const response = [3, id, {
          status: 'Accepted',
          currentTime: new Date().toISOString(),
          interval: 300
        }];
        ws.send(JSON.stringify(response));
        await Charger.findOneAndUpdate({ id: chargerId }, { status: 'Available' });
      }

      if (action === 'StatusNotification') {
        const { status } = payload;
        await Charger.findOneAndUpdate({ id: chargerId }, { status });
      }

      // Authorize with RFID expiration check
      if (action === 'Authorize') {
        const { idTag } = payload;
        const user = await User.findOne({ rfidTag: idTag });
        
        let status = 'Invalid';
        if (user) {
          const now = new Date();
          const isExpired = user.rfidExpiration && new Date(user.rfidExpiration) < now;
          if (user.status === 'Active' && !isExpired) {
            status = 'Accepted';
          } else if (isExpired) {
            status = 'Expired';
          } else if (user.status === 'Blocked') {
            status = 'Blocked';
          }
        }

        const response = [3, id, { idTagInfo: { status } }];
        ws.send(JSON.stringify(response));
      }
    } catch (e) {
      console.error(`[OCPP][ERR][${chargerId}]`, e.message);
    }
  });
});

server.listen(port, () => {
  console.log(`Dashboard serving from: http://localhost:${port}`);
});
