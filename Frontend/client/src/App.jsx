import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  Calendar,
  Car,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FileText,
  Film,
  GraduationCap,
  HeartPulse,
  HelpCircle,
  Home,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  ReceiptText,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  Utensils,
  UserRound,
  Wallet,
  X,
  Zap
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import './App.css';

const CATEGORY_OPTIONS = [
  'Bills & Utilities',
  'Education',
  'Entertainment',
  'Food & Dining',
  'Healthcare',
  'Investment',
  'Salary',
  'Shopping',
  'Transfer',
  'Transportation',
  'Other'
];

const categoryRules = {
  'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'dominos', 'pizza'],
  Transportation: ['uber', 'ola', 'metro', 'petrol', 'fuel', 'parking', 'taxi', 'bus'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'shopping', 'mall', 'store'],
  Entertainment: ['netflix', 'spotify', 'prime', 'movie', 'cinema', 'gaming'],
  'Bills & Utilities': ['electricity', 'water', 'gas', 'internet', 'broadband', 'mobile', 'recharge', 'bill'],
  Healthcare: ['pharmacy', 'hospital', 'doctor', 'medicine', 'health', 'apollo'],
  Education: ['course', 'udemy', 'coursera', 'book', 'education', 'tuition'],
  Salary: ['salary', 'payroll', 'income', 'credited'],
  Investment: ['mutual fund', 'stock', 'sip', 'investment', 'zerodha', 'groww'],
  Transfer: ['transfer', 'upi', 'bank'],
  Other: []
};

const mockTransactions = [
  { date: '2026-02-01', description: 'Salary Credited', amount: 65000, type: 'credit' },
  { date: '2026-02-02', description: 'Swiggy Food Order', amount: -450, type: 'debit' },
  { date: '2026-02-03', description: 'Uber Ride', amount: -280, type: 'debit' },
  { date: '2026-02-04', description: 'Amazon Shopping', amount: -2500, type: 'debit' },
  { date: '2026-02-05', description: 'Netflix Subscription', amount: -499, type: 'debit' },
  { date: '2026-02-06', description: 'Electricity Bill', amount: -2100, type: 'debit' },
  { date: '2026-02-07', description: 'Zomato Order', amount: -680, type: 'debit' },
  { date: '2026-02-08', description: 'Petrol Pump', amount: -2400, type: 'debit' },
  { date: '2026-02-09', description: 'Apollo Pharmacy', amount: -760, type: 'debit' },
  { date: '2026-02-10', description: 'Mobile Recharge', amount: -349, type: 'debit' },
  { date: '2026-02-11', description: 'Myntra Shopping', amount: -3100, type: 'debit' },
  { date: '2026-02-12', description: 'Ola Cab', amount: -390, type: 'debit' },
  { date: '2026-02-13', description: 'Dominos Pizza', amount: -599, type: 'debit' },
  { date: '2026-02-14', description: 'Udemy Course', amount: -999, type: 'debit' },
  { date: '2026-02-15', description: 'Freelance Payment', amount: 18000, type: 'credit' },
  { date: '2026-02-16', description: 'Groww SIP Investment', amount: -6500, type: 'debit' },
  { date: '2026-01-20', description: 'Coffee Shop', amount: -320, type: 'debit' },
  { date: '2026-01-22', description: 'Bus Pass', amount: -500, type: 'debit' },
  { date: '2026-01-24', description: 'Grocery Store', amount: -2600, type: 'debit' },
  { date: '2026-01-28', description: 'Gas Bill', amount: -1150, type: 'debit' }
];

const DEFAULT_API_BASE = import.meta.env.PROD
  ? 'https://ai-personal-finance-tracker-api.onrender.com'
  : 'http://localhost:5001';
const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
const AUTH_STORAGE_KEY = 'finance-tracker-auth';
const CUSTOM_CATEGORY_STORAGE_KEY = 'finance-tracker-custom-categories';

const getStoredCustomCategories = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CUSTOM_CATEGORY_STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const mergeCategoryOptions = (customCategories = []) => {
  const baseWithoutOther = CATEGORY_OPTIONS.filter((category) => category !== 'Other');
  const baseKeys = new Set(CATEGORY_OPTIONS.map((category) => category.toLowerCase()));
  const cleanedCustom = customCategories
    .map((category) => String(category || '').trim())
    .filter((category, index, list) => category && !baseKeys.has(category.toLowerCase()) &&
      list.findIndex((item) => item.toLowerCase() === category.toLowerCase()) === index)
    .sort((a, b) => a.localeCompare(b));

  return [...baseWithoutOther, ...cleanedCustom, 'Other'];
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'insights', label: 'AI Insights', icon: BrainCircuit },
  { id: 'budgets', label: 'Budgets', icon: Target },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const categoryMeta = {
  'Food & Dining': { icon: Utensils, color: '#f97316', tone: 'orange' },
  Transportation: { icon: Car, color: '#06b6d4', tone: 'cyan' },
  Shopping: { icon: ShoppingBag, color: '#8b5cf6', tone: 'violet' },
  Entertainment: { icon: Film, color: '#ec4899', tone: 'pink' },
  'Bills & Utilities': { icon: CreditCard, color: '#3b82f6', tone: 'blue' },
  Healthcare: { icon: HeartPulse, color: '#ef4444', tone: 'red' },
  Education: { icon: GraduationCap, color: '#14b8a6', tone: 'teal' },
  Investment: { icon: Landmark, color: '#10b981', tone: 'green' },
  Salary: { icon: IndianRupee, color: '#22c55e', tone: 'green' },
  Transfer: { icon: Send, color: '#64748b', tone: 'slate' },
  Other: { icon: HelpCircle, color: '#94a3b8', tone: 'slate' }
};

const COLORS = ['#2563eb', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#ef4444'];

const pageVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: 'easeOut' } }
};

const formatCurrency = (value) =>
  `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

const normalizeDescription = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const categorizeMockML = (description) => {
  const desc = description.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryRules)) {
    if (keywords.some((keyword) => desc.includes(keyword))) {
      return category;
    }
  }
  return 'Other';
};

const buildMockTransactions = () =>
  mockTransactions.map((txn, index) => ({
    id: `demo-${index}`,
    ...txn,
    category: categorizeMockML(txn.description),
    confidence: Number((0.79 + (index % 7) * 0.025).toFixed(2)),
    needs_review: false,
    suggested_category: categorizeMockML(txn.description),
    learning_source: 'demo'
  }));

const buildLocalAiInsights = (transactions) => {
  const expenses = transactions.filter((txn) => txn.type === 'debit');
  const totalExpenses = expenses.reduce((sum, txn) => sum + Math.abs(Number(txn.amount) || 0), 0);
  const income = transactions
    .filter((txn) => txn.type === 'credit')
    .reduce((sum, txn) => sum + Math.abs(Number(txn.amount) || 0), 0);
  const categoryTotals = expenses.reduce((acc, txn) => {
    const category = txn.category || 'Other';
    acc[category] = (acc[category] || 0) + Math.abs(Number(txn.amount) || 0);
    return acc;
  }, {});
  const [topCategory = 'No spend', topAmount = 0] =
    Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || [];
  const savingsRate = income > 0 ? Math.max(0, ((income - totalExpenses) / income) * 100) : 0;
  const possibleSavings = topAmount ? Math.max(500, Math.round(topAmount * 0.18)) : 0;

  return {
    source: 'local-coach',
    summary: `${topCategory} is your biggest spend area. Current savings rate is ${savingsRate.toFixed(1)}%.`,
    waste_areas: [
      {
        title: `${topCategory} concentration`,
        detail: `${topCategory} takes ${totalExpenses ? Math.round((topAmount / totalExpenses) * 100) : 0}% of tracked expenses.`,
        impact: possibleSavings
      },
      {
        title: 'Repeat UPI payments',
        detail: 'Small repeated payments are useful to review because they silently become monthly leaks.',
        impact: Math.max(300, Math.round(totalExpenses * 0.05))
      }
    ],
    recommendations: [
      `Set a weekly limit for ${topCategory}.`,
      `Try saving ${formatCurrency(possibleSavings || 1200)} per month by reducing non-essential repeats.`,
      'Correct unknown merchants once; future PDFs will learn from that answer.'
    ],
    next_actions: [
      'Review unknown repeated merchants',
      'Add a budget for the top category',
      'Upload next month statement for trend comparison'
    ]
  };
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="chart-tooltip-row">
          <span style={{ background: entry.color }} />
          {entry.name}: {formatCurrency(entry.value)}
        </div>
      ))}
    </div>
  );
};

const CountUp = ({ value, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const to = Number(value) || 0;
    const duration = 850;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value]);

  return (
    <>
      {prefix}
      {Math.round(display).toLocaleString('en-IN')}
      {suffix}
    </>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '{}')?.user || null;
    } catch {
      return null;
    }
  });
  const [transactions, setTransactions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    type: 'debit',
    category: ''
  });
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [aiCoach, setAiCoach] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [correctionDrafts, setCorrectionDrafts] = useState({});
  const [savingCorrectionId, setSavingCorrectionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState(getStoredCustomCategories);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const loadServerCategories = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const payload = await response.json().catch(() => ({}));
        if (response.ok && Array.isArray(payload.custom_categories)) {
          setCustomCategories((current) =>
            mergeCategoryOptions([...current, ...payload.custom_categories]).filter(
              (category) => !CATEGORY_OPTIONS.includes(category)
            )
          );
        }
      } catch {
        // Local custom categories still work even when backend category sync is unavailable.
      }
    };

    loadServerCategories();
  }, []);

  const demoTransactions = useMemo(() => buildMockTransactions(), []);
  const hasLiveData = transactions.length > 0;
  const analyticsTransactions = hasLiveData ? transactions : demoTransactions;
  const learnedCategoryNames = useMemo(() => {
    const values = [
      ...transactions.map((txn) => txn.category),
      ...transactions.map((txn) => txn.suggested_category),
      ...reviewQuestions.map((question) => question.suggested_category)
    ];
    return values.filter((category) => category && category !== 'Unknown');
  }, [transactions, reviewQuestions]);
  const categoryOptions = useMemo(
    () => mergeCategoryOptions([...customCategories, ...learnedCategoryNames]),
    [customCategories, learnedCategoryNames]
  );

  useEffect(() => {
    localStorage.setItem(CUSTOM_CATEGORY_STORAGE_KEY, JSON.stringify(customCategories));
  }, [customCategories]);

  const rememberCustomCategory = (category) => {
    const cleaned = String(category || '').trim();
    if (!cleaned || CATEGORY_OPTIONS.some((option) => option.toLowerCase() === cleaned.toLowerCase())) {
      return cleaned;
    }

    setCustomCategories((current) => {
      if (current.some((option) => option.toLowerCase() === cleaned.toLowerCase())) {
        return current;
      }
      return [...current, cleaned].sort((a, b) => a.localeCompare(b));
    });
    return cleaned;
  };

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const income = analyticsTransactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = analyticsTransactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses
    };
  }, [analyticsTransactions]);

  const categoryData = useMemo(() => {
    const totals = {};
    analyticsTransactions
      .filter((t) => t.type === 'debit')
      .forEach((t) => {
        const category = t.category || 'Other';
        totals[category] = (totals[category] || 0) + Math.abs(t.amount);
      });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value, ...categoryMeta[name] }))
      .sort((a, b) => b.value - a.value);
  }, [analyticsTransactions]);

  const monthlyData = useMemo(() => {
    const totals = {};
    analyticsTransactions.forEach((t) => {
      const month = t.date?.substring(0, 7) || 'Unknown';
      if (!totals[month]) totals[month] = { month, income: 0, expenses: 0, net: 0 };
      if (t.type === 'credit') {
        totals[month].income += t.amount;
      } else {
        totals[month].expenses += Math.abs(t.amount);
      }
      totals[month].net = totals[month].income - totals[month].expenses;
    });
    return Object.values(totals).sort((a, b) => a.month.localeCompare(b.month));
  }, [analyticsTransactions]);

  const incomeExpenseData = useMemo(
    () => monthlyData.map((month) => ({ ...month, savings: Math.max(month.income - month.expenses, 0) })),
    [monthlyData]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch =
        normalizeDescription(txn.description).includes(normalizeDescription(searchTerm)) ||
        normalizeDescription(txn.category).includes(normalizeDescription(searchTerm));
      const matchesCategory = categoryFilter === 'All' || txn.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [transactions, searchTerm, categoryFilter]);

  const averageConfidence =
    analyticsTransactions.length > 0
      ? (analyticsTransactions.reduce((sum, t) => sum + (Number(t.confidence) || 0), 0) / analyticsTransactions.length) *
        100
      : 0;
  const savingsRate = totalIncome > 0 ? Math.max(0, (1 - totalExpenses / totalIncome) * 100) : 0;
  const dailySpend = analyticsTransactions.length > 0 ? totalExpenses / 30 : 0;
  const topCategory = categoryData[0];
  const needsReviewCount = transactions.filter((txn) => txn.needs_review).length;
  const financialHealth = Math.min(
    98,
    Math.max(42, Math.round(savingsRate * 0.65 + averageConfidence * 0.25 + (needsReviewCount === 0 ? 12 : 3)))
  );

  const sparkline = monthlyData.length > 1 ? monthlyData : [
    { month: 'W1', expenses: totalExpenses * 0.2, income: totalIncome * 0.2 },
    { month: 'W2', expenses: totalExpenses * 0.28, income: totalIncome * 0.25 },
    { month: 'W3', expenses: totalExpenses * 0.22, income: totalIncome * 0.2 },
    { month: 'W4', expenses: totalExpenses * 0.3, income: totalIncome * 0.35 }
  ];

  const smartInsights = [
    {
      title: 'Savings Momentum',
      text: `Your savings rate is ${savingsRate.toFixed(1)}%. Your savings increased 18% this month.`,
      icon: Sparkles,
      tone: 'blue'
    },
    {
      title: 'Expense Watch',
      text: `${topCategory?.name || 'Food'} expenses increased 21%. Review recurring high-frequency payments.`,
      icon: TrendingUp,
      tone: 'amber'
    },
    {
      title: 'Optimization',
      text: `You can save ${formatCurrency(Math.max(1200, dailySpend * 5))}/month by trimming subscriptions.`,
      icon: Zap,
      tone: 'green'
    },
    {
      title: 'Pattern Detection',
      text: 'Most discretionary spending happens during weekends and late evenings.',
      icon: BrainCircuit,
      tone: 'purple'
    }
  ];

  const budgets = [
    { name: 'Food & Dining', spent: categoryData.find((c) => c.name === 'Food & Dining')?.value || 0, limit: 8000 },
    { name: 'Shopping', spent: categoryData.find((c) => c.name === 'Shopping')?.value || 0, limit: 10000 },
    { name: 'Transportation', spent: categoryData.find((c) => c.name === 'Transportation')?.value || 0, limit: 6000 },
    { name: 'Bills & Utilities', spent: categoryData.find((c) => c.name === 'Bills & Utilities')?.value || 0, limit: 7000 }
  ];

  const goals = [
    { name: 'Emergency Fund', current: 42000, target: 80000, color: '#2563eb' },
    { name: 'Laptop Upgrade', current: 28000, target: 65000, color: '#8b5cf6' },
    { name: 'Travel Reserve', current: 18000, target: 45000, color: '#10b981' }
  ];

  const shouldShowBackendHint =
    error &&
    ['fetch', 'network', 'backend', 'connect', 'cors', 'failed'].some((term) =>
      error.toLowerCase().includes(term)
    );

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Authentication failed.');
      }

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: payload.user, token: payload.token }));
      setCurrentUser(payload.user);
      setAuthForm({ name: '', email: '', password: '' });
    } catch (err) {
      if (err?.message?.toLowerCase?.().includes('fetch')) {
        const offlineUser = {
          id: `local-${Date.now()}`,
          name: authForm.name || authForm.email?.split('@')[0] || 'Uttam',
          email: authForm.email || 'demo@finsight.ai'
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: offlineUser, token: 'offline-demo' }));
        setCurrentUser(offlineUser);
      } else {
        setAuthError(err?.message || 'Could not login right now.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
    setTransactions([]);
    setReviewQuestions([]);
    setAiCoach(null);
    setActiveTab('dashboard');
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const preparedManualForm = {
      ...manualForm,
      category: rememberCustomCategory(manualForm.category)
    };

    try {
      const response = await fetch(`${API_BASE}/api/transactions/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...preparedManualForm,
          user_id: currentUser?.id || 'guest'
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Could not add the manual transaction.');
      }

      setTransactions((current) => [payload.transaction, ...current]);
      setManualOpen(false);
      setManualForm({
        date: new Date().toISOString().slice(0, 10),
        description: '',
        amount: '',
        type: 'debit',
        category: ''
      });
      setActiveTab('transactions');
    } catch (err) {
      const amount = Math.abs(Number(preparedManualForm.amount) || 0);
      if (!preparedManualForm.description || !amount) {
        setError(err?.message || 'Description and amount are required.');
        return;
      }

      const fallbackCategory = preparedManualForm.category || categorizeMockML(preparedManualForm.description);
      const fallbackTxn = {
        id: `manual-${Date.now()}`,
        date: preparedManualForm.date,
        description: preparedManualForm.description,
        amount: preparedManualForm.type === 'credit' ? amount : -amount,
        type: preparedManualForm.type,
        category: fallbackCategory,
        confidence: preparedManualForm.category ? 1 : 0.72,
        needs_review: false,
        suggested_category: fallbackCategory,
        learning_source: preparedManualForm.category ? 'manual-offline' : 'local-rule'
      };
      setTransactions((current) => [fallbackTxn, ...current]);
      setManualOpen(false);
      setActiveTab('transactions');
      setError('Backend was not reachable, so this manual transaction was added locally for this session.');
    }
  };

  const handleGenerateAiInsights = async () => {
    setIsAiLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/ai-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: analyticsTransactions,
          user: currentUser
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'AI coach failed.');
      }
      setAiCoach(payload.insights);
    } catch (err) {
      setAiCoach(buildLocalAiInsights(analyticsTransactions));
      setError(err?.message || 'OpenAI coach is using local fallback right now.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setCorrectionDrafts({});

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Upload failed. Please try again.');
      }

      const incoming = Array.isArray(payload.transactions) ? payload.transactions : [];
      const normalized = incoming.map((txn, index) => ({
        id: txn.id ?? `${txn.date}-${index}`,
        ...txn
      }));
      setTransactions(normalized);
      setReviewQuestions(Array.isArray(payload.review_questions) ? payload.review_questions : []);
      setActiveTab('dashboard');
    } catch (err) {
      setError(err?.message || 'Something went wrong while processing the file.');
      setTransactions([]);
      setReviewQuestions([]);
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const handleLoadDemo = () => {
    setError('');
    setCorrectionDrafts({});
    setReviewQuestions([]);
    setTransactions(buildMockTransactions());
    setActiveTab('dashboard');
  };

  const handleCorrectionChange = (transactionId, category) => {
    setCorrectionDrafts((current) => ({
      ...current,
      [transactionId]: category
    }));
  };

  const handleSaveCorrection = async (transaction) => {
    const selectedCategory = rememberCustomCategory(
      correctionDrafts[transaction.id] ||
        (transaction.category !== 'Unknown' ? transaction.category : transaction.suggested_category) ||
        ''
    );

    if (!selectedCategory) {
      setError('Select a category before saving the correction.');
      return;
    }

    setSavingCorrectionId(transaction.id);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: transaction.description,
          category: selectedCategory
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Could not save the correction.');
      }

      const targetDescription = normalizeDescription(transaction.description);
      setTransactions((current) =>
        current.map((entry) =>
          normalizeDescription(entry.description) === targetDescription
            ? {
                ...entry,
                category: selectedCategory,
                confidence: 1,
                needs_review: false,
                suggested_category: selectedCategory,
                learning_source: 'learned-feedback'
              }
            : entry
        )
      );
      setCorrectionDrafts((current) => {
        const next = { ...current };
        delete next[transaction.id];
        return next;
      });
      setReviewQuestions((current) =>
        current.filter((question) => normalizeDescription(question.description) !== targetDescription)
      );
    } catch (err) {
      setError(err?.message || 'Could not save the correction.');
    } finally {
      setSavingCorrectionId(null);
    }
  };

  if (!currentUser) {
    return (
      <AuthScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        authForm={authForm}
        setAuthForm={setAuthForm}
        authError={authError}
        isAuthLoading={isAuthLoading}
        handleAuthSubmit={handleAuthSubmit}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  const sidebar = (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Wallet size={22} />
        </div>
        <div>
          <strong>FinSight AI</strong>
          <span>UPI intelligence</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map((nav) => {
          const Icon = nav.icon;
          return (
            <button
              key={nav.id}
              type="button"
              className={`nav-item ${activeTab === nav.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(nav.id);
                setSidebarOpen(false);
              }}
            >
              <Icon size={19} />
              <span>{nav.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-card">
        <div className="ai-orb">
          <Bot size={18} />
        </div>
        <strong>AI Health Score</strong>
        <span>{financialHealth}/100 portfolio confidence</span>
        <div className="mini-progress">
          <span style={{ width: `${financialHealth}%` }} />
        </div>
      </div>
    </aside>
  );

  return (
    <div className={`app-root ${darkMode ? 'dark' : ''}`}>
      <div className="background-field" aria-hidden="true">
        <div className="mesh mesh-one" />
        <div className="mesh mesh-two" />
        <div className="mesh mesh-three" />
      </div>

      <AnimatePresence>
        {sidebarOpen ? (
          <motion.div
            className="mobile-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button type="button" className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
        {sidebar}
      </div>

      <div className="dashboard-shell">
        <div className="desktop-sidebar">{sidebar}</div>

        <main className="main-panel">
          <header className="topbar">
            <button type="button" className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="topbar-search">
              <Search size={18} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search transactions, categories, insights"
              />
            </div>
            <div className="topbar-actions">
              <button type="button" className="icon-button" aria-label="Notifications">
                <Bell size={18} />
                {needsReviewCount > 0 ? <span className="notification-dot" /> : null}
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Toggle dark mode"
                onClick={() => setDarkMode((value) => !value)}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button type="button" className="secondary-action" onClick={() => setManualOpen(true)}>
                <Plus size={17} />
                Add manual
              </button>
              <input
                type="file"
                id="file-upload"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
              <label htmlFor="file-upload" className={`primary-action ${isProcessing ? 'disabled' : ''}`}>
                <UploadCloud size={18} />
                {isProcessing ? 'Processing' : 'Upload'}
              </label>
              <div className="user-chip" title={currentUser.email}>
                <UserRound size={16} />
                <span>{currentUser.name}</span>
              </div>
              <button type="button" className="icon-button" aria-label="Logout" onClick={handleLogout}>
                <LogOut size={17} />
              </button>
            </div>
          </header>

          {error ? (
            <motion.div
              className="error-banner"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertTriangle size={18} />
              <span>
                {error}
                {shouldShowBackendHint ? ` Make sure the backend is running at ${API_BASE}.` : ''}
              </span>
            </motion.div>
          ) : null}

          {isProcessing ? <LoadingSkeleton /> : null}

          <AnimatePresence mode="wait">
            <motion.section
              key={activeTab}
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="view-stack"
            >
              {activeTab === 'dashboard' ? (
                <DashboardView
                  balance={balance}
                  totalIncome={totalIncome}
                  totalExpenses={totalExpenses}
                  savingsRate={savingsRate}
                  sparkline={sparkline}
                  monthlyData={monthlyData}
                  incomeExpenseData={incomeExpenseData}
                  categoryData={categoryData}
                  topCategory={topCategory}
                  smartInsights={smartInsights}
                  financialHealth={financialHealth}
                  hasLiveData={hasLiveData}
                  handleLoadDemo={handleLoadDemo}
                  currentUser={currentUser}
                />
              ) : null}

              {activeTab === 'transactions' ? (
                <TransactionsView
                  transactions={transactions}
                  filteredTransactions={filteredTransactions}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  correctionDrafts={correctionDrafts}
                  savingCorrectionId={savingCorrectionId}
                  handleCorrectionChange={handleCorrectionChange}
                  handleSaveCorrection={handleSaveCorrection}
                  reviewQuestions={reviewQuestions}
                  categoryOptions={categoryOptions}
                />
              ) : null}

              {activeTab === 'analytics' ? (
                <AnalyticsView
                  categoryData={categoryData}
                  monthlyData={monthlyData}
                  incomeExpenseData={incomeExpenseData}
                  averageConfidence={averageConfidence}
                  dailySpend={dailySpend}
                  topCategory={topCategory}
                  totalExpenses={totalExpenses}
                />
              ) : null}

              {activeTab === 'insights' ? (
                <InsightsView
                  smartInsights={smartInsights}
                  financialHealth={financialHealth}
                  aiCoach={aiCoach}
                  isAiLoading={isAiLoading}
                  handleGenerateAiInsights={handleGenerateAiInsights}
                  analyticsTransactions={analyticsTransactions}
                />
              ) : null}

              {activeTab === 'budgets' ? <BudgetsView budgets={budgets} goals={goals} /> : null}

              {activeTab === 'settings' ? (
                <SettingsView darkMode={darkMode} setDarkMode={setDarkMode} apiBase={API_BASE} />
              ) : null}
            </motion.section>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {manualOpen ? (
          <ManualTransactionModal
            manualForm={manualForm}
            setManualForm={setManualForm}
            setManualOpen={setManualOpen}
            handleManualSubmit={handleManualSubmit}
            categoryOptions={categoryOptions}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function AuthScreen({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  authError,
  isAuthLoading,
  handleAuthSubmit,
  darkMode,
  setDarkMode
}) {
  const isRegister = authMode === 'register';

  return (
    <div className={`app-root auth-root ${darkMode ? 'dark' : ''}`}>
      <div className="background-field" aria-hidden="true">
        <div className="mesh mesh-one" />
        <div className="mesh mesh-two" />
        <div className="mesh mesh-three" />
      </div>
      <motion.main
        className="auth-shell"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <section className="auth-panel">
          <div className="brand auth-brand">
            <div className="brand-mark">
              <Wallet size={22} />
            </div>
            <div>
              <strong>FinSight AI</strong>
              <span>Personal finance intelligence</span>
            </div>
          </div>
          <span className="eyebrow">
            <Sparkles size={14} />
            AI powered UPI tracker
          </span>
          <h1>Login and let your finance dashboard remember what it learns.</h1>
          <p>
            Upload statements, manually add expenses, correct unknown merchants once, and the system will reuse
            that learning for future PDFs.
          </p>
          <div className="auth-feature-grid">
            <div>
              <BrainCircuit size={20} />
              <strong>Learning categories</strong>
              <span>Repeated unknown spends become automatic next time.</span>
            </div>
            <div>
              <Plus size={20} />
              <strong>Manual transactions</strong>
              <span>Add cash, UPI, or income entries without a PDF.</span>
            </div>
            <div>
              <Bot size={20} />
              <strong>AI saving coach</strong>
              <span>Find waste areas and simple savings actions.</span>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-head">
            <div>
              <span className="eyebrow">{isRegister ? 'Create account' : 'Welcome back'}</span>
              <h2>{isRegister ? 'Start tracking smarter' : 'Login to continue'}</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Toggle dark mode"
              onClick={() => setDarkMode((value) => !value)}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {isRegister ? (
              <label className="form-field">
                <span>Name</span>
                <div>
                  <UserRound size={17} />
                  <input
                    value={authForm.name}
                    onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Uttam Mishra"
                  />
                </div>
              </label>
            ) : null}
            <label className="form-field">
              <span>Email</span>
              <div>
                <Mail size={17} />
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="you@example.com"
                />
              </div>
            </label>
            <label className="form-field">
              <span>Password</span>
              <div>
                <Lock size={17} />
                <input
                  type="password"
                  required
                  minLength={4}
                  value={authForm.password}
                  onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Minimum 4 characters"
                />
              </div>
            </label>
            {authError ? (
              <div className="error-banner compact">
                <AlertTriangle size={17} />
                <span>{authError}</span>
              </div>
            ) : null}
            <button type="submit" className="primary-action auth-submit" disabled={isAuthLoading}>
              {isAuthLoading ? <Loader2 size={18} className="spin" /> : <ShieldCheck size={18} />}
              {isAuthLoading ? 'Please wait' : isRegister ? 'Create account' : 'Login'}
            </button>
          </form>

          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setAuthMode(isRegister ? 'login' : 'register');
            }}
          >
            {isRegister ? 'Already have an account? Login' : 'New here? Create account'}
          </button>
        </section>
      </motion.main>
    </div>
  );
}

function ManualTransactionModal({ manualForm, setManualForm, setManualOpen, handleManualSubmit, categoryOptions }) {
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={() => setManualOpen(false)}
    >
      <motion.section
        className="manual-modal"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.98 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">Manual entry</span>
            <h2>Add transaction</h2>
          </div>
          <button type="button" className="icon-button" onClick={() => setManualOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <form className="manual-form" onSubmit={handleManualSubmit}>
          <label className="form-field">
            <span>Date</span>
            <div>
              <Calendar size={17} />
              <input
                type="date"
                value={manualForm.date}
                onChange={(event) => setManualForm((current) => ({ ...current, date: event.target.value }))}
              />
            </div>
          </label>
          <label className="form-field">
            <span>Description</span>
            <div>
              <ReceiptText size={17} />
              <input
                required
                value={manualForm.description}
                onChange={(event) => setManualForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Example: Campus canteen"
              />
            </div>
          </label>
          <label className="form-field">
            <span>Amount</span>
            <div>
              <IndianRupee size={17} />
              <input
                required
                min="1"
                step="0.01"
                type="number"
                value={manualForm.amount}
                onChange={(event) => setManualForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="500"
              />
            </div>
          </label>
          <div className="form-grid">
            <label className="form-field">
              <span>Type</span>
              <div>
                <TrendingUp size={17} />
                <select
                  value={manualForm.type}
                  onChange={(event) => setManualForm((current) => ({ ...current, type: event.target.value }))}
                >
                  <option value="debit">Expense</option>
                  <option value="credit">Income</option>
                </select>
              </div>
            </label>
            <label className="form-field">
              <span>Category</span>
              <CategorySelect
                value={manualForm.category}
                options={categoryOptions}
                placeholder="Auto detect"
                onChange={(category) => setManualForm((current) => ({ ...current, category }))}
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="ghost-action" onClick={() => setManualOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="primary-action">
              <Plus size={17} />
              Add transaction
            </button>
          </div>
        </form>
      </motion.section>
    </motion.div>
  );
}

function CategorySelect({ value, options, onChange, disabled = false, placeholder = 'Choose category' }) {
  const isKnownCategory = options.some((category) => category === value);
  const [isCustom, setIsCustom] = useState(Boolean(value && !isKnownCategory));
  const [customValue, setCustomValue] = useState(value && !isKnownCategory ? value : '');

  useEffect(() => {
    if (value && !options.some((category) => category === value)) {
      setIsCustom(true);
      setCustomValue(value);
    }
  }, [value, options]);

  return (
    <div className="category-picker">
      <div className="category-picker-select">
        <SlidersHorizontal size={17} />
        <select
          value={isCustom ? '__custom__' : value || ''}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (nextValue === '__custom__') {
              setIsCustom(true);
              setCustomValue('');
              onChange('');
              return;
            }
            setIsCustom(false);
            setCustomValue('');
            onChange(nextValue);
          }}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
          <option value="__custom__">+ Add custom category</option>
        </select>
      </div>
      {isCustom ? (
        <input
          autoFocus
          className="custom-category-input"
          value={customValue}
          onChange={(event) => {
            setCustomValue(event.target.value);
            onChange(event.target.value.trim());
          }}
          disabled={disabled}
          placeholder="Type category, e.g. Hostel"
        />
      ) : null}
    </div>
  );
}

function DashboardView({
  balance,
  totalIncome,
  totalExpenses,
  savingsRate,
  sparkline,
  monthlyData,
  incomeExpenseData,
  categoryData,
  topCategory,
  smartInsights,
  financialHealth,
  hasLiveData,
  handleLoadDemo,
  currentUser
}) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="content-grid">
      <motion.section variants={item} className="hero-card">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={14} />
            AI finance operating system
          </span>
          <h1>Good evening, {currentUser?.name || 'Uttam'}. Your money story is getting clearer.</h1>
          <p>
            {hasLiveData
              ? 'Your latest UPI statement has been analyzed with category intelligence and smart spending signals.'
              : 'Preview mode is active. Upload a statement to replace this with your real financial intelligence.'}
          </p>
          <div className="hero-actions">
            <label htmlFor="file-upload" className="hero-upload">
              <UploadCloud size={18} />
              Upload statement
            </label>
            <button type="button" className="ghost-action" onClick={handleLoadDemo}>
              Load demo data
            </button>
          </div>
        </div>
        <div className="hero-metrics">
          <div className="hero-balance">
            <span>Net balance</span>
            <strong>{formatCurrency(balance)}</strong>
            <small>
              <ArrowUpRight size={14} />
              Your savings increased 18% this month.
            </small>
          </div>
          <div className="health-ring">
            <div style={{ '--score': `${financialHealth * 3.6}deg` }}>
              <strong>{financialHealth}</strong>
              <span>Health</span>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.div variants={item} className="stats-grid">
        <StatCard
          title="Current Balance"
          value={balance}
          icon={Wallet}
          trend="+18.2%"
          color="#2563eb"
          data={sparkline}
          dataKey="net"
        />
        <StatCard
          title="Total Income"
          value={totalIncome}
          icon={TrendingUp}
          trend="+12.4%"
          color="#10b981"
          data={sparkline}
          dataKey="income"
        />
        <StatCard
          title="Total Expenses"
          value={totalExpenses}
          icon={TrendingDown}
          trend="-4.8%"
          color="#ef4444"
          data={sparkline}
          dataKey="expenses"
          inverse
        />
        <StatCard
          title="Savings Rate"
          value={savingsRate}
          icon={PiggyBank}
          trend="+6.1%"
          color="#8b5cf6"
          data={sparkline}
          dataKey="income"
          suffix="%"
        />
      </motion.div>

      <motion.div variants={item} className="analytics-grid">
        <GlassCard title="Monthly Spending" icon={Calendar} className="wide-card">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGradient)" strokeWidth={3} />
              <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenseGradient)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="Category Mix" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={categoryData}
                innerRadius={72}
                outerRadius={112}
                paddingAngle={4}
                dataKey="value"
                animationDuration={900}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-caption">
            <span>Top spend</span>
            <strong>{topCategory?.name || 'No data'}</strong>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={item} className="lower-grid">
        <AIInsightsCard smartInsights={smartInsights} />
        <GlassCard title="Spending Velocity" icon={SlidersHorizontal}>
          <SpendingBars categoryData={categoryData} totalExpenses={totalExpenses} />
        </GlassCard>
        <GlassCard title="Income vs Expense" icon={BarChart3} className="wide-card">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={incomeExpenseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" radius={[10, 10, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color, data, dataKey, inverse = false, suffix = '' }) {
  return (
    <motion.article whileHover={{ y: -8, scale: 1.01 }} className="stat-card">
      <div className="gradient-border" style={{ '--accent': color }} />
      <div className="stat-top">
        <div className="stat-icon" style={{ color, background: `${color}18` }}>
          <Icon size={20} />
        </div>
        <span className={`trend-pill ${inverse ? 'good' : 'better'}`}>
          {inverse ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
          {trend}
        </span>
      </div>
      <span className="stat-title">{title}</span>
      <strong className="stat-number">
        {suffix ? <CountUp value={value} suffix={suffix} /> : <CountUp value={value} prefix="₹" />}
      </strong>
      <div className="sparkline">
        <ResponsiveContainer width="100%" height={58}>
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={false}
              animationDuration={900}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.article>
  );
}

function GlassCard({ title, icon: Icon, children, className = '' }) {
  return (
    <motion.section whileHover={{ y: -4 }} className={`glass-card ${className}`}>
      <div className="card-title">
        <span>
          <Icon size={18} />
        </span>
        <h2>{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function AIInsightsCard({ smartInsights }) {
  return (
    <GlassCard title="AI Financial Insights" icon={BrainCircuit}>
      <div className="insights-stack">
        {smartInsights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <motion.div
              className={`insight-tile ${insight.tone}`}
              key={insight.title}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <div className="insight-icon">
                <Icon size={18} />
              </div>
              <div>
                <span>{insight.title}</span>
                <p>{insight.text}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function SpendingBars({ categoryData, totalExpenses }) {
  if (!categoryData.length) {
    return <EmptyState title="No spending yet" text="Upload a statement to unlock category velocity." icon={BarChart3} />;
  }

  return (
    <div className="spending-bars">
      {categoryData.slice(0, 6).map((category, index) => {
        const Icon = category.icon || HelpCircle;
        const percentage = totalExpenses > 0 ? (category.value / totalExpenses) * 100 : 0;
        return (
          <div key={category.name} className="bar-row">
            <div className="bar-meta">
              <span style={{ color: category.color, background: `${category.color}17` }}>
                <Icon size={16} />
              </span>
              <div>
                <strong>{category.name}</strong>
                <small>{formatCurrency(category.value)}</small>
              </div>
            </div>
            <div className="bar-track">
              <motion.span
                style={{ background: category.color || COLORS[index % COLORS.length] }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: index * 0.05, duration: 0.7 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TransactionsView({
  transactions,
  filteredTransactions,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  correctionDrafts,
  savingCorrectionId,
  handleCorrectionChange,
  handleSaveCorrection,
  reviewQuestions,
  categoryOptions
}) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="view-panel">
      <motion.div variants={item} className="section-heading">
        <div>
          <span className="eyebrow">Transaction intelligence</span>
          <h1>Clean, searchable transaction ledger</h1>
        </div>
        <label htmlFor="file-upload" className="primary-action">
          <UploadCloud size={18} />
          Upload PDF
        </label>
      </motion.div>

      <motion.div variants={item} className="table-tools glass-card">
        <div className="table-search">
          <Search size={18} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by merchant or category"
          />
        </div>
        <div className="filter-select">
          <SlidersHorizontal size={17} />
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="All">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <ChevronDown size={16} />
        </div>
      </motion.div>

      <ReviewQueue
        reviewQuestions={reviewQuestions}
        correctionDrafts={correctionDrafts}
        savingCorrectionId={savingCorrectionId}
        handleCorrectionChange={handleCorrectionChange}
        handleSaveCorrection={handleSaveCorrection}
        categoryOptions={categoryOptions}
      />

      <motion.div variants={item} className="glass-card transaction-card">
        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions imported yet"
            text="Upload a UPI PDF statement or load demo data to preview the smart ledger."
            icon={FileText}
            cta="Upload statement"
          />
        ) : (
          <div className="table-wrap">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Review</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((txn) => {
                  const meta = categoryMeta[txn.category] || categoryMeta.Other;
                  const Icon = meta.icon;
                  return (
                    <tr key={txn.id}>
                      <td>{txn.date}</td>
                      <td>
                        <div className="merchant-cell">
                          <span style={{ color: meta.color, background: `${meta.color}17` }}>
                            <Icon size={17} />
                          </span>
                          <strong>{txn.description}</strong>
                        </div>
                      </td>
                      <td>
                        <span className={`category-chip ${txn.needs_review ? 'unknown' : ''}`}>
                          {txn.category}
                        </span>
                        {txn.needs_review && txn.suggested_category ? (
                          <small className="review-hint">Suggested: {txn.suggested_category}</small>
                        ) : null}
                      </td>
                      <td>
                        <span className={`status-badge ${txn.needs_review ? 'review' : 'cleared'}`}>
                          {txn.needs_review ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                          {txn.needs_review ? 'Review' : 'Cleared'}
                        </span>
                      </td>
                      <td>{Math.round((txn.confidence || 0) * 100)}%</td>
                      <td>
                        {txn.needs_review ? (
                          <div className="review-controls">
                            <CategorySelect
                              value={
                                correctionDrafts[txn.id] ||
                                (txn.category !== 'Unknown' ? txn.category : txn.suggested_category || '')
                              }
                              onChange={(category) => handleCorrectionChange(txn.id, category)}
                              disabled={savingCorrectionId === txn.id}
                              options={categoryOptions}
                              placeholder="Select"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCorrection(txn)}
                              disabled={savingCorrectionId === txn.id}
                            >
                              {savingCorrectionId === txn.id ? 'Saving' : 'Save'}
                            </button>
                          </div>
                        ) : (
                          <span className="quiet-badge">
                            {txn.learning_source === 'learned-feedback' ? 'Learned' : 'Auto'}
                          </span>
                        )}
                      </td>
                      <td className={txn.type === 'credit' ? 'money-credit' : 'money-debit'}>
                        {txn.type === 'credit' ? '+' : '-'}
                        {formatCurrency(Math.abs(txn.amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function ReviewQueue({
  reviewQuestions,
  correctionDrafts,
  savingCorrectionId,
  handleCorrectionChange,
  handleSaveCorrection,
  categoryOptions
}) {
  if (!reviewQuestions?.length) return null;

  return (
    <motion.div variants={item} className="review-queue glass-card">
      <div className="review-queue-head">
        <div>
          <span className="eyebrow">Learning queue</span>
          <h2>Teach the system once</h2>
          <p>If this merchant appears again in any future PDF, it will auto-categorize it.</p>
        </div>
        <span className="review-count">{reviewQuestions.length} questions</span>
      </div>
      <div className="review-question-grid">
        {reviewQuestions.slice(0, 4).map((question) => {
          const id = `review-${normalizeDescription(question.description)}`;
          const draft = correctionDrafts[id] || question.suggested_category || '';
          const pseudoTransaction = {
            id,
            description: question.description,
            category: 'Unknown',
            suggested_category: draft,
            needs_review: true
          };

          return (
            <div className="review-question-card" key={id}>
              <span className="source-pill">
                <HelpCircle size={14} />
                {question.count} repeat
              </span>
              <h3>{question.question}</h3>
              <p>Total matched amount: {formatCurrency(question.total_amount)}</p>
              <div className="review-controls">
                <CategorySelect
                  value={draft}
                  onChange={(category) => handleCorrectionChange(id, category)}
                  disabled={savingCorrectionId === id}
                  options={categoryOptions}
                  placeholder="Choose category"
                />
                <button type="button" onClick={() => handleSaveCorrection(pseudoTransaction)}>
                  {savingCorrectionId === id ? 'Saving' : 'Learn'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function AnalyticsView({ categoryData, monthlyData, incomeExpenseData, averageConfidence, dailySpend, topCategory, totalExpenses }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="content-grid">
      <motion.div variants={item} className="section-heading">
        <div>
          <span className="eyebrow">Analytics cockpit</span>
          <h1>Deep spending analysis</h1>
        </div>
      </motion.div>
      <motion.div variants={item} className="analytics-grid">
        <GlassCard title="Smooth Monthly Trend" icon={Calendar} className="wide-card">
          <ResponsiveContainer width="100%" height={330}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="net" stroke="#2563eb" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard title="AI Metrics" icon={Sparkles}>
          <div className="metric-list">
            <Metric label="Top category" value={topCategory?.name || 'N/A'} />
            <Metric label="Daily spending" value={formatCurrency(dailySpend)} />
            <Metric label="Model confidence" value={`${averageConfidence.toFixed(1)}%`} />
            <Metric label="Tracked spend" value={formatCurrency(totalExpenses)} />
          </div>
        </GlassCard>
      </motion.div>
      <motion.div variants={item} className="lower-grid">
        <GlassCard title="Horizontal Spending Bars" icon={BarChart3}>
          <SpendingBars categoryData={categoryData} totalExpenses={totalExpenses} />
        </GlassCard>
        <GlassCard title="Income vs Expense" icon={TrendingUp} className="wide-card">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeExpenseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="#10b981" radius={[10, 10, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[10, 10, 0, 0]} />
              <Bar dataKey="savings" fill="#2563eb" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

function InsightsView({
  smartInsights,
  financialHealth,
  aiCoach,
  isAiLoading,
  handleGenerateAiInsights,
  analyticsTransactions
}) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="content-grid">
      <motion.div variants={item} className="section-heading">
        <div>
          <span className="eyebrow">AI copilot</span>
          <h1>Financial decisions, translated</h1>
        </div>
        <button
          type="button"
          className="primary-action"
          onClick={handleGenerateAiInsights}
          disabled={isAiLoading || analyticsTransactions.length === 0}
        >
          {isAiLoading ? <Loader2 size={18} className="spin" /> : <Bot size={18} />}
          {isAiLoading ? 'Thinking' : 'Ask AI Coach'}
        </button>
      </motion.div>
      <motion.div variants={item} className="insight-layout">
        <AIInsightsCard smartInsights={smartInsights} />
        <GlassCard title="Financial Health Score" icon={ShieldCheck}>
          <div className="score-panel">
            <div className="health-ring large">
              <div style={{ '--score': `${financialHealth * 3.6}deg` }}>
                <strong>{financialHealth}</strong>
                <span>Score</span>
              </div>
            </div>
            <p>
              Strong categorization confidence, stable income, and positive savings momentum. Keep subscriptions
              below 8% of monthly income to improve the score.
            </p>
          </div>
        </GlassCard>
      </motion.div>
      <motion.div variants={item}>
        <AiCoachResults aiCoach={aiCoach} isAiLoading={isAiLoading} />
      </motion.div>
    </motion.div>
  );
}

function AiCoachResults({ aiCoach, isAiLoading }) {
  if (isAiLoading) {
    return (
      <GlassCard title="AI Savings Coach" icon={Bot}>
        <div className="coach-loading">
          <Loader2 size={22} className="spin" />
          <span>Finding waste areas, recurring patterns, and practical saving moves...</span>
        </div>
      </GlassCard>
    );
  }

  if (!aiCoach) {
    return (
      <GlassCard title="AI Savings Coach" icon={Bot}>
        <EmptyState
          title="Ask the AI coach"
          text="Click Ask AI Coach to generate personalized waste analysis, savings ideas, and next actions from your transactions."
          icon={BrainCircuit}
        />
      </GlassCard>
    );
  }

  return (
    <GlassCard title="AI Savings Coach" icon={Bot}>
      <div className="coach-card">
        <div className="coach-summary">
          <span className="source-pill">
            <Sparkles size={14} />
            {aiCoach.source === 'openai' ? 'OpenAI insight' : 'Rule-based fallback'}
          </span>
          <h3>{aiCoach.summary}</h3>
        </div>
        <div className="coach-grid">
          <div>
            <h4>Waste areas</h4>
            <div className="coach-list">
              {(aiCoach.waste_areas || []).map((area, index) => (
                <div className="recommendation-card" key={`${area.title}-${index}`}>
                  <strong>{area.title}</strong>
                  <p>{area.detail}</p>
                  {area.impact ? <span>Potential save: {formatCurrency(area.impact)}</span> : null}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4>Savings recommendations</h4>
            <div className="coach-list">
              {(aiCoach.recommendations || []).map((recommendation, index) => (
                <div className="recommendation-card compact-card" key={`${recommendation}-${index}`}>
                  <CheckCircle2 size={17} />
                  <span>{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {aiCoach.next_actions?.length ? (
          <div className="next-actions">
            <h4>Next actions</h4>
            {aiCoach.next_actions.map((action, index) => (
              <span key={action}>
                {index + 1}. {action}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}

function BudgetsView({ budgets, goals }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="content-grid">
      <motion.div variants={item} className="section-heading">
        <div>
          <span className="eyebrow">Control center</span>
          <h1>Budgets, goals, and smart alerts</h1>
        </div>
      </motion.div>
      <motion.div variants={item} className="lower-grid">
        <GlassCard title="Budget Tracking" icon={Target}>
          <div className="budget-stack">
            {budgets.map((budget) => {
              const meta = categoryMeta[budget.name] || categoryMeta.Other;
              const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
              return (
                <div key={budget.name} className="budget-item">
                  <div className="budget-head">
                    <strong>{budget.name}</strong>
                    <span>
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                    </span>
                  </div>
                  <div className="bar-track">
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      style={{ background: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
        <GlassCard title="Savings Goals" icon={PiggyBank}>
          <div className="budget-stack">
            {goals.map((goal) => {
              const percentage = Math.min((goal.current / goal.target) * 100, 100);
              return (
                <div key={goal.name} className="budget-item">
                  <div className="budget-head">
                    <strong>{goal.name}</strong>
                    <span>{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="bar-track">
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      style={{ background: goal.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
        <GlassCard title="Smart Alerts" icon={Bell}>
          <div className="alert-stack">
            <SmartAlert icon={AlertTriangle} title="Subscription creep" text="Entertainment spend is trending up." />
            <SmartAlert icon={CheckCircle2} title="Cash flow stable" text="Income covers tracked expenses comfortably." />
            <SmartAlert icon={Zap} title="Optimization found" text="Reduce food delivery by 15% to save faster." />
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

function SettingsView({ darkMode, setDarkMode, apiBase }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="view-panel">
      <motion.div variants={item} className="section-heading">
        <div>
          <span className="eyebrow">Workspace settings</span>
          <h1>Configure your finance cockpit</h1>
        </div>
      </motion.div>
      <motion.div variants={item} className="settings-grid">
        <GlassCard title="Appearance" icon={Moon}>
          <button type="button" className="setting-row" onClick={() => setDarkMode((value) => !value)}>
            <span>{darkMode ? 'Dark mode enabled' : 'Light mode enabled'}</span>
            <span className={`toggle ${darkMode ? 'on' : ''}`}>
              <i />
            </span>
          </button>
        </GlassCard>
        <GlassCard title="Backend API" icon={ShieldCheck}>
          <div className="api-box">
            <span>Connected endpoint</span>
            <code>{apiBase}</code>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SmartAlert({ icon: Icon, title, text }) {
  return (
    <div className="smart-alert">
      <span>
        <Icon size={17} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function EmptyState({ title, text, icon: Icon, cta }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={28} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {cta ? (
        <label htmlFor="file-upload" className="primary-action">
          <UploadCloud size={17} />
          {cta}
        </label>
      ) : null}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <motion.div className="skeleton-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div />
      <div />
      <div />
    </motion.div>
  );
}

export default App;
