
export enum ChargerStatus {
  AVAILABLE = 'Available',
  CHARGING = 'Charging',
  FINISHING = 'Finishing',
  FAULTED = 'Faulted',
  UNAVAILABLE = 'Unavailable',
  PREPARING = 'Preparing'
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
}

export interface User {
  id: string;
  name: string;
  email: string;
  rfidTag: string;
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
