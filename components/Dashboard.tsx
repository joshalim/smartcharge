
import React from 'react';
import { Charger, Transaction, ChargerStatus, Language, GrafanaConfig } from '../types';
import { translations } from '../locales/translations';
import { 
  Zap, 
  Clock, 
  DollarSign, 
  TrendingUp,
  BatteryCharging,
  Activity,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { LiveEvent } from '../App';

interface DashboardProps {
  chargers: Charger[];
  transactions: Transaction[];
  liveEvents: LiveEvent[];
  language: Language;
  grafanaConfig: GrafanaConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ chargers, transactions, liveEvents, language, grafanaConfig }) => {
  const t = translations[language];
  const activeChargers = chargers.filter(c => c.status === ChargerStatus.CHARGING).length;
  const totalRevenue = transactions.reduce((acc, tr) => acc + tr.cost, 0);
  const totalEnergy = chargers.reduce((acc, c) => acc + c.totalEnergy, 0);
  const currentLoad = chargers.reduce((acc, c) => acc + c.currentPower, 0);

  // Construct Grafana URL
  // Defaulting to a sensible localhost if not configured
  const grafanaSrc = `${grafanaConfig.url}/d/${grafanaConfig.dashboardUid}?orgId=1&refresh=${grafanaConfig.refreshInterval}&kiosk&theme=${grafanaConfig.theme}`;

  const StatCard = ({ title, value, icon: Icon, color, trend, sub }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
        {trend && (
          <div className="flex items-center text-green-600 text-sm font-medium">
            <TrendingUp size={16} className="mr-1" />
            {trend}
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
          trend="+12%" 
          sub="Live sessions active"
        />
        <StatCard 
          title={t.totalEnergy} 
          value={`${totalEnergy.toFixed(1)} kWh`} 
          icon={Zap} 
          color="bg-amber-500"
          trend="+5.4%" 
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
          trend="+8.2%" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Activity className="text-indigo-400" size={18} />
              Grafana {t.liveTelemetry}
            </h3>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                TSDB STREAMING
              </span>
              <a href={grafanaConfig.url} target="_blank" className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
          <div className="flex-1 relative bg-[#111111]">
            <iframe 
              src={grafanaSrc} 
              width="100%" 
              height="100%" 
              frameBorder="0"
              className="absolute inset-0"
              title="Grafana Dashboard"
            ></iframe>
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

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase tracking-widest text-xs flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            {t.monitoringGrid}
          </h3>
          <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
            <Maximize2 size={14} /> Full Map
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="pb-4">{t.stationId}</th>
                <th className="pb-4">{t.currentLoad}</th>
                <th className="pb-4">{t.totalEnergy}</th>
                <th className="pb-4 text-center">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {chargers.map((charger) => {
                const statusKey = charger.status.toLowerCase() as keyof typeof t;
                const localizedStatus = (t as any)[statusKey] || charger.status;

                return (
                <tr key={charger.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                       <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-offset-2 ${
                         charger.status === ChargerStatus.AVAILABLE ? 'bg-green-500 ring-green-100' : 
                         charger.status === ChargerStatus.CHARGING ? 'bg-blue-500 ring-blue-100 animate-pulse' : 
                         'bg-red-500 ring-red-100'
                       }`}></div>
                       <span className="text-slate-900 font-bold font-mono text-sm">{charger.id}</span>
                    </div>
                  </td>
                  <td className="py-4 text-slate-600 font-mono text-xs">{charger.currentPower.toFixed(2)} kW</td>
                  <td className="py-4 text-slate-600 font-mono text-xs">{(charger.totalEnergy % 50).toFixed(2)} kWh</td>
                  <td className="py-4 text-center">
                    <span className={`
                      px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter
                      ${charger.status === ChargerStatus.AVAILABLE ? 'bg-green-100 text-green-700' : 
                        charger.status === ChargerStatus.CHARGING ? 'bg-blue-100 text-blue-700' : 
                        'bg-red-100 text-red-700'}
                    `}>
                      {localizedStatus}
                    </span>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
