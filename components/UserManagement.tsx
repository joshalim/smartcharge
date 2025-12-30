
import React from 'react';
import { User, Language } from '../types';
import { translations } from '../locales/translations';
import { 
  Plus, ShieldAlert, CheckCircle2, Search, Wallet, X, Loader2, 
  Smartphone, Zap, CarFront, Pencil, AlertCircle, FileUp, 
  Calendar, Check, CreditCard, Building2, ExternalLink, Trash2,
  Download, FileSpreadsheet, Upload, Users, Lock
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Partial<User>) => void;
  onBulkAddUsers: (users: Partial<User>[]) => void;
  onEditUser: (userId: string, user: Partial<User>) => void;
  onUpdateStatus: (id: string, updates: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  onTopUp: (userId: string, amount: number) => void;
  language: Language;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onBulkAddUsers, onEditUser, onUpdateStatus, onDeleteUser, onTopUp, language }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [topUpAmount, setTopUpAmount] = React.useState<string>('50000');
  const [selectedMethod, setSelectedMethod] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [paymentStatus, setPaymentStatus] = React.useState<'idle' | 'initiating' | 'checkout' | 'success' | 'error'>('idle');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [userFormData, setUserFormData] = React.useState({
    name: '', email: '', password: '', phoneNumber: '', placa: '', cedula: '', rfidTag: '', rfidExpiration: ''
  });

  const t = translations[language];
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.rfidTag.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setUserFormData({ name: '', email: '', password: '', phoneNumber: '', placa: '', cedula: '', rfidTag: '', rfidExpiration: '' });
    setSelectedUser(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: user.password || '',
      phoneNumber: user.phoneNumber,
      placa: user.placa,
      cedula: user.cedula,
      rfidTag: user.rfidTag,
      rfidExpiration: user.rfidExpiration ? user.rfidExpiration.split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      ...userFormData, 
      rfidExpiration: userFormData.rfidExpiration ? new Date(userFormData.rfidExpiration).toISOString() : new Date(Date.now() + 31536000000).toISOString()
    };
    
    if (isEditModalOpen && selectedUser) {
      onEditUser(selectedUser.id, payload);
    } else {
      onAddUser({ 
        ...payload, 
        id: `USR-${Math.floor(Math.random() * 1000)}`, 
        balance: 0, 
        role: 'driver',
        status: 'Active', 
        joinedDate: new Date().toISOString() 
      });
    }
    setIsModalOpen(false);
    setIsEditModalOpen(false);
    resetForm();
  };

  const handleOpenTopUp = (user: User) => { 
    setSelectedUser(user); 
    setIsTopUpModalOpen(true); 
    setPaymentStatus('idle'); 
    setSelectedMethod(null);
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

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Plate', 'ID_Number', 'RFID_Tag', 'Expiry', 'Balance', 'Status'];
    const rows = filteredUsers.map(u => [
      u.name,
      u.email,
      u.phoneNumber,
      u.placa,
      u.cedula,
      u.rfidTag,
      u.rfidExpiration.split('T')[0],
      u.balance,
      u.status
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplate = () => {
    // Template column order: Name, Email, Password, Phone, Plate, ID_Number, RFID_Tag, Expiry, Balance
    const headers = ['Name', 'Email', 'Password', 'Phone', 'Plate', 'ID_Number', 'RFID_Tag', 'Expiry (YYYY-MM-DD)', 'Balance'];
    const example = ['Juan Perez', 'juan@example.com', 'password123', '3001234567', 'ABC-123', '1020304050', 'RFID_99881', '2025-12-31', '50000'];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), example.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "user_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      // Skip headers and empty lines
      const dataLines = lines.slice(1).filter(line => line.trim().length > 0);
      
      const parsedUsers = dataLines.map((line, idx): User | null => {
        // Robust CSV split that handles quoted fields
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, '').trim());
        
        // Basic validation: skip if we don't have at least Name and Email
        if (parts.length < 2) return null;

        // Defensive Date Parsing
        const parseDate = (val: string) => {
          const d = new Date(val);
          return isNaN(d.getTime()) ? new Date(Date.now() + 31536000000).toISOString() : d.toISOString();
        };

        // Defensive Numeric Parsing
        const parseNum = (val: string) => {
          const n = parseFloat(val);
          return isNaN(n) ? 0 : n;
        };

        return {
          id: `USR-IMP-${Date.now()}-${idx}`,
          name: parts[0] || 'Unknown Import',
          email: parts[1] || `import_${idx}@local.host`,
          password: parts[2] || 'password123',
          phoneNumber: parts[3] || '',
          placa: parts[4] || '',
          cedula: parts[5] || '',
          rfidTag: parts[6] || `RFID-IMP-${Math.floor(Math.random()*10000)}`,
          rfidExpiration: parseDate(parts[7] || ''),
          balance: parseNum(parts[8] || '0'),
          role: 'driver',
          status: 'Active',
          joinedDate: new Date().toISOString()
        };
      }).filter((u): u is User => u !== null);

      if (parsedUsers.length > 0) {
        onBulkAddUsers(parsedUsers);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const getExpiryLabel = (dateStr: string) => {
    if (!dateStr) return { label: 'No Expiry', color: 'bg-slate-100 text-slate-600 border-slate-200' };
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
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder} 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand/10 outline-none transition-all shadow-sm" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
             <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-600 hover:text-brand transition-all"
                title={t.exportCsv}
             >
                <Download size={16} />
                <span className="hidden sm:inline">{t.exportCsv}</span>
             </button>
             <div className="w-px h-6 bg-slate-100 my-auto mx-1" />
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-600 hover:text-emerald-600 transition-all"
                title={t.importCsv}
             >
                <Upload size={16} />
                <span className="hidden sm:inline">{t.importCsv}</span>
             </button>
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv" 
                onChange={handleImportCSV} 
             />
             <div className="w-px h-6 bg-slate-100 my-auto mx-1" />
             <button 
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-400 hover:text-slate-900 transition-all"
                title={t.downloadTemplate}
             >
                <FileSpreadsheet size={16} />
             </button>
          </div>

          <button onClick={handleOpenAdd} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white font-black rounded-2xl shadow-brand active:scale-95 transition-all">
            <Plus size={18} /> {t.addUser}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-8 py-5">User</th>
              <th className="px-8 py-5">Plate / ID</th>
              <th className="px-8 py-5">RFID Card</th>
              <th className="px-8 py-5">RFID Expiry</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Balance</th>
              <th className="px-8 py-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const expiry = getExpiryLabel(user.rfidExpiration);
                return (
                  <tr key={user.id} className="hover:bg-brand/5 group transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-black text-base border-2 border-white shadow-sm transition-transform group-hover:scale-110">{user.name.charAt(0)}</div>
                        <div>
                          <p className="font-black text-slate-900 leading-tight">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{user.email}</p>
                          <p className="text-[9px] font-black uppercase text-blue-500 mt-0.5 tracking-widest">{user.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium">
                      <div className="flex items-center gap-2"><CarFront size={14} className="text-brand" /> <span className="font-black tracking-tight">{user.placa}</span></div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1 tracking-wider">{user.cedula}</div>
                    </td>
                    <td className="px-8 py-5"><span className="font-mono text-[10px] font-black bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shadow-inner">{user.rfidTag}</span></td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border flex items-center gap-1.5 w-fit ${expiry.color} shadow-sm`}>
                         <Calendar size={12} /> {expiry.label}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <button onClick={() => onUpdateStatus(user.id, { status: user.status === 'Active' ? 'Blocked' : 'Active' })} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all active:scale-95 shadow-sm ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                        {user.status === 'Active' ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />} {user.status === 'Active' ? t.active : t.blocked}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900 text-sm font-mono">{t.currencySymbol}{user.balance.toLocaleString()}</td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => handleOpenEdit(user)} className="p-2.5 rounded-xl border border-slate-100 bg-white hover:text-brand shadow-sm transition-all hover:scale-110"><Pencil size={18} /></button>
                        <button onClick={() => handleOpenTopUp(user)} className="p-2.5 rounded-xl border border-slate-100 bg-white hover:text-emerald-600 shadow-sm transition-all hover:scale-110"><Wallet size={18} /></button>
                        <button onClick={() => { if(window.confirm('Delete user?')) onDeleteUser(user.id); }} className="p-2.5 rounded-xl border border-slate-100 bg-white hover:text-rose-600 shadow-sm transition-all hover:scale-110"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center opacity-40">
                    <Users size={64} className="text-slate-300 mb-6" />
                    <p className="font-black uppercase tracking-widest text-slate-400">No users found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isTopUpModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50 rounded-t-[40px]">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-brand/10 text-brand rounded-2xl shadow-sm">
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
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t.amount}</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-2xl">$</span>
                      <input 
                        type="number" 
                        className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-3xl font-black text-slate-900 focus:border-brand/50 outline-none transition-all shadow-inner" 
                        value={topUpAmount} 
                        onChange={e => setTopUpAmount(e.target.value)} 
                        disabled={isProcessing} 
                      />
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
                            ${selectedMethod === m.id ? 'border-brand bg-brand/5' : 'border-slate-100 bg-white hover:border-slate-200'}
                          `}
                        >
                          <div className={`p-2 rounded-xl w-fit ${m.color} shadow-sm`}>
                            <m.icon size={18} />
                          </div>
                          <span className={`text-sm font-black ${selectedMethod === m.id ? 'text-brand' : 'text-slate-600'}`}>{m.name}</span>
                          {selectedMethod === m.id && (
                            <div className="absolute right-3 top-3 bg-brand text-white rounded-full p-1 shadow-sm">
                              <Check size={10} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={simulateSuccess} 
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

      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[32px]">
              <h3 className="text-2xl font-black text-slate-900">{isEditModalOpen ? t.editUser : t.addUser}</h3>
              <button onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
            </div>
            <form className="p-8 grid grid-cols-2 gap-4" onSubmit={handleUserSubmit}>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input placeholder="Ex: Alejandro Rivera" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand/10 outline-none transition-all" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                <input type="email" placeholder="email@provider.com" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand/10 outline-none transition-all" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                   <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand/10 outline-none transition-all" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} required={!isEditModalOpen} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                <input placeholder="+57 3..." className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand/10 outline-none transition-all" value={userFormData.phoneNumber} onChange={e => setUserFormData({...userFormData, phoneNumber: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plate</label>
                <input placeholder="ABC-123" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand/10 outline-none transition-all" value={userFormData.placa} onChange={e => setUserFormData({...userFormData, placa: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Number</label>
                <input placeholder="CC / ID" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand/10 outline-none transition-all" value={userFormData.cedula} onChange={e => setUserFormData({...userFormData, cedula: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RFID Tag</label>
                <input placeholder="RFID_..." className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand/10 outline-none transition-all font-mono" value={userFormData.rfidTag} onChange={e => setUserFormData({...userFormData, rfidTag: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RFID Expiration</label>
                <input type="date" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand/10 outline-none transition-all" value={userFormData.rfidExpiration} onChange={e => setUserFormData({...userFormData, rfidExpiration: e.target.value})} required />
              </div>
              <div className="col-span-2 flex gap-3 pt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-4 bg-slate-100 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-brand text-white font-bold rounded-2xl hover:bg-brand-hover transition-all shadow-brand active:scale-95">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
