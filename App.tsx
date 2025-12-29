
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
import { 
  Download, FileText, Server, HardDrive, Terminal, ShieldCheck, 
  Cpu, Copy, Check, ExternalLink, Package, Globe, Lock, Code2, Layers
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
  const [chargers, setChargers] = React.useState<Charger[]>(MOCK_CHARGERS);
  const [users, setUsers] = React.useState<User[]>(MOCK_USERS);
  const [transactions, setTransactions] = React.useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [logs, setLogs] = React.useState<OCPPLog[]>(MOCK_LOGS);
  const [liveEvents, setLiveEvents] = React.useState<LiveEvent[]>([]);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const t = translations[language];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const addEvent = (message: string, type: LiveEvent['type'] = 'info') => {
    const newEvent: LiveEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      message
    };
    setLiveEvents(prev => [newEvent, ...prev.slice(0, 19)]);
  };

  const deploySteps = [
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
      command: 'cd /var/www\nsudo git clone <YOUR_REPO_URL> smart-charge\nsudo chown -R $USER:$USER smart-charge\ncd smart-charge\nnpm install\n\n# Create environment file\necho "API_KEY=your_gemini_api_key" > .env'
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
    server_name smartcharge.yourdomain.com; # Change this

    # Dashboard Frontend & API
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # OCPP WebSocket Redirect
    location /ocpp {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}`;

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard chargers={chargers} transactions={transactions} liveEvents={liveEvents} language={language} />;
      case 'chargers':
        return <ChargerList chargers={chargers} onRemoteAction={(id, act) => {}} onAddCharger={(c) => {}} language={language} />;
      case 'users':
        return <UserManagement users={users} onAddUser={(u) => {}} onEditUser={(id, u) => {}} onUpdateStatus={(id, s) => {}} onTopUp={(id, a) => {}} language={language} />;
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
                System Ready for Production
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Steps */}
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

                {/* Nginx Block */}
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
                    <p className="text-indigo-200 text-sm mb-6 leading-relaxed max-w-xl font-medium">
                      Navigate to <code className="bg-black/30 px-1.5 py-0.5 rounded text-white font-bold">/etc/nginx/sites-available/default</code> and paste this configuration to enable high-performance routing.
                    </p>
                    <div className="bg-black/40 rounded-2xl p-6 font-mono text-[11px] leading-normal border border-white/5 overflow-x-auto text-indigo-100">
                      {nginxConfig}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
                    <ShieldCheck size={16} className="text-blue-600" />
                    Security Baseline
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                      <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-blue-600 transition-colors">
                        <Lock size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">UFW Firewall</p>
                        <p className="text-[11px] text-slate-400">Open ports 80, 443, 9000</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                      <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-green-600 transition-colors">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Certbot (SSL)</p>
                        <p className="text-[11px] text-slate-400">sudo certbot --nginx</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                      <div className="p-2 bg-white rounded-lg shadow-sm group-hover:text-amber-600 transition-colors">
                        <Layers size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Node Cluster</p>
                        <p className="text-[11px] text-slate-400">Use pm2 -i max for scaling</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Code2 size={24} className="text-blue-400" />
                    <h4 className="font-bold">OCPP Connectivity</h4>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      Configure your hardware chargers to point to the following WebSocket endpoint:
                    </p>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Station URL Format</p>
                      <code className="text-blue-400 font-bold break-all text-xs">
                        ws://SERVER_IP/ocpp/STATION_ID
                      </code>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      * If using SSL, use <b>wss://</b> protocol instead.
                    </p>
                  </div>
                </div>

                <div className="p-6 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                  <p className="text-xs text-slate-400 font-medium mb-3">Need specialized hardware integration?</p>
                  <button className="text-blue-600 font-bold text-sm hover:underline flex items-center justify-center gap-1 mx-auto">
                    Contact Enterprise Support <ExternalLink size={14} />
                  </button>
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
