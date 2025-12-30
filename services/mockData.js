
// Mock Data for EV Charging Application
// This file is used by both the Frontend (Vite) and Backend (Node.js)

export const MOCK_CHARGERS = [
  {
    id: 'CP-001-ALPHA',
    name: 'Entrada Principal - Estación A',
    status: 'Charging',
    location: { lat: 4.6097, lng: -74.0817, address: 'Carrera 7 # 12-34, Bogotá' },
    lastHeartbeat: new Date().toISOString(),
    model: 'VoltCore 500',
    firmware: 'v2.4.1',
    currentPower: 22.5,
    totalEnergy: 1250.4,
    connectors: [
      { connectorId: 1, pricePerKwh: 1200, pricePerMinute: 50, status: 'Charging' }
    ]
  },
  {
    id: 'CP-002-BETA',
    name: 'Parqueadero Nivel 2',
    status: 'Available',
    location: { lat: 4.6099, lng: -74.0820, address: 'Carrera 7 # 12-34, Bogotá' },
    lastHeartbeat: new Date().toISOString(),
    model: 'VoltCore 500',
    firmware: 'v2.4.1',
    currentPower: 0,
    totalEnergy: 840.2,
    connectors: [
      { connectorId: 1, pricePerKwh: 1100, pricePerMinute: 45, status: 'Available' }
    ]
  },
  {
    id: 'CP-003-GAMMA',
    name: 'Muelle de Carga Oeste',
    status: 'Faulted',
    location: { lat: 4.6090, lng: -74.0810, address: 'Calle 100 # 15-22, Bogotá' },
    lastHeartbeat: new Date(Date.now() - 3600000).toISOString(),
    model: 'VoltCore Heavy Duty',
    firmware: 'v1.9.0',
    currentPower: 0,
    totalEnergy: 4500.8,
    connectors: [
      { connectorId: 1, pricePerKwh: 1500, pricePerMinute: 100, status: 'Faulted' }
    ]
  }
];

export const MOCK_USERS = [
  {
    id: 'USR-882',
    name: 'Alex Rivera',
    email: 'alex.r@voltmail.com',
    phoneNumber: '310 555 1234',
    placa: 'GKF-452',
    cedula: '1.020.344.551',
    rfidTag: 'RFID_A7B2991',
    rfidExpiration: '2025-12-31T23:59:59Z',
    status: 'Active',
    joinedDate: '2023-10-12',
    balance: 180000.00
  },
  {
    id: 'USR-124',
    name: 'Sarah Chen',
    email: 's.chen@techcorp.io',
    phoneNumber: '315 222 9988',
    placa: 'LML-901',
    cedula: '1.098.765.432',
    rfidTag: 'RFID_82CC104',
    rfidExpiration: '2026-01-01T00:00:00Z',
    status: 'Active',
    joinedDate: '2024-01-05',
    balance: 48800.00
  }
];

export const MOCK_TRANSACTIONS = [
  {
    id: 'TX-9981',
    chargerId: 'CP-001-ALPHA',
    userId: 'USR-882',
    startTime: new Date(Date.now() - 45 * 60000).toISOString(),
    energyConsumed: 18.5,
    cost: 22500,
    status: 'Active',
  }
];

export const MOCK_LOGS = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    direction: 'IN',
    messageType: 'StatusNotification',
    payload: { connectorId: 1, status: 'Charging', errorCode: 'NoError' }
  }
];
