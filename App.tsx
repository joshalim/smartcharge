
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
import { Activity, AlertCircle, RefreshCw, Database, Upload, Image as ImageIcon, Save, Check } from 'lucide-react';

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

interface AppSettings {
  customLogo: string | null;
  payuEnabled: boolean;
  currency: string;
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
  const [settings, setSettings] = useState<AppSettings>({ customLogo: null, payuEnabled: true, currency: 'COP' });

  const t = translations[language];

  const fetchData = async () => {
    try {
      const endpoints = [
        { key: 'chargers', url: '/api/chargers', setter: setChargers },
        { key: 'users', url: '/api/users', setter: setUsers },
        { key: 'transactions', url: '/api/transactions', setter: setTransactions },
        { key: 'logs', url: '/api/logs', setter: setLogs },
        { key: 'status', url: '/api/system/status', setter: setDbStatus },
        { key: 'settings', url: '/api/settings', setter: setSettings }
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

  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        addEvent('success', 'System settings updated.');
      }
    } catch (e) {
      addEvent('error', 'Failed to update settings.');
    }
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

  const SettingsView = () => {
    const [logoFile, setLogoFile] = useState<string | null>(settings.customLogo);
    const [isSaving, setIsSaving] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoFile(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    const saveBranding = async () => {
      setIsSaving(true);
      await handleUpdateSettings({ customLogo: logoFile });
      setIsSaving(false);
    };

    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <section className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <ImageIcon className="text-blue-600" size={24} />
            <h3 className="text-xl font-black text-slate-900">Custom Branding</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Upload your company logo to customize the dashboard header. Recommended size: 400x120px, PNG with transparent background.
              </p>
              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 font-bold rounded-2xl border-2 border-dashed border-blue-200 cursor-pointer hover:bg-blue-100 transition-all">
                  <Upload size={20} />
                  Choose Image
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                <button 
                  onClick={saveBranding}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-black rounded-[24px] shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
                  Save Logo
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[32px] border border-slate-200">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Preview</p>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[100px] flex items-center justify-center w-full">
                  {logoFile ? (
                    <img src={logoFile} alt="Logo Preview" className="max-h-16 object-contain" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-300">
                      <ImageIcon size={48} />
                      <p className="text-xs mt-2">No custom logo</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2"><Database className="text-blue-600" /> System Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Mode</p>
               <p className="font-bold text-slate-700">{dbStatus?.mode}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TSDB Connection</p>
               <p className={`font-bold ${dbStatus?.influxConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
                 {dbStatus?.influxConnected ? 'Active' : 'Disconnected'}
               </p>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading && chargers.length === 0) return <div className="flex items-center justify-center h-[60vh]"><Activity size={48} className="text-blue-500 animate-pulse" /></div>;
    switch (activeView) {
      case 'dashboard': return <Dashboard chargers={chargers} transactions={transactions} liveEvents={liveEvents} language={language} isLive={dbStatus?.influxConnected} />;
      case 'chargers': return <ChargerList chargers={chargers} onRemoteAction={handleRemoteAction} onAddCharger={handleAddCharger} onEditCharger={handleEditCharger} onDeleteCharger={handleDeleteCharger} language={language} />;
      case 'users': return <UserManagement users={users} onAddUser={handleAddUser} onBulkAddUsers={handleBulkAddUsers} onEditUser={handleEditUser} onUpdateStatus={handleEditUser} onTopUp={(id, amt) => { const u = users.find(u => u.id === id); if(u) handleEditUser(id, { balance: u.balance + amt }); }} language={language} />;
      case 'transactions': return <Transactions transactions={transactions} language={language} />;
      case 'logs': return <OCPPLogs logs={logs} />;
      case 'ai-insights': return <AIAnalyst chargers={chargers} logs={logs} language={language} />;
      case 'settings': return <SettingsView />;
      default: return null;
    }
  };

  return <Layout activeView={activeView} setActiveView={setActiveView} language={language} setLanguage={setLanguage} extraHeader={renderTopBarStatus()} customLogo={settings.customLogo}>{renderContent()}</Layout>;
};

export default App;
