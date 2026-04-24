import { Header } from '../components/Header';
import { Users2, Plus, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function Groups() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f4f5f7]">
      <Header title="Groups" />

      <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto flex flex-col items-center justify-center text-center pb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md bg-white p-10 rounded-xl border border-[#e2e8f0]"
        >
          <div className="w-16 h-16 bg-brand-600 rounded-xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-brand-600/20">
            <Users2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#1e293b] tracking-tight mb-3">Group Expenses</h3>
          <p className="text-[13px] text-slate-500 font-medium mb-8 leading-relaxed">
            Split bills with housemates or friends. Track balances and settle up in seconds.
          </p>
          <div className="flex flex-col gap-3">
            <button className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all outline-none">
              Start a Group
            </button>
            <button className="px-8 py-3 bg-white border border-[#e2e8f0] hover:bg-slate-50 text-[#1e293b] rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
              Use Invite Code
            </button>
          </div>
          <p className="mt-8 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
            <Info className="w-3.5 h-3.5" />
          </p>
        </motion.div>
      </div>
    </div>
  );
}
