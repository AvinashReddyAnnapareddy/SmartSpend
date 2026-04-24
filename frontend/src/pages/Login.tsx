import { useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { Wallet, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAddingAccount = (location.state as any)?.isAddingAccount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await register(username, email, password);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err) {
      alert(isRegistering ? "Registration failed. Username may exist." : "Login failed. Check credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#e2e8f0] w-full max-w-md">
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          {isAddingAccount && (
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <h2 className="text-2xl font-bold text-center text-[#1e293b] mb-8">
          {isRegistering ? "Create an Account" : "SmartSpend Login"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-[13px] font-bold focus:ring-1 focus:ring-brand-600/40 outline-none"
              required
            />
          </div>
          {isRegistering && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-[13px] font-bold focus:ring-1 focus:ring-brand-600/40 outline-none"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-[13px] font-bold focus:ring-1 focus:ring-brand-600/40 outline-none"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[13px] font-bold transition-all"
          >
            {isRegistering ? "Register" : "Sign In"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[12px] font-bold text-brand-600 hover:underline"
          >
            {isRegistering ? "Already have an account? Sign In" : "Need an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
