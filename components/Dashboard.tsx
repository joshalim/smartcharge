
import React from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { Charger, Transaction, ChargerStatus, Language } from '../types';
import { translations } from '../locales/translations';
import { 
  Zap, 
  Clock, 
  DollarSign, 
  TrendingUp,
  BatteryCharging,
  Activity,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { LiveEvent } from '../App';

interface DashboardProps {
  chargers: Charger[];
  transactions: Transaction[];
  liveEvents: LiveEvent[];
  language: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ chargers, transactions, liveEvents, language }) => {
  const t = translations[language];
  const activeChargers = chargers.filter(c => c.status === ChargerStatus.CHARGING).length;
  const totalRevenue = transactions.reduce((acc, tr) => acc + tr.cost, 0);
  const totalEnergy = chargers.reduce((acc, c) => acc + c.totalEnergy, 0);
  const currentLoad = chargers.reduce((acc, c) => acc + c.currentPower, 0);

  const energyData = [
    { time: '10:00', value: 340 },
    { time: '12:00', value: 450 },
    { time: '14:00', value: 390 },
    { time: '16:00', value: 620 },
    { time: '18:00', value: 580 },
    { time: '20:00', value: 310 },
    { time: 'NOW', value: Math.round(currentLoad * 10) },
  ];

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
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1 font-mono">{sub}</p>}
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
          sub="Live monitoring active"
        />
        <StatCard 
          title={t.totalEnergy} 
          value={`${totalEnergy.toFixed(1)} kWh`} 
          icon={Zap} 
          color="bg-amber-500"
          trend="+5.4%" 
          sub="Updated 3s ago"
        />
        <StatCard 
          title={t.currentLoad} 
          value={`${currentLoad.toFixed(2)} kW`} 
          icon={Activity} 
          color="bg-indigo-600"
          sub="Aggregate peak output"
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
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="text-blue-500" size={20} />
              {t.currentLoad} Distribution (kW)
            </h3>
            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
               <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
               {t.liveTelemetry}
            </span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={energyData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#2563eb" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity className="text-slate-400" size={20} />
            {t.liveEventStream}
          </h3>
          <div className="flex-1 overflow-auto space-y-4 pr-2">
            {liveEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <Clock size={32} className="mb-2" />
                <p className="text-sm">{t.waitingEvents}</p>
              </div>
            ) : (
              liveEvents.map((event) => (
                <div key={event.id} className="flex gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="mt-1">
                    {event.type === 'error' && <AlertCircle size={16} className="text-red-500" />}
                    {event.type === 'success' && <CheckCircle2 size={16} className="text-green-500" />}
                    {(event.type === 'info' || event.type === 'warning') && <Activity size={16} className="text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${event.type === 'error' ? 'text-red-700' : 'text-slate-700'}`}>
                      {event.message}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">{t.monitoringGrid}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 font-semibold text-slate-600">{t.stationId}</th>
                <th className="pb-4 font-semibold text-slate-600">{t.currentLoad}</th>
                <th className="pb-4 font-semibold text-slate-600">{t.totalEnergy}</th>
                <th className="pb-4 font-semibold text-slate-600">{t.heartbeat}</th>
                <th className="pb-4 font-semibold text-slate-600">{t.status}</th>
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
                       <div className={`w-2 h-2 rounded-full ${charger.status === ChargerStatus.AVAILABLE ? 'bg-green-500' : charger.status === ChargerStatus.CHARGING ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></div>
                       <span className="text-slate-900 font-medium">{charger.id}</span>
                    </div>
                  </td>
                  <td className="py-4 text-slate-600 font-mono">{charger.currentPower.toFixed(2)} kW</td>
                  <td className="py-4 text-slate-600 font-mono">{(charger.totalEnergy % 50).toFixed(2)} kWh</td>
                  <td className="py-4 text-slate-500 text-sm">Recently active</td>
                  <td className="py-4">
                    <span className={`
                      px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest
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
