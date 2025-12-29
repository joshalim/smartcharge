
import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChargerList from './components/ChargerList';
import UserManagement from './components/UserManagement';
import OCPPLogs from './components/OCPPLogs';
import AIAnalyst from './components/AIAnalyst';
import { ViewType, Charger, Transaction, OCPPLog, ChargerStatus, User, Language } from './types';
import { translations } from './locales/translations';
import { 
  Download, FileText, Server, HardDrive, Terminal, ShieldCheck, 
  Cpu, Copy, Check, ExternalLink, Package, Globe, Lock, Code2, Layers, Database,
  Settings as SettingsIcon, Play, Rocket
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
      id: 'quick',
      title: language === 'es' ? '⚡ Instalación Rápida' : '⚡ Quick Install',
      desc: language === 'es' ? 'Script automatizado para Ubuntu.' : 'Automated script for Ubuntu.',
      command: 'curl -fsSL https://raw.githubusercontent.com/your-repo/smart-charge/main/setup.sh | bash'
    },
    {
      id: 'step0',
      title: language === 'es' ? '1. Configurar MongoDB' : '1. Configure MongoDB',
      desc: language === 'es' ? 'Instalación de la base de datos local.' : 'Local database installation.',
      command: 'curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor\necho "deb [ [arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list\nsudo apt update && sudo apt install -y mongodb-org\nsudo systemctl start mongod && sudo systemctl enable mongod'
    },
    {
      id: 'step1',
      title: language === 'es' ? '2. Entorno Node.js' : '2. Node.js Runtime',
      desc: language === 'es' ? 'Instalar Node 20 y PM2.' : 'Install Node 20 and PM2.',
      command: 'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt install -y nodejs nginx\nsudo npm install -g pm2'
    },
    {
      id: 'step2',
      title: language === 'es' ? '3. Despliegue de App' : '3. App Deployment',
      desc: language === 'es' ? 'Build y ejecución persistente.' : 'Build and persistent execution.',
      command: 'git clone <repo_url> smart-charge && cd smart-charge\nnpm install\nnpm run build\npm2 start server.js --name "smart-charge"\npm2 save'
    }
  ];

  const nginxConfig = `server {
    listen 80;
    server_name smartcharge.local;

    # Backend API & Dashboard
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # OCPP WebSocket (ws://ip/ocpp)
    location /ocpp {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}`;

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Database size={48} className="text-blue-500 animate-pulse" />
          <p className="text-slate-500 font-bold">Synchronizing with MongoDB...</p>
        </div>
      </div>
    );

    switch (activeView) {
      case 'dashboard':
        return <Dashboard chargers={chargers} transactions={transactions} liveEvents={liveEvents} language={language} />;
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
            <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                  <Rocket size={240} />
               </div>
               <div className="relative z-10">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20">
                    <Server size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t.deployment} Console</h3>
                    <p className="text-slate-500 font-medium">Full Installation Guide for Ubuntu 22.04 / 24.04 LTS</p>
                  </div>
                </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <Play size={24} className="text-blue-400" />
                      </div>
                      <h4 className="text-xl font-bold text-white uppercase tracking-tight">Step-by-Step Installation</h4>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {deploySteps.map((step) => (
                      <div key={step.id} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-blue-500/50 transition-all">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-700/50">
                          <div>
                            <span className="text-blue-400 text-xs font-black uppercase tracking-widest">{step.title}</span>
                            <p className="text-slate-400 text-sm">{step.desc}</p>
                          </div>
                          <button 
                            onClick={() => handleCopy(step.command, step.id)}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-all"
                          >
                            {copiedId === step.id ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                          </button>
                        </div>
                        <div className="p-6 bg-black/40 font-mono text-xs leading-relaxed overflow-x-auto text-emerald-400">
                          {step.command}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-xl">
                        <Globe size={24} className="text-slate-600" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-800">Nginx Proxy Configuration</h4>
                    </div>
                    <button 
                      onClick={() => handleCopy(nginxConfig, 'nginx')}
                      className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-all"
                    >
                      {copiedId === 'nginx' ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 mb-4 font-medium italic">
                    File path: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-bold">/etc/nginx/sites-available/default</code>
                  </p>
                  <div className="bg-slate-50 rounded-2xl p-6 font-mono text-xs border border-slate-100 text-slate-600 overflow-x-auto leading-relaxed">
                    {nginxConfig}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck size={120} />
                  </div>
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Lock size={20} /> Production Security
                  </h4>
                  <ul className="space-y-4 text-sm font-medium text-blue-100">
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">1</div>
                      <span>Enable UFW firewall: <code>ufw allow 80,443,9000/tcp</code></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">2</div>
                      <span>Install SSL via Certbot: <code>sudo certbot --nginx</code></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">3</div>
                      <span>Restrict MongoDB to localhost access only.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest text-[10px]">
                    <Package size={14} className="text-blue-600" />
                    Stack Overview
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm py-2 border-b border-slate-50">
                      <span className="text-slate-500">Operating System</span>
                      <span className="font-bold text-slate-800">Ubuntu 22.04+</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-2 border-b border-slate-50">
                      <span className="text-slate-500">Database Engine</span>
                      <span className="font-bold text-slate-800">MongoDB 7.0</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-2 border-b border-slate-50">
                      <span className="text-slate-500">Runtime Env</span>
                      <span className="font-bold text-slate-800">Node.js 20.x</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-2 border-b border-slate-50">
                      <span className="text-slate-500">OCPP Standard</span>
                      <span className="font-bold text-slate-800">1.6J JSON</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-2">
                      <span className="text-slate-500">AI Reasoning</span>
                      <span className="font-bold text-blue-600">Gemini 3 Pro</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-3xl border border-amber-100 p-8">
                  <h4 className="text-amber-800 font-bold mb-2 flex items-center gap-2">
                    <Database size={18} /> Persistence
                  </h4>
                  <p className="text-amber-700 text-sm leading-relaxed font-medium">
                    The app uses a local MongoDB instance. Ensure the <code>mongod</code> service is always running to prevent dashboard data loss.
                  </p>
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
