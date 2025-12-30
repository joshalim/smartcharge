
import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChargerList from './components/ChargerList';
import UserManagement from './components/UserManagement';
import OCPPLogs from './components/OCPPLogs';
import AIAnalyst from './components/AIAnalyst';
import Transactions from './components/Transactions';
import { ViewType, Charger, Transaction, OCPPLog, User, Language, GrafanaConfig } from './types';
import { translations } from './locales/translations';
import { 
  Terminal, ShieldCheck, 
  Copy, Check, Activity, Monitor, CreditCard, AlertCircle, RefreshCw
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const endpoints = [
        { key: 'chargers', url: '/api/chargers', setter: setChargers },
        { key: 'users', url: '/api/users', setter: setUsers },
        { key: 'transactions', url: '/api/transactions', setter: setTransactions },
        { key: 'logs', url: '/api/logs', setter: setLogs }
      ];

      const results = await Promise.allSettled(
        endpoints.map(e => fetch(e.url).then(r => {
          if (!r.ok) throw new Error(`${e.key} failed with ${r.status}`);
          return r.json();
        }))
      );

      results.forEach((res, index) => {
        if (res.status === 'fulfilled') {
          endpoints[index].setter(res.value);
        } else {
          console.warn(`[API] Endpoint ${endpoints[index].key} failed:`, res.reason);
        }
      });
      
      setError(null);
    } catch (err) {
      console.error("Critical Connection Error:", err);
      setError("Unable to connect to the OCPP Central System API. Verify firewall port 3080 and Nginx proxy.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); 
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
      }
    } catch (error) {
      console.error("Remote action error:", error);
    }
  };

  if (error && chargers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Conexión Fallida</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">{error}</p>
          <button 
            onClick={() => { setIsLoading(true); fetchData(); }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-95"
          >
            <RefreshCw size={18} /> Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (isLoading && chargers.length === 0) return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Activity size={48} className="text-blue-500 animate-pulse" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Syncing Command Center...</p>
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
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{t.gatewayKey}</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                      value={paymentKeys.publicKey}
                      onChange={e => setPaymentKeys({...paymentKeys, publicKey: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">{t.gatewaySecret}</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                      value={paymentKeys.secretKey}
                      onChange={e => setPaymentKeys({...paymentKeys, secretKey: e.target.value})}
                    />
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
