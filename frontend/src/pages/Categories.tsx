import { Header } from '../components/Header';
import { useEffect, useMemo, useState } from 'react';
import { createCategory, getCategories } from '../lib/api';
import { cn, formatCurrency } from '../lib/utils';
import { ArrowDownLeft, ArrowUpRight, Plus, Tag, X } from 'lucide-react';
import { motion } from 'motion/react';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshCategories();
      } catch (error) {
        console.error('Failed to fetch categories', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const closeForm = () => {
    setIsFormOpen(false);
    setName('');
    setType('EXPENSE');
    setSaving(false);
    setErrorMessage(null);
  };

  const saveCategory = async () => {
    setErrorMessage(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('Category name is required');
      return;
    }

    setSaving(true);
    try {
      await createCategory({ name: trimmed, transaction_type: type });
      await refreshCategories();
      closeForm();
    } catch (err) {
      console.error('Failed to create category', err);
      setErrorMessage('Failed to create category');
      setSaving(false);
    }
  };

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const aType = String(a.transaction_type);
      const bType = String(b.transaction_type);
      if (aType !== bType) return aType.localeCompare(bType);
      return String(a.name).localeCompare(String(b.name));
    });
  }, [categories]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Loading categories...</div>;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f4f5f7]">
      <Header title="Categories" />

      <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto max-w-5xl mx-auto w-full pb-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[13px] font-bold text-[#1e293b]">Manage Categories</h3>
            <p className="text-[11px] text-slate-500 font-medium">Create income or expense categories.</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        </div>

        {isFormOpen && (
          <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-none mb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-[13px] font-bold text-[#1e293b]">New Category</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Choose whether it’s income or expense.
                </p>
              </div>
              <button
                onClick={closeForm}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 text-[11px] font-bold outline-none"
                  placeholder="e.g. Freelance"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                  Type
                </label>
                <div className="flex bg-[#f8fafc] p-1 rounded-lg border border-[#e2e8f0]">
                  {[{ label: 'Expense', value: 'EXPENSE' as const }, { label: 'Income', value: 'INCOME' as const }].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-md text-[11px] font-bold transition-all",
                        type === t.value ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {errorMessage && <p className="mt-3 text-[11px] font-bold text-rose-600">{errorMessage}</p>}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={closeForm}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveCategory}
                disabled={saving}
                className={cn(
                  "px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[11px] font-bold transition-all",
                  saving && "opacity-60 cursor-not-allowed"
                )}
              >
                {saving ? 'Saving...' : 'Create'}
              </button>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-bold text-[#1e293b]">All Categories</h3>
              <p className="text-[11px] text-slate-500 font-medium">{sortedCategories.length} total</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">
                    Monthly Limit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {sortedCategories.map((cat) => {
                  const isIncome = String(cat.transaction_type).toUpperCase() === 'INCOME';
                  const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
                  const limit = cat.monthly_budget_limit;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div
                          className={cn(
                            "inline-flex items-center gap-2 px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest",
                            isIncome
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-slate-50 text-slate-600 border-slate-100"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{isIncome ? 'Income' : 'Expense'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 border border-[#e2e8f0] bg-white text-slate-400">
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                          <p className="text-[13px] font-bold text-[#1e293b] leading-tight">{cat.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-[13px] font-bold font-mono text-[#1e293b]">
                        {typeof limit === 'number' ? formatCurrency(limit) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
