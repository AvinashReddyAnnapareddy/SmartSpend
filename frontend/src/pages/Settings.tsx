import { Header } from '../components/Header';
import { useAuth } from '../lib/useAuth';
import { 
  User, 
  Shield, 
  Bell, 
  Database, 
  LogOut, 
  Trash2, 
  ChevronRight,
  Globe,
  Wallet,
  Mail,
  Phone,
  LayoutGrid,
  CreditCard,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

// Temporarily using hardcoded values since we don't have a user API yet
const currentUser = { name: 'User', email: 'user@example.com', phone: '+91 98765 43210', avatar: 'U' };

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: LayoutGrid },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data', label: 'Manage Data', icon: Database },
];

export default function Settings() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.reload(); // Reload to update app state and redirect to login
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f4f5f7]">
      <Header title="Settings" />
      
      <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6 pb-12">
        <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
           <div className="flex bg-white p-1 rounded-lg border border-[#e2e8f0]">
              {tabs.map((tab) => (
                <button 
                  key={tab.id} 
                  className={cn(
                    "px-4 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-2",
                    tab.id === 'profile' ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[11px] font-bold border border-rose-100 hover:bg-rose-100 transition-all">
               <Trash2 className="w-3.5 h-3.5" />
               Delete
            </button>
        </div>

        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Section 1: Personal Info */}
           <div className="lg:col-span-2 space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-none"
              >
                <h3 className="text-[13px] font-bold text-[#1e293b] mb-6 tracking-tight">Personal Info</h3>
                <div className="space-y-6">
                   <div className="flex items-center gap-6 mb-4">
                      <div className="w-16 h-16 bg-brand-600 rounded-xl flex items-center justify-center text-xl font-bold text-white">
                         {currentUser.avatar}
                      </div>
                      <div>
                         <button className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold mb-1.5">Update Avatar</button>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Min 400x400px • JPG, PNG</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                         <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                              type="text" 
                              defaultValue={currentUser.name} 
                              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-2 text-[13px] font-bold focus:ring-0 outline-none"
                            />
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                         <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                              type="email" 
                              defaultValue={currentUser.email} 
                              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-2 text-[13px] font-bold focus:ring-0 outline-none"
                            />
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                         <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                              type="tel" 
                              defaultValue={currentUser.phone} 
                              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-2 text-[13px] font-bold focus:ring-0 outline-none"
                            />
                         </div>
                      </div>
                   </div>
                   <div className="flex justify-end pt-2">
                      <button className="px-8 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold active:scale-95 transition-all outline-none">Save Profile</button>
                   </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-none"
              >
                 <h3 className="text-[13px] font-bold text-[#1e293b] mb-6 tracking-tight">Preferences</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Currency</label>
                       <div className="relative">
                          <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <select className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-2 text-[13px] font-bold focus:ring-0 outline-none appearance-none">
                            <option>INR - Indian Rupee</option>
                            <option>USD - US Dollar</option>
                            <option>EUR - Euro</option>
                          </select>
                          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-slate-400 pointer-events-none" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Language</label>
                       <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <select className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-2 text-[13px] font-bold focus:ring-0 outline-none appearance-none">
                            <option>English (US)</option>
                            <option>Hindi</option>
                            <option>Kannada</option>
                          </select>
                          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 text-slate-400 pointer-events-none" />
                       </div>
                    </div>
                 </div>
                 
                 <div className="mt-8 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                       <div>
                          <p className="text-[13px] font-bold text-[#1e293b] leading-none mb-1">Theme Setting</p>
                          <p className="text-[10px] text-slate-500 font-medium">Auto-switch based on system</p>
                       </div>
                       <select className="bg-white border border-[#e2e8f0] rounded-md px-3 py-1 text-[11px] font-bold outline-none">
                          <option>System</option>
                          <option>Light</option>
                          <option>Dark</option>
                       </select>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                       <div>
                          <p className="text-[13px] font-bold text-[#1e293b] leading-none mb-1">Smart Categorization</p>
                          <p className="text-[10px] text-slate-500 font-medium">Automatic transaction labeling</p>
                       </div>
                       <div className="w-10 h-5 bg-brand-600 rounded-full relative p-1 cursor-pointer">
                          <div className="w-3 h-3 bg-white rounded-full absolute right-1 top-1" />
                       </div>
                    </div>
                 </div>
              </motion.div>
           </div>

           {/* Section 2: Sidebar Widgets */}
           <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-none">
                 <h3 className="text-[13px] font-bold text-[#1e293b] tracking-tight mb-5">Linked Accounts</h3>
                 <div className="space-y-3">
                      {[
                      { name: 'HDFC Bank', email: '**** 4022', icon: 'H', status: 'Connected', color: 'bg-indigo-600' }
                    ].map((acc, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-[#f8fafc] rounded-lg hover:bg-slate-50 transition-all">
                         <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded flex items-center justify-center font-bold text-white shadow-sm text-xs", acc.color || "bg-rose-500")}>
                               {acc.icon}
                            </div>
                            <div>
                               <p className="text-[11px] font-bold text-[#1e293b] leading-none mb-1">{acc.name}</p>
                               <p className="text-[9px] text-slate-500 font-medium">{acc.email}</p>
                            </div>
                         </div>
                         <button className="text-[10px] font-bold text-brand-600 uppercase tracking-widest p-1.5 hover:bg-white rounded transition-all">Setup</button>
                      </div>
                    ))}
                    <button className="w-full py-2.5 border border-dashed border-[#e2e8f0] hover:border-brand-600 hover:bg-brand-600/5 transition-all rounded-lg text-[10px] font-bold text-slate-400 hover:text-brand-600 uppercase tracking-widest mt-1 flex items-center justify-center gap-2">
                       <Plus className="w-3 h-3" />
                       Link Account
                    </button>
                 </div>
              </div>

              <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 text-center relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-brand-600/10 rounded-full blur-2xl" />
                 <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto mb-5 border border-white/5">
                    <LogOut className="w-6 h-6 text-slate-400" />
                 </div>
                 <h4 className="text-white text-sm font-bold tracking-tight mb-1">Session Management</h4>
                 <p className="text-[11px] text-slate-500 font-medium mb-6">Safe logout from all active devices.</p>
                 <button onClick={handleLogout} className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all outline-none">Sign Out</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
