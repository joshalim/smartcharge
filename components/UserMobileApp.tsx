import React, { useState, useEffect } from 'react';
import { Charger, User, Transaction, Language, ChargerStatus } from '../types';
import { translations } from '../locales/translations';
import { 
  MapPin, 
  Wallet, 
  BatteryCharging, 
  History, 
  User as UserIcon, 
  Search, 
  Zap, 
  Navigation, 
  QrCode, 
  ChevronRight, 
  Bell,
  CreditCard,
  Plus,
  X,
  Play
} from 'lucide-react';

interface UserMobileAppProps {
  chargers: Charger[];
  currentUser: User;
  transactions: Transaction[];
  onRemoteStart: (chargerId: string) => void;
  onTopUp: (amount: number) => void;
  language: Language;
}

const UserMobileApp: React.FC<UserMobileAppProps> = ({ chargers, currentUser, transactions, onRemoteStart, onTopUp, language }) => {
  const [activeTab, setActiveTab] = useState<'map' | 'wallet' | 'sessions' | 'profile'>('map');
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('50000');
  
  const t = translations[language];

  // Filter sessions specifically for this user
  const activeSessions = transactions.filter(tx => tx.userId === currentUser.id && tx.status === 'Active');
  const pastSessions = transactions.filter(tx => tx.userId === currentUser.id && tx.status === 'Completed');

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
      <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'map' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
        <MapPin size={24} fill={activeTab === 'map' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-black uppercase tracking-widest">{t.chargers}</span>
      </button>
      <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'wallet' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
        <Wallet size={24} fill={activeTab === 'wallet' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-black uppercase tracking-widest">{t.balance}</span>
      </button>
      <div className="relative -mt-12">
        <button className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-600/40 border-4 border-slate-50 active:scale-90 transition-transform">
          <QrCode size={28} />
        </button>
      </div>
      <button onClick={() => setActiveTab('sessions')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'sessions' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
        <BatteryCharging size={24} fill={activeTab === 'sessions' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-black uppercase tracking-widest">Sessions</span>
      </button>
      <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
        <UserIcon size={24} fill={activeTab === 'profile' ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
      </button>
    </div>
  );

  const MapView = () => (
    <div className="p-6 space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Find a Charger</h2>
          <p className="text-sm text-slate-500 font-medium">Nearby stations in Bogotá</p>
        </div>
        <button className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm relative">
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by address or station name..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
        />
      </div>

      <div className="space-y-4">
        {chargers.map(charger => (
          <div 
            key={charger.id} 
            onClick={() => setSelectedCharger(charger)}
            className="p-5 bg-white rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${charger.status === 'Available' ? 'bg-emerald-500 shadow-emerald-500/20' : charger.status === 'Charging' ? 'bg-blue-500 shadow-blue-500/20' : 'bg-slate-400 shadow-slate-400/20'}`}>
              <Zap size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-slate-800 tracking-tight leading-tight">{charger.name}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest flex items-center gap-1">
                <Navigation size={10} /> 0.8 km • {charger.status}
              </p>
            </div>
            <ChevronRight className="text-slate-300" size={20} />
          </div>
        ))}
      </div>
    </div>
  );

  const WalletView = () => (
    <div className="p-6 space-y-8 pb-24">
       <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-8 text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100 text-xs font-black uppercase tracking-widest mb-2 opacity-80">Current Balance</p>
            <h2 className="text-4xl font-black mb-6">{t.currencySymbol}{currentUser.balance.toLocaleString()}</h2>
            <button 
              onClick={() => setIsTopUpOpen(true)}
              className="px-8 py-3 bg-white text-blue-600 font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Add Credit
            </button>
          </div>
          <Wallet size={120} className="absolute -right-8 -bottom-8 text-white opacity-10" />
       </div>

       <section className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 ml-2">Recent Transactions</h3>
          {pastSessions.slice(0, 5).map(tx => (
            <div key={tx.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-500">
                   <History size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">{tx.chargerId}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{new Date(tx.startTime).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="font-black text-slate-900">-{t.currencySymbol}{tx.cost.toLocaleString()}</p>
            </div>
          ))}
       </section>
    </div>
  );

  const SessionsView = () => (
    <div className="p-6 space-y-6 pb-24 h-full">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Charging</h2>
      
      {activeSessions.length > 0 ? (
        activeSessions.map(session => (
          <div key={session.id} className="bg-white rounded-[40px] p-8 border border-blue-100 shadow-xl shadow-blue-500/5 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-xl text-slate-900">{session.chargerId}</h3>
                <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mt-1">Live Charging Session</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center animate-pulse">
                <Zap size={24} />
              </div>
            </div>

            <div className="flex justify-around items-center py-4">
               <div className="text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Energy</p>
                 <p className="text-2xl font-black text-slate-800">{session.energyConsumed} <span className="text-sm">kWh</span></p>
               </div>
               <div className="w-px h-10 bg-slate-100" />
               <div className="text-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cost</p>
                 <p className="text-2xl font-black text-blue-600">{t.currencySymbol}{session.cost.toLocaleString()}</p>
               </div>
            </div>

            <button className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all">
              Stop Charging
            </button>
          </div>
        ))
      ) : (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-40">
           <Zap size={80} strokeWidth={1} className="text-slate-300 mb-6" />
           <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No Active Session</h3>
           <p className="text-sm font-medium mt-2 max-w-[200px]">Find a station or scan a QR code to start charging.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col relative max-w-md mx-auto border-x border-slate-200 shadow-2xl">
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'map' && <MapView />}
        {activeTab === 'wallet' && <WalletView />}
        {activeTab === 'sessions' && <SessionsView />}
        {activeTab === 'profile' && (
          <div className="p-8 text-center py-20">
             <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[32px] mx-auto mb-6 flex items-center justify-center text-white text-3xl font-black shadow-xl">
               {currentUser.name.charAt(0)}
             </div>
             <h2 className="text-2xl font-black text-slate-900">{currentUser.name}</h2>
             <p className="text-slate-500 font-medium mb-8">{currentUser.email}</p>
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-4 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehicle Plate</p>
                  <p className="font-black text-slate-800">{currentUser.placa}</p>
               </div>
               <div className="bg-white p-4 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Card</p>
                  <p className="font-black text-slate-800">{currentUser.rfidTag.split('_')[1]}</p>
               </div>
             </div>
          </div>
        )}
      </div>

      <BottomNav />

      {/* Charger Details Modal */}
      {selectedCharger && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end">
           <div className="bg-white w-full rounded-t-[48px] p-8 space-y-8 animate-in slide-in-from-bottom-20 duration-300">
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedCharger.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{selectedCharger.location.address}</p>
                 </div>
                 <button onClick={() => setSelectedCharger(null)} className="p-2 bg-slate-50 rounded-full"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {selectedCharger.connectors.map(c => (
                   <div key={c.connectorId} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600">
                           <Zap size={24} />
                        </div>
                        <div>
                           <p className="text-sm font-black text-slate-800">{c.connectorType}</p>
                           <p className="text-xs font-bold text-blue-600">{t.currencySymbol}{c.pricePerKwh}/kWh</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          onRemoteStart(selectedCharger.id);
                          setSelectedCharger(null);
                          setActiveTab('sessions');
                        }}
                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${c.status === 'Available' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                         {c.status === 'Available' ? 'Start' : 'Busy'}
                      </button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Top Up Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
           <div className="bg-white w-full rounded-[40px] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">Add Credit</h3>
                <button onClick={() => setIsTopUpOpen(false)} className="p-2"><X size={20} className="text-slate-400" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                   {['20000', '50000', '100000'].map(amt => (
                     <button 
                      key={amt} 
                      onClick={() => setTopUpAmount(amt)}
                      className={`py-3 rounded-2xl font-black text-sm border-2 transition-all ${topUpAmount === amt ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-500'}`}
                     >
                       {/* Fix: Explicitly cast string to number before arithmetic division */}
                       {Number(amt) / 1000}k
                     </button>
                   ))}
                </div>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                   <input 
                    type="number" 
                    className="w-full pl-8 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-600/50"
                    value={topUpAmount}
                    onChange={e => setTopUpAmount(e.target.value)}
                   />
                </div>
              </div>

              <button 
                onClick={() => {
                  onTopUp(parseFloat(topUpAmount));
                  setIsTopUpOpen(false);
                }}
                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
              >
                Complete Payment
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserMobileApp;