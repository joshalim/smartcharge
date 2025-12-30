
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
  customLogo?: string | null;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, language, setLanguage, extraHeader, customLogo }) => {
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
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className={`
        ${isSidebarOpen ? 'w-64' : 'w-24'} 
        bg-slate-900 text-white transition-all duration-500 ease-in-out flex flex-col h-full border-r border-slate-800 z-30 shadow-2xl
      `}>
        <div className="p-4 flex items-center justify-center border-b border-slate-800/50 h-24 bg-slate-900 relative">
          <div className="w-14 h-14 border-2 border-brand rounded-2xl flex items-center justify-center bg-slate-800 shadow-inner group cursor-pointer transition-all hover:scale-105 active:scale-95">
             <Zap size={32} className="text-brand fill-brand/20 transition-all group-hover:scale-110" />
          </div>
          {isSidebarOpen && <span className="ml-4 font-black text-xl tracking-tighter text-white uppercase animate-in fade-in duration-500">Admin</span>}
        </div>

        <nav className="flex-1 mt-8 px-4 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewType)}
                className={`
                  w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 relative group
                  ${isActive 
                    ? 'bg-brand text-white shadow-xl shadow-brand/30' 
                    : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'}
                `}
              >
                <div className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}>
                  <Icon size={24} />
                </div>
                {isSidebarOpen && <span className="font-bold tracking-wide text-sm">{item.label}</span>}
                {isActive && (
                   <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex justify-center text-slate-500 hover:text-white transition-all p-3 rounded-2xl hover:bg-slate-800 active:scale-90"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative flex flex-col bg-slate-50">
        <header className="h-24 bg-white border-b border-slate-200 flex items-center px-10 justify-between sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-10">
             <div className="flex items-center">
                {customLogo ? (
                   <img 
                    src={customLogo} 
                    alt="Custom Branding" 
                    className="h-12 w-auto object-contain cursor-pointer hover:opacity-80 transition-all hover:scale-105 animate-in fade-in zoom-in-90 duration-500"
                    onClick={() => setActiveView('dashboard')}
                  />
                ) : (
                   <img 
                    src="logo.png" 
                    alt="SMART Charge" 
                    className="h-10 w-auto object-contain cursor-pointer hover:opacity-80 transition-all"
                    onClick={() => setActiveView('dashboard')}
                    onError={(e) => {
                      (e.target as any).style.display = 'none';
                    }}
                  />
                )}
             </div>
             <div className="h-10 w-px bg-slate-200 hidden md:block" />
             <h2 className="text-2xl font-black text-slate-800 capitalize tracking-tight hidden sm:block">
               {navItems.find(n => n.id === activeView)?.label || activeView}
             </h2>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden lg:block">
              {extraHeader}
            </div>
            
            <div className="flex items-center bg-slate-100/50 rounded-2xl p-1.5 border border-slate-200 shadow-inner">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${language === 'en' ? 'bg-white text-brand shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('es')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${language === 'es' ? 'bg-white text-brand shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                ES
              </button>
            </div>
            
            <div className="h-12 w-12 rounded-2xl bg-brand flex items-center justify-center font-black text-white text-base shadow-xl shadow-brand/20 cursor-pointer hover:scale-105 transition-transform active:scale-95">
               JD
            </div>
          </div>
        </header>
        
        <div className="p-10 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
