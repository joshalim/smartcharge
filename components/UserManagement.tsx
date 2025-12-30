
import React from 'react';
import { User, Language } from '../types';
import { translations } from '../locales/translations';
import { 
  Plus, ShieldAlert, CheckCircle2, Search, Wallet, X, Loader2, 
  Smartphone, Zap, CarFront, Pencil, Phone, AlertCircle, FileUp, 
  Calendar, Check, ChevronRight, CreditCard, Building2, ExternalLink
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Partial<User>) => void;
  onBulkAddUsers: (users: Partial<User>[]) => void;
  onEditUser: (userId: string, user: Partial<User>) => void;
  onUpdateStatus: (id: string, updates: Partial<User>) => void;
  onTopUp: (userId: string, amount: number) => void;
  language: Language;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onBulkAddUsers, onEditUser, onUpdateStatus, onTopUp, language }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [topUpAmount, setTopUpAmount] = React.useState<string>('50000');
  const [selectedMethod, setSelectedMethod] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [paymentStatus, setPaymentStatus] = React.useState<'idle' | 'initiating' | 'checkout' | 'success' | 'error'>('idle');
  const [payuParams, setPayuParams] = React.useState<any>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [userFormData, setUserFormData] = React.useState({
    name: '', email: '', phoneNumber: '', placa: '', cedula: '', rfidTag: '', rfidExpiration: ''
  });

  const t = translations[language];
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.rfidTag.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      ...userFormData, 
      rfidExpiration: new Date(userFormData.rfidExpiration).toISOString() 
    };
    
    if (isEditModalOpen && selectedUser) {
      onEditUser(selectedUser.id, payload);
    } else {
      onAddUser({ 
        ...payload, 
        id: `USR-${Math.floor(Math.random() * 1000)}`, 
        balance: 0, 
        status: 'Active', 
        joinedDate: new Date().toISOString() 
      });
    }
    setIsModalOpen(false);
    setIsEditModalOpen(false);
  };

  const handleOpenTopUp = (user: User) => { 
    setSelectedUser(user); 
    setIsTopUpModalOpen(true); 
    setPaymentStatus('idle'); 
    setSelectedMethod(null);
  };

  const handleInitiatePayU = async () => {
    if (!selectedUser || !selectedMethod) return;
    setIsProcessing(true);
    setPaymentStatus('initiating');

    try {
      const res = await fetch('/api/payments/payu/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: parseFloat(topUpAmount),
          method: selectedMethod
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setPayuParams(data.params);
        setPaymentStatus('checkout');
      } else {
        setPaymentStatus('error');
      }
    } catch (e) {
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateSuccess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onTopUp(selectedUser!.id, parseFloat(topUpAmount));
      setPaymentStatus('success');
      setIsProcessing(false);
      setTimeout(() => setIsTopUpModalOpen(false), 2000);
    }, 1500);
  };

  const getExpiryLabel = (dateStr: string) => {
    const exp = new Date(dateStr);
    const now = new Date();
    const diffDays = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
    
    if (diffDays < 0) return { label: t.expired, color: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (diffDays < 30) return { label: t.expiryWarning, color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: exp.toLocaleDateString(), color: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  const paymentMethods = [
    { id: 'NEQUI', name: 'Nequi', color: 'bg-[#7000FF] text-white', icon: Smartphone },
    { id: 'DAVIPLATA', name: 'Daviplata', color: 'bg-[#ED1C24] text-white', icon: Smartphone },
    { id: 'BRE_B', name: 'Bre-B', color: 'bg-[#00D1FF] text-slate-900', icon: Zap },
    { id: 'PAYU', name: 'PayU / Card', color: 'bg-[#B4D233] text-slate-900', icon: CreditCard }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder} 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={(e) => {}} />
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <FileUp size={18} className="text-blue-500" />
            CSV Import
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
            <Plus size={18} /> {t.addUser}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Plate / ID</th>
              <th className="px-6 py-4">RFID Card</th>
              <th className="px-6 py-4">RFID Expiry</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Balance</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map((user) => {
              const expiry = getExpiryLabel(user.rfidExpiration);
              return (
                <tr key={user.id} className="hover:bg-blue-50/30 group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm border-2 border-white shadow-sm">{user.name.charAt(0)}</div>
                      <div><p className="font-bold text-slate-900">{user.name}</p><p className="text-[10px] text-slate-400 font-medium">{user.email}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2"><CarFront size={14} className="text-blue-500" /> {user.placa}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.cedula}</div>
                  </td>
                  <td className="px-6 py-4"><span className="font-mono text-[10px] font-black bg-slate-100 px-2 py-1 rounded border border-slate-200">{user.rfidTag}</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1 w-fit ${expiry.color}`}>
                       <Calendar size={10} /> {expiry.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => onUpdateStatus(user.id, { status: user.status === 'Active' ? 'Blocked' : 'Active' })} className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border transition-all active:scale-95 ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                      {user.status === 'Active' ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />} {user.status === 'Active' ? t.active : t.blocked}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 text-sm font-mono">{t.currencySymbol}{user.balance.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setSelectedUser(user); setUserFormData({ ...user, rfidExpiration: user.rfidExpiration.split('T')[0] }); setIsEditModalOpen(true); }} className="p-2 rounded-lg border border-slate-100 bg-white hover:text-blue-600 shadow-sm transition-all hover:scale-110"><Pencil size={18} /></button>
                      <button onClick={() => handleOpenTopUp(user)} className="p-2 rounded-lg border border-slate-100 bg-white hover:text-emerald-600 shadow-sm transition-all hover:scale-110"><Wallet size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Top Up Modal with PayU Colombia Integration */}
      {isTopUpModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50 rounded-t-[40px]">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm">
                    <Wallet size={24} />
                 </div>
                 <div>
                    <h3 className="font-black text-xl text-slate-900">{t.topUp}</h3>
                    <p className="text-xs text-slate-500 font-medium">{selectedUser.name}</p>
                 </div>
              </div>
              <button onClick={() => setIsTopUpModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto">
              {paymentStatus === 'success' ? (
                <div className="py-10 text-center flex flex-col items-center animate-in zoom-in-50 duration-500">
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 size={48} />
                  </div>
                  <h4 className="font-black text-2xl text-slate-900">{t.paymentSuccess}</h4>
                  <p className="text-slate-500 mt-2 font-medium">RFID wallet has been credited.</p>
                </div>
              ) : paymentStatus === 'checkout' && payuParams ? (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 flex items-center gap-4">
                    <div className="p-4 bg-white rounded-2xl shadow-sm">
                       <CreditCard size={32} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">PayU Colombia Checkout</p>
                      <p className="text-lg font-black text-blue-900">{t.currencySymbol}{parseFloat(topUpAmount).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Merchant</span>
                      <span className="font-bold">SMART Charge Col</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Method</span>
                      <span className="font-bold">{selectedMethod}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Reference</span>
                      <span className="font-mono text-xs">{payuParams.referenceCode}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setPaymentStatus('idle')} className="flex-1 py-4 bg-slate-100 font-bold rounded-2xl hover:bg-slate-200 transition-all">Back</button>
                    <button onClick={simulateSuccess} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 flex items-center justify-center gap-2 active:scale-95 transition-all">
                      Complete Payment <ExternalLink size={18} />
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-slate-400 uppercase font-bold tracking-widest">PayU Secure Gateway Sandbox</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t.amount}</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-2xl">$</span>
                      <input 
                        type="number" 
                        className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-3xl font-black text-slate-900 focus:border-blue-500/50 outline-none transition-all shadow-inner" 
                        value={topUpAmount} 
                        onChange={e => setTopUpAmount(e.target.value)} 
                        disabled={isProcessing} 
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {[20000, 50000, 100000, 200000].map(amt => (
                        <button key={amt} onClick={() => setTopUpAmount(amt.toString())} className="py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black hover:bg-blue-50 transition-all">+{amt/1000}k</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.map(m => (
                        <button 
                          key={m.id}
                          onClick={() => setSelectedMethod(m.id)}
                          className={`
                            p-4 rounded-[24px] border-2 transition-all flex flex-col gap-2 relative group overflow-hidden
                            ${selectedMethod === m.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'}
                          `}
                        >
                          <div className={`p-2 rounded-xl w-fit ${m.color} shadow-sm`}>
                            <m.icon size={18} />
                          </div>
                          <span className={`text-sm font-black ${selectedMethod === m.id ? 'text-blue-900' : 'text-slate-600'}`}>{m.name}</span>
                          {selectedMethod === m.id && (
                            <div className="absolute right-3 top-3 bg-blue-600 text-white rounded-full p-1 shadow-sm">
                              <Check size={10} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleInitiatePayU} 
                    disabled={isProcessing || !selectedMethod} 
                    className="w-full py-5 bg-emerald-600 text-white font-black rounded-[24px] flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Building2 size={20} />} 
                    Secure Checkout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Other user modals (Add/Edit) would go here (truncated for space) */}
    </div>
  );
};

export default UserManagement;
