import { motion } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';

interface Transaction {
  id: number;
  amount: number;
  description: string;
  category: { id: number };
}

interface BudgetCardProps {
  budget: {
    id: number;
    name: string;
    amount: number;
    categories: Array<{ id: number; name: string }>;
  };
  spent: number;
  icon: any;
  transactions: Transaction[];
  categoryIds: number[];
  onEdit: (budget: any) => void;
  onDelete?: (budgetId: number) => void;
  delay?: number;
}

export const BudgetCard = ({
  budget,
  spent,
  icon: Icon,
  transactions,
  categoryIds,
  onEdit,
  onDelete,
  delay = 0,
}: BudgetCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const percent = budget.amount ? (spent / budget.amount) * 100 : 0;
  const remaining = budget.amount - spent;
  const isOverBudget = spent > budget.amount;

  const getColorClasses = () => {
    if (isOverBudget) return 'bg-rose-500';
    if (percent > 90) return 'bg-rose-500';
    if (percent > 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getTextColorClasses = () => {
    if (isOverBudget) return 'text-rose-600';
    if (percent > 90) return 'text-rose-600';
    if (percent > 70) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const categoryNames = (budget.categories ?? []).map((c: any) => c.name).join(', ');
  const recentTransactions = transactions
    .filter((t) => categoryIds.includes(Number(t.category.id)))
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.3, type: 'spring', stiffness: 100 }}
      className="group"
    >
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0">
              <Icon className="w-6 h-6 text-slate-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-[13px] font-bold text-[#1e293b] truncate">{budget.name}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {(percent > 100 ? 'Over Budget' : 'Active Budget')}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-1 truncate" title={categoryNames}>
                {categoryNames}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1">
              Limit
            </p>
            <p className="text-[15px] font-bold font-mono text-[#1e293b] leading-none">
              {formatCurrency(budget.amount)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percent, 100)}%` }}
              transition={{ delay: delay + 0.2, duration: 0.5 }}
              className={cn('h-full rounded-full transition-all', getColorClasses())}
            />
          </div>

          {/* Stats Row */}
          <div className="flex justify-between items-center text-[11px] font-medium">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">
                Spent: <span className="font-bold text-slate-900 font-mono">{formatCurrency(spent)}</span>
              </span>
            </div>
            <span className={cn('font-bold', getTextColorClasses())}>
              {Math.round(percent)}%
            </span>
          </div>

          {/* Remaining/Over Amount */}
          <div className="mt-2 text-[10px] font-bold">
            {isOverBudget ? (
              <span className="text-rose-600">
                Over by {formatCurrency(Math.abs(remaining))}
              </span>
            ) : (
              <span className="text-emerald-600">
                {formatCurrency(remaining)} remaining
              </span>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div className="mb-4 pb-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 mt-3">
              Recent
            </p>
            <div className="space-y-1.5">
              {recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 truncate flex-1">{t.description || 'Transaction'}</span>
                  <span className="text-[11px] font-bold font-mono text-[#1e293b] ml-2 flex-shrink-0">
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer with Action Button */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => onEdit(budget)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    onEdit(budget);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 border-b border-slate-100"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Budget
                </button>
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete(budget.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete Budget
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
