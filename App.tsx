
import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChargerList from './components/ChargerList';
import UserManagement from './components/UserManagement';
import OCPPLogs from './components/OCPPLogs';
import AIAnalyst from './components/AIAnalyst';
import { ViewType, Charger, Transaction, OCPPLog, ChargerStatus, User } from './types';
import { MOCK_CHARGERS, MOCK_TRANSACTIONS, MOCK_LOGS, MOCK_USERS } from './services/mockData';
import { Download, FileText } from 'lucide-react';

export interface LiveEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

const App: React.FC = () => {
  const [activeView, setActiveView] = React.useState<ViewType>('dashboard');
  const [chargers, setChargers] = React.useState<Charger[]>(MOCK_CHARGERS);
  const [users, setUsers] = React.useState<User[]>(MOCK_USERS);
  const [transactions, setTransactions] = React.useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [logs, setLogs] = React.useState<OCPPLog[]>(MOCK_LOGS);
  const [liveEvents, setLiveEvents] = React.useState<LiveEvent[]>([]);

  // Helper to add a live event
  const addEvent = (message: string, type: LiveEvent['type'] = 'info') => {
    const newEvent: LiveEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      message
    };
    setLiveEvents(prev => [newEvent, ...prev.slice(0, 19)]);
  };

  // CSV Export Logic
  const exportTransactionsToCSV = () => {
    const headers = ['Transaction ID', 'Charger ID', 'User ID', 'Start Time', 'End Time', 'Energy (kWh)', 'Cost ($)', 'Status'];
    const rows = transactions.map(t => [
      t.id,
      t.chargerId,
      t.userId,
      t.startTime,
      t.endTime || 'In Progress',
      t.energyConsumed.toFixed(2),
      t.cost.toFixed(2),
      t.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SMART_Charge_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addEvent('Transactions report exported to CSV', 'success');
  };

  // Simulation: Real-time Monitoring Loop
  React.useEffect(() => {
    const interval = setInterval(() => {
      // 1. Update Charger Telemetry & Meter Values
      setChargers(prev => prev.map(c => {
        if (c.status === ChargerStatus.CHARGING) {
          const powerFlux = (Math.random() - 0.5) * 2; // Random variation
          const newPower = Math.max(1, Math.min(50, c.currentPower + powerFlux));
          
          // Increment energy consumption (0.01kWh every 3s approx)
          const energyIncrement = (newPower / 3600) * 3; 
          
          // Occasionally log a MeterValue message
          if (Math.random() > 0.6) {
             const meterLog: OCPPLog = {
               id: `log-meter-${Date.now()}`,
               timestamp: new Date().toISOString(),
               direction: 'IN',
               messageType: 'MeterValues',
               payload: { 
                 connectorId: 1, 
                 transactionId: 1001, 
                 meterValue: [{ timestamp: new Date().toISOString(), sampledValue: [{ value: c.totalEnergy.toFixed(2), unit: 'Wh' }] }] 
               }
             };
             setLogs(l => [meterLog, ...l.slice(0, 99)]);
          }

          return { 
            ...c, 
            currentPower: parseFloat(newPower.toFixed(2)),
            totalEnergy: c.totalEnergy + energyIncrement
          };
        }
        return c;
      }));

      // 2. Random Status Updates/Heartbeats
      if (Math.random() > 0.8) {
        const randomCharger = chargers[Math.floor(Math.random() * chargers.length)];
        const heartbeatLog: OCPPLog = {
          id: `log-hb-${Date.now()}`,
          timestamp: new Date().toISOString(),
          direction: 'IN',
          messageType: 'Heartbeat',
          payload: { chargerId: randomCharger.id }
        };
        setLogs(prev => [heartbeatLog, ...prev.slice(0, 99)]);
      }

      // 3. Random Fault Simulation (Rare)
      if (Math.random() > 0.99) {
        const chargerToFault = chargers.find(c => c.status !== ChargerStatus.FAULTED);
        if (chargerToFault) {
          setChargers(prev => prev.map(c => c.id === chargerToFault.id ? { ...c, status: ChargerStatus.FAULTED, currentPower: 0 } : c));
          addEvent(`Critical Fault detected on ${chargerToFault.id}`, 'error');
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [chargers.length]);

  const handleRemoteAction = (id: string, action: string) => {
    const actionLog: OCPPLog = {
      id: `log-act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      direction: 'OUT',
      messageType: action === 'start' ? 'RemoteStartTransaction' : 'Reset',
      payload: { chargerId: id, action }
    };
    setLogs(prev => [actionLog, ...prev]);
    addEvent(`Sent ${action.toUpperCase()} command to ${id}`, 'info');
    
    setTimeout(() => {
      setChargers(prev => prev.map(c => {
        if (c.id === id) {
          if (action === 'start') {
            addEvent(`Transaction started on ${id}`, 'success');
            return { ...c, status: ChargerStatus.CHARGING, currentPower: 22.0 };
          }
          if (action === 'reset') {
            addEvent(`Charger ${id} successfully reset`, 'warning');
            return { ...c, status: ChargerStatus.AVAILABLE, currentPower: 0 };
          }
        }
        return c;
      }));
    }, 1200);
  };

  const handleAddCharger = (chargerData: Partial<Charger>) => {
    const newCharger = chargerData as Charger;
    setChargers(prev => [...prev, newCharger]);
    addEvent(`New station added: ${newCharger.name} (${newCharger.id})`, 'success');
    
    // Simulate initial BootNotification
    const bootLog: OCPPLog = {
      id: `log-boot-${Date.now()}`,
      timestamp: new Date().toISOString(),
      direction: 'IN',
      messageType: 'BootNotification',
      payload: { 
        chargePointModel: newCharger.model, 
        chargePointVendor: 'VoltCore Systems',
        firmwareVersion: newCharger.firmware
      }
    };
    setLogs(prev => [bootLog, ...prev]);
  };

  const handleAddUser = (userData: Partial<User>) => {
    const newUser: User = {
      id: `USR-${Math.floor(Math.random() * 1000)}`,
      name: userData.name || 'Anonymous',
      email: userData.email || 'no-email@volt.com',
      rfidTag: userData.rfidTag || 'RFID_NEW',
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0],
      balance: 0
    };
    setUsers(prev => [newUser, ...prev]);
    addEvent(`New user registered: ${newUser.name} (RFID: ${newUser.rfidTag})`, 'success');
    
    const authLog: OCPPLog = {
      id: `log-auth-${Date.now()}`,
      timestamp: new Date().toISOString(),
      direction: 'IN',
      messageType: 'Authorize',
      payload: { idTag: newUser.rfidTag }
    };
    setLogs(prev => [authLog, ...prev]);
  };

  const handleUpdateUserStatus = (id: string, status: 'Active' | 'Blocked') => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    addEvent(`User status updated to ${status} for ${id}`, status === 'Active' ? 'success' : 'warning');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard chargers={chargers} transactions={transactions} liveEvents={liveEvents} />;
      case 'chargers':
        return <ChargerList chargers={chargers} onRemoteAction={handleRemoteAction} onAddCharger={handleAddCharger} />;
      case 'users':
        return <UserManagement users={users} onAddUser={handleAddUser} onUpdateStatus={handleUpdateUserStatus} />;
      case 'logs':
        return <OCPPLogs logs={logs} />;
      case 'ai-insights':
        return <AIAnalyst chargers={chargers} logs={logs} />;
      case 'transactions':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Charging Sessions</h3>
                <p className="text-slate-500 text-sm">Review historical and live transaction data.</p>
              </div>
              <button 
                onClick={exportTransactionsToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md shadow-blue-500/20"
              >
                <Download size={18} />
                Export to CSV
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <th className="px-6 py-4">Session ID</th>
                      <th className="px-6 py-4">Charger</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Start Time</th>
                      <th className="px-6 py-4 text-right">Energy (kWh)</th>
                      <th className="px-6 py-4 text-right">Cost ($)</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {transactions.map(t => (
                       <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-400">
                              <FileText size={14} />
                              {t.id}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <p className="font-bold text-slate-800">{t.chargerId}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">
                             {t.userId}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                             {new Date(t.startTime).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <p className="font-mono text-blue-600 font-bold">{t.energyConsumed.toFixed(2)}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <p className="font-mono text-emerald-600 font-bold">${t.cost.toFixed(2)}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className={`
                               px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                               ${t.status === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}
                             `}>
                                {t.status}
                             </span>
                          </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-xl border p-6 max-w-2xl">
            <h3 className="text-xl font-bold mb-6">Monitoring Configuration</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Telemetry Interval (ms)</label>
                <input type="number" defaultValue={3000} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Alert Webhook URL</label>
                <input type="text" placeholder="https://hooks.slack.com/..." className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none" />
              </div>
              <button className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">Save Monitoring Config</button>
            </div>
          </div>
        );
      default:
        return <Dashboard chargers={chargers} transactions={transactions} liveEvents={liveEvents} />;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={setActiveView}>
      {renderContent()}
    </Layout>
  );
};

export default App;
