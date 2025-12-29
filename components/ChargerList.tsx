
import React from 'react';
import { Charger, ChargerStatus, Language } from '../types';
import { translations } from '../locales/translations';
import { Power, Settings, RefreshCw, AlertTriangle, MapPin, Plus, X, Globe, Cpu } from 'lucide-react';

interface ChargerListProps {
  chargers: Charger[];
  onRemoteAction: (id: string, action: string) => void;
  onAddCharger: (charger: Partial<Charger>) => void;
  language: Language;
}

const ChargerList: React.FC<ChargerListProps> = ({ chargers, onRemoteAction, onAddCharger, language }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const t = translations[language];

  const [formData, setFormData] = React.useState({
    name: '',
    id: '',
    address: '',
    model: 'VoltCore 500'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCharger({
      name: formData.name,
      id: formData.id || `CP-${Math.floor(Math.random() * 10000)}`,
      location: { lat: 0, lng: 0, address: formData.address },
      model: formData.model,
      firmware: 'v1.0.0',
      status: ChargerStatus.AVAILABLE,
      currentPower: 0,
      totalEnergy: 0,
      lastHeartbeat: new Date().toISOString()
    });
    setIsModalOpen(false);
    setFormData({ name: '', id: '', address: '', model: 'VoltCore 500' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">{t.chargers}</h3>
          <p className="text-sm text-slate-500">Manage and monitor all hardware endpoints.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} /> {t.addCharger}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {chargers.map((charger) => {
          const isFaulted = charger.status === ChargerStatus.FAULTED;
          const statusKey = charger.status.toLowerCase() as keyof typeof t;
          const localizedStatus = (t as any)[statusKey] || charger.status;

          return (
            <div key={charger.id} className={`
              bg-white rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1
              ${isFaulted ? 'border-red-200 bg-red-50/10' : 'border-slate-200'}
            `}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 mr-2">
                  <h3 className="font-bold text-slate-900 leading-tight">{charger.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono bg-slate-50 inline-block px-1.5 py-0.5 rounded">{charger.id}</p>
                </div>
                <span className={`
                  px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap
                  ${charger.status === ChargerStatus.AVAILABLE ? 'bg-green-100 text-green-700' : ''}
                  ${charger.status === ChargerStatus.CHARGING ? 'bg-blue-100 text-blue-700 animate-pulse' : ''}
                  ${charger.status === ChargerStatus.FAULTED ? 'bg-red-100 text-red-700' : ''}
                  ${charger.status === ChargerStatus.FINISHING ? 'bg-amber-100 text-amber-700' : ''}
                `}>
                  {localizedStatus}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                    <MapPin size={14} />
                  </div>
                  <span className="truncate">{charger.location.address}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t.hardware}</p>
                    <p className="text-sm font-semibold text-slate-700">{charger.model}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t.currentLoad}</p>
                    <p className="text-sm font-semibold text-blue-600">{charger.currentPower} kW</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => onRemoteAction(charger.id, 'start')}
                    disabled={charger.status !== ChargerStatus.AVAILABLE}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                  >
                    <Power size={16} /> {t.remoteStart}
                  </button>
                  <button 
                    onClick={() => onRemoteAction(charger.id, 'reset')}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm active:scale-95"
                    title={t.reset}
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{t.addCharger}</h3>
                <p className="text-sm text-slate-500 mt-1">Onboard a new OCPP station.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form className="p-8 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1.5">
                    <Globe size={14} className="text-blue-500" /> Station Name
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none focus:border-blue-500 transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1.5">
                    <MapPin size={14} className="text-blue-500" /> {t.address}
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none focus:border-blue-500 transition-all"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargerList;
