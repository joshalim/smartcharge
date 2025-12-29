
import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChargerList from './components/ChargerList';
import UserManagement from './components/UserManagement';
import OCPPLogs from './components/OCPPLogs';
import AIAnalyst from './components/AIAnalyst';
import { ViewType, Charger, Transaction, OCPPLog, ChargerStatus, User, Language } from './types';
import { MOCK_CHARGERS, MOCK_TRANSACTIONS, MOCK_LOGS, MOCK_USERS } from './services/mockData';
import { translations } from './locales/translations';
import { Download, FileText, Server, HardDrive, Terminal, ShieldCheck, Cpu } from 'lucide-react';

export interface LiveEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

const App: React.FC = () => {
  const [activeView, setActiveView] = React.useState<ViewType>('dashboard');
  const [language, setLanguage] = React.useState<Language>('es'); 
  const [chargers, setChargers] = React.useState<Charger[]>(MOCK_CHARGERS);
  const [users, setUsers] = React.useState<User[]>(MOCK_USERS);
  const [transactions, setTransactions] = React.useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [logs, setLogs] = React.useState<OCPPLog[]>(MOCK_LOGS);
  const [liveEvents, setLiveEvents] = React.useState<LiveEvent[]>([]);

  const t = translations[language];

  const addEvent = (message: string, type: LiveEvent['type'] = 'info') => {
    const newEvent: LiveEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      message
    };
    setLiveEvents(prev => [newEvent, ...prev.slice(0, 19)]);
  };

  const exportTransactionsToCSV = () => {
    const headers = ['Transaction ID', 'Charger ID', 'User ID', 'Start Time', 'End Time', 'Energy (kWh)', 'Cost (COP)', 'Status'];
    const rows = transactions.map(tr => [
      tr.id,
      tr.chargerId,
      tr.userId,
      tr.startTime,
      tr.endTime || 'In Progress',
      tr.energyConsumed.toFixed(2),
      tr.cost.toFixed(0),
      tr.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SMART_Charge_Transactions_COL_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addEvent('Transactions report exported to CSV', 'success');
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      setChargers(prev => prev.map(c => {
        if (c.status === ChargerStatus.CHARGING) {
          const powerFlux = (Math.random() - 0.5) * 2;
          const newPower = Math.max(1, Math.min(50, c.currentPower + powerFlux));
          const energyIncrement = (newPower / 3600) * 3; 

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
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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
  };

  const handleAddUser = (userData: Partial<User>) => {
    const newUser: User = {
      id: `USR-${Math.floor(Math.random() * 1000)}`,
      name: userData.name || 'Anonymous',
      email: userData.email || 'no-email@volt.com',
      phoneNumber: userData.phoneNumber || 'N/A',
      placa: userData.placa || 'N/A',
      cedula: userData.cedula || 'N/A',
      rfidTag: userData.rfidTag || 'RFID_NEW',
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0],
      balance: 0
    };
    setUsers(prev => [newUser, ...prev]);
    addEvent(`New user registered: ${newUser.name}`, 'success');
  };

  const handleEditUser = (userId: string, updatedData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedData } : u));
    addEvent(`User ${updatedData.name || userId} updated successfully`, 'success');
  };

  const handleUpdateUserStatus = (id: string, status: 'Active' | 'Blocked') => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    addEvent(`User status updated to ${status} for ${id}`, status === 'Active' ? 'success' : 'warning');
  };

  const handleTopUp = (userId: string, amount: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, balance: u.balance + amount } : u));
    const user = users.find(u => u.id === userId);
    addEvent(`Top up of $${amount.toLocaleString()} COP successful for ${user?.name || userId}`, 'success');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard chargers={chargers} transactions={transactions} liveEvents={liveEvents} language={language} />;
      case 'chargers':
        return <ChargerList chargers={chargers} onRemoteAction={handleRemoteAction} onAddCharger={handleAddCharger} language={language} />;
      case 'users':
        return <UserManagement users={users} onAddUser={handleAddUser} onEditUser={handleEditUser} onUpdateStatus={handleUpdateUserStatus} onTopUp={handleTopUp} language={language} />;
      case 'logs':
        return <OCPPLogs logs={logs} />;
      case 'ai-insights':
        return <AIAnalyst chargers={chargers} logs={logs} language={language} />;
      case 'transactions':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{t.transactions}</h3>
                <p className="text-slate-500 text-sm">Review historical and live data.</p>
              </div>
              <button 
                onClick={exportTransactionsToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md shadow-blue-500/20"
              >
                <Download size={18} />
                {t.exportCsv}
              </button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <th className="px-6 py-4">Session ID</th>
                      <th className="px-6 py-4">Station</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Start</th>
                      <th className="px-6 py-4 text-right">Energy (kWh)</th>
                      <th className="px-6 py-4 text-right">Cost (COP)</th>
                      <th className="px-6 py-4 text-center">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {transactions.map(tr => (
                       <tr key={tr.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">#{tr.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{tr.chargerId}</td>
                          <td className="px-6 py-4 text-slate-600 text-sm">{tr.userId}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs font-mono">{new Date(tr.startTime).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-mono text-blue-600 font-bold">{tr.energyConsumed.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-mono text-emerald-600 font-bold">{t.currencySymbol}{tr.cost.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                             <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tr.status === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                {tr.status === 'Active' ? t.active : t.completed}
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
          <div className="space-y-8 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Server size={22} className="text-blue-600" />
                    {t.settings}
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Intervalo Telemetría (ms)</label>
                      <input type="number" defaultValue={3000} className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Webhook Alertas (Slack/Teams)</label>
                      <input type="text" placeholder="https://hooks.slack.com/..." className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all" />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95">Guardar Configuración</button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-8 text-slate-300 shadow-xl border border-slate-800">
                  <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
                    <Terminal size={22} className="text-emerald-500" />
                    {t.deployment}
                  </h3>
                  <div className="space-y-4 font-mono text-sm">
                    <p className="text-slate-500"># Deploying to Ubuntu 22.04 LTS</p>
                    <div className="bg-black/50 p-4 rounded-lg border border-slate-800 space-y-2">
                      <p className="text-emerald-400">$ sudo apt install nginx certbot</p>
                      <p className="text-emerald-400">$ npm run build</p>
                      <p className="text-emerald-400">$ sudo cp -r dist/* /var/www/html/</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      SSL configured via Let's Encrypt (Certbot)
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-2xl border p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Cpu size={18} className="text-blue-500" />
                    {t.serverStatus}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-sm text-slate-500">{t.osVersion}</span>
                      <span className="text-sm font-bold text-slate-700">Ubuntu 22.04</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-sm text-slate-500">{t.nodeVersion}</span>
                      <span className="text-sm font-bold text-slate-700">v20.11.0</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-slate-500">{t.uptime}</span>
                      <span className="text-sm font-bold text-green-600">14d 02h 44m</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <HardDrive className="text-blue-600" size={20} />
                    <h4 className="font-bold text-blue-900 leading-tight">Database Storage</h4>
                  </div>
                  <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden mb-2">
                    <div className="bg-blue-600 h-full w-[12%]"></div>
                  </div>
                  <p className="text-[10px] text-blue-600 font-bold uppercase">12.4 GB / 100 GB used</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard chargers={chargers} transactions={transactions} liveEvents={liveEvents} language={language} />;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={setActiveView} language={language} setLanguage={setLanguage}>
      {renderContent()}
    </Layout>
  );
};

export default App;
