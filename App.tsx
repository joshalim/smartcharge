
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
import { Download, FileText, Server, HardDrive, Terminal, ShieldCheck, Cpu, Copy, Check, ExternalLink, Package, Globe, Lock } from 'lucide-react';

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

  // Deployment Steps Data
  const deploySteps = [
    {
      id: 'step1',
      title: language === 'es' ? '1. Dependencias del Sistema' : '1. System Dependencies',
      icon: <Package size={18} />,
      command: 'sudo apt update && sudo apt install -y nginx git curl\ncurl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt install -y nodejs\nsudo npm install -g pm2'
    },
    {
      id: 'step2',
      title: language === 'es' ? '2. Compilar Frontend' : '2. Build Frontend',
      icon: <Terminal size={18} />,
      command: 'export API_KEY=your_gemini_key\nnpm install\nnpm run build'
    },
    {
      id: 'step3',
      title: language === 'es' ? '3. Iniciar Backend (PM2)' : '3. Start Backend (PM2)',
      icon: <Cpu size={18} />,
      command: 'pm2 start server.js --name smart-charge\npm2 save\npm2 startup'
    },
    {
      id: 'step4',
      title: language === 'es' ? '4. Certificado SSL (HTTPS)' : '4. SSL Certificate (HTTPS)',
      icon: <Lock size={18} />,
      command: 'sudo apt install python3-certbot-nginx -y\nsudo certbot --nginx'
    }
  ];

  const nginxConfig = `server {
    listen 80;
    server_name your_domain.com;

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
          <div className="space-y-8 max-w-5xl">
            <header className="mb-6">
              <h3 className="text-2xl font-bold text-slate-800">{t.deployment}</h3>
              <p className="text-slate-500">Instrucciones paso a paso para desplegar en un servidor Ubuntu propio.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {deploySteps.map((step) => (
                  <div key={step.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-700">
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                          {step.icon}
                        </div>
                        {step.title}
                      </div>
                      <button 
                        onClick={() => handleCopy(step.command, step.id)}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                      >
                        {copiedId === step.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                      </button>
                    </div>
                    <div className="p-5 font-mono text-sm bg-slate-900 text-slate-300">
                      <pre className="whitespace-pre-wrap">{step.command}</pre>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/20">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Globe size={18} />
                    Nginx Config
                  </h4>
                  <p className="text-blue-100 text-xs mb-4">Recomendado para manejar el tráfico de red y WebSockets de forma segura.</p>
                  <div className="relative group">
                    <pre className="bg-black/20 p-4 rounded-xl text-[10px] font-mono overflow-x-auto border border-white/10">
                      {nginxConfig}
                    </pre>
                    <button 
                      onClick={() => handleCopy(nginxConfig, 'nginx')}
                      className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-green-500" />
                    Security Checklist
                  </h4>
                  <ul className="space-y-3">
                    {[
                      'Habilitar UFW (Firewall)',
                      'Configurar HTTPS (WSS)',
                      'Proteger API Key (.env)',
                      'Rotación de Logs'
                    ].map((check, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        {check}
                      </li>
                    ))}
                  </ul>
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
