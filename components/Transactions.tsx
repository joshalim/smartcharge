
import React, { useState, useMemo } from 'react';
import { Transaction, Language } from '../types';
import { translations } from '../locales/translations';
import { 
  Search, 
  Download, 
  ArrowUpDown, 
  Calendar, 
  Zap, 
  DollarSign, 
  ChevronRight,
  History,
  Clock,
  BatteryCharging,
  FileText
} from 'lucide-react';

interface TransactionsProps {
  transactions: Transaction[];
  language: Language;
}

type SortField = 'startTime' | 'energyConsumed' | 'cost';
type SortOrder = 'asc' | 'desc';

const Transactions: React.FC<TransactionsProps> = ({ transactions, language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const t = translations[language];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedTransactions = useMemo(() => {
    return transactions
      .filter(tx => 
        tx.chargerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const factor = sortOrder === 'asc' ? 1 : -1;
        if (sortField === 'startTime') {
          return (new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) * factor;
        }
        return ((a[sortField] || 0) - (b[sortField] || 0)) * factor;
      });
  }, [transactions, searchTerm, sortField, sortOrder]);

  const exportToCSV = () => {
    const headers = ['ID', 'Charger', 'User', 'Start', 'End', 'Energy (kWh)', 'Cost'];
    const rows = filteredAndSortedTransactions.map(tx => [
      tx.id,
      tx.chargerId,
      tx.userId,
      tx.startTime,
      tx.endTime || 'Active',
      tx.energyConsumed,
      tx.cost
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <Download size={18} className="text-blue-500" />
          {t.exportCsv}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.txId}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.chargers}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.user}</th>
                <th 
                  className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group hover:text-blue-600 transition-colors"
                  onClick={() => handleSort('startTime')}
                >
                  <div className="flex items-center gap-1">
                    {t.startTime} <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group hover:text-blue-600 transition-colors text-right"
                  onClick={() => handleSort('energyConsumed')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    {t.energyConsumed} <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group hover:text-blue-600 transition-colors text-right"
                  onClick={() => handleSort('cost')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    {t.cost} <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAndSortedTransactions.length > 0 ? (
                filteredAndSortedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-[11px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">{tx.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                          <Zap size={14} />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{tx.chargerId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 font-medium">{tx.userId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{new Date(tx.startTime).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(tx.startTime).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-mono font-bold text-slate-900">{tx.energyConsumed.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-emerald-600 font-mono">
                        {t.currencySymbol}{tx.cost.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`
                        px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${tx.status === 'Active' ? 'bg-blue-100 text-blue-700 animate-pulse' : 'bg-slate-100 text-slate-500'}
                      `}>
                        {(t as any)[tx.status.toLowerCase()] || tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <History size={48} className="text-slate-300 mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">No matching transactions found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
