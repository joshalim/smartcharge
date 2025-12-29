
import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChargerList from './components/ChargerList';
import UserManagement from './components/UserManagement';
import OCPPLogs from './components/OCPPLogs';
import AIAnalyst from './components/AIAnalyst';
import Transactions from './components/Transactions';
import { ViewType, Charger, Transaction, OCPPLog, ChargerStatus, User, Language, GrafanaConfig } from './types';
import { translations } from './locales/translations';
import { 
  Download, FileText, Server, HardDrive, Terminal, ShieldCheck, 
  Cpu, Copy, Check, ExternalLink, Package, Globe, Lock, Code2, Layers, Database,
  Settings as SettingsIcon, Play, Rocket, Activity, Monitor, CreditCard, ChevronRight
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

  const handleRemoteAction = async (chargerId: string, action: string) => {
    try {
      const response = await fetch(`/api/chargers/${chargerId}/remote-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        setLiveEvents(prev => [{
          id: Math.random().toString(),
          timestamp: new Date().toISOString(),
          type: 'success',
          message: `Remote ${action} sent to ${chargerId}`
        }, ...prev].slice(0, 15));
        
        fetchData();
      } else {
        setLiveEvents(prev => [{
          id: Math.random().toString(),
          timestamp: new Date().toISOString(),
          type: 'error',
          message: `Failed to send ${action} to ${chargerId}`
        }, ...prev].slice(0, 15));
      }
    } catch (error) {
      console.error("Remote action error:", error);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
        return <ChargerList chargers={chargers} onRemoteAction={handleRemoteAction} onAddCharger={() => {}} language={language} />;
      case 'users':
        return <UserManagement users={users} onAddUser={() => {}} onEditUser={() => {}} onUpdateStatus={() => {}} onTopUp={() => {}} language={language} />;
      case 'transactions':
        return <Transactions transactions={transactions} language={language} />;
      case 'logs':
        return <OCPPLogs logs={logs} />;
      case 'ai-insights':
        return <AIAnalyst chargers={chargers} logs={logs} language={language} />;
      case 'settings':
        return (
          <div className="space-y-8 max-w-6xl pb-20">
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <Terminal size={24} className="text-indigo-400" />
                      </div>
                      <h4 className="text-xl font-bold text-white uppercase tracking-tight">Ubuntu Deployment Checklist (v2)</h4>
                    </div>
                    <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-black uppercase tracking-widest">
                      InfluxDB OSS v2
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {[
                      {
                        title: "1. Environment Setup",
                        cmd: "wget -O setup.sh https://your-server/setup.sh && chmod +x setup.sh && ./setup.sh",
                        desc: "Installs Node.js 20, InfluxDB v2, Grafana, and Nginx automatically."
                      },
                      {
                        title: "2. Initialize InfluxDB v2",
                        cmd: "influx setup --org smartcharge --bucket smartcharge_bucket --username admin --token YOUR_SECRET_TOKEN",
                        desc: "Configures the initial TSDB v2 organization. You must save the token for the .env file."
                      },
                      {
                        title: "3. Firewall & Proxy",
                        cmd: "sudo ufw allow 9000/tcp && sudo systemctl restart nginx",
                        desc: "Ensures the OCPP WebSocket port is accessible through the reverse proxy."
                      },
                      {
                        title: "4. Deploy CMS Service",
                        cmd: "npm install && npm run build && pm2 start server.js --name 'smart-charge'",
                        desc: "Compiles React assets and starts the high-availability central system service."
                      }
                    ].map((step, idx) => (
                      <div key={idx} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                        <div className="px-6 py-4 flex items-center justify-between bg-slate-800/30">
                          <span className="text-white font-bold text-sm">{step.title}</span>
                          <button 
                            onClick={() => handleCopy(step.cmd, `step-${idx}`)}
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedId === `step-${idx}` ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                          </button>
                        </div>
                        <div className="px-6 py-4 space-y-3">
                          <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                          <div className="p-3 bg-black/40 rounded-xl font-mono text-[11px] text-indigo-300 break-all border border-white/5">
                            {step.cmd}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                 <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden">
                    <div className="relative z-10">
                      <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Rocket size={20} /> Production Ready
                      </h4>
                      <p className="text-xs text-indigo-100 leading-relaxed mb-6 opacity-80">
                        Once deployed, chargers can connect via WebSocket. Ensure InfluxDB v2 is running on port 8086.
                      </p>
                      <div className="space-y-3">
                         <div className="flex items-center gap-3 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                            <span>Auto-Restart Enabled (PM2)</span>
                         </div>
                         <div className="flex items-center gap-3 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                            <span>TSDB Persistence (InfluxDB v2)</span>
                         </div>
                      </div>
                    </div>
                    <Activity size={120} className="absolute -bottom-8 -right-8 opacity-10" />
                 </div>

                 <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                      <Database size={14} className="text-indigo-600" />
                      Infrastructure Specs
                    </h4>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">InfluxDB Engine</span>
                          <span className="font-mono bg-slate-100 px-1.5 rounded text-indigo-600">OSS v2.7+</span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">OCPP WebSocket</span>
                          <span className="font-mono bg-slate-100 px-1.5 rounded">Port 9000</span>
                       </div>
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
