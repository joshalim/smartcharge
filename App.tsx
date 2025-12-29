
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
  Cpu, Copy, Check, ExternalLink, Package, Globe, Lock, Code2, Layers, Database
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
    const interval = setInterval(fetchData, 5000); // Poll every 5s for live dashboard
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      title: language === 'es' ? '0. Instalar MongoDB Local' : '0. Install Local MongoDB',
      desc: language === 'es' ? 'Configurar la base de datos persistente.' : 'Setup the persistent database.',
      command: 'sudo apt-get install gnupg curl\ncurl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor\necho "deb [ [arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/nginx/sites-available/mongodb-org-7.0.list\nsudo apt-get update\nsudo apt-get install -y mongodb-org\nsudo systemctl start mongod\nsudo systemctl enable mongod'
    },
    {
      id: 'step1',
      title: language === 'es' ? '1. Preparación del Sistema' : '1. System Preparation',
      desc: language === 'es' ? 'Instalar Node.js, Nginx y gestores de procesos.' : 'Install Node.js, Nginx, and process managers.',
      command: 'sudo apt update && sudo apt upgrade -y\n# Install Node.js 20.x\ncurl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt install -y nodejs nginx git\n# Install PM2 globally\nsudo npm install -g pm2'
    },
    {
      id: 'step2',
      title: language === 'es' ? '2. Configuración del Proyecto' : '2. Project Configuration',
      desc: language === 'es' ? 'Clonar repositorio y configurar variables de entorno.' : 'Clone repository and setup environment variables.',
      command: 'cd /var/www\nsudo git clone <YOUR_REPO_URL> smart-charge\nsudo chown -R $USER:$USER smart-charge\ncd smart-charge\nnpm install\n\n# Environment setup\necho "VITE_API_KEY=your_gemini_api_key" > .env\necho "MONGO_URI=mongodb://localhost:27017/smartcharge" >> .env'
    },
    {
      id: 'step3',
      title: language === 'es' ? '3. Compilación y Despliegue' : '3. Build & Deployment',
      desc: language === 'es' ? 'Construir el frontend y activar el servidor persistente.' : 'Build the frontend and activate the persistent server.',
      command: 'npm run build\npm2 start server.js --name "smart-charge"\npm2 save\npm2 startup'
    }
  ];

  const nginxConfig = `server {
    listen 80;
    server_name smartcharge.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /ocpp {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://localhost:3000/api;
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
        return <ChargerList chargers={chargers} onRemoteAction={(id, act) => {}} onAddCharger={(c) => {}} language={language} />;
      case 'users':
        return <UserManagement users={users} onAddUser={() => {}} onEditUser={() => {}} onUpdateStatus={handleUpdateUserStatus} onTopUp={handleTopUp} language={language} />;
      case 'logs':
        return <OCPPLogs logs={logs} />;
      case 'ai-insights':
        return <AIAnalyst chargers={chargers} logs={logs} language={language} />;
      case 'settings':
        return (
          <div className="space-y-8 max-w-6xl pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/30">
                    <Terminal size={24} />
                  </div>
                  {t.deployment} Console
                </h3>
                <p className="text-slate-500 font-medium mt-1">Ubuntu 22.04 LTS / 24.04 LTS Production Guide</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100 font-bold text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                MongoDB Connected
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                {deploySteps.map((step) => (
                  <div key={step.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                    <div className="p-6 flex items-start justify-between bg-slate-50/50">
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">{step.title}</h4>
                        <p className="text-slate-500 text-sm mt-0.5 font-medium">{step.desc}</p>
                      </div>
                      <button 
                        onClick={() => handleCopy(step.command, step.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-xl transition-all font-bold text-xs"
                      >
                        {copiedId === step.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        {copiedId === step.id ? 'Copied' : 'Copy Bash'}
                      </button>
                    </div>
                    <div className="p-6 bg-slate-900 overflow-x-auto">
                      <pre className="text-emerald-400 font-mono text-sm leading-relaxed">
                        {step.command}
                      </pre>
                    </div>
                  </div>
                ))}

                <div className="bg-indigo-950 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <Globe size={120} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/30 rounded-xl backdrop-blur-md">
                          <Globe size={24} className="text-indigo-200" />
                        </div>
                        <h4 className="text-xl font-bold">Nginx Reverse Proxy Config</h4>
                      </div>
                      <button 
                        onClick={() => handleCopy(nginxConfig, 'nginx')}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                      >
                         {copiedId === 'nginx' ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                      </button>
                    </div>
                    <div className="bg-black/40 rounded-2xl p-6 font-mono text-[11px] leading-normal border border-white/5 overflow-x-auto text-indigo-100">
                      {nginxConfig}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
                    <Database size={16} className="text-blue-600" />
                    Storage Engine
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-tighter">Connection String</p>
                    <code className="text-[10px] break-all text-blue-600 bg-white p-2 rounded block border border-slate-200">
                      mongodb://localhost:27017/smartcharge
                    </code>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Code2 size={24} className="text-blue-400" />
                    <h4 className="font-bold">OCPP Connectivity</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Station URL Format</p>
                      <code className="text-blue-400 font-bold break-all text-xs">
                        ws://SERVER_IP/ocpp/STATION_ID
                      </code>
                    </div>
                  </div>
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
