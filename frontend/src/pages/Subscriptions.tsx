import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { 
  Plus, Tv, Music, ShoppingBag, Cloud, LayoutGrid, Info, Trash2, X
} from 'lucide-react';
import { formatCurrency, cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getSubscriptions, createSubscription, deleteSubscription } from '../lib/api';

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
  const [activeTab, setActiveTab] = useState('Active');
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [nextBillingDate, setNextBillingDate] = useState('');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptions();
      setSubscriptions(data);
      
      // Calculate insights (only for active subs)
      const activeSubs = data.filter((s: any) => s.is_active);
      const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];
      const insights = activeSubs.map((sub: any, i: number) => ({
        name: sub.name,
        value: sub.amount,
        color: colors[i % colors.length]
      }));
      setInsightsData(insights);
    } catch (error) {
      console.error("Failed to fetch subscriptions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !nextBillingDate) return;
    
    try {
      await createSubscription({
        name,
        amount: parseFloat(amount),
        billing_cycle: billingCycle,
        next_billing_date: nextBillingDate
      });
      setShowAddModal(false);
      setName('');
      setAmount('');
      setBillingCycle('MONTHLY');
      setNextBillingDate('');
      fetchSubscriptions();
    } catch (error) {
      console.error("Failed to create subscription", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSubscription(id);
      fetchSubscriptions();
    } catch (error) {
      console.error("Failed to delete subscription", error);
    }
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#f4f5f7]">
        <Header title="Subscriptions" />
        <div className="p-8 text-center text-slate-500 font-bold">Loading subscriptions...</div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.is_active);
  const totalMonthly = activeSubscriptions.reduce((acc, sub) => acc + sub.amount, 0);
  const nextRenewal = activeSubscriptions.length > 0 ? formatDate(activeSubscriptions[0].nextBilling || activeSubscriptions[0].next_billing_date) : '-';

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (activeTab === 'Active') return sub.is_active;
    if (activeTab === 'History') return !sub.is_active;
    if (activeTab === 'Upcoming') {
      // Just show active for now, or filter by date
      return sub.is_active; 
    }
    return true;
  });

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
                   onClick={() => setActiveTab(tab)}
                   className={cn(
                     "px-5 py-1.5 rounded-md text-[11px] font-bold transition-all",
                     activeTab === tab ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-900"
                   )}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold transition-all"
              >
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
               { label: 'Active Subs', value: activeSubscriptions.length.toString() }
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
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Cycle</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Renewal</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none text-right">Cost</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredSubscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                          {activeTab === 'History' ? "No subscription history." : "No subscriptions found. Click 'New' to add one."}
                        </td>
                      </tr>
                    ) : (
                      filteredSubscriptions.map(sub => {
                        const Icon = serviceIcons[sub.name] || LayoutGrid;
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50 transition-colors group">
                             <td className="px-6 py-3">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                                      <Icon className="w-4 h-4" />
                                   </div>
                                   <span className="text-[13px] font-bold text-[#1e293b]">{sub.name}</span>
                                </div>
                             </td>
                             <td className="px-6 py-3 text-[11px] text-slate-500 font-medium">{sub.billing_cycle}</td>
                             <td className="px-6 py-3 font-bold text-slate-600 text-[11px]">{formatDate(sub.next_billing_date)}</td>
                             <td className="px-6 py-3 font-bold font-mono text-[#1e293b] text-[13px] text-right">{formatCurrency(sub.amount)}</td>
                             <td className="px-6 py-3 text-right">
                               {sub.is_active && (
                                 <button 
                                   onClick={() => handleDelete(sub.id)}
                                   className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                   title="Cancel Subscription"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               )}
                               {!sub.is_active && (
                                 <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-2 py-1 bg-red-50 rounded">Cancelled</span>
                               )}
                             </td>
                          </tr>
                        )
                      })
                    )}
                 </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <aside className="w-[300px] space-y-5 hidden xl:block shrink-0">
           <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-none flex flex-col">
              <h3 className="text-[13px] font-bold text-[#1e293b] mb-4">Breakdown</h3>
              {subscriptions.length > 0 ? (
                <>
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
                </>
              ) : (
                <div className="text-center text-slate-500 text-sm py-10">
                  Add subscriptions to see breakdown.
                </div>
              )}
           </div>
        </aside>
      </div>

      {/* Add Subscription Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Add Subscription</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Service Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Netflix, Spotify"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Amount (₹)</label>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Cycle</label>
                    <select 
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Next Billing Date</label>
                  <input 
                    type="date" 
                    value={nextBillingDate}
                    onChange={(e) => setNextBillingDate(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                    required
                  />
                </div>

                <button type="submit" className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-600/20 mt-4">
                  Save Subscription
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

