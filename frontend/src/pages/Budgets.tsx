import { Header } from '../components/Header';
import { useState, useEffect } from 'react';
import { getCategories, getTransactions } from '../lib/api';
import { 
  Plus, 
  ArrowUpRight, 
  TrendingUp, 
  ChevronRight,
  TrendingDown,
  AlertCircle,
  Download,
  UtensilsCrossed,
  Plane,
  ShoppingBag,
  Zap,
  MoreVertical
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';


const categoryIcons: Record<string, any> = {
  'Food & Dining': UtensilsCrossed,
  'Travel': Plane,
  'Shopping': ShoppingBag,
  'Bills & Utilities': Zap,
  'Bills & Utilities': Zap,
};

export default function Budgets() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, txs] = await Promise.all([
          getCategories(),
          getTransactions()
        ]);
        
        // Transform categories into budgets format
        const calculatedBudgets = cats.filter(c => c.transaction_type === 'EXPENSE').map(c => {
          const spent = txs.filter(t => t.category.id === c.id).reduce((sum, t) => sum + t.amount, 0);
          return {
            id: c.id,
            category: c.name,
            budgeted: c.monthly_budget_limit || 0,
            spent: spent,
            color: '#10B981'
          };
        });
        
        setBudgets(calculatedBudgets);
        setTransactions(txs);
      } catch (error) {
        console.error("Failed to fetch budgets", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading budgets...</div>;

  const totalBudgeted = budgets.reduce((acc, b) => acc + b.budgeted, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const remaining = totalBudgeted - totalSpent;
  const budgetStats = [
    { name: 'Budgeted', amount: totalBudgeted, color: '#4F46E5', percent: 100 },
    { name: 'Spent', amount: totalSpent, color: '#F43F5E', percent: totalBudgeted ? (totalSpent/totalBudgeted)*100 : 0 },
    { name: 'Remaining', amount: remaining > 0 ? remaining : 0, color: '#10B981', percent: totalBudgeted ? (remaining/totalBudgeted)*100 : 0 },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f4f5f7]">
      <Header title="Budgets" />
      
      <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex gap-6">
        <div className="flex-1 flex flex-col min-w-0 pr-2 overflow-y-auto">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
             <div className="flex bg-white p-1 rounded-lg border border-[#e2e8f0]">
              {['Current', 'Previous', 'Saved'].map((tab) => (
                <button 
                  key={tab} 
                  className={cn(
                    "px-5 py-1.5 rounded-md text-[11px] font-bold transition-all",
                    tab === 'Current' ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold transition-all shrink-0">
                <Plus className="w-4 h-4" />
                <span>New Budget</span>
              </button>
            </div>
          </div>

          {/* Urgent Alert */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-rose-900 leading-tight">Total Budget Alert</h4>
                <p className="text-[11px] text-rose-600 font-medium">{formatCurrency(totalSpent)} of {formatCurrency(totalBudgeted)} spent ({totalBudgeted ? Math.round((totalSpent/totalBudgeted)*100) : 0}%)</p>
              </div>
            </div>
            <button className="px-3 py-1.5 bg-white text-rose-600 text-[11px] font-bold rounded-lg border border-rose-100">Review</button>
          </motion.div>

          {/* Budget Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-6">
            {budgets.map((budget, i) => {
              const Icon = categoryIcons[budget.category] || UtensilsCrossed;
              const percent = (budget.spent / budget.budgeted) * 100;
              return (
                <motion.div 
                  key={budget.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-none relative group"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold text-[#1e293b] tracking-tight">{budget.category}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Budget</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1">Total</p>
                       <p className="text-sm font-bold font-mono text-[#1e293b] leading-none">{formatCurrency(budget.budgeted)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                        className={cn(
                          "h-full rounded-full",
                          percent > 90 ? "bg-rose-500" : percent > 70 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${percent}%` }}
                       />
                    </div>
                    
                    <div className="flex justify-between items-center text-[11px] mb-2 font-medium">
                      <span className="text-slate-500">Spent: <span className="font-bold text-slate-900 font-mono">{formatCurrency(budget.spent)}</span></span>
                      <span className={cn(
                        "font-bold",
                        percent > 90 ? "text-rose-500" : percent > 70 ? "text-amber-500" : "text-emerald-500"
                      )}>{Math.round(percent)}%</span>
                    </div>

                    <div className="space-y-2 pt-2">
                      {transactions.filter(t => t.category.name === budget.category).slice(0, 2).map((t) => (
                        <div key={t.id} className="flex items-center justify-between py-1 border-t border-slate-50 first:border-0">
                          <span className="text-[11px] text-slate-600 truncate max-w-[140px]">{t.description}</span>
                          <span className="text-[11px] font-bold font-mono text-[#1e293b]">{formatCurrency(t.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                     <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-brand-600 transition-colors">Details</button>
                     <p className="text-[10px] font-bold text-slate-400">MAY REPORT</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Info Panel */}
        <aside className="w-[300px] space-y-5 hidden xl:block shrink-0">
           <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] flex flex-col pt-6 shadow-none">
              <h3 className="text-[13px] font-bold text-[#1e293b] mb-4">Summary</h3>
              <div className="h-40 relative mb-6">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    <Pie
                      data={budgetStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="amount"
                    >
                      {budgetStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-xl font-bold font-mono text-[#1e293b]">{budgets.length}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">BUDGETS</p>
                </div>
              </div>
              <div className="space-y-3">
                 {budgetStats.map((item, i) => (
                   <div key={i} className="flex flex-col gap-1 p-2.5 rounded-lg border border-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                           <span className="text-[11px] font-bold text-slate-600">{item.name}</span>
                        </div>
                        <span className="text-[11px] font-bold font-mono text-[#1e293b]">{formatCurrency(item.amount)}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] relative overflow-hidden group shadow-none">
              <h3 className="text-[13px] font-bold text-[#1e293b] mb-2 leading-tight">PDF Report</h3>
              <p className="text-[11px] text-slate-500 mb-4 font-medium">Detailed monthly analysis.</p>
              
              <div className="relative mb-3">
                <select className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-[11px] font-bold appearance-none outline-none">
                  <option>May 2024</option>
                  <option>April 2024</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rotate-90 text-slate-400 pointer-events-none" />
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>
           </div>
        </aside>
      </div>
    </div>
  );
}
