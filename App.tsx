
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
  Settings as SettingsIcon, Play, Rocket, Activity, Monitor
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

  // Default Grafana Config
  const [grafanaConfig, setGrafanaConfig] = useState<GrafanaConfig>({
    url: 'http://localhost:3000',
    dashboardUid: 'smart-charge-live',
    refreshInterval: '5s',
    theme: 'light'
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
    } catch (err) {
      console.error("Add user failed");
    }
  };

  const handleEditUser = async (userId: string, userData: Partial<User>) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Edit user failed");
    }
  };

  const handleTopUp = async (userId: string, amount: number) => {
    try {
      const res = await fetch('/api/users/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Top up failed");
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: 'Active' | 'Blocked') => {
    try {
      const res = await fetch('/api/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Status update failed");
    }
  };

  const deploySteps = [
    {
      id: 'step0',
      title: '1. InfluxDB 3.0 Engine',
      desc: language === 'es' ? 'Motor IOx de alto rendimiento.' : 'High-performance IOx engine.',
      command: 'wget -q https://repos.influxdata.com/influxdata-archive_61499124.key\ncat influxdata-archive_61499124.key | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/influxdata-archive.gpg > /dev/null\necho "deb [signed-by=/etc/apt/trusted.gpg.d/influxdata-archive.gpg] https://repos.influxdata.com/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/influxdata.list\nsudo apt update && sudo apt install influxdb2\n# Version 3 settings applied via influxd CLI'
    },
    {
      id: 'step1',
      title: '2. Grafana OSS Setup',
      desc: language === 'es' ? 'Instalar motor de visualización.' : 'Install visualization engine.',
      command: 'sudo apt install -y apt-transport-https software-properties-common wget\nwget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -\nsudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"\nsudo apt update && sudo apt install grafana\nsudo systemctl start grafana-server'
    },
    {
      id: 'step2',
      title: '3. Data Source Link',
      desc: language === 'es' ? 'Vincular InfluxDB 3.0 a Grafana.' : 'Link InfluxDB 3.0 to Grafana.',
      command: '# Navigate to http://localhost:3000\n# Configuration > Data Sources > Add InfluxDB\n# Query Language: Flux or SQL (InfluxDB 3.0)\n# Bucket: smartcharge_bucket'
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
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-4 focus:ring-orange-500/10 focus:outline-none"
                        value={grafanaConfig.url}
                        onChange={e => setGrafanaConfig({...grafanaConfig, url: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{t.dashboardUid}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-4 focus:ring-orange-500/10 focus:outline-none"
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
                          <option value="30s">30 Seconds</option>
                          <option value="1m">1 Minute</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">UI Theme</label>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => setGrafanaConfig({...grafanaConfig, theme: 'light'})}
                             className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${grafanaConfig.theme === 'light' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
                           >Light</button>
                           <button 
                             onClick={() => setGrafanaConfig({...grafanaConfig, theme: 'dark'})}
                             className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${grafanaConfig.theme === 'dark' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
                           >Dark</button>
                        </div>
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
                      <h4 className="text-xl font-bold text-white uppercase tracking-tight">InfluxDB 3.0 + Grafana</h4>
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
                          <button 
                            onClick={() => handleCopy(step.command, step.id)}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-all"
                          >
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

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                    <Package size={14} className="text-indigo-600" />
                    Industrial Stack
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs py-2 border-b border-slate-50">
                      <span className="text-slate-500">TSDB Engine</span>
                      <span className="font-bold text-slate-800">InfluxDB 3.0 IOx</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-2 border-b border-slate-50">
                      <span className="text-slate-500">Visual Engine</span>
                      <span className="font-bold text-orange-600">Grafana 10.x</span>
                    </div>
                    <div className="flex justify-between items-center text-xs py-2 border-b border-slate-50">
                      <span className="text-slate-500">Messaging</span>
                      <span className="font-bold text-slate-800">OCPP 1.6J</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-3xl border border-amber-100 p-8">
                  <div className="flex items-center gap-2 text-amber-800 font-bold mb-2">
                    <Monitor size={18} />
                    <span>Grafana Security</span>
                  </div>
                  <p className="text-amber-700 text-[11px] leading-relaxed font-medium">
                    To embed Grafana dashboards, ensure <code>allow_embedding = true</code> is set in your <code>grafana.ini</code> configuration file.
                  </p>
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
