import { Header } from '../components/Header';
import { useAuth } from '../lib/useAuth';
import { useState, useEffect, useRef } from 'react';
import { updateUserProfile } from '../lib/api';
import { 
  User, 
  Mail,
  Phone,
  Plus,
  ChevronRight,
  LogOut,
  Camera,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Profile() {
  const { user, logout, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    avatar_url: user?.avatar_url || ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        setMessage({ type: 'error', text: 'Image size should be less than 1MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setFormData(prev => ({ ...prev, avatar_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.full_name.trim()) {
      setMessage({ type: 'error', text: 'Full Name is required' });
      return;
    }
    if (!formData.email.trim()) {
      setMessage({ type: 'error', text: 'Email Address is required' });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    if (!formData.phone_number.trim()) {
      setMessage({ type: 'error', text: 'Phone Number is required' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      await updateUserProfile(formData);
      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update profile', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const displayInitials = (user?.full_name?.[0] || user?.username?.[0] || 'U').toUpperCase();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f4f5f7]">
      <Header title="Profile" />
      
      <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6 pb-12">
        <div className="max-w-5xl mx-auto w-full">
           <AnimatePresence>
              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "mb-6 p-4 rounded-xl flex items-center gap-3 border shadow-sm",
                    message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
                  )}
                >
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5 rotate-45" />}
                  <p className="text-sm font-bold">{message.text}</p>
                </motion.div>
              )}
           </AnimatePresence>

           <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                         <div className="relative group">
                            <div className="w-20 h-20 bg-brand-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-brand-600/20 overflow-hidden">
                               {formData.avatar_url ? (
                                 <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                               ) : (
                                 displayInitials
                               )}
                            </div>
                            <button 
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute -bottom-2 -right-2 p-2 bg-white border border-[#e2e8f0] rounded-lg shadow-sm text-slate-600 hover:text-brand-600 transition-all active:scale-95"
                            >
                               <Camera className="w-4 h-4" />
                            </button>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleFileChange} 
                              accept="image/*" 
                              className="hidden" 
                            />
                         </div>
                         <div>
                            <div className="flex gap-2 mb-2">
                               <button 
                                 type="button"
                                 onClick={() => fileInputRef.current?.click()}
                                 className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 transition-all"
                               >
                                  Update Avatar
                               </button>
                               {formData.avatar_url && (
                                 <button 
                                   type="button"
                                   onClick={removeAvatar}
                                   className="px-4 py-1.5 bg-white border border-rose-100 text-rose-600 rounded-lg text-[11px] font-bold hover:bg-rose-50 transition-all"
                                 >
                                    Remove
                                 </button>
                               )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Max 1MB • JPG, PNG</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                            <div className="relative">
                               <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                               <input 
                                 type="text" 
                                 name="full_name"
                                 value={formData.full_name}
                                 onChange={handleInputChange}
                                 placeholder="Enter your full name"
                                 className={cn(
                                   "w-full bg-[#f8fafc] border rounded-lg pl-9 pr-4 py-2 text-[13px] font-bold focus:ring-1 focus:ring-brand-600/40 outline-none transition-all",
                                   !formData.full_name.trim() && message?.type === 'error' ? "border-rose-400" : "border-[#e2e8f0]"
                                 )}
                               />
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                            <div className="relative">
                               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                               <input 
                                 type="email" 
                                 name="email"
                                 value={formData.email}
                                 onChange={handleInputChange}
                                 placeholder="your.email@example.com"
                                 className={cn(
                                   "w-full bg-[#f8fafc] border rounded-lg pl-9 pr-4 py-2 text-[13px] font-bold focus:ring-1 focus:ring-brand-600/40 outline-none transition-all",
                                   (!formData.email.trim() || (message?.type === 'error' && !/^\S+@\S+\.\S+$/.test(formData.email))) && message?.type === 'error' ? "border-rose-400" : "border-[#e2e8f0]"
                                 )}
                               />
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                            <div className="relative">
                               <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                               <input 
                                 type="tel" 
                                 name="phone_number"
                                 value={formData.phone_number}
                                 onChange={handleInputChange}
                                 placeholder="+91 00000 00000"
                                 className={cn(
                                   "w-full bg-[#f8fafc] border rounded-lg pl-9 pr-4 py-2 text-[13px] font-bold focus:ring-1 focus:ring-brand-600/40 outline-none transition-all",
                                   !formData.phone_number.trim() && message?.type === 'error' ? "border-rose-400" : "border-[#e2e8f0]"
                                 )}
                               />
                            </div>
                         </div>
                      </div>
                      <div className="flex justify-end pt-2 border-t border-slate-50 mt-4">
                         <button 
                            disabled={isSaving}
                            type="submit"
                            className={cn(
                              "px-8 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold active:scale-95 transition-all outline-none shadow-md shadow-brand-600/10 min-w-[140px]",
                              isSaving && "opacity-70 cursor-not-allowed scale-100"
                            )}
                         >
                            {isSaving ? "Saving..." : "Save Changes"}
                         </button>
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
                            <button type="button" className="text-[10px] font-bold text-brand-600 uppercase tracking-widest p-1.5 hover:bg-white rounded transition-all">Setup</button>
                         </div>
                       ))}
                       <button type="button" className="w-full py-2.5 border border-dashed border-[#e2e8f0] hover:border-brand-600 hover:bg-brand-600/5 transition-all rounded-lg text-[10px] font-bold text-slate-400 hover:text-brand-600 uppercase tracking-widest mt-1 flex items-center justify-center gap-2">
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
                    <button type="button" onClick={handleLogout} className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all outline-none">Sign Out</button>
                 </div>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
}
