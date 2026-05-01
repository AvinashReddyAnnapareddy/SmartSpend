import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { 
  Users2, Plus, Info, ChevronRight, ArrowLeft, 
  DollarSign, Receipt, Copy, Check, LogIn, PlusCircle,
  TrendingDown, TrendingUp, User as UserIcon, Calendar,
  CreditCard, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getGroups, 
  createGroup, 
  joinGroup, 
  getGroupDetails, 
  getGroupExpenses, 
  getGroupBalances, 
  addGroupExpense,
  getMe
} from '../lib/api';

interface GroupMember {
  id: number;
  user_id: number;
  joined_at: string;
  user?: {
    username: string;
    email: string;
  };
}

interface Group {
  id: number;
  name: string;
  invite_code: string;
  created_by: number;
  created_at: string;
  members: GroupMember[];
}

interface GroupExpense {
  id: number;
  group_id: number;
  paid_by: number;
  amount: number;
  description: string;
  date: string;
  is_settlement: boolean;
  payer?: {
    username: string;
    email: string;
  };
}

interface GroupBalance {
  user_id: number;
  username: string;
  balance: number;
}

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [balances, setBalances] = useState<GroupBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  
  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsData, userData] = await Promise.all([
        getGroups(),
        getMe()
      ]);
      setGroups(groupsData);
      setCurrentUser(userData);
    } catch (err) {
      console.error('Failed to fetch data', err);
      setError('Could not load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = async (group: Group) => {
    try {
      setLoading(true);
      const [details, expensesData, balancesData] = await Promise.all([
        getGroupDetails(group.id),
        getGroupExpenses(group.id),
        getGroupBalances(group.id)
      ]);
      setSelectedGroup(details);
      setExpenses(expensesData);
      setBalances(balancesData);
    } catch (err) {
      console.error('Failed to fetch group details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      await createGroup({ name: newGroupName });
      setNewGroupName('');
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create group', err);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    try {
      await joinGroup(inviteCode);
      setInviteCode('');
      setShowJoinModal(false);
      fetchData();
    } catch (err) {
      setError('Invalid invite code. Please check and try again.');
      console.error('Failed to join group', err);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !expenseAmount || !expenseDesc) return;
    try {
      await addGroupExpense(selectedGroup.id, {
        amount: parseFloat(expenseAmount),
        description: expenseDesc
      });
      setExpenseAmount('');
      setExpenseDesc('');
      setShowExpenseModal(false);
      handleSelectGroup(selectedGroup); // Refresh details
    } catch (err) {
      console.error('Failed to add expense', err);
    }
  };

  const copyInviteCode = () => {
    if (selectedGroup) {
      navigator.clipboard.writeText(selectedGroup.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading && groups.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-[#f8fafc]">
        <Header title="Groups" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc]">
      <Header title={selectedGroup ? selectedGroup.name : "Groups"} />

      <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto pb-12">
        <AnimatePresence mode="wait">
          {!selectedGroup ? (
            <motion.div
              key="group-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6">
                    <Users2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">No groups yet</h3>
                  <p className="text-slate-500 max-w-sm mb-10 text-sm leading-relaxed">
                    Split bills with housemates or friends. Track balances and settle up in seconds.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-600/20 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Start a Group
                    </button>
                    <button 
                      onClick={() => setShowJoinModal(true)}
                      className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4" /> Use Invite Code
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Groups</h2>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowJoinModal(true)}
                        className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                        title="Join Group"
                      >
                        <LogIn className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setShowCreateModal(true)}
                        className="p-2.5 bg-brand-600 text-white hover:bg-brand-700 rounded-lg transition-colors shadow-sm"
                        title="Create Group"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((group) => (
                      <motion.button
                        key={group.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectGroup(group)}
                        className="p-5 bg-white border border-slate-200 rounded-2xl text-left hover:border-brand-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                            <Users2 className="w-6 h-6" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg mb-1">{group.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>{group.members?.length || 0} members</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="group-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-5xl mx-auto space-y-6"
            >
              <button 
                onClick={() => setSelectedGroup(null)}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest hover:text-brand-600 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Groups
              </button>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">{selectedGroup.name}</h2>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invite Code:</span>
                        <code className="text-sm font-mono font-bold text-brand-600">{selectedGroup.invite_code}</code>
                        <button 
                          onClick={copyInviteCode}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                      </div>
                      <div className="text-sm text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Created {new Date(selectedGroup.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowExpenseModal(true)}
                    className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                  >
                    <PlusCircle className="w-5 h-5" /> Add Expense
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900">Recent Expenses</h3>
                      <button className="text-brand-600 text-xs font-bold uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    
                    <div className="space-y-3">
                      {expenses.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 text-sm">No expenses recorded yet.</p>
                        </div>
                      ) : (
                        expenses.map((expense) => (
                          <div key={expense.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                                <Receipt className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{expense.description}</p>
                                <p className="text-xs text-slate-500">Paid by <span className="font-semibold text-slate-700">{expense.payer?.username || 'Member'}</span> • {new Date(expense.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <p className="font-black text-slate-900 text-lg">₹{expense.amount.toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900">Member Balances</h3>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                      {balances.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200">
                              <UserIcon className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{member.username}</span>
                          </div>
                          <div className={`flex items-center gap-1 text-sm font-black ${member.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {member.balance >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            ₹{Math.abs(member.balance).toLocaleString()}
                          </div>
                        </div>
                      ))}
                      <div className="pt-4 mt-4 border-t border-slate-200">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                          <Info className="w-3.5 h-3.5" />
                          Balances are calculated by splitting each expense equally among all members.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(showCreateModal || showJoinModal || showExpenseModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCreateModal(false);
                setShowJoinModal(false);
                setShowExpenseModal(false);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md relative z-10 shadow-2xl border border-white/20"
            >
              {showCreateModal && (
                <form onSubmit={handleCreateGroup}>
                  <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6">
                    <PlusCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Create a New Group</h3>
                  <p className="text-slate-500 text-sm mb-8">Give your group a name to get started. You'll get an invite code to share.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Group Name</label>
                      <input 
                        type="text" 
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="e.g. Dream House, Trip to Goa"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                        required
                        autoFocus
                      />
                    </div>
                    <button type="submit" className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-600/20 mt-4">
                      Create Group
                    </button>
                  </div>
                </form>
              )}

              {showJoinModal && (
                <form onSubmit={handleJoinGroup}>
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
                    <LogIn className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Join a Group</h3>
                  <p className="text-slate-500 text-sm mb-8">Enter the unique 8-character invite code shared by your friend.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Invite Code</label>
                      <input 
                        type="text" 
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="e.g. ABC123XY"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono font-bold text-center tracking-widest uppercase"
                        required
                        maxLength={8}
                        autoFocus
                      />
                    </div>
                    {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                    <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg mt-4">
                      Join Group
                    </button>
                  </div>
                </form>
              )}

              {showExpenseModal && (
                <form onSubmit={handleAddExpense}>
                  <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6">
                    <DollarSign className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Add Group Expense</h3>
                  <p className="text-slate-500 text-sm mb-8">Enter the amount and description. It will be split among all members.</p>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Amount (₹)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold text-xl"
                          required
                          autoFocus
                        />
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block px-1">Description</label>
                      <input 
                        type="text" 
                        value={expenseDesc}
                        onChange={(e) => setExpenseDesc(e.target.value)}
                        placeholder="e.g. Dinner at Taj, Electricity Bill"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                        required
                      />
                    </div>
                    <button type="submit" className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-600/20 mt-4">
                      Post Expense
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
