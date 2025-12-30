
import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChargerList from './components/ChargerList';
import UserManagement from './components/UserManagement';
import OCPPLogs from './components/OCPPLogs';
import AIAnalyst from './components/AIAnalyst';
import Transactions from './components/Transactions';
import { ViewType, Charger, Transaction, OCPPLog, User, Language } from './types';
import { translations } from '../locales/translations';
import { Activity, AlertCircle, RefreshCw, Database, Upload, Image as ImageIcon, Save, Check, Palette, Trash2 } from 'lucide-react';

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

type AppTheme = 'slate' | 'emerald' | 'amber' | 'midnight';

interface AppSettings {
  customLogo: string | null;
  payuEnabled: boolean;
  currency: string;
  theme: AppTheme;
}

const THEME_CONFIG: Record<AppTheme, { primary: string, hover: string, bg: string, text: string }> = {
  slate: { primary: '#2563eb', hover: '#1d4ed8', bg: '#f8fafc', text: '#2563eb' },
  emerald: { primary: '#059669', hover: '#047857', bg: '#f0fdf4', text: '#059669' },
  amber: { primary: '#d97706', hover: '#b45309', bg: '#fffbeb', text: '#d97706' },
  midnight: { primary: '#6366f1', hover: '#4f46e5', bg: '#0f172a', text: '#818cf8' }
};

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
  const [settings, setSettings] = useState<AppSettings>({ customLogo: null, payuEnabled: true, currency: 'COP', theme: 'slate' });

  const t = translations[language];

  // Global Theme CSS Injection
  useEffect(() => {
    const config = THEME_CONFIG[settings.theme || 'slate'];
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --brand-primary: ${config.primary};
        --brand-hover: ${config.hover};
        --brand-bg: ${config.bg};
        --brand-text: ${config.text};
      }
      .bg-brand { background-color: var(--brand-primary); }
      .bg-brand-hover:hover { background-color: var(--brand-hover); }
      .text-brand { color: var(--brand-primary); }
      .border-brand { border-color: var(--brand-primary); }
      .ring-brand:focus { --tw-ring-color: var(--brand-primary); }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, [settings.theme]);

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
        return true;
      }
    } catch (e) {
      addEvent('error', 'Failed to update settings.');
    }
    return false;
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
          <button onClick={fetchData} className="w-full flex items-center justify-center gap-2 py-3 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20"><RefreshCw size={18} /> Reintentar</button>
        </div>
      </div>
    );
  }

  const SettingsView = () => {
    const [logoFile, setLogoFile] = useState<string | null>(settings.customLogo);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
      const success = await handleUpdateSettings({ customLogo: logoFile });
      setIsSaving(false);
      if (success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    };

    const resetBranding = async () => {
      setLogoFile(null);
      await handleUpdateSettings({ customLogo: null });
    };

    const updateTheme = (newTheme: AppTheme) => {
      handleUpdateSettings({ theme: newTheme });
    };

    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Custom Branding */}
          <section className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-left-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-brand/10 text-brand rounded-2xl">
                <ImageIcon size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Custom Branding</h3>
                <p className="text-sm text-slate-400 font-medium tracking-wide">Customize your network identity</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-10 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center min-h-[160px] group transition-all hover:border-brand/40">
                {logoFile ? (
                  <div className="relative group">
                    <img src={logoFile} alt="Logo Preview" className="max-h-24 object-contain" />
                    <button 
                      onClick={resetBranding}
                      className="absolute -top-4 -right-4 p-2 bg-white text-rose-500 rounded-full shadow-lg border border-rose-100 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    <ImageIcon size={64} strokeWidth={1} />
                    <p className="text-xs mt-4 font-black uppercase tracking-widest">No custom logo</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white font-black rounded-3xl cursor-pointer hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20">
                  <Upload size={20} />
                  Choose Image
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                <button 
                  onClick={saveBranding}
                  disabled={isSaving || logoFile === settings.customLogo}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-brand text-white font-black rounded-3xl shadow-xl shadow-brand/20 transition-all active:scale-95 disabled:opacity-50
                    ${saveStatus === 'success' ? 'bg-emerald-500 shadow-emerald-500/20' : ''}
                  `}
                >
                  {isSaving ? <RefreshCw className="animate-spin" /> : saveStatus === 'success' ? <Check size={20} /> : <Save size={20} />}
                  {saveStatus === 'success' ? 'Success!' : 'Apply Logo'}
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest px-8">
                Recommended: 400x120px PNG/SVG with transparent background.
              </p>
            </div>
          </section>

          {/* Theme Selector */}
          <section className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-brand/10 text-brand rounded-2xl">
                <Palette size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">System Theme</h3>
                <p className="text-sm text-slate-400 font-medium tracking-wide">Environment styling presets</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(THEME_CONFIG) as AppTheme[]).map((tId) => (
                <button
                  key={tId}
                  onClick={() => updateTheme(tId)}
                  className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-4 group
                    ${settings.theme === tId ? 'border-brand bg-brand/5' : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'}
                  `}
                >
                  <div className={`w-12 h-12 rounded-2xl shadow-lg group-hover:scale-110 transition-transform flex items-center justify-center text-white`} style={{ backgroundColor: THEME_CONFIG[tId].primary }}>
                    {settings.theme === tId && <Check size={24} />}
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${settings.theme === tId ? 'text-brand' : 'text-slate-500'}`}>
                    {tId}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
               <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Sample Status Accent</h4>
               <div className="flex gap-4">
                  <div className="px-4 py-2 bg-white rounded-xl border-2 border-brand text-brand font-black text-[10px] shadow-sm">ACTIVE STATE</div>
                  <div className="px-4 py-2 bg-brand text-white rounded-xl font-black text-[10px] shadow-lg shadow-brand/20">ACTION BUTTON</div>
               </div>
            </div>
          </section>
        </div>

        <section className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl font-black flex items-center gap-4 tracking-tight"><Database className="text-brand" size={28} /> System Metadata</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Database Engine</p>
               <p className="text-lg font-black text-slate-900 tracking-tight">{dbStatus?.mode}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Region</p>
               <p className="text-lg font-black text-slate-900 tracking-tight">Colombia (AMER-SOUTH)</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">OCPP Port</p>
               <p className="text-lg font-black text-slate-900 tracking-tight">9000 (TLS Enabled)</p>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading && chargers.length === 0) return <div className="flex items-center justify-center h-[60vh]"><Activity size={48} className="text-brand animate-pulse" /></div>;
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
