
import React from 'react';
import { Charger, ChargerStatus, Language, ConnectorPricing } from '../types';
import { translations } from '../locales/translations';
import { Power, Settings, RefreshCw, AlertTriangle, MapPin, Plus, X, Globe, Cpu, DollarSign, Save, Zap } from 'lucide-react';

interface ChargerListProps {
  chargers: Charger[];
  onRemoteAction: (id: string, action: string) => void;
  onAddCharger: (charger: Partial<Charger>) => void;
  language: Language;
}

const ChargerList: React.FC<ChargerListProps> = ({ chargers, onRemoteAction, onAddCharger, language }) => {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = React.useState(false);
  const [selectedCharger, setSelectedCharger] = React.useState<Charger | null>(null);
  const [connectorPricing, setConnectorPricing] = React.useState<ConnectorPricing[]>([]);

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
      lastHeartbeat: new Date().toISOString(),
      connectors: [{ connectorId: 1, pricePerKwh: 1000, pricePerMinute: 0, status: ChargerStatus.AVAILABLE }]
    });
    setIsAddModalOpen(false);
    setFormData({ name: '', id: '', address: '', model: 'VoltCore 500' });
  };

  const handleOpenPricing = (charger: Charger) => {
    setSelectedCharger(charger);
    setConnectorPricing(charger.connectors || [{ connectorId: 1, pricePerKwh: 0, pricePerMinute: 0, status: charger.status }]);
    setIsPricingModalOpen(true);
  };

  const handleSavePricing = async () => {
    if (!selectedCharger) return;
    try {
      const response = await fetch(`/api/chargers/${selectedCharger.id}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectors: connectorPricing })
      });
      if (response.ok) {
        setIsPricingModalOpen(false);
        // In a real app, you'd trigger a data refresh here
        window.location.reload(); 
      }
    } catch (error) {
      console.error("Failed to save pricing", error);
    }
  };

  const updateConnectorPricing = (id: number, field: keyof ConnectorPricing, value: number) => {
    setConnectorPricing(prev => prev.map(cp => cp.connectorId === id ? { ...cp, [field]: value } : cp));
  };

  const getStatusStyles = (status: ChargerStatus) => {
    switch (status) {
      case ChargerStatus.AVAILABLE:
        return 'bg-green-100 text-green-700 border-green-200';
      case ChargerStatus.CHARGING:
        return 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse';
      case ChargerStatus.FAULTED:
        return 'bg-red-100 text-red-700 border-red-200';
      case ChargerStatus.FINISHING:
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case ChargerStatus.PREPARING:
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">{t.chargers}</h3>
          <p className="text-sm text-slate-500">Manage and monitor all hardware endpoints.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} /> {t.addCharger}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {chargers.map((charger) => {
          const isAnyFaulted = charger.connectors.some(c => c.status === ChargerStatus.FAULTED) || charger.status === ChargerStatus.FAULTED;

          return (
            <div key={charger.id} className={`
              bg-white rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1
              ${isAnyFaulted ? 'border-red-200 bg-red-50/10 shadow-red-500/5' : 'border-slate-200'}
            `}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1 mr-2">
                  <h3 className="font-bold text-slate-900 leading-tight">{charger.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono bg-slate-50 inline-block px-1.5 py-0.5 rounded">{charger.id}</p>
                </div>
                <button 
                    onClick={() => handleOpenPricing(charger)}
                    className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                    title={t.pricing}
                >
                    <DollarSign size={18} />
                </button>
              </div>

              {/* Connector Status Grid */}
              <div className="mb-6 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{t.connector} Status</p>
                <div className="grid grid-cols-2 gap-3">
                  {charger.connectors.map((connector) => {
                    const statusKey = connector.status.toLowerCase() as keyof typeof t;
                    const localizedStatus = (t as any)[statusKey] || connector.status;
                    return (
                      <div 
                        key={`${charger.id}-c${connector.connectorId}`}
                        className={`
                          flex flex-col p-3 rounded-xl border transition-all
                          ${getStatusStyles(connector.status)}
                        `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase opacity-60">ID #{connector.connectorId}</span>
                          {connector.status === ChargerStatus.CHARGING && <Zap size={10} className="fill-current" />}
                        </div>
                        <span className="text-xs font-bold leading-none">{localizedStatus}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                    <MapPin size={14} />
                  </div>
                  <span className="truncate text-xs font-medium">{charger.location.address}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t.hardware}</p>
                    <p className="text-xs font-bold text-slate-700">{charger.model}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t.currentLoad}</p>
                    <p className="text-xs font-bold text-blue-600">{charger.currentPower} kW</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => onRemoteAction(charger.id, 'start')}
                    disabled={!charger.connectors.some(c => c.status === ChargerStatus.AVAILABLE)}
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

      {/* Pricing Modal */}
      {isPricingModalOpen && selectedCharger && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{t.editPricing}</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedCharger.name} ({selectedCharger.id})</p>
              </div>
              <button onClick={() => setIsPricingModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              {connectorPricing.map((cp) => (
                <div key={cp.connectorId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <Cpu size={16} className="text-blue-500" /> {t.connector} #{cp.connectorId}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{t.pricePerKwh}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input 
                          type="number"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                          value={cp.pricePerKwh}
                          onChange={(e) => updateConnectorPricing(cp.connectorId, 'pricePerKwh', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{t.pricePerMinute}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input 
                          type="number"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                          value={cp.pricePerMinute}
                          onChange={(e) => updateConnectorPricing(cp.connectorId, 'pricePerMinute', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-4 flex gap-3">
                <button onClick={() => setIsPricingModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={handleSavePricing} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                  <Save size={18} /> {t.savePricing}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{t.addCharger}</h3>
                <p className="text-sm text-slate-500 mt-1">Onboard a new OCPP station.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
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
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
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
