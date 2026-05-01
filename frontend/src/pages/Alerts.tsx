import { Header } from '../components/Header';
import { useState, useEffect } from 'react';
import { getAlerts } from '../lib/api';
import { cn } from '../lib/utils';
import { 
  AlertTriangle, 
  Zap, 
  CreditCard, 
  X, 
  ChevronRight,
  Info,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

const icons: Record<string, any> = {
  AlertTriangle,
  Zap,
  CreditCard,
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAlerts();
        setAlerts(data);
      } catch (error) {
        console.error("Failed to fetch alerts", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading alerts...</div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f4f5f7]">
      <Header title="Alerts" />
      
      <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto max-w-5xl mx-auto w-full space-y-6 pb-12">
        <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-[#e2e8f0]">
           <div className="flex bg-[#f8fafc] p-1 rounded-lg">
              {['All', 'Critical 3', 'Dual', 'Informative'].map((tab) => (
                <button 
                  key={tab} 
                  className={cn(
                    "px-4 py-1.5 rounded-md text-[11px] font-bold transition-all",
                    tab === 'All' ? "bg-white text-slate-900 border border-[#e2e8f0] shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button className="text-[10px] font-bold text-slate-400 hover:text-slate-900 px-4 uppercase tracking-widest transition-colors">Clear All</button>
        </div>

        <div className="space-y-3">
          {alerts.map((alert, i) => {
            const Icon = icons[alert.icon] || Info;
            return (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-4 rounded-xl border border-[#e2e8f0] hover:border-brand-600 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 flex-1">
                   <div className={cn(
                     "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                     alert.type === 'critical' ? "bg-rose-50 text-rose-500" : alert.type === 'dual' ? "bg-amber-50 text-amber-500" : "bg-brand-50 text-brand-600"
                   )}>
                      <Icon className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                      <h4 className="text-[13px] font-bold text-[#1e293b] leading-tight mb-0.5">{alert.message}</h4>
                      <p className="text-[11px] font-medium text-slate-500 line-clamp-1">{alert.is_read ? 'Read' : 'Unread'}</p>
                   </div>
                </div>
                <div className="flex items-center gap-6">
                   <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">{new Date(alert.created_at).toLocaleDateString()}</span>
                      <button className="text-brand-600 text-[10px] font-bold hover:underline flex items-center gap-0.5 uppercase tracking-widest">
                        Details <ChevronRight className="w-3 h-3" />
                      </button>
                   </div>
                   <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-500 transition-all">
                      <X className="w-4 h-4" />
                   </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-brand-600 p-6 rounded-xl border border-brand-700 shadow-none relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <CheckCircle2 className="w-24 h-24 text-white" />
           </div>
           <div className="relative z-10 flex items-center gap-6">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center text-white border border-white/10 shrink-0">
                <Info className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white tracking-tight leading-none mb-1.5 uppercase tracking-wide">Weekly Recap</h3>
                <p className="text-[11px] text-brand-100 font-medium">You've cleared 12 alerts this week. Keep maintaining your financial health!</p>
              </div>
              <button className="px-6 py-2 bg-white text-brand-600 hover:bg-brand-50 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all outline-none">History</button>
           </div>
        </div>
      </div>
    </div>
  );
}
