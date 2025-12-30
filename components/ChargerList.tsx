
import React from 'react';
import { Charger, ChargerStatus, Language, ConnectorPricing } from '../types';
import { translations } from '../locales/translations';
import { Power, RefreshCw, MapPin, Plus, X, Globe, Cpu, DollarSign, Save, Zap, Trash2, PlusCircle, Pencil } from 'lucide-react';

interface ChargerListProps {
  chargers: Charger[];
  onRemoteAction: (id: string, action: string) => void;
  onAddCharger: (charger: Partial<Charger>) => void;
  onEditCharger: (id: string, updates: Partial<Charger>) => void;
  onDeleteCharger: (id: string) => void;
  language: Language;
}

const ChargerList: React.FC<ChargerListProps> = ({ chargers, onRemoteAction, onAddCharger, onEditCharger, onDeleteCharger, language }) => {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = React.useState(false);
  const [selectedCharger, setSelectedCharger] = React.useState<Charger | null>(null);
  const [connectorPricing, setConnectorPricing] = React.useState<ConnectorPricing[]>([]);

  const t = translations[language];

  const [formData, setFormData] = React.useState({ name: '', id: '', address: '', model: 'VoltCore 500' });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCharger({
      name: formData.name, id: formData.id || `CP-${Math.floor(Math.random() * 10000)}`,
      location: { lat: 0, lng: 0, address: formData.address },
      model: formData.model, status: ChargerStatus.AVAILABLE,
      currentPower: 0, totalEnergy: 0, lastHeartbeat: new Date().toISOString(),
      connectors: [{ connectorId: 1, pricePerKwh: 1200, pricePerMinute: 0, status: ChargerStatus.AVAILABLE }]
    });
    setIsAddModalOpen(false);
    setFormData({ name: '', id: '', address: '', model: 'VoltCore 500' });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCharger) return;
    onEditCharger(selectedCharger.id, {
      name: formData.name,
      location: { ...selectedCharger.location, address: formData.address },
      model: formData.model
    });
    setIsEditModalOpen(false);
  };

  const handleOpenEdit = (charger: Charger) => {
    setSelectedCharger(charger);
    setFormData({ name: charger.name, id: charger.id, address: charger.location.address, model: charger.model });
    setIsEditModalOpen(true);
  };

  const handleOpenPricing = (charger: Charger) => {
    setSelectedCharger(charger);
    setConnectorPricing(charger.connectors || []);
    setIsPricingModalOpen(true);
  };

  const handleSavePricing = () => {
    if (!selectedCharger) return;
    onEditCharger(selectedCharger.id, { connectors: connectorPricing });
    setIsPricingModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete charger "${name}"? This will remove it from the management dashboard.`)) {
      onDeleteCharger(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div><h3 className="text-xl font-bold text-slate-800">{t.chargers}</h3></div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20"><Plus size={20} /> {t.addCharger}</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {chargers.map((charger) => (
          <div key={charger.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{charger.name}</h3>
                <p className="text-xs text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded mt-1">{charger.id}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenEdit(charger)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={18} /></button>
                <button onClick={() => handleOpenPricing(charger)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><DollarSign size={18} /></button>
                <button onClick={() => handleDelete(charger.id, charger.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
              </div>
            </div>
            
            <div className="mb-6 grid grid-cols-2 gap-3">
              {charger.connectors.map(c => (
                <div key={c.connectorId} className={`p-3 rounded-xl border text-xs font-bold ${c.status === 'Charging' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                  C#{c.connectorId} - {c.status}
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2 text-xs text-slate-600 truncate"><MapPin size={14} /> {charger.location.address}</div>
              <div className="flex gap-2">
                <button onClick={() => onRemoteAction(charger.id, 'start')} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm"><Power size={16} /> {t.remoteStart}</button>
                <button onClick={() => onRemoteAction(charger.id, 'reset')} className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"><RefreshCw size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-2xl font-bold">{isEditModalOpen ? t.editUser : t.addCharger}</h3>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}><X size={20} className="text-slate-400" /></button>
            </div>
            <form className="p-8 space-y-4" onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit}>
              <input placeholder="Name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              {!isEditModalOpen && <input placeholder="Station ID (Optional)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} />}
              <input placeholder="Address" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {isPricingModalOpen && selectedCharger && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-2xl font-bold">{t.editPricing}</h3>
              <button onClick={() => setIsPricingModalOpen(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-8 space-y-4 overflow-y-auto flex-1">
              {connectorPricing.map((cp, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-700">Connector #{cp.connectorId}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Price/kWh" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg" value={cp.pricePerKwh} onChange={e => { const n = [...connectorPricing]; n[idx].pricePerKwh = parseFloat(e.target.value); setConnectorPricing(n); }} />
                    <input type="number" placeholder="Price/Min" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg" value={cp.pricePerMinute} onChange={e => { const n = [...connectorPricing]; n[idx].pricePerMinute = parseFloat(e.target.value); setConnectorPricing(n); }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 border-t border-slate-100 flex gap-3">
              <button onClick={() => setIsPricingModalOpen(false)} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Cancel</button>
              <button onClick={handleSavePricing} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Save size={18} /> {t.savePricing}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargerList;
