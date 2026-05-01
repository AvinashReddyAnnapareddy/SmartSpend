import { Search, Bell, ChevronDown, User, LogOut, UserCircle, UserPlus, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, accounts, logout, switchAccount, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddAccount = () => {
    // Clear current token temporarily to show login page
    // Actually, we should have a way to go to login without fully logging out
    // For now, let's just go to login. The useAuth logic will handle adding the new account.
    navigate('/login', { state: { isAddingAccount: true } });
  };

  const getAvatar = (name: string) => name.charAt(0).toUpperCase();

  return (
    <header className="h-16 border-b border-[#e2e8f0] bg-white sticky top-0 z-40 flex items-center justify-between px-8 shrink-0">
      <div>
        <h2 className="text-lg font-bold text-[#1e293b] tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group w-80 hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-10 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-brand-600/40 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/alerts"
            className="w-8 h-8 rounded-lg border border-[#e2e8f0] flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
          </Link>

          <div className="h-8 w-[1px] bg-slate-200" />

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-1 rounded-lg hover:bg-slate-100 transition-all group"
            >
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white text-xs overflow-hidden shadow-sm">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user ? getAvatar(user.full_name || user.username) : '?'
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-[#1e293b]">{user ? (user.full_name || user.username) : 'Loading...'}</p>
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#e2e8f0] rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-[#e2e8f0] mb-1">
                  <p className="text-xs font-bold text-[#1e293b]">{user?.full_name || user?.username}</p>
                  <p className="text-[10px] text-slate-500">{user?.email}</p>
                </div>
                
                <div className="max-h-48 overflow-y-auto">
                  {accounts.length > 1 && (
                    <div className="py-1">
                      <p className="px-4 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Switch Account</p>
                      {accounts.map((acc) => (
                        <button
                          key={acc.username}
                          onClick={() => { switchAccount(acc.username); setIsDropdownOpen(false); }}
                          disabled={acc.username === user?.username}
                          className={`w-full flex items-center justify-between px-4 py-2 text-xs transition-colors ${
                            acc.username === user?.username 
                              ? 'bg-slate-50 text-brand-600 cursor-default' 
                              : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              acc.username === user?.username ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {getAvatar(acc.username)}
                            </div>
                            <span>{acc.username}</span>
                          </div>
                          {acc.username === user?.username && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#e2e8f0] mt-1 pt-1">
                  <button 
                    onClick={() => { handleAddAccount(); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Another Account</span>
                  </button>
                  
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-3 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <UserCircle className="w-4 h-4" />
                    <span>View Profile</span>
                  </Link>
                  
                  <button 
                    onClick={() => { logout(); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors border-t border-[#e2e8f0] mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
