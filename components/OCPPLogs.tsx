
import React from 'react';
import { OCPPLog } from '../types';
import { Search, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface OCPPLogsProps {
  logs: OCPPLog[];
}

const OCPPLogs: React.FC<OCPPLogsProps> = ({ logs }) => {
  const [filter, setFilter] = React.useState('');
  const [selectedLog, setSelectedLog] = React.useState<OCPPLog | null>(null);

  const filteredLogs = logs.filter(log => 
    log.messageType.toLowerCase().includes(filter.toLowerCase()) ||
    JSON.stringify(log.payload).toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Filter by message type or payload contents..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Direction</th>
                <th className="px-6 py-3">Message Type</th>
                <th className="px-6 py-3">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id} 
                  onClick={() => setSelectedLog(log)}
                  className={`
                    cursor-pointer transition-colors hover:bg-blue-50/50
                    ${selectedLog?.id === log.id ? 'bg-blue-50' : ''}
                  `}
                >
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`
                      flex items-center gap-1 text-xs font-bold
                      ${log.direction === 'IN' ? 'text-green-600' : 'text-blue-600'}
                    `}>
                      {log.direction === 'IN' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      {log.direction === 'IN' ? 'Central System' : 'Charger'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                    {log.messageType}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-[200px]">
                    {JSON.stringify(log.payload)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`
        lg:w-96 bg-slate-900 text-slate-300 rounded-xl p-6 shadow-xl border border-slate-800 overflow-auto
        ${!selectedLog ? 'flex items-center justify-center text-slate-600' : ''}
      `}>
        {selectedLog ? (
          <div>
            <h3 className="text-white font-bold mb-4 flex items-center justify-between">
              Message Details
              <span className="text-xs text-slate-500 font-mono">OCPP v1.6J</span>
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Payload</p>
                <pre className="p-4 bg-slate-950 rounded-lg text-green-400 text-xs overflow-x-auto font-mono border border-slate-800">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Sequence</p>
                  <p className="text-sm font-mono text-white">#88219</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Latency</p>
                  <p className="text-sm font-mono text-white">42ms</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm">Select a message from the log to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OCPPLogs;
