
import { Charger, ChargerStatus, Transaction, OCPPLog, User } from '../types';

export const MOCK_CHARGERS: Charger[] = [
  {
    id: 'CP-001-ALPHA',
    name: 'Entrada Principal - Estación A',
    status: ChargerStatus.CHARGING,
    location: { lat: 4.6097, lng: -74.0817, address: 'Carrera 7 # 12-34, Bogotá' },
    lastHeartbeat: new Date().toISOString(),
    model: 'VoltCore 500',
    firmware: 'v2.4.1',
    currentPower: 22.5,
    totalEnergy: 1250.4,
  },
  {
    id: 'CP-002-BETA',
    name: 'Parqueadero Nivel 2',
    status: ChargerStatus.AVAILABLE,
    location: { lat: 4.6099, lng: -74.0820, address: 'Carrera 7 # 12-34, Bogotá' },
    lastHeartbeat: new Date().toISOString(),
    model: 'VoltCore 500',
    firmware: 'v2.4.1',
    currentPower: 0,
    totalEnergy: 840.2,
  },
  {
    id: 'CP-003-GAMMA',
    name: 'Muelle de Carga Oeste',
    status: ChargerStatus.FAULTED,
    location: { lat: 4.6090, lng: -74.0810, address: 'Calle 100 # 15-22, Bogotá' },
    lastHeartbeat: new Date(Date.now() - 3600000).toISOString(),
    model: 'VoltCore Heavy Duty',
    firmware: 'v1.9.0',
    currentPower: 0,
    totalEnergy: 4500.8,
  },
  {
    id: 'CP-004-DELTA',
    name: 'Fila Flota Corporativa',
    status: ChargerStatus.CHARGING,
    location: { lat: 6.2442, lng: -75.5812, address: 'El Poblado, Medellín' },
    lastHeartbeat: new Date().toISOString(),
    model: 'VoltCore 500',
    firmware: 'v2.4.1',
    currentPower: 11.2,
    totalEnergy: 112.5,
  },
];

export const MOCK_USERS: User[] = [
  {
    id: 'USR-882',
    name: 'Alex Rivera',
    email: 'alex.r@voltmail.com',
    phoneNumber: '310 555 1234',
    placa: 'GKF-452',
    cedula: '1.020.344.551',
    rfidTag: 'RFID_A7B2991',
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
    status: 'Active',
    joinedDate: '2024-01-05',
    balance: 48800.00
  },
  {
    id: 'USR-901',
    name: 'Marcus Thorne',
    email: 'm.thorne@fleet.com',
    phoneNumber: '301 444 0000',
    placa: 'AAA-001',
    cedula: '80.123.456',
    rfidTag: 'RFID_F009D12',
    status: 'Blocked',
    joinedDate: '2023-11-20',
    balance: -20000.00
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-9981',
    chargerId: 'CP-001-ALPHA',
    userId: 'USR-882',
    startTime: new Date(Date.now() - 45 * 60000).toISOString(),
    energyConsumed: 18.5,
    cost: 22500,
    status: 'Active',
  },
  {
    id: 'TX-9975',
    chargerId: 'CP-002-BETA',
    userId: 'USR-124',
    startTime: new Date(Date.now() - 120 * 60000).toISOString(),
    endTime: new Date(Date.now() - 10 * 60000).toISOString(),
    energyConsumed: 45.2,
    cost: 54200,
    status: 'Completed',
  }
];

export const MOCK_LOGS: OCPPLog[] = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    direction: 'IN',
    messageType: 'StatusNotification',
    payload: { connectorId: 1, status: 'Charging', errorCode: 'NoError' }
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 5000).toISOString(),
    direction: 'OUT',
    messageType: 'RemoteStartTransaction',
    payload: { idTag: 'ID_12345', connectorId: 1 }
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 10000).toISOString(),
    direction: 'IN',
    messageType: 'Heartbeat',
    payload: {}
  }
];
