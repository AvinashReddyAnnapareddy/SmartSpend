import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  Tag,
  Users2,
  CreditCard,
  Bell,
  User,
  Trophy,
  Plus,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ReceiptText, label: 'Transactions', path: '/transactions' },
  { icon: Wallet, label: 'Budgets', path: '/budgets' },
  { icon: Tag, label: 'Categories', path: '/categories' },
  { icon: Users2, label: 'Groups', path: '/groups' },
  { icon: CreditCard, label: 'Subscriptions', path: '/subscriptions' },
  { icon: Bell, label: 'Alerts', path: '/alerts' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function Sidebar() {
  return (
    <aside className="w-[240px] bg-[#0f172a] text-slate-400 h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="py-6 mb-4">
        <NavLink to="/" className="flex items-center gap-3 px-6 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-600/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">SmartSpend</h1>
        </NavLink>
      </div>

      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-6 py-3 transition-all duration-200 group text-sm font-medium",
                isActive
                  ? "bg-sky-400/10 text-sky-400 border-r-4 border-sky-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-sky-400" : "text-slate-500 group-hover:text-white")} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-6 py-6 border-t border-white/10">
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-2">Quick Actions</p>
          <div className="space-y-1">
            <NavLink to="/add-expense" className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all group">
              <Plus className="w-4 h-4 text-slate-500 group-hover:text-brand-600" />
              <span>Add Transaction</span>
            </NavLink>
          </div>
        </div>
      </div>
    </aside>
  );
}
