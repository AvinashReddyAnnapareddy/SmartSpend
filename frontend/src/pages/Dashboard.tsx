import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { useState, useEffect } from 'react';
import { getMonthlyOverview, getSpendingByCategory, getTransactions } from '../lib/api';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  TrendingUp, 
  PiggyBank, 
  HeartPulse, 
  ChevronRight, 
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line,
  CartesianGrid
} from 'recharts';
import { formatCurrency, cn, formatDate } from '../lib/utils';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [spendingByCategory, setSpendingByCategory] = useState<any[]>([]);
  const [monthlyOverview, setMonthlyOverview] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txs, spending, overview] = await Promise.all([
          getTransactions(),
          getSpendingByCategory(),
          getMonthlyOverview()
        ]);
        setTransactions(txs);
        setSpendingByCategory(spending);
        setMonthlyOverview(overview);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading dashboard data...</div>;

  const totalSpent = transactions.filter(t => t.category?.transaction_type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const totalReceived = transactions.filter(t => t.category?.transaction_type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const totalBalance = totalReceived - totalSpent;
  const savingsRate = totalReceived > 0 ? Math.round(((totalReceived - totalSpent) / totalReceived) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f4f5f7]">
      <Header title="Dashboard" />
      
      <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-64px)]">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Total Balance" value={totalBalance} change={0} icon={Wallet} />
          <StatCard title="Total Spending" value={totalSpent} change={0} icon={TrendingUp} variant="warning" />
          <StatCard title="Savings Rate" value={`${savingsRate}%`} change={0} icon={PiggyBank} variant="success" isCurrency={false} />
          <StatCard title="Total Income" value={totalReceived} change={0} icon={HeartPulse} variant="info" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Pie Chart: Spending by Category */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 bg-white p-5 rounded-xl border border-[#e2e8f0] flex flex-col shadow-none"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[13px] font-bold text-[#1e293b] tracking-tight">Spending by Category</h3>
              <Link to="/categories" className="text-brand-600 text-[11px] font-bold hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex-1 min-h-[260px] relative flex items-center justify-center">
              {spendingByCategory.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                      <Pie
                        data={spendingByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {spendingByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Spent</p>
                    <p className="text-2xl font-bold font-mono text-[#1e293b] leading-none">{formatCurrency(totalSpent)}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm font-bold text-slate-400">No data available</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
              {spendingByCategory.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-[11px] font-medium text-slate-600 truncate">{cat.name}</span>
                  <span className="text-[11px] font-bold font-mono text-[#1e293b] ml-auto">{cat.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bar Chart: Monthly Overview */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white p-5 rounded-xl border border-[#e2e8f0] flex flex-col shadow-none"
          >
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-[13px] font-bold text-[#1e293b] tracking-tight">Monthly Spending Overview</h3>
              </div>
              <select className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[10px] font-bold px-2 py-1 focus:ring-1 focus:ring-brand-600/40 outline-none">
                <option>This Year</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-64 mt-4 flex items-center justify-center">
              {monthlyOverview.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <LineChart data={monthlyOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 600 }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm font-bold text-slate-400">No data available</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Transactions */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-none"
          >
            <div className="px-5 py-4 border-b border-[#e2e8f0] flex justify-between items-center">
              <h3 className="text-[13px] font-bold text-[#1e293b] tracking-tight">Recent Transactions</h3>
              <Link to="/transactions" className="text-brand-600 text-[11px] font-bold hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-[#e2e8f0]">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="p-3.5 px-5 hover:bg-slate-50 transition-colors flex items-center gap-4 group">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-[#e2e8f0]",
                    tx.category?.transaction_type === 'INCOME' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                  )}>
                    {tx.category?.transaction_type === 'INCOME' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1e293b] truncate leading-tight mb-0.5">{tx.description}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{tx.category?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-[13px] font-bold font-mono tracking-tight leading-tight",
                      tx.category?.transaction_type === 'INCOME' ? "text-emerald-600" : "text-[#1e293b]"
                    )}>
                      {tx.category?.transaction_type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">{formatDate(tx.transaction_date)}</p>
                  </div>
                  <button className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 transition-all ml-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Savings Trend and Budget Alerts */}
          <div className="space-y-5">
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-none"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[13px] font-bold text-[#1e293b] tracking-tight">Savings Trend</h3>
                <span className="text-[10px] font-bold text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded uppercase">Growing</span>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyOverview}>
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10B981" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: '#10B981' }}
                    />
                    <Tooltip contentStyle={{ display: 'none' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
