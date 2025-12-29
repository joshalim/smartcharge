
import React from 'react';
import { ViewType } from '../types';
import { 
  LayoutDashboard, 
  Zap, 
  History, 
  Terminal, 
  Settings, 
  BrainCircuit,
  Users,
  Menu,
  X,
  BatteryCharging
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chargers', label: 'Chargers', icon: Zap },
    { id: 'users', label: 'Users & RFID', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'logs', label: 'OCPP Logs', icon: Terminal },
    { id: 'ai-insights', label: 'AI Analyst', icon: BrainCircuit },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'} 
        bg-slate-900 text-white transition-all duration-300 flex flex-col h-full border-r border-slate-800
      `}>
        <div className="p-4 flex items-center justify-between border-b border-slate-800/50 h-20">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex-shrink-0 relative">
                {/* Custom Logo approximation from image */}
                <div className="w-10 h-10 border-2 border-green-500 rounded-lg flex items-center justify-center relative">
                  <Zap size={18} className="text-green-500 fill-green-500" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-4 bg-green-500 rounded-sm"></div>
                </div>
              </div>
              <div className="h-8 w-[2px] bg-slate-700 mx-1"></div>
              <div className="flex items-baseline gap-1 font-sans">
                <span className="text-2xl font-bold text-[#3B82F6] tracking-tight">SMART</span>
                <span className="text-2xl font-bold text-[#F8FAFC] tracking-tight">Charge</span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 border-2 border-green-500 rounded-lg flex items-center justify-center mx-auto">
               <Zap size={18} className="text-green-500 fill-green-500" />
            </div>
          )}
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewType)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon size={20} />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex justify-center text-slate-500 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-semibold text-slate-800 capitalize">
               {activeView.replace('-', ' ')}
             </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
               OCPP Server Online
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600">
               JD
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
