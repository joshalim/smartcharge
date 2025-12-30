
import React from 'react';
import { Charger, Transaction, ChargerStatus, Language } from '../types';
import { translations } from '../locales/translations';
import { 
  Zap, 
  Clock, 
  DollarSign, 
  BatteryCharging,
  Activity,
  AlertCircle,
  CheckCircle2,
  Database
} from 'lucide-react';
import { LiveEvent } from '../App';

interface DashboardProps {
  chargers: Charger[];
  transactions: Transaction[];
  liveEvents: LiveEvent[];
  language: Language;
  isLive?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ chargers, transactions, liveEvents, language, isLive }) => {
  const t = translations[language];
  const activeChargers = chargers.filter(c => c.status === ChargerStatus.CHARGING).length;
  const totalRevenue = transactions.reduce((acc, tr) => acc + tr.cost, 0);
  const totalEnergy = chargers.reduce((acc, c) => acc + c.totalEnergy, 0);
  const currentLoad = chargers.reduce((acc, c) => acc + c.currentPower, 0);

  const StatCard = ({ title, value, icon: Icon, color, sub }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
        {isLive && (
          <div className="flex items-center text-emerald-500 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
            <Database size={10} className="mr-1" />
            Live
          </div>
        )}
      </div>
      <div className="relative z-10">
        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider text-[10px]">{title}</h3>
        <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-1 font-mono">{sub}</p>}
      </div>
      <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={100} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t.activeSessions} 
          value={activeChargers} 
          icon={BatteryCharging} 
          color="bg-blue-600"
          sub="Live sessions active"
        />
        <StatCard 
          title={t.totalEnergy} 
          value={`${totalEnergy.toFixed(1)} kWh`} 
          icon={Zap} 
          color="bg-amber-500"
          sub="Cumulative TSDB data"
        />
        <StatCard 
          title={t.currentLoad} 
          value={`${currentLoad.toFixed(2)} kW`} 
          icon={Activity} 
          color="bg-indigo-600"
          sub="Real-time power stream"
        />
        <StatCard 
          title={t.dailyRevenue} 
          value={`${t.currencySymbol}${totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-emerald-600"
          sub="Recent income stream"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                   <Activity className="text-blue-600" />
                   {t.monitoringGrid}
                </h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isLive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                   {isLive ? 'Network Synchronized' : 'Offline Simulation'}
                </span>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {chargers.slice(0, 4).map(charger => (
                   <div key={charger.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full ${charger.status === 'Available' ? 'bg-emerald-500' : 'bg-blue-500'} shadow-sm`}></div>
                         <div>
                            <p className="text-xs font-black text-slate-800">{charger.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">{charger.id}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-slate-700">{charger.currentPower} kW</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full max-h-[500px]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
            <Clock className="text-blue-500" size={20} />
            {t.liveEventStream}
          </h3>
          <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
            {liveEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <Activity size={32} className="mb-2 animate-pulse" />
                <p className="text-xs font-bold uppercase tracking-widest">{t.waitingEvents}</p>
              </div>
            ) : (
              liveEvents.map((event) => (
                <div key={event.id} className="flex gap-3 animate-in fade-in slide-in-from-right-4 duration-300 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="mt-1">
                    {event.type === 'error' && <AlertCircle size={16} className="text-red-500" />}
                    {event.type === 'success' && <CheckCircle2 size={16} className="text-green-500" />}
                    {(event.type === 'info' || event.type === 'warning') && <Activity size={16} className="text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${event.type === 'error' ? 'text-red-700' : 'text-slate-700'}`}>
                      {event.message}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
