
import React from 'react';
import { User, Language } from '../types';
import { translations } from '../locales/translations';
import { 
  CreditCard, 
  Plus, 
  MoreVertical, 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  Mail, 
  Wallet, 
  DollarSign, 
  X, 
  Loader2, 
  Smartphone, 
  Zap, 
  IdCard, 
  CarFront,
  Pencil,
  Phone
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Partial<User>) => void;
  onEditUser: (userId: string, user: Partial<User>) => void;
  onUpdateStatus: (id: string, status: 'Active' | 'Blocked') => void;
  onTopUp: (userId: string, amount: number) => void;
  language: Language;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onEditUser, onUpdateStatus, onTopUp, language }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [topUpAmount, setTopUpAmount] = React.useState<string>('50000');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = React.useState<string | null>(null);

  // User Form State (Shared for Add/Edit)
  const [userFormData, setUserFormData] = React.useState({
    name: '',
    email: '',
    phoneNumber: '',
    placa: '',
    cedula: '',
    rfidTag: ''
  });

  const t = translations[language];
  
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.rfidTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cedula.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setUserFormData({ name: '', email: '', phoneNumber: '', placa: '', cedula: '', rfidTag: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      placa: user.placa,
      cedula: user.cedula,
      rfidTag: user.rfidTag
    });
    setIsEditModalOpen(true);
  };

  const handleOpenTopUp = (user: User) => {
    setSelectedUser(user);
    setIsTopUpModalOpen(true);
    setActivePaymentMethod(null);
  };

  const handlePayment = (method: string) => {
    if (!selectedUser) return;
    setIsProcessing(true);
    setActivePaymentMethod(method);
    
    setTimeout(() => {
      onTopUp(selectedUser.id, parseFloat(topUpAmount));
      setIsProcessing(false);
      setIsTopUpModalOpen(false);
      setSelectedUser(null);
      setActivePaymentMethod(null);
    }, 2000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({
      ...userFormData,
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0],
      balance: 0
    });
    setIsModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      onEditUser(selectedUser.id, userFormData);
      setIsEditModalOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/10"
        >
          <Plus size={18} /> {t.addUser}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">{language === 'es' ? 'Usuario' : 'User'}</th>
                  <th className="px-6 py-4">{t.placa} / {t.cedula}</th>
                  <th className="px-6 py-4">{t.rfidTag}</th>
                  <th className="px-6 py-4">{t.status}</th>
                  <th className="px-6 py-4 text-right">{t.balance}</th>
                  <th className="px-6 py-4 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => {
                  const statusKey = user.status.toLowerCase() as keyof typeof t;
                  const localizedStatus = (t as any)[statusKey] || user.status;
                  return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{user.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail size={12} /> {user.email}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                            <Phone size={12} /> {user.phoneNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-700 text-sm font-medium">
                          <CarFront size={14} className="text-blue-500" />
                          <span className="uppercase">{user.placa}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                          <IdCard size={14} />
                          <span>{user.cedula}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-slate-400" />
                        <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">
                          {user.rfidTag}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold
                        ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {user.status === 'Active' ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                        {localizedStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <p className={`font-mono font-bold ${user.balance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                          {t.currencySymbol}{user.balance.toLocaleString()}
                        </p>
                        <button 
                          onClick={() => handleOpenTopUp(user)}
                          className="text-[10px] text-blue-600 font-bold uppercase tracking-wider hover:underline"
                        >
                          {t.topUp}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 rounded-lg border border-slate-100 text-slate-600 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all"
                          title={t.editUser}
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => onUpdateStatus(user.id, user.status === 'Active' ? 'Blocked' : 'Active')}
                          className={`p-2 rounded-lg border transition-colors ${user.status === 'Active' ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-green-100 text-green-600 hover:bg-green-50'}`}
                        >
                          {user.status === 'Active' ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">{isEditModalOpen ? t.editUser : t.addUser}</h3>
              <button onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={isEditModalOpen ? handleSaveEdit : handleCreateUser} className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">{language === 'es' ? 'Nombre Completo' : 'Full Name'}</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                  value={userFormData.name}
                  onChange={e => setUserFormData({...userFormData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Email</label>
                  <input 
                    type="email" 
                    required
                    className="w-full px-4 py-2 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                    value={userFormData.email}
                    onChange={e => setUserFormData({...userFormData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">{t.phoneNumber}</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                    value={userFormData.phoneNumber}
                    onChange={e => setUserFormData({...userFormData, phoneNumber: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">{t.placa}</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none uppercase transition-all"
                    value={userFormData.placa}
                    onChange={e => setUserFormData({...userFormData, placa: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">{t.cedula}</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                    value={userFormData.cedula}
                    onChange={e => setUserFormData({...userFormData, cedula: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">{t.rfidTag}</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none font-mono transition-all"
                  value={userFormData.rfidTag}
                  onChange={e => setUserFormData({...userFormData, rfidTag: e.target.value})}
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                  {isEditModalOpen ? t.saveChanges : (language === 'es' ? 'Crear Usuario' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {isTopUpModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{t.topUp}</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedUser.name}</p>
                </div>
              </div>
              <button onClick={() => !isProcessing && setIsTopUpModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t.amount} (COP)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xl font-bold focus:ring-4 focus:ring-blue-500/10 focus:outline-none focus:border-blue-500 transition-all"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {['20000', '50000', '100000', '200000'].map(val => (
                  <button 
                    key={val}
                    onClick={() => setTopUpAmount(val)}
                    disabled={isProcessing}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${topUpAmount === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-500'} disabled:opacity-50`}
                  >
                    ${parseInt(val).toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-500">Saldo Actual</span>
                  <span className="font-mono font-bold text-slate-700">{t.currencySymbol}{selectedUser.balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Nuevo Saldo</span>
                  <span className="font-mono font-bold text-blue-600">{t.currencySymbol}{(selectedUser.balance + parseFloat(topUpAmount || '0')).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.selectPayment}</p>
                
                {/* Nequi */}
                <button 
                  onClick={() => handlePayment('nequi')}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-between p-4 bg-[#7000FF] hover:bg-[#5E00D9] text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/10 disabled:opacity-50 group`}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone size={20} />
                    <span>{t.payWithNequi}</span>
                  </div>
                  {isProcessing && activePaymentMethod === 'nequi' ? <Loader2 className="animate-spin" size={20} /> : <div className="w-10 h-6 bg-white/20 rounded-md flex items-center justify-center font-black text-[8px]">NEQUI</div>}
                </button>

                {/* Daviplata */}
                <button 
                  onClick={() => handlePayment('daviplata')}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-between p-4 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/10 disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet size={20} />
                    <span>{t.payWithDaviplata}</span>
                  </div>
                  {isProcessing && activePaymentMethod === 'daviplata' ? <Loader2 className="animate-spin" size={20} /> : <div className="w-10 h-6 bg-white/20 rounded-md flex items-center justify-center font-black text-[7px]">DAVIPLATA</div>}
                </button>

                {/* Bre-B */}
                <button 
                  onClick={() => handlePayment('breb')}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#0047BB] via-[#00A3E0] to-[#FFD100] hover:brightness-110 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3">
                    <Zap size={20} fill="currentColor" />
                    <span>{t.payWithBreB}</span>
                  </div>
                  {isProcessing && activePaymentMethod === 'breb' ? <Loader2 className="animate-spin" size={20} /> : <span className="font-black text-sm italic tracking-tighter">Bre-B</span>}
                </button>

                {/* PayPal */}
                <button 
                  onClick={() => handlePayment('paypal')}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-between p-4 bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] font-bold rounded-2xl transition-all shadow-lg shadow-yellow-500/10 disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={20} />
                    <span>{t.payWithPaypal}</span>
                  </div>
                  {isProcessing && activePaymentMethod === 'paypal' ? <Loader2 className="animate-spin" size={20} /> : 
                    <svg className="w-12 h-4" viewBox="0 0 100 25" fill="currentColor">
                      <path d="M12.5 3c-1.8 0-3.3.6-4.5 1.8-1.2 1.2-1.8 2.7-1.8 4.5v9h4v-9c0-.7.2-1.3.7-1.8s1.1-.7 1.8-.7c.7 0 1.3.2 1.8.7.5.5.7 1.1.7 1.8v9h4v-9c0-1.8-.6-3.3-1.8-4.5-1.1-1.2-2.6-1.8-4.4-1.8zM26.5 3c-1.8 0-3.3.6-4.5 1.8-1.2 1.2-1.8 2.7-1.8 4.5s.6 3.3 1.8 4.5 2.7 1.8 4.5 1.8h4.5v-9c0-1.8-.6-3.3-1.8-4.5S28.3 3 26.5 3zm1.5 8h-1.5c-.7 0-1.3-.2-1.8-.7s-.7-1.1-.7-1.8.2-1.3.7-1.8 1.1-.7 1.8-.7h1.5v5zM40.5 3c-1.8 0-3.3.6-4.5 1.8-1.2 1.2-1.8 2.7-1.8 4.5s.6 3.3 1.8 4.5 2.7 1.8 4.5 1.8h4.5v-12.6zm1.5 8h-1.5c-.7 0-1.3-.2-1.8-.7s-.7-1.1-.7-1.8.2-1.3.7-1.8 1.1-.7 1.8-.7h1.5v5z" />
                    </svg>
                  }
                </button>
              </div>
              
              <p className="text-[10px] text-center text-slate-400 font-medium">
                Encrypted secure transaction. Processed by Colombian Interbank Gateway.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
