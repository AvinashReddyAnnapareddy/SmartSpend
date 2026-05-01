import { Header } from '../components/Header';
import { useState, useEffect } from 'react';
import { getTransactions, getSpendingByCategory } from '../lib/api';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  PiggyBank
} from 'lucide-react';
import { formatCurrency, cn, formatDate } from '../lib/utils';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txs, spending] = await Promise.all([
          getTransactions(),
          getSpendingByCategory()
        ]);
        setTransactions(txs);
        setSpendingByCategory(spending);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading transactions...</div>;

  const summaryData = spendingByCategory.map(cat => ({
    name: cat.name,
    value: cat.value,
    color: cat.color,
    amount: cat.amount
  }));

  const totalSpent = transactions.filter(t => t.category.transaction_type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const totalReceived = transactions.filter(t => t.category.transaction_type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const netFlow = totalReceived - totalSpent;

  const quickStats = [
    { label: 'Transactions', value: transactions.length.toString(), change: '', variant: 'info' },
    { label: 'Total Spent', value: formatCurrency(totalSpent), change: '', variant: 'warning' },
    { label: 'Total Received', value: formatCurrency(totalReceived), change: '', variant: 'success' },
    { label: 'Net Flow', value: formatCurrency(netFlow), change: '', variant: 'brand' }
  ];
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f4f5f7]">
      <Header title="Transactions" />
      
      <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex gap-6">
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pr-2">
          {/* Controls */}
          <div className="bg-white p-3.5 rounded-xl border border-[#e2e8f0] flex items-center justify-between mb-5 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="flex bg-[#f1f5f9] p-1 rounded-lg">
                {['All', 'Income', 'Expense', 'Transfer'].map((tab) => (
                  <button 
                    key={tab} 
                    className={cn(
                      "px-3 py-1 rounded-md text-[11px] font-bold transition-all",
                      tab === 'All' ? "bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="h-6 w-[1px] bg-slate-200 mx-1" />
              <button className="flex items-center gap-2 px-2.5 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[11px] font-bold text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>May 1 - May 31</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-48 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-1.5 text-[11px] focus:ring-1 focus:ring-brand-600/40 outline-none"
                />
              </div>
              <button
                onClick={() => navigate('/add-expense')}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-5 mb-5">
            {quickStats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-3.5 rounded-xl border border-[#e2e8f0]"
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <h4 className="text-base font-bold font-mono text-[#1e293b] leading-none">{stat.value}</h4>
                  <span className={cn(
                    "text-[10px] font-bold",
                    stat.change.startsWith('+') ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {stat.change}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Amount</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3">
                        <p className="text-[11px] font-bold text-[#1e293b]">{formatDate(tx.transaction_date)}</p>
                        <p className="text-[10px] text-slate-400">12:45 PM</p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-7 h-7 rounded flex items-center justify-center shrink-0 border border-[#e2e8f0]",
                            tx.category.transaction_type === 'INCOME' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                          )}>
                            {tx.category.transaction_type === 'INCOME' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-[#1e293b] leading-tight px-0">{tx.description}</p>
                            <p className="text-[10px] text-slate-500">{tx.merchant || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] font-medium text-slate-600">
                          {tx.category.name}
                        </span>
                      </td>
                      <td className={cn(
                        "px-5 py-3 text-[13px] font-bold font-mono text-right",
                        tx.category.transaction_type === 'INCOME' ? "text-emerald-600" : "text-[#1e293b]"
                      )}>
                        {tx.category.transaction_type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button className="p-1 hover:bg-slate-200 rounded text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="mt-auto p-4 border-t border-[#e2e8f0] flex items-center justify-between bg-white sticky bottom-0">
               <p className="text-[11px] text-slate-500">Showing {Math.min(10, transactions.length)} of {transactions.length}</p>
               <div className="flex items-center gap-1">
                 <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
                 <div className="flex items-center gap-1 mx-2">
                   {[1, 2, 3].map(p => (
                     <button key={p} className={cn(
                       "w-7 h-7 rounded text-[11px] font-bold",
                       p === 1 ? "bg-[#1e293b] text-white" : "text-slate-500 hover:bg-slate-50"
                     )}>
                       {p}
                     </button>
                   ))}
                 </div>
                 <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400"><ChevronRight className="w-4 h-4" /></button>
               </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Summary */}
        <aside className="w-[300px] space-y-5 hidden xl:block shrink-0">
          <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-none">
            <h3 className="text-[13px] font-bold text-[#1e293b] mb-4">Allocation</h3>
            <div className="w-full h-40 relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={summaryData}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {summaryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-xl font-bold font-mono text-[#1e293b]">{transactions.length}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">TOTAL</p>
              </div>
            </div>
            <div className="w-full space-y-3 mt-4">
              {summaryData.map((item, i) => (
               <div key={i} className="flex flex-col gap-1">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                     <span className="text-[11px] font-bold text-slate-600">{item.name}</span>
                   </div>
                   <span className="text-[11px] font-bold font-mono text-[#1e293b]">{formatCurrency(item.amount)}</span>
                 </div>
                 <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                   <div 
                     className="h-full rounded-full" 
                     style={{ backgroundColor: item.color, width: `${item.value}%` }} 
                   />
                 </div>
               </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-none">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[13px] font-bold text-[#1e293b]">Categories</h3>
              <button
                onClick={() => navigate('/categories')}
                className="text-brand-600 text-[10px] font-bold uppercase tracking-widest leading-none"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {spendingByCategory.slice(0, 4).map((cat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center border border-slate-100">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600">{cat.name}</span>
                  </div>
                  <span className="text-[11px] font-bold font-mono text-[#1e293b]">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
          
          <button className="w-full p-4 bg-[#0F172A] rounded-xl text-white flex flex-col items-center gap-3 border border-slate-800 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-brand-600/10 rounded-full blur-2xl group-hover:bg-brand-600/20 transition-all shadow-none" />
            <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center relative z-10">
              <Download className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-center relative z-10">
              <h4 className="text-[10px] font-bold uppercase tracking-[2px]">Export Data</h4>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">Monthly PDF Report</p>
            </div>
          </button>
        </aside>
      </div>
    </div>
  );
}
