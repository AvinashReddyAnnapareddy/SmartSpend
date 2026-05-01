import { Header } from '../components/Header';
import { useState, useEffect } from 'react';
import { getTransactions, getSpendingByCategory, updateTransaction, deleteTransaction, getCategories } from '../lib/api';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [spendingByCategory, setSpendingByCategory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit/Delete state
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formDate, setFormDate] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, currentMonth, currentYear]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txs, spending, cats] = await Promise.all([
          getTransactions(),
          getSpendingByCategory(),
          getCategories()
        ]);
        setTransactions(txs);
        setSpendingByCategory(spending);
        setCategories(cats);
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

  const totalSpent = transactions.filter(t => t.category?.transaction_type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const totalReceived = transactions.filter(t => t.category?.transaction_type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const netFlow = totalReceived - totalSpent;

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
        const [newTxs, newSpending] = await Promise.all([getTransactions(), getSpendingByCategory()]);
        setTransactions(newTxs);
        setSpendingByCategory(newSpending);
      } catch (err) {
        alert('Failed to delete transaction');
      }
    }
  };

  const openEditModal = (tx: any) => {
    setEditingTransaction(tx);
    setFormAmount(tx.amount.toString());
    setFormDescription(tx.description || '');
    setFormCategoryId(tx.category?.id || '');
    setFormDate(tx.transaction_date);
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleEditSave = async () => {
    if (!formAmount || !formCategoryId || !formDate) {
      alert("Please fill required fields");
      return;
    }
    try {
      await updateTransaction(editingTransaction.id, {
        amount: parseFloat(formAmount),
        category_id: Number(formCategoryId),
        transaction_date: formDate,
        description: formDescription || undefined
      });
      setIsEditModalOpen(false);
      setEditingTransaction(null);
      const [newTxs, newSpending] = await Promise.all([getTransactions(), getSpendingByCategory()]);
      setTransactions(newTxs);
      setSpendingByCategory(newSpending);
    } catch (err) {
      alert('Failed to update transaction');
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedAndFilteredTransactions = [...transactions]
    .filter(tx => {
      if (activeFilter === 'Income' && tx.category?.transaction_type !== 'INCOME') return false;
      if (activeFilter === 'Expense' && tx.category?.transaction_type !== 'EXPENSE') return false;
      
      const txDate = new Date(tx.transaction_date);
      if (txDate.getMonth() !== currentMonth || txDate.getFullYear() !== currentYear) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const descMatch = tx.description?.toLowerCase().includes(q);
        const merchantMatch = tx.merchant?.toLowerCase().includes(q);
        const catMatch = tx.category?.name?.toLowerCase().includes(q);
        if (!descMatch && !merchantMatch && !catMatch) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === 'date') {
        aVal = new Date(a.transaction_date).getTime();
        bVal = new Date(b.transaction_date).getTime();
      } else if (sortConfig.key === 'amount') {
        aVal = a.amount;
        bVal = b.amount;
      } else if (sortConfig.key === 'description') {
        aVal = a.description?.toLowerCase() || '';
        bVal = b.description?.toLowerCase() || '';
      } else if (sortConfig.key === 'category') {
        aVal = a.category?.name?.toLowerCase() || '';
        bVal = b.category?.name?.toLowerCase() || '';
      } else {
        return 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      
      // Secondary sort by ID to ensure consistent ordering and latest items at top when dates are equal
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc' ? a.id - b.id : b.id - a.id;
      }
      return 0;
    });

  const totalPages = Math.ceil(sortedAndFilteredTransactions.length / itemsPerPage);
  const currentTransactions = sortedAndFilteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const quickStats = [
    { label: 'Transactions', value: transactions.length.toString(), change: '', variant: 'info' },
    { label: 'Total Spent', value: formatCurrency(totalSpent), change: '', variant: 'warning' },
    { label: 'Total Received', value: formatCurrency(totalReceived), change: '', variant: 'success' },
    { label: 'Net Flow', value: formatCurrency(netFlow), change: '', variant: 'brand' }
  ];

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Transactions Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const periodStr = `${monthNames[currentMonth]} ${currentYear}`;
    doc.text(`Period: ${periodStr} | Filter: ${activeFilter} | Total: ${sortedAndFilteredTransactions.length} transactions`, 14, 30);
    
    const tableColumn = ["Date", "Description", "Category", "Type", "Amount"];
    const tableRows = sortedAndFilteredTransactions.map(tx => [
      formatDate(tx.transaction_date),
      tx.description || '-',
      tx.category?.name || '-',
      tx.category?.transaction_type === 'INCOME' ? 'Income' : 'Expense',
      `${tx.category?.transaction_type === 'INCOME' ? '+' : '-'}${formatCurrency(tx.amount)}`
    ]);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
    });
    
    doc.save(`smartspend_transactions_${currentYear}_${currentMonth + 1}.pdf`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f4f5f7]">
      <Header title="Transactions" />
      
      <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex gap-6">
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pr-2">
          {/* Controls */}
          <div className="bg-white p-3.5 rounded-xl border border-[#e2e8f0] flex items-center justify-between mb-5 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="flex bg-[#f1f5f9] p-1 rounded-lg">
                {['All', 'Income', 'Expense'].map((tab) => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveFilter(tab)}
                    className={cn(
                      "px-3 py-1 rounded-md text-[11px] font-bold transition-all",
                      activeFilter === tab ? "bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="h-6 w-[1px] bg-slate-200 mx-1" />
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[11px] font-bold text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="month" 
                  value={`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-');
                    setCurrentYear(Number(y));
                    setCurrentMonth(Number(m) - 1);
                  }}
                  className="bg-transparent outline-none cursor-pointer text-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-4 py-1.5 text-[11px] focus:ring-1 focus:ring-brand-600/40 outline-none"
                />
              </div>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e2e8f0] hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold transition-all shadow-none"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
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
                    <th onClick={() => handleSort('date')} className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors">
                      Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('description')} className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors">
                      Description {sortConfig.key === 'description' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('category')} className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors">
                      Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('amount')} className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100 transition-colors">
                      Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {currentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-500 text-sm">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    currentTransactions.map((tx) => (
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
                      <td className="px-5 py-3 text-[13px] font-bold font-mono text-right text-[#1e293b]">
                        {tx.category?.transaction_type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-5 py-3 text-right relative">
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === tx.id ? null : tx.id)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-all"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeDropdown === tx.id && (
                          <div className="absolute right-8 top-10 w-32 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                            <button 
                              onClick={() => openEditModal(tx)}
                              className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => {
                                setActiveDropdown(null);
                                handleDelete(tx.id);
                              }}
                              className="w-full text-left px-4 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="mt-auto p-4 border-t border-[#e2e8f0] flex items-center justify-between bg-white sticky bottom-0">
               <p className="text-[11px] text-slate-500">
                 Showing {currentTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, sortedAndFilteredTransactions.length)} of {sortedAndFilteredTransactions.length}
               </p>
               <div className="flex items-center gap-1">
                 <button 
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                   disabled={currentPage === 1}
                   className="p-1.5 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-50 transition-opacity"
                 >
                   <ChevronLeft className="w-4 h-4" />
                 </button>
                 <div className="flex items-center gap-1 mx-2 overflow-x-auto max-w-[200px] scrollbar-hide">
                   {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                     <button 
                       key={p} 
                       onClick={() => setCurrentPage(p)}
                       className={cn(
                         "w-7 h-7 shrink-0 rounded text-[11px] font-bold transition-colors",
                         p === currentPage ? "bg-[#1e293b] text-white" : "text-slate-500 hover:bg-slate-50"
                       )}
                     >
                       {p}
                     </button>
                   ))}
                 </div>
                 <button 
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                   disabled={currentPage === totalPages || totalPages === 0}
                   className="p-1.5 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-50 transition-opacity"
                 >
                   <ChevronRight className="w-4 h-4" />
                 </button>
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
          
        </aside>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1e293b]">Edit Transaction</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-[13px] font-bold focus:ring-0 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-[13px] font-bold focus:ring-0 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                <div className="relative">
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(Number(e.target.value))}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-[13px] font-bold focus:ring-0 outline-none appearance-none"
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name} ({cat.transaction_type})</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-[13px] font-bold focus:ring-0 outline-none"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-[12px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditSave}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[12px] font-bold transition-all shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
