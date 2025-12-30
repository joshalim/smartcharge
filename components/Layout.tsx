
import React from 'react';
import { ViewType, Language } from '../types';
import { translations } from '../locales/translations';
import { 
  LayoutDashboard, 
  Zap, 
  History, 
  Terminal, 
  Settings, 
  BrainCircuit,
  Users,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  extraHeader?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, language, setLanguage, extraHeader }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const t = translations[language];

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'chargers', label: t.chargers, icon: Zap },
    { id: 'users', label: t.users, icon: Users },
    { id: 'transactions', label: t.transactions, icon: History },
    { id: 'logs', label: t.logs, icon: Terminal },
    { id: 'ai-insights', label: t.aiInsights, icon: BrainCircuit },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className={`
        ${isSidebarOpen ? 'w-64' : 'w-20'} 
        bg-slate-900 text-white transition-all duration-300 flex flex-col h-full border-r border-slate-800
      `}>
        <div className="p-4 flex items-center justify-center border-b border-slate-800/50 h-24 bg-slate-900">
          <div className="w-12 h-12 border-2 border-blue-500 rounded-xl flex items-center justify-center bg-slate-800 shadow-inner">
             <Zap size={24} className="text-blue-500 fill-blue-500" />
          </div>
          {isSidebarOpen && <span className="ml-3 font-black text-xl tracking-tighter text-white">ADMIN</span>}
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
            className="w-full flex justify-center text-slate-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative flex flex-col">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center px-8 justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-6">
             <div className="flex items-center">
                <img 
                  src="logo.png" 
                  alt="SMART Charge" 
                  className="h-10 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setActiveView('dashboard')}
                  onError={(e) => {
                    (e.target as any).style.display = 'none';
                  }}
                />
             </div>
             <div className="h-8 w-px bg-slate-200 hidden md:block" />
             <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight hidden sm:block">
               {navItems.find(n => n.id === activeView)?.label || activeView}
             </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:block">
              {extraHeader}
            </div>
            
            <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200 shadow-inner">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${language === 'en' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('es')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${language === 'es' ? 'bg-white text-blue-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                ES
              </button>
            </div>
            
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform">
               JD
            </div>
          </div>
        </header>
        
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
