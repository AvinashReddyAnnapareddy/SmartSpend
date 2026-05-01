import { Header } from '../components/Header';
import { BudgetCard } from '../components/BudgetCard';
import { useState, useEffect, useMemo } from 'react';
import { createBudget, getBudgets, getCategories, getTransactions, updateBudget, deleteBudget } from '../lib/api';
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
  'Groceries': UtensilsCrossed,
  'Travel': Plane,
  'Transport': Plane,
  'Shopping': ShoppingBag,
  'Entertainment': ShoppingBag,
  'Bills & Utilities': Zap,
  'Rent': Zap,
};

export default function Budgets() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategoryIds, setFormCategoryIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const expenseCategories = useMemo(
    () => categories.filter((c) => String(c.transaction_type).toUpperCase() === 'EXPENSE'),
    [categories]
  );

  const budgetsWithSpent = useMemo(() => {
    return budgets.map((budget) => {
      const categoryIds = (budget.categories ?? [])
        .map((c: any) => Number(c.id))
        .filter((id: number) => Number.isFinite(id));
      const categoryIdSet = new Set<number>(categoryIds);
      const spent = transactions.reduce((sum: number, t: any) => {
        const categoryId = Number(t?.category?.id);
        if (categoryIdSet.has(categoryId)) {
          return sum + (Number(t.amount) || 0);
        }
        return sum;
      }, 0);
      return { ...budget, categoryIds, spent };
    });
  }, [budgets, transactions]);

  const refreshBudgets = async () => {
    const data = await getBudgets();
    setBudgets(data);
  };

  const closeBudgetForm = () => {
    setIsBudgetFormOpen(false);
    setEditingBudget(null);
    setFormError(null);
  };

  const openNewBudgetForm = () => {
    setEditingBudget(null);
    setFormName('');
    setFormAmount('');
    setFormCategoryIds([]);
    setFormError(null);
    setIsBudgetFormOpen(true);
  };

  const openEditBudgetForm = (budget: any) => {
    setEditingBudget(budget);
    setFormName(budget.name ?? '');
    setFormAmount(String(budget.amount ?? ''));
    setFormCategoryIds(
      (budget.categories ?? [])
        .map((c: any) => Number(c.id))
        .filter((id: number) => Number.isFinite(id))
    );
    setFormError(null);
    setIsBudgetFormOpen(true);
  };

  const toggleFormCategory = (categoryId: number) => {
    setFormCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const saveBudget = async () => {
    setFormError(null);
    const name = formName.trim();
    const amount = Number(formAmount);

    if (!name) {
      setFormError('Budget name is required');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Amount must be a number greater than 0');
      return;
    }
    if (formCategoryIds.length === 0) {
      setFormError('Select at least one category');
      return;
    }

    setSaving(true);
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, { name, amount, category_ids: formCategoryIds });
      } else {
        await createBudget({ name, amount, category_ids: formCategoryIds });
      }
      await refreshBudgets();
      closeBudgetForm();
    } catch (error: any) {
      console.error('Failed to save budget', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save budget';
      setFormError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (budgetId: number) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(budgetId);
        await refreshBudgets();
      } catch (error: any) {
        console.error('Failed to delete budget', error);
        alert('Failed to delete budget');
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const [budgetsRes, catsRes, txsRes] = await Promise.allSettled([
        getBudgets(),
        getCategories(),
        getTransactions(),
      ]);

      if (catsRes.status === 'fulfilled') {
        setCategories(catsRes.value);
      } else {
        console.error('Failed to fetch categories', catsRes.reason);
      }

      if (txsRes.status === 'fulfilled') {
        setTransactions(txsRes.value);
      } else {
        console.error('Failed to fetch transactions', txsRes.reason);
      }

      if (budgetsRes.status === 'fulfilled') {
        setBudgets(budgetsRes.value);
      } else {
        console.error('Failed to fetch budgets', budgetsRes.reason);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading budgets...</div>;

  const totalBudgeted = budgetsWithSpent.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const totalSpent = budgetsWithSpent.reduce((acc, b) => acc + (Number(b.spent) || 0), 0);
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
          <div className="flex items-center justify-end mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={openNewBudgetForm}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Budget</span>
              </button>
            </div>
          </div>

          {isBudgetFormOpen && (
            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-none mb-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-[13px] font-bold text-[#1e293b]">
                    {editingBudget ? 'Edit Budget' : 'New Budget'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Set a monthly limit and pick categories.
                  </p>
                </div>
                <button
                  onClick={closeBudgetForm}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                    Budget Name
                  </label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-[11px] font-bold outline-none"
                    placeholder="e.g. Essentials"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                    Monthly Limit
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-[11px] font-bold outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest px-1">
                  Category
                </label>
                <div className="relative">
                  <select
                    value={formCategoryIds[0] || ''}
                    onChange={(e) => setFormCategoryIds([Number(e.target.value)])}
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-[11px] font-bold outline-none appearance-none"
                  >
                    <option value="" disabled>Select a category</option>
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rotate-90 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {formError && <p className="mt-3 text-[11px] font-bold text-rose-600">{formError}</p>}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={closeBudgetForm}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBudget}
                  disabled={saving}
                  className={cn(
                    "px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold transition-all",
                    saving && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {saving ? 'Saving...' : editingBudget ? 'Save Changes' : 'Create Budget'}
                </button>
              </div>
            </div>
          )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
            {budgetsWithSpent.map((budget, i) => {
              const primaryCategoryName = budget.categories?.[0]?.name;
              const Icon = categoryIcons[primaryCategoryName] || UtensilsCrossed;
              return (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  spent={budget.spent}
                  icon={Icon}
                  transactions={transactions}
                  categoryIds={budget.categoryIds}
                  onEdit={openEditBudgetForm}
                  onDelete={handleDeleteBudget}
                  delay={i * 0.05}
                />
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
                  <p className="text-xl font-bold font-mono text-[#1e293b]">{budgetsWithSpent.length}</p>
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
