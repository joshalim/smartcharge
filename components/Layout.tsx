
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
        <div className="p-4 flex items-center justify-center border-b border-slate-800/50 h-24 overflow-hidden bg-white">
          {isSidebarOpen ? (
            <img 
              src="logo.png" 
              alt="SMART Charge" 
              className="h-auto max-w-[80%] object-contain transition-all duration-300"
              onError={(e) => {
                // Fallback in case image isn't found
                (e.target as any).style.display = 'none';
              }}
            />
          ) : (
             <div className="w-10 h-10 border-2 border-blue-500 rounded-lg flex items-center justify-center mx-auto">
               <Zap size={18} className="text-blue-500 fill-blue-500" />
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

      <main className="flex-1 overflow-auto relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-semibold text-slate-800 capitalize">
               {navItems.find(n => n.id === activeView)?.label || activeView}
             </h2>
          </div>
          <div className="flex items-center gap-6">
            {extraHeader}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('es')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${language === 'es' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                ES
              </button>
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
