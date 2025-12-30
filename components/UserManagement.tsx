
import React from 'react';
import { User, Language } from '../types';
import { translations } from '../locales/translations';
import { CreditCard, Plus, ShieldAlert, CheckCircle2, Search, Mail, Wallet, X, Loader2, Smartphone, Zap, CarFront, Pencil, Phone, AlertCircle, FileUp } from 'lucide-react';

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
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.rfidTag.toLowerCase().includes(searchTerm.toLowerCase()) || u.placa.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditModalOpen && selectedUser) {
      onEditUser(selectedUser.id, userFormData);
    } else {
      onAddUser({ ...userFormData, id: `USR-${Math.floor(Math.random() * 1000)}`, balance: 0, status: 'Active', joinedDate: new Date().toISOString() });
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

      // Assume simple CSV format: name, email, phone, placa, cedula, rfidTag
      // Skip header if it exists
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
            status: 'Active',
            joinedDate: new Date().toISOString(),
            balance: 0
          });
        }
      }

      if (importedUsers.length > 0) {
        onBulkAddUsers(importedUsers);
      } else {
        alert("No valid users found in CSV. Format: name, email, phone, placa, cedula, rfidTag");
      }
    };
    reader.readAsText(file);
    // Clear the input value to allow re-importing same file if needed
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder={t.searchPlaceholder} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleCsvImport}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <FileUp size={18} className="text-blue-500" />
            CSV Import
          </button>
          <button onClick={() => { setUserFormData({ name: '', email: '', phoneNumber: '', placa: '', cedula: '', rfidTag: '', rfidExpiration: '' }); setIsModalOpen(true); }} className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg"><Plus size={18} /> {t.addUser}</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Plate / ID</th>
              <th className="px-6 py-4">RFID</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Balance</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
                    <div><p className="font-bold">{user.name}</p><p className="text-xs text-slate-400">{user.email}</p></div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm"><div className="flex items-center gap-2"><CarFront size={14} className="text-blue-500" /> {user.placa}</div></td>
                <td className="px-6 py-4"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{user.rfidTag}</span></td>
                <td className="px-6 py-4">
                  <button onClick={() => onUpdateStatus(user.id, { status: user.status === 'Active' ? 'Blocked' : 'Active' })} className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.status === 'Active' ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />} {user.status}
                  </button>
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">{t.currencySymbol}{user.balance.toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setSelectedUser(user); setUserFormData({ ...user, rfidExpiration: user.rfidExpiration ? user.rfidExpiration.split('T')[0] : '' }); setIsEditModalOpen(true); }} className="p-2 rounded-lg border border-slate-100 hover:text-blue-600"><Pencil size={18} /></button>
                    <button onClick={() => handleOpenTopUp(user)} className="p-2 rounded-lg border border-slate-100 hover:text-emerald-600"><Wallet size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit User Modal */}
      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95">
            <div className="p-8 border-b flex justify-between items-center">
              <h3 className="text-2xl font-bold">{isEditModalOpen ? t.editUser : t.addUser}</h3>
              <button onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }}><X size={20} /></button>
            </div>
            <form className="p-8 grid grid-cols-2 gap-4" onSubmit={handleUserSubmit}>
              <div className="col-span-2"><input placeholder="Full Name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} required /></div>
              <input placeholder="Email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} required />
              <input placeholder="Phone" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={userFormData.phoneNumber} onChange={e => setUserFormData({...userFormData, phoneNumber: e.target.value})} required />
              <input placeholder="License Plate" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={userFormData.placa} onChange={e => setUserFormData({...userFormData, placa: e.target.value})} required />
              <input placeholder="RFID Tag" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={userFormData.rfidTag} onChange={e => setUserFormData({...userFormData, rfidTag: e.target.value})} required />
              <div className="col-span-2 flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-3 bg-slate-100 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {isTopUpModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <div className="flex items-center gap-3"><Wallet size={20} className="text-blue-600" /> <div><h3 className="font-bold">{t.topUp}</h3><p className="text-xs text-slate-500">{selectedUser.name}</p></div></div>
              <button onClick={() => setIsTopUpModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              {paymentStatus === 'success' ? (
                <div className="py-10 text-center flex flex-col items-center animate-in zoom-in-50"><CheckCircle2 size={48} className="text-green-500 mb-2" /><h4 className="font-bold">{t.paymentSuccess}</h4></div>
              ) : (
                <>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                    <input type="number" className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} disabled={isProcessing} />
                  </div>
                  <button onClick={handlePayment} disabled={isProcessing} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
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
