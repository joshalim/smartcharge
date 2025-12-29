
import { Charger, ChargerStatus, Transaction, OCPPLog, User } from '../types';

export const MOCK_CHARGERS: Charger[] = [
  {
    id: 'CP-001-ALPHA',
    name: 'Main Entrance - Station A',
    status: ChargerStatus.CHARGING,
    location: { lat: 40.7128, lng: -74.006, address: '123 Tech Way, NY' },
    lastHeartbeat: new Date().toISOString(),
    model: 'VoltCore 500',
    firmware: 'v2.4.1',
    currentPower: 22.5,
    totalEnergy: 1250.4,
  },
  {
    id: 'CP-002-BETA',
    name: 'Parking Level 2',
    status: ChargerStatus.AVAILABLE,
    location: { lat: 40.7130, lng: -74.007, address: '123 Tech Way, NY' },
    lastHeartbeat: new Date().toISOString(),
    model: 'VoltCore 500',
    firmware: 'v2.4.1',
    currentPower: 0,
    totalEnergy: 840.2,
  },
  {
    id: 'CP-003-GAMMA',
    name: 'Loading Bay West',
    status: ChargerStatus.FAULTED,
    location: { lat: 40.7125, lng: -74.005, address: '123 Tech Way, NY' },
    lastHeartbeat: new Date(Date.now() - 3600000).toISOString(),
    model: 'VoltCore Heavy Duty',
    firmware: 'v1.9.0',
    currentPower: 0,
    totalEnergy: 4500.8,
  },
  {
    id: 'CP-004-DELTA',
    name: 'Corporate Fleet Row',
    status: ChargerStatus.CHARGING,
    location: { lat: 40.7122, lng: -74.008, address: '123 Tech Way, NY' },
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
    rfidTag: 'RFID_A7B2991',
    status: 'Active',
    joinedDate: '2023-10-12',
    balance: 45.50
  },
  {
    id: 'USR-124',
    name: 'Sarah Chen',
    email: 's.chen@techcorp.io',
    rfidTag: 'RFID_82CC104',
    status: 'Active',
    joinedDate: '2024-01-05',
    balance: 12.20
  },
  {
    id: 'USR-901',
    name: 'Marcus Thorne',
    email: 'm.thorne@fleet.com',
    rfidTag: 'RFID_F009D12',
    status: 'Blocked',
    joinedDate: '2023-11-20',
    balance: -5.00
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-9981',
    chargerId: 'CP-001-ALPHA',
    userId: 'USR-882',
    startTime: new Date(Date.now() - 45 * 60000).toISOString(),
    energyConsumed: 18.5,
    cost: 5.55,
    status: 'Active',
  },
  {
    id: 'TX-9975',
    chargerId: 'CP-002-BETA',
    userId: 'USR-124',
    startTime: new Date(Date.now() - 120 * 60000).toISOString(),
    endTime: new Date(Date.now() - 10 * 60000).toISOString(),
    energyConsumed: 45.2,
    cost: 13.56,
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
