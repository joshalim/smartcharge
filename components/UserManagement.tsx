
import React from 'react';
import { User, Language } from '../types';
import { translations } from '../locales/translations';
import { CreditCard, Plus, ShieldAlert, CheckCircle2, Search, Mail, Wallet, X, Loader2, Smartphone, Zap, CarFront, Pencil, Phone, AlertCircle, FileUp, Calendar, Trash2 } from 'lucide-react';

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
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [paymentStatus, setPaymentStatus] = React.useState<'idle' | 'initiating' | 'success' | 'error'>('idle');

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

  const handleOpenTopUp = (user: User) => { setSelectedUser(user); setIsTopUpModalOpen(true); setPaymentStatus('idle'); };

  const handlePayment = async () => {
    if (!selectedUser) return;
    setIsProcessing(true); setPaymentStatus('initiating');
    await new Promise(r => setTimeout(r, 1500));
    onTopUp(selectedUser.id, parseFloat(topUpAmount));
    setPaymentStatus('success');
    setTimeout(() => setIsTopUpModalOpen(false), 1500);
    setIsProcessing(false);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/);
      const importedUsers: Partial<User>[] = [];
      const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 6) {
          importedUsers.push({
            id: `USR-IMP-${Math.floor(Math.random() * 100000)}`,
            name: parts[0].trim(),
            email: parts[1].trim(),
            phoneNumber: parts[2].trim(),
            placa: parts[3].trim(),
            cedula: parts[4].trim(),
            rfidTag: parts[5].trim(),
            rfidExpiration: new Date(Date.now() + 31536000000).toISOString(), // 1 year default
            status: 'Active',
            joinedDate: new Date().toISOString(),
            balance: 0
          });
        }
      }
      if (importedUsers.length > 0) onBulkAddUsers(importedUsers);
      else alert("No valid users found. Format: name, email, phone, placa, cedula, rfidTag");
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getExpiryLabel = (dateStr: string) => {
    const exp = new Date(dateStr);
    const now = new Date();
    const diffDays = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
    
    if (diffDays < 0) return { label: t.expired, color: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (diffDays < 30) return { label: t.expiryWarning, color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: exp.toLocaleDateString(), color: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

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
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCsvImport} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <FileUp size={18} className="text-blue-500" />
            CSV Import
          </button>
          <button 
            onClick={() => { 
              setUserFormData({ name: '', email: '', phoneNumber: '', placa: '', cedula: '', rfidTag: '', rfidExpiration: new Date(Date.now() + 31536000000).toISOString().split('T')[0] }); 
              setIsModalOpen(true); 
            }} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
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

      {/* Add / Edit User Modal */}
      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-900">{isEditModalOpen ? t.editUser : t.addUser}</h3>
              <button onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
            </div>
            <form className="p-8 grid grid-cols-2 gap-4" onSubmit={handleUserSubmit}>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input placeholder="Ex: Alejandro Rivera" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input type="email" placeholder="email@provider.com" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                <input placeholder="+57 3..." className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" value={userFormData.phoneNumber} onChange={e => setUserFormData({...userFormData, phoneNumber: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plate</label>
                <input placeholder="ABC-123" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" value={userFormData.placa} onChange={e => setUserFormData({...userFormData, placa: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Number</label>
                <input placeholder="CC / ID" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" value={userFormData.cedula} onChange={e => setUserFormData({...userFormData, cedula: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RFID Tag</label>
                <input placeholder="RFID_..." className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono" value={userFormData.rfidTag} onChange={e => setUserFormData({...userFormData, rfidTag: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RFID Expiration</label>
                <input type="date" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" value={userFormData.rfidExpiration} onChange={e => setUserFormData({...userFormData, rfidExpiration: e.target.value})} required />
              </div>
              <div className="col-span-2 flex gap-3 pt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-4 bg-slate-100 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {isTopUpModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b flex justify-between items-center">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                    <Wallet size={24} />
                 </div>
                 <div>
                    <h3 className="font-black text-xl text-slate-900">{t.topUp}</h3>
                    <p className="text-xs text-slate-500 font-medium">{selectedUser.name}</p>
                 </div>
              </div>
              <button onClick={() => setIsTopUpModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-8 space-y-6">
              {paymentStatus === 'success' ? (
                <div className="py-10 text-center flex flex-col items-center animate-in zoom-in-50 duration-500">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="font-black text-2xl text-slate-900">{t.paymentSuccess}</h4>
                  <p className="text-slate-500 mt-2">Redirecting back...</p>
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
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[50000, 100000, 200000, 500000].map(amt => (
                      <button 
                        key={amt} 
                        onClick={() => setTopUpAmount(amt.toString())}
                        className="py-3 px-4 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95"
                      >
                        +{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <button onClick={handlePayment} disabled={isProcessing} className="w-full py-5 bg-emerald-600 text-white font-black rounded-[24px] flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95">
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Smartphone />} Confirm Deposit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
