
import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChargerList from './components/ChargerList';
import UserManagement from './components/UserManagement';
import OCPPLogs from './components/OCPPLogs';
import AIAnalyst from './components/AIAnalyst';
import { ViewType, Charger, Transaction, OCPPLog, ChargerStatus, User, Language, GrafanaConfig } from './types';
import { translations } from './locales/translations';
import { 
  Download, FileText, Server, HardDrive, Terminal, ShieldCheck, 
  Cpu, Copy, Check, ExternalLink, Package, Globe, Lock, Code2, Layers, Database,
  Settings as SettingsIcon, Play, Rocket, Activity, Monitor, CreditCard
} from 'lucide-react';

export interface LiveEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

const App: React.FC = () => {
  const [activeView, setActiveView] = React.useState<ViewType>('dashboard');
  const [language, setLanguage] = React.useState<Language>('es'); 
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [logs, setLogs] = useState<OCPPLog[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [grafanaConfig, setGrafanaConfig] = useState<GrafanaConfig>({
    url: 'http://localhost:3000',
    dashboardUid: 'smart-charge-live',
    refreshInterval: '5s',
    theme: 'light'
  });

  const [paymentKeys, setPaymentKeys] = useState({
    publicKey: 'pk_live_************************',
    secretKey: 'sk_live_************************'
  });

  const t = translations[language];

  const fetchData = async () => {
    try {
      const [cRes, uRes, tRes, lRes] = await Promise.all([
        fetch('/api/chargers'),
        fetch('/api/users'),
        fetch('/api/transactions'),
        fetch('/api/logs')
      ]);
      
      if (cRes.ok) setChargers(await cRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (tRes.ok) setTransactions(await tRes.json());
      if (lRes.ok) setLogs(await lRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddUser = async (userData: Partial<User>) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) fetchData();
    } catch (err) { console.error("Add user failed"); }
  };

  const handleEditUser = async (userId: string, userData: Partial<User>) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) fetchData();
    } catch (err) { console.error("Edit user failed"); }
  };

  const handleTopUp = async (userId: string, amount: number) => {
    // Balances are updated via the verification flow now, but we refresh data here
    fetchData();
  };

  const handleUpdateUserStatus = async (userId: string, status: 'Active' | 'Blocked') => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchData();
    } catch (err) { console.error("Status update failed"); }
  };

  const deploySteps = [
    {
      id: 'step0',
      title: '1. InfluxDB 3.0 Engine',
      desc: language === 'es' ? 'Motor IOx de alto rendimiento.' : 'High-performance IOx engine.',
      command: 'wget -q https://repos.influxdata.com/influxdata-archive_61499124.key\ncat influxdata-archive_61499124.key | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/influxdata-archive.gpg > /dev/null\necho "deb [signed-by=/etc/apt/trusted.gpg.d/influxdata-archive.gpg] https://repos.influxdata.com/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/influxdata.list\nsudo apt update && sudo apt install influxdb2'
    },
    {
      id: 'step1',
      title: '2. Payment API Gateway',
      desc: language === 'es' ? 'Configurar pasarela segura.' : 'Setup secure gateway.',
      command: '# Webhook configuration\n# URL: https://your-domain.com/api/payments/verify\n# Secret: Generated in Dashboard'
    }
  ];

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Activity size={48} className="text-indigo-500 animate-pulse" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Syncing Command Center...</p>
        </div>
      </div>
    );

    switch (activeView) {
      case 'dashboard':
        return <Dashboard chargers={chargers} transactions={transactions} liveEvents={liveEvents} language={language} grafanaConfig={grafanaConfig} />;
      case 'chargers':
        return <ChargerList chargers={chargers} onRemoteAction={() => {}} onAddCharger={() => {}} language={language} />;
      case 'users':
        return <UserManagement users={users} onAddUser={handleAddUser} onEditUser={handleEditUser} onUpdateStatus={handleUpdateUserStatus} onTopUp={handleTopUp} language={language} />;
      case 'logs':
        return <OCPPLogs logs={logs} />;
      case 'ai-insights':
        return <AIAnalyst chargers={chargers} logs={logs} language={language} />;
      case 'settings':
        return (
          <div className="space-y-8 max-w-6xl pb-20">
            {/* Payment Integration Config */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{t.paymentGateway}</h3>
                    <p className="text-sm text-slate-500">External API integration for billing.</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{t.gatewayKey}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                        value={paymentKeys.publicKey}
                        onChange={e => setPaymentKeys({...paymentKeys, publicKey: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{t.gatewaySecret}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-4 focus:ring-green-500/10 focus:outline-none"
                        value={paymentKeys.secretKey}
                        onChange={e => setPaymentKeys({...paymentKeys, secretKey: e.target.value})}
                      />
                    </div>
                  </div>
               </div>
            </div>

            {/* Grafana Config Section */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                    <Monitor size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{t.grafanaConfig}</h3>
                    <p className="text-sm text-slate-500">Live dashboard integration settings.</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{t.grafanaUrl}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                        value={grafanaConfig.url}
                        onChange={e => setGrafanaConfig({...grafanaConfig, url: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{t.dashboardUid}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                        value={grafanaConfig.dashboardUid}
                        onChange={e => setGrafanaConfig({...grafanaConfig, dashboardUid: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Refresh Interval</label>
                        <select 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
                          value={grafanaConfig.refreshInterval}
                          onChange={e => setGrafanaConfig({...grafanaConfig, refreshInterval: e.target.value})}
                        >
                          <option value="5s">5 Seconds</option>
                          <option value="10s">10 Seconds</option>
                          <option value="1m">1 Minute</option>
                        </select>
                     </div>
                  </div>
               </div>
            </div>

            {/* Deployment Steps */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <Terminal size={24} className="text-indigo-400" />
                      </div>
                      <h4 className="text-xl font-bold text-white uppercase tracking-tight">InfluxDB 3.0 + Payment Integration</h4>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {deploySteps.map((step) => (
                      <div key={step.id} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-indigo-500/50 transition-all">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-700/50">
                          <div>
                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">{step.title}</span>
                            <p className="text-slate-400 text-xs font-medium">{step.desc}</p>
                          </div>
                          <button onClick={() => handleCopy(step.command, step.id)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300">
                            {copiedId === step.id ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                          </button>
                        </div>
                        <div className="p-6 bg-black/40 font-mono text-[11px] leading-relaxed overflow-x-auto text-indigo-300">
                          {step.command}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard chargers={chargers} transactions={transactions} liveEvents={liveEvents} language={language} grafanaConfig={grafanaConfig} />;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={setActiveView} language={language} setLanguage={setLanguage}>
      {renderContent()}
    </Layout>
  );
};

export default App;
