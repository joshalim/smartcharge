
import React from 'react';
import { User } from '../types';
import { CreditCard, Plus, MoreVertical, ShieldAlert, CheckCircle2, Search, Mail } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Partial<User>) => void;
  onUpdateStatus: (id: string, status: 'Active' | 'Blocked') => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.rfidTag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or RFID tag..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/10"
        >
          <Plus size={18} /> Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">RFID Card Tag</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail size={12} /> {user.email}
                        </p>
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
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className={`font-mono font-bold ${user.balance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      ${user.balance.toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => onUpdateStatus(user.id, user.status === 'Active' ? 'Blocked' : 'Active')}
                        className={`p-2 rounded-lg border transition-colors ${user.status === 'Active' ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-green-100 text-green-600 hover:bg-green-50'}`}
                        title={user.status === 'Active' ? 'Block User' : 'Activate User'}
                      >
                        {user.status === 'Active' ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
                      </button>
                      <button className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Add New User</h3>
              <p className="text-sm text-slate-500 mt-1">Register a new driver and associate an RFID card.</p>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              // In a real app we'd capture form data
              onAddUser({ name: 'New Driver', email: 'driver@volt.com', rfidTag: 'RFID_' + Math.random().toString(36).substr(2, 7).toUpperCase() });
              setIsModalOpen(false);
            }}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input type="email" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RFID Tag ID (Scan Card)</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Scanning..." className="flex-1 px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 font-mono text-sm" />
                  <button type="button" className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors">Scan</button>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
