
import React, { useState } from 'react';
import { Zap, Mail, Lock, User, Smartphone, LayoutDashboard, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../locales/translations';

interface LoginProps {
  onLogin: (credentials: any) => Promise<boolean>;
  onRegister: (data: any) => Promise<boolean>;
  language: Language;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, language }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'admin' | 'driver'>('driver');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [placa, setPlaca] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const success = await onLogin({ email, password, role });
        if (!success) setError('Invalid credentials. Please try again.');
      } else {
        const success = await onRegister({ email, password, name, placa, role: 'driver' });
        if (success) {
          setIsLogin(true);
          setError(null);
        } else {
          setError('Registration failed. Email might already exist.');
        }
      }
    } catch (err) {
      setError('An error occurred. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-2xl rounded-[48px] border border-white/10 shadow-2xl overflow-hidden relative z-10">
        
        {/* Left Side: Branding & Info */}
        <div className="p-12 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-10 backdrop-blur-md border border-white/20">
              <Zap size={32} className="fill-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-6 leading-tight">
              Empowering the <br /> <span className="text-blue-200">Electric Future</span>
            </h1>
            <p className="text-blue-100 text-lg opacity-80 max-w-sm">
              Manage your fleet or charge your vehicle with the most advanced OCPP platform in the region.
            </p>
          </div>

          <div className="mt-12 space-y-6 relative z-10">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                 <LayoutDashboard size={18} />
               </div>
               <p className="text-sm font-bold">Full Admin CMS for Fleet Managers</p>
             </div>
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                 <Smartphone size={18} />
               </div>
               <p className="text-sm font-bold">Seamless Driver Experience</p>
             </div>
          </div>
          
          <Zap size={300} className="absolute -bottom-20 -right-20 text-white/5 rotate-12" />
        </div>

        {/* Right Side: Form */}
        <div className="p-12 lg:p-16 flex flex-col justify-center bg-white">
          <div className="mb-10 flex justify-center">
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
               <button 
                onClick={() => { setRole('driver'); setIsLogin(true); }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === 'driver' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <Smartphone size={14} /> Driver
               </button>
               <button 
                onClick={() => { setRole('admin'); setIsLogin(true); }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <LayoutDashboard size={14} /> Admin
               </button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Driver Account'}
            </h2>
            <p className="text-slate-500 mt-2">
              {isLogin ? `Accessing as ${role === 'admin' ? 'Administrator' : 'Driver'}` : 'Join the charging network'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-medium animate-in slide-in-from-top-2">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="Juan Perez" 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vehicle Plate</label>
                  <div className="relative">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="ABC-123" 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                      value={placa}
                      onChange={e => setPlaca(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="name@email.com" 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? 'Login Now' : 'Create Account'} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            {role === 'driver' && (
              <p className="text-sm font-medium text-slate-500">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => setIsLogin(!isLogin)} 
                  className="ml-2 text-blue-600 font-black hover:underline"
                >
                  {isLogin ? 'Register Here' : 'Login Here'}
                </button>
              </p>
            )}
            {role === 'admin' && (
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Authorized Personnel Only
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
