
export enum ChargerStatus {
  AVAILABLE = 'Available',
  CHARGING = 'Charging',
  FINISHING = 'Finishing',
  FAULTED = 'Faulted',
  UNAVAILABLE = 'Unavailable',
  PREPARING = 'Preparing'
}

export enum ConnectorType {
  CCS2 = 'CCS2',
  TYPE2 = 'Type 2',
  CHADEMO = 'CHAdeMO',
  GB_T = 'GB/T',
  J1772 = 'J1772'
}

export type Language = 'en' | 'es';

export interface GrafanaConfig {
  url: string;
  dashboardUid: string;
  refreshInterval: string;
  theme: 'light' | 'dark';
}

export interface ConnectorPricing {
  connectorId: number;
  connectorType: ConnectorType;
  pricePerKwh: number;
  pricePerMinute: number;
  status: ChargerStatus;
}

export interface Charger {
  id: string;
  name: string;
  status: ChargerStatus;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  lastHeartbeat: string;
  model: string;
  firmware: string;
  currentPower: number; // in kW
  totalEnergy: number; // in kWh
  connectors: ConnectorPricing[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  placa: string;
  cedula: string;
  rfidTag: string;
  rfidExpiration: string; // ISO date string
  status: 'Active' | 'Blocked';
  joinedDate: string;
  balance: number;
}

export interface Transaction {
  id: string;
  chargerId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  energyConsumed: number;
  cost: number;
  status: 'Active' | 'Completed';
}

export interface OCPPLog {
  id: string;
  timestamp: string;
  direction: 'IN' | 'OUT';
  messageType: string;
  payload: any;
}

export type ViewType = 'dashboard' | 'chargers' | 'users' | 'transactions' | 'logs' | 'settings' | 'ai-insights';
