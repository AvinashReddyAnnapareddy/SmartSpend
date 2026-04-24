import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: LucideIcon;
  variant?: 'brand' | 'success' | 'warning' | 'info';
  isCurrency?: boolean;
}

export function StatCard({ title, value, change, icon: Icon, variant = 'brand', isCurrency = true }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 rounded-xl border border-[#e2e8f0] flex flex-col gap-2 relative overflow-hidden group"
    >
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={cn(
          "p-1.5 rounded-lg",
          variant === 'success' ? "bg-emerald-50 text-emerald-600" :
          variant === 'warning' ? "bg-amber-50 text-amber-600" :
          variant === 'info' ? "bg-sky-50 text-sky-600" :
          "bg-blue-50 text-brand-600"
        )}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <h3 className="text-2xl font-bold font-mono text-[#1e293b] tracking-tight">
        {typeof value === 'number' && isCurrency ? formatCurrency(value) : value}
      </h3>

      {change !== undefined && (
        <div className={cn(
          "text-[11px] font-medium flex items-center gap-1",
          change >= 0 ? "text-[#10b981]" : "text-[#ef4444]"
        )}>
          <span>{change >= 0 ? '↑' : '↓'} {Math.abs(change)}%</span>
          <span className="text-slate-400 font-normal">from last month</span>
        </div>
      )}
    </motion.div>
  );
}
