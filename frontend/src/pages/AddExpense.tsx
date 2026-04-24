import { Header } from '../components/Header';
import {
  ChevronLeft,
  IndianRupee,
  Calendar,
  Tag,
  CreditCard,
  FileText,
  Save,
  Plus,
  Camera,
  Loader2,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { scanReceipt, getCategories, createTransaction, createCategory } from '../lib/api';

export default function AddExpense() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
      if (cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;

    setIsCreatingCategory(true);
    try {
      const newCat = await createCategory({
        name: newCategoryName,
        transaction_type: 'EXPENSE' // Default for this page
      });
      await fetchCategories();
      setCategoryId(newCat.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (err) {
      alert("Failed to create category");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const data = await scanReceipt(file);
      if (data.suggested_amount > 0) {
        setAmount((-data.suggested_amount).toString());
      }
      if (data.extracted_text) {
        const firstLine = data.extracted_text.split('\n')[0].substring(0, 50);
        setDescription(firstLine);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to scan receipt.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !date) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTransaction({
        amount: parseFloat(amount),
        category_id: Number(categoryId),
        transaction_date: date,
        description: description || undefined
      });
      navigate('/transactions');
    } catch (err) {
      console.error(err);
      alert("Failed to save transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f4f5f7]">
      <Header title="Add Expense" />

      <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto max-w-xl mx-auto w-full pb-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-5 group font-bold text-[11px] uppercase tracking-wider"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to list
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-xl border border-[#e2e8f0] shadow-none"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-brand-600 rounded-xl flex items-center justify-center text-white mb-5 shadow-lg shadow-brand-600/20">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#1e293b] tracking-tight">New Entry</h3>
            <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-widest">Manual transaction record</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Amount</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-600 rounded flex items-center justify-center">
                  <IndianRupee className="w-4 h-4 text-white" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  required
                  className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-16 pr-16 py-4 text-3xl font-bold font-mono text-[#1e293b] focus:ring-0 outline-none"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-all disabled:opacity-50"
                  title="Scan Receipt"
                >
                  {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleScan}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    className="text-[10px] font-bold text-brand-600 hover:underline uppercase"
                  >
                    {isAddingCategory ? 'Cancel' : '+ Add New'}
                  </button>
                </div>

                <AnimatePresence>
                  {isAddingCategory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Category Name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-1 bg-white border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-[12px] font-bold outline-none focus:ring-1 focus:ring-brand-600/20"
                        />
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          disabled={isCreatingCategory || !newCategoryName}
                          className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold disabled:opacity-50"
                        >
                          {isCreatingCategory ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    required
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-8 py-2.5 text-[13px] font-bold focus:ring-0 outline-none appearance-none"
                  >
                    {categories.length === 0 && <option value="">No categories found</option>}
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name} ({cat.transaction_type})</option>
                    ))}
                  </select>
                  <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-[-90deg] text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Transaction Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-6 py-2.5 text-[13px] font-bold focus:ring-0 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Method (Notes)</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. Cash, Card"
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-6 py-2.5 text-[13px] font-bold focus:ring-0 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Description</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What was this for?"
                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg pl-9 pr-6 py-2.5 text-[13px] font-bold focus:ring-0 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[13px] font-bold flex items-center justify-center gap-3 transition-all outline-none disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
                Commit Transaction
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-6 font-bold uppercase tracking-[0.2em] leading-none"></p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
