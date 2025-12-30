
import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChargerList from './components/ChargerList';
import UserManagement from './components/UserManagement';
import OCPPLogs from './components/OCPPLogs';
import AIAnalyst from './components/AIAnalyst';
import Transactions from './components/Transactions';
import { ViewType, Charger, Transaction, OCPPLog, User, Language } from './types';
import { translations } from './locales/translations';
import { Activity, AlertCircle, RefreshCw, Database } from 'lucide-react';

export interface LiveEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

interface SystemStatus {
  influxConnected: boolean;
  mode: 'PRODUCTION' | 'MOCK';
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
  const [dbStatus, setDbStatus] = useState<SystemStatus | null>(null);

  const t = translations[language];

  const fetchData = async () => {
    try {
      const endpoints = [
        { key: 'chargers', url: '/api/chargers', setter: setChargers },
        { key: 'users', url: '/api/users', setter: setUsers },
        { key: 'transactions', url: '/api/transactions', setter: setTransactions },
        { key: 'logs', url: '/api/logs', setter: setLogs },
        { key: 'status', url: '/api/system/status', setter: setDbStatus }
      ];

      const results = await Promise.allSettled(
        endpoints.map(e => fetch(e.url).then(r => r.ok ? r.json() : Promise.reject(r.statusText)))
      );

      results.forEach((res, index) => {
        if (res.status === 'fulfilled') endpoints[index].setter(res.value);
      });
      setError(null);
    } catch (err) {
      setError("Unable to connect to the OCPP Central System API.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); 
    return () => clearInterval(interval);
  }, []);

  const addEvent = (type: LiveEvent['type'], message: string) => {
    setLiveEvents(prev => [{ id: Math.random().toString(), timestamp: new Date().toISOString(), type, message }, ...prev].slice(0, 15));
  };

  const handleAddCharger = async (charger: Partial<Charger>) => {
    try {
      const res = await fetch('/api/chargers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(charger) });
      if (res.ok) {
        addEvent('success', `Station ${charger.id} registered successfully.`);
        fetchData();
      }
    } catch (e) { addEvent('error', 'Failed to add charger.'); }
  };

  const handleEditCharger = async (id: string, updates: Partial<Charger>) => {
    try {
      const res = await fetch(`/api/chargers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      if (res.ok) {
        addEvent('success', `Station ${id} updated.`);
        fetchData();
      }
    } catch (e) { addEvent('error', 'Failed to update charger.'); }
  };

  const handleDeleteCharger = async (id: string) => {
    try {
      const res = await fetch(`/api/chargers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addEvent('success', `Station ${id} removed from dashboard.`);
        fetchData();
      }
    } catch (e) { addEvent('error', 'Failed to delete charger.'); }
  };

  const handleAddUser = async (user: Partial<User>) => {
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
      if (res.ok) {
        addEvent('success', `User ${user.name} added.`);
        fetchData();
      }
    } catch (e) { addEvent('error', 'Failed to add user.'); }
  };

  const handleBulkAddUsers = async (usersToImport: Partial<User>[]) => {
    try {
      const res = await fetch('/api/users/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(usersToImport) });
      if (res.ok) {
        addEvent('success', `${usersToImport.length} users imported successfully.`);
        fetchData();
      }
    } catch (e) { addEvent('error', 'Failed to import users.'); }
  };

  const handleEditUser = async (id: string, updates: Partial<User>) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      if (res.ok) {
        addEvent('success', `User profile ${id} updated.`);
        fetchData();
      }
    } catch (e) { addEvent('error', 'Failed to update user.'); }
  };

  const handleRemoteAction = async (chargerId: string, action: string) => {
    try {
      const res = await fetch(`/api/chargers/${chargerId}/remote-action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      if (res.ok) addEvent('success', `Remote ${action} sent to ${chargerId}`);
    } catch (e) {}
  };

  const renderTopBarStatus = () => (
    <div className="flex items-center gap-4">
      {dbStatus && (
        <div className={`flex items-center gap-2 text-[10px] font-black uppercase px-3 py-1 rounded-full border ${dbStatus.influxConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
          <Database size={12} /> {dbStatus.influxConnected ? 'InfluxDB Live' : 'Mock Mode'}
        </div>
      )}
      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> {t.serverOnline}
      </div>
    </div>
  );

  if (error && chargers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-md text-center">
          <AlertCircle size={32} className="text-red-600 mx-auto mb-6" />
          <h2 className="text-xl font-bold mb-2">Conexión Fallida</h2>
          <button onClick={fetchData} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl"><RefreshCw size={18} /> Reintentar</button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (isLoading && chargers.length === 0) return <div className="flex items-center justify-center h-[60vh]"><Activity size={48} className="text-blue-500 animate-pulse" /></div>;
    switch (activeView) {
      case 'dashboard': return <Dashboard chargers={chargers} transactions={transactions} liveEvents={liveEvents} language={language} isLive={dbStatus?.influxConnected} />;
      case 'chargers': return <ChargerList chargers={chargers} onRemoteAction={handleRemoteAction} onAddCharger={handleAddCharger} onEditCharger={handleEditCharger} onDeleteCharger={handleDeleteCharger} language={language} />;
      case 'users': return <UserManagement users={users} onAddUser={handleAddUser} onBulkAddUsers={handleBulkAddUsers} onEditUser={handleEditUser} onUpdateStatus={handleEditUser} onTopUp={(id, amt) => { const u = users.find(u => u.id === id); if(u) handleEditUser(id, { balance: u.balance + amt }); }} language={language} />;
      case 'transactions': return <Transactions transactions={transactions} language={language} />;
      case 'logs': return <OCPPLogs logs={logs} />;
      case 'ai-insights': return <AIAnalyst chargers={chargers} logs={logs} language={language} />;
      case 'settings': return <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm"><h3 className="text-xl font-bold">Database Engine: {dbStatus?.mode}</h3></div>;
      default: return null;
    }
  };

  return <Layout activeView={activeView} setActiveView={setActiveView} language={language} setLanguage={setLanguage} extraHeader={renderTopBarStatus()}>{renderContent()}</Layout>;
};

export default App;
