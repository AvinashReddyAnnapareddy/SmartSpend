import { Header } from '../components/Header';
import { useState, useEffect } from 'react';
import { getSpendingByCategory, getMonthlyOverview } from '../lib/api';
import { 
  Download, 
  Share2, 
  ChevronDown, 
  UtensilsCrossed, 
  Plane, 
  ShoppingBag, 
  Zap,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';


export default function Analytics() {
  const [spendingByCategory, setSpendingByCategory] = useState<any[]>([]);
  const [monthlyOverview, setMonthlyOverview] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [spending, overview] = await Promise.all([
          getSpendingByCategory(),
          getMonthlyOverview()
        ]);
        setSpendingByCategory(spending);
        setMonthlyOverview(overview);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading analytics...</div>;

  const totalSpent = spendingByCategory.reduce((acc, cat) => acc + cat.amount, 0);
  const avgMonthlySpent = monthlyOverview.length > 0 ? Math.round(monthlyOverview.reduce((acc, mo) => acc + mo.amount, 0) / monthlyOverview.length) : 0;
  const dynamicSavingsTrend = monthlyOverview.map(mo => ({ name: mo.name, trend: mo.amount }));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f4f5f7]">
      <Header title="Analytics" />
      
      <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto space-y-6 pb-12">
        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex bg-white p-1 rounded-lg border border-[#e2e8f0]">
            {['Overview', 'Expenses', 'Income'].map((tab) => (
              <button 
                key={tab} 
                className={cn(
                  "px-5 py-1.5 rounded-md text-[11px] font-bold transition-all",
                  tab === 'Overview' ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-900"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e2e8f0]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yearly</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
             </div>
             <button className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-white rounded-lg text-[11px] font-bold transition-all">
               <Download className="w-3.5 h-3.5" />
               <span>Statement</span>
             </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Detailed Category Chart */}
           <motion.div 
             initial={{ opacity: 0, scale: 0.98 }}
             animate={{ opacity: 1, scale: 1 }}
             className="lg:col-span-1 bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-none flex flex-col items-center"
           >
              <h3 className="font-bold text-[#1e293b] text-[13px] mb-6 text-center shrink-0">Spending Distribution</h3>
              <div className="w-full h-56 relative mb-8 shrink-0 flex items-center justify-center">
                {spendingByCategory.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <PieChart>
                        <Pie
                          data={spendingByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {spendingByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total</p>
                      <p className="text-xl font-bold font-mono text-[#1e293b] tracking-tight leading-none">{formatCurrency(totalSpent)}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-bold text-slate-400">No data available</p>
                )}
              </div>
              <div className="w-full space-y-3">
                {spendingByCategory.map((cat, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-[11px] font-bold text-slate-600">{cat.name}</span>
                      </div>
                      <span className="text-[11px] font-bold font-mono text-[#1e293b]">{cat.value}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div className="h-full rounded-full" style={{ backgroundColor: cat.color, width: `${cat.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
           </motion.div>

           <div className="lg:col-span-2 space-y-6">
              {/* Monthly Spending overview */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-none"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-[13px] font-bold text-[#1e293b] tracking-tight">Monthly Average</h3>
                    <p className="text-[11px] font-medium text-slate-500 mt-1">{formatCurrency(avgMonthlySpent)} / month spent average</p>
                  </div>
                </div>
                <div className="h-56 flex items-center justify-center">
                   {monthlyOverview.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <BarChart data={monthlyOverview} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '11px' }}
                        />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]} fill="#2563eb" barSize={24} />
                      </BarChart>
                     </ResponsiveContainer>
                   ) : (
                     <p className="text-sm font-bold text-slate-400">No data available</p>
                   )}
                </div>
              </motion.div>

              {/* Savings Trend and other small charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-none"
                >
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-[13px] font-bold text-[#1e293b] tracking-tight">Savings Path</h4>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">+6% Growth</p>
                      </div>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                   </div>
                    <div className="h-24">
                      {dynamicSavingsTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                          <AreaChart data={dynamicSavingsTrend}>
                             <defs>
                              <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                             <Area type="monotone" dataKey="trend" stroke="#10B981" strokeWidth={2} fill="url(#colorTrend)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-xs font-bold text-slate-400 mt-4">No trend available</p>
                      )}
                   </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-none"
                >
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-[13px] font-bold text-white tracking-tight">Fin Score</h4>
                        <p className="text-[10px] font-bold text-sky-400 uppercase">Excellent</p>
                      </div>
                      <Info className="w-4 h-4 text-slate-500" />
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold font-mono text-white italic tracking-tighter">8.7</div>
                      <div className="flex-1 space-y-1.5">
                         <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-600 rounded-full" style={{ width: '87%' }} />
                         </div>
                         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">8.4% improvement</p>
                      </div>
                   </div>
                </motion.div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
