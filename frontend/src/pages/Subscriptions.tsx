import { Header } from '../components/Header';
import { 
  Download, 
  Filter, 
  TrendingUp, 
  MoreHorizontal,
  ChevronDown,
  Info,
  ExternalLink,
  Plus,
  Tv,
  Music,
  ShoppingBag,
  Cloud,
  LayoutGrid
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatCurrency, cn, formatDate } from '../lib/utils';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const serviceIcons: Record<string, any> = {
  'Netflix': Tv,
  'Spotify': Music,
  'Amazon Prime': ShoppingBag,
  'Microsoft OneDrive': Cloud,
  'Adobe Creative Cloud': LayoutGrid,
};

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [insightsData, setInsightsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated fetch for real subscription data. Empty for now since backend lacks this API.
    const fetchSubscriptions = async () => {
      try {
        setSubscriptions([]);
        setInsightsData([]);
      } catch (error) {
        console.error("Failed to fetch subscriptions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading subscriptions...</div>;

  const totalMonthly = subscriptions.reduce((acc, sub) => acc + sub.amount, 0);
  const nextRenewal = subscriptions.length > 0 ? formatDate(subscriptions[0].nextBilling) : '-';

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f4f5f7]">
      <Header title="Subscriptions" />
      
      <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex gap-6">
        <div className="flex-1 flex flex-col min-w-0 pr-1 overflow-y-auto">
          {/* Action Row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex bg-white p-1 rounded-lg border border-[#e2e8f0]">
               {['Active', 'Upcoming', 'History'].map((tab) => (
                 <button 
                   key={tab} 
                   className={cn(
                     "px-5 py-1.5 rounded-md text-[11px] font-bold transition-all",
                     tab === 'Active' ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-900"
                   )}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold transition-all">
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
             {[
               { label: 'Total Monthly', value: formatCurrency(totalMonthly) },
               { label: 'Next Renewal', value: nextRenewal },
               { label: 'Savings Potential', value: '₹0' }
             ].map((stat, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-none">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">{stat.label}</p>
                  <h4 className="text-base font-bold font-mono text-[#1e293b] tracking-tight">{stat.value}</h4>
                </div>
             ))}
          </div>

          {/* Subscription List Table */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-none overflow-hidden flex flex-col mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Service</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Plan</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Renewal</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none text-right">Cost</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {subscriptions.map(sub => {
                      const Icon = serviceIcons[sub.service] || LayoutGrid;
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50 transition-colors group">
                           <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                                    <Icon className="w-4 h-4" />
                                 </div>
                                 <span className="text-[13px] font-bold text-[#1e293b]">{sub.service}</span>
                              </div>
                           </td>
                           <td className="px-6 py-3 text-[11px] text-slate-500 font-medium">{sub.plan}</td>
                           <td className="px-6 py-3 font-bold text-slate-600 text-[11px]">{formatDate(sub.nextBilling)}</td>
                           <td className="px-6 py-3 font-bold font-mono text-[#1e293b] text-[13px] text-right">{formatCurrency(sub.amount)}</td>
                        </tr>
                      )
                    })}
                 </tbody>
              </table>
            </div>
          </div>

          {/* Smart Offer Card */}
          <div className="bg-[#1e293b] p-6 rounded-xl border border-slate-700 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-10 h-10 bg-brand-600/20 rounded flex items-center justify-center border border-brand-600/20">
                <Info className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight leading-none mb-1">Optimizer Recommendations</h3>
                <p className="text-[11px] text-slate-500 font-medium">4 alternatives could save you ₹840 monthly.</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold transition-all transform active:scale-95 outline-none relative z-10">Compare</button>
          </div>
        </div>

        {/* Info Column */}
        <aside className="w-[300px] space-y-5 hidden xl:block shrink-0">
           <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-none flex flex-col">
              <h3 className="text-[13px] font-bold text-[#1e293b] mb-4">Breakdown</h3>
              <div className="h-40 relative mb-6">
                 <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                      <Pie
                        data={insightsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {insightsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-xl font-bold font-mono text-[#1e293b] leading-none">{formatCurrency(totalMonthly)}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">MONTHLY</p>
                 </div>
              </div>
              <div className="space-y-3">
                 {insightsData.map((item, i) => (
                   <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[11px] font-bold text-slate-600 leading-none">{item.name}</span>
                         </div>
                         <span className="text-[11px] font-bold font-mono text-[#1e293b] leading-none">{formatCurrency(item.value)}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-amber-50 p-5 rounded-xl border border-amber-100 shadow-none relative">
              <div className="w-8 h-8 bg-amber-500/10 rounded flex items-center justify-center text-amber-500 mb-3">
                <Info className="w-4 h-4" />
              </div>
              <h4 className="text-[13px] font-bold text-amber-900 tracking-tight leading-none mb-1">Savings Alert</h4>
              <p className="text-[11px] font-medium text-amber-800/70 mb-5 leading-relaxed">Cancel 2 unused trials to save <span className="font-bold text-amber-900 tracking-tight">₹840</span> this month.</p>
              <button className="w-full py-2 bg-white border border-amber-200 text-amber-900 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-amber-100 transition-all">Review Hub</button>
           </div>
        </aside>
      </div>
    </div>
  );
}
