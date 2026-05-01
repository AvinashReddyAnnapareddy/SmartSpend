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
  UtensilsCrossed,
  Plane,
  ShoppingBag,
  Zap,
  MoreVertical,
  Wallet
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

          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-8">
            <div className="md:col-span-4 bg-white p-6 rounded-2xl border border-[#e2e8f0] flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Budgets</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-[#1e293b]">{budgetsWithSpent.length}</h3>
                  <span className="text-[11px] font-bold text-slate-500">Active</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-inner">
                <Wallet className="w-7 h-7" />
              </div>
            </div>
            
            <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-[#e2e8f0] flex items-center gap-8 shadow-sm">
              <div className="w-24 h-24 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetStats.filter(s => s.name !== 'Budgeted')}
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={4}
                      dataKey="amount"
                      stroke="none"
                    >
                      {budgetStats.filter(s => s.name !== 'Budgeted').map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <TrendingUp className="w-4 h-4 text-slate-300" />
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Spent</p>
                  <h3 className="text-lg font-bold text-rose-600 font-mono">{formatCurrency(totalSpent)}</h3>
                  <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-rose-500" 
                      style={{ width: `${totalBudgeted ? Math.min(100, (totalSpent/totalBudgeted)*100) : 0}%` }} 
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining</p>
                  <h3 className="text-lg font-bold text-emerald-600 font-mono">{formatCurrency(remaining > 0 ? remaining : 0)}</h3>
                  <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${totalBudgeted ? Math.max(0, (remaining/totalBudgeted)*100) : 0}%` }} 
                    />
                  </div>
                </div>
                <div className="hidden lg:block">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Efficiency</p>
                  <h3 className="text-lg font-bold text-brand-600 font-mono">
                    {totalBudgeted ? Math.round(((totalBudgeted - totalSpent) / totalBudgeted) * 100) : 0}%
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Available to spend</p>
                </div>
              </div>
            </div>
          </div>

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


      </div>
    </div>
  );
}
