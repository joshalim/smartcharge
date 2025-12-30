
import React from 'react';
import { Charger, ChargerStatus, ConnectorType, Language, ConnectorPricing } from '../types';
import { translations } from '../locales/translations';
import { 
  Power, RefreshCw, MapPin, Plus, X, Globe, Cpu, DollarSign, Save, 
  Zap, Trash2, PlusCircle, Pencil, Info, Map as MapIcon, ChevronDown 
} from 'lucide-react';

interface ChargerListProps {
  chargers: Charger[];
  onRemoteAction: (id: string, action: string) => void;
  onAddCharger: (charger: Partial<Charger>) => void;
  onEditCharger: (id: string, updates: Partial<Charger>) => void;
  onDeleteCharger: (id: string) => void;
  language: Language;
}

const ConnectorIcon = ({ type, size = 20 }: { type: ConnectorType; size?: number }) => {
  // Simple graphic mapping for EV connector types
  switch (type) {
    case ConnectorType.CCS2:
      return <Zap size={size} className="text-orange-500" />;
    case ConnectorType.TYPE2:
      return <Cpu size={size} className="text-blue-500" />;
    case ConnectorType.CHADEMO:
      return <Globe size={size} className="text-emerald-500" />;
    default:
      return <Zap size={size} className="text-slate-400" />;
  }
};

const ChargerList: React.FC<ChargerListProps> = ({ chargers, onRemoteAction, onAddCharger, onEditCharger, onDeleteCharger, language }) => {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = React.useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = React.useState(false);
  const [selectedCharger, setSelectedCharger] = React.useState<Charger | null>(null);
  const [connectorPricing, setConnectorPricing] = React.useState<ConnectorPricing[]>([]);

  const t = translations[language];

  const [formData, setFormData] = React.useState({ 
    name: '', id: '', address: '', model: 'VoltCore 500', lat: 4.6, lng: -74.0 
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCharger({
      name: formData.name, id: formData.id || `CP-${Math.floor(Math.random() * 10000)}`,
      location: { lat: formData.lat, lng: formData.lng, address: formData.address },
      model: formData.model, status: ChargerStatus.AVAILABLE,
      currentPower: 0, totalEnergy: 0, lastHeartbeat: new Date().toISOString(),
      connectors: [{ 
        connectorId: 1, 
        connectorType: ConnectorType.CCS2, 
        pricePerKwh: 1200, 
        pricePerMinute: 0, 
        status: ChargerStatus.AVAILABLE 
      }]
    });
    setIsAddModalOpen(false);
    setFormData({ name: '', id: '', address: '', model: 'VoltCore 500', lat: 4.6, lng: -74.0 });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCharger) return;
    onEditCharger(selectedCharger.id, {
      name: formData.name,
      location: { ...selectedCharger.location, address: formData.address, lat: formData.lat, lng: formData.lng },
      model: formData.model
    });
    setIsEditModalOpen(false);
  };

  const handleOpenEdit = (charger: Charger) => {
    setSelectedCharger(charger);
    setFormData({ 
      name: charger.name, 
      id: charger.id, 
      address: charger.location.address, 
      model: charger.model,
      lat: charger.location.lat,
      lng: charger.location.lng
    });
    setIsEditModalOpen(true);
  };

  const handleOpenPricing = (charger: Charger) => {
    setSelectedCharger(charger);
    setConnectorPricing(charger.connectors || []);
    setIsPricingModalOpen(true);
  };

  const handleAddConnector = () => {
    const nextId = connectorPricing.length > 0 ? Math.max(...connectorPricing.map(c => c.connectorId)) + 1 : 1;
    setConnectorPricing([
      ...connectorPricing, 
      { 
        connectorId: nextId, 
        connectorType: ConnectorType.TYPE2, 
        pricePerKwh: 1000, 
        pricePerMinute: 0, 
        status: ChargerStatus.AVAILABLE 
      }
    ]);
  };

  const handleSavePricing = () => {
    if (!selectedCharger) return;
    onEditCharger(selectedCharger.id, { connectors: connectorPricing });
    setIsPricingModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete charger "${name}"?`)) {
      onDeleteCharger(id);
    }
  };

  const openMap = (charger: Charger) => {
    setSelectedCharger(charger);
    setIsMapModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div><h3 className="text-xl font-bold text-slate-800">{t.chargers}</h3></div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"><Plus size={20} /> {t.addCharger}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {chargers.map((charger) => (
          <div key={charger.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                   <h3 className="font-bold text-slate-900">{charger.name}</h3>
                   <span className={`w-2 h-2 rounded-full ${charger.status === ChargerStatus.AVAILABLE ? 'bg-emerald-500' : charger.status === ChargerStatus.CHARGING ? 'bg-blue-500' : 'bg-rose-500'} animate-pulse`}></span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-slate-100">{charger.id}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openMap(charger)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title={t.viewMap}><MapIcon size={18} /></button>
                <button onClick={() => handleOpenEdit(charger)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={18} /></button>
                <button onClick={() => handleOpenPricing(charger)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><DollarSign size={18} /></button>
                <button onClick={() => handleDelete(charger.id, charger.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
              </div>
            </div>
            
            <div className="mb-6 grid grid-cols-1 gap-2">
              {charger.connectors.map(c => (
                <div key={c.connectorId} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${c.status === 'Charging' ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                       <ConnectorIcon type={c.connectorType} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">#{c.connectorId} • {c.connectorType}</div>
                      <div className={`text-xs font-bold ${c.status === 'Charging' ? 'text-blue-700' : 'text-slate-700'}`}>{c.status}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-500">{t.currencySymbol}{c.pricePerKwh}/kWh</div>
                    {c.pricePerMinute > 0 && <div className="text-[10px] text-slate-400">{t.currencySymbol}{c.pricePerMinute}/min</div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2 text-xs text-slate-600 truncate hover:text-blue-600 cursor-pointer" onClick={() => openMap(charger)}><MapPin size={14} className="text-slate-400" /> {charger.location.address}</div>
              <div className="flex gap-2">
                <button onClick={() => onRemoteAction(charger.id, 'start')} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-sm hover:bg-blue-700 active:scale-95 transition-all"><Power size={16} /> {t.remoteStart}</button>
                <button onClick={() => onRemoteAction(charger.id, 'reset')} className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 transition-all"><RefreshCw size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Map Modal */}
      {isMapModalOpen && selectedCharger && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{selectedCharger.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={12}/> {selectedCharger.location.address}</p>
              </div>
              <button onClick={() => setIsMapModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
            </div>
            <div className="aspect-video w-full bg-slate-100 relative">
               <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-400 bg-slate-200">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-xl">
                    <MapPin size={32} />
                  </div>
                  <p className="font-black uppercase tracking-widest text-xs">Lat: {selectedCharger.location.lat} | Lng: {selectedCharger.location.lng}</p>
                  <p className="text-sm mt-2 opacity-60 font-medium">Map visualization ready for integration.</p>
               </div>
            </div>
            <div className="p-8 flex justify-end gap-3">
               <button onClick={() => setIsMapModalOpen(false)} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95">Close View</button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing & Connector Management Modal */}
      {isPricingModalOpen && selectedCharger && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{t.editPricing}</h3>
                <p className="text-sm text-slate-400">{selectedCharger.name}</p>
              </div>
              <button onClick={() => setIsPricingModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-8 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {connectorPricing.map((cp, idx) => (
                <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 relative group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-black">#{cp.connectorId}</div>
                       <select 
                         className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                         value={cp.connectorType}
                         onChange={e => {
                           const n = [...connectorPricing];
                           n[idx].connectorType = e.target.value as ConnectorType;
                           setConnectorPricing(n);
                         }}
                       >
                         {Object.values(ConnectorType).map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </div>
                    <button 
                      onClick={() => setConnectorPricing(connectorPricing.filter((_, i) => i !== idx))}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">{t.pricePerKwh}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                        <input type="number" className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" value={cp.pricePerKwh} onChange={e => { const n = [...connectorPricing]; n[idx].pricePerKwh = parseFloat(e.target.value); setConnectorPricing(n); }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">{t.pricePerMinute}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                        <input type="number" className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" value={cp.pricePerMinute} onChange={e => { const n = [...connectorPricing]; n[idx].pricePerMinute = parseFloat(e.target.value); setConnectorPricing(n); }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={handleAddConnector}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 flex items-center justify-center gap-2 font-bold hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all active:scale-[0.98]"
              >
                <Plus size={20} /> {t.addConnector}
              </button>
            </div>
            <div className="p-8 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button onClick={() => setIsPricingModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
              <button onClick={handleSavePricing} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"><Save size={18} /> {t.savePricing}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Basic Info Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">{isEditModalOpen ? t.editUser : t.addCharger}</h3>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
            </div>
            <form className="p-8 space-y-4" onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit}>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                <input placeholder="Ex: Estación Central" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              {!isEditModalOpen && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID (Optional)</label>
                  <input placeholder="Ex: CP-ALPHA-01" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                <input placeholder="Physical location..." className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                  <input type="number" step="any" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono" value={formData.lat} onChange={e => setFormData({...formData, lat: parseFloat(e.target.value)})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                  <input type="number" step="any" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono" value={formData.lng} onChange={e => setFormData({...formData, lng: parseFloat(e.target.value)})} required />
                </div>
              </div>
              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-3.5 bg-slate-100 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargerList;
