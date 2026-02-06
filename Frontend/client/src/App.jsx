import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './App.css';

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);

const TrendingUp = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendingDown = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const Wallet = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const PieChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);

const TagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const AlertCircle = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

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
  Other: []
};

const mockTransactions = [
  { date: '2024-02-01', description: 'Swiggy Food Order', amount: -450, type: 'debit' },
  { date: '2024-02-01', description: 'Salary Credited', amount: 50000, type: 'credit' },
  { date: '2024-02-02', description: 'Uber Ride', amount: -180, type: 'debit' },
  { date: '2024-02-02', description: 'Amazon Shopping', amount: -2500, type: 'debit' },
  { date: '2024-02-03', description: 'Netflix Subscription', amount: -199, type: 'debit' },
  { date: '2024-02-03', description: 'Electricity Bill', amount: -1200, type: 'debit' },
  { date: '2024-02-04', description: 'Zomato Order', amount: -380, type: 'debit' },
  { date: '2024-02-05', description: 'Petrol Pump', amount: -2000, type: 'debit' },
  { date: '2024-02-05', description: 'Apollo Pharmacy', amount: -560, type: 'debit' },
  { date: '2024-02-06', description: 'Mobile Recharge', amount: -299, type: 'debit' },
  { date: '2024-02-07', description: 'Myntra Shopping', amount: -1800, type: 'debit' },
  { date: '2024-02-08', description: 'Ola Cab', amount: -250, type: 'debit' },
  { date: '2024-02-09', description: 'Dominos Pizza', amount: -499, type: 'debit' },
  { date: '2024-02-10', description: 'Udemy Course', amount: -799, type: 'debit' },
  { date: '2024-02-11', description: 'Flipkart Order', amount: -3200, type: 'debit' },
  { date: '2024-02-12', description: 'Internet Bill', amount: -699, type: 'debit' },
  { date: '2024-02-13', description: 'Movie Tickets', amount: -600, type: 'debit' },
  { date: '2024-02-14', description: 'Restaurant Dining', amount: -1500, type: 'debit' },
  { date: '2024-02-15', description: 'Freelance Payment', amount: 15000, type: 'credit' },
  { date: '2024-02-16', description: 'Groww SIP Investment', amount: -5000, type: 'debit' },
  { date: '2024-01-28', description: 'Coffee Shop', amount: -250, type: 'debit' },
  { date: '2024-01-29', description: 'Bus Pass', amount: -500, type: 'debit' },
  { date: '2024-01-30', description: 'Grocery Store', amount: -2200, type: 'debit' },
  { date: '2024-01-31', description: 'Gas Bill', amount: -800, type: 'debit' }
];

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
    id: Date.now() + index,
    ...txn,
    category: categorizeMockML(txn.description),
    confidence: Number((Math.random() * 0.3 + 0.7).toFixed(2))
  }));

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState('');

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses
    };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const totals = {};
    transactions
      .filter((t) => t.type === 'debit')
      .forEach((t) => {
        if (!totals[t.category]) totals[t.category] = 0;
        totals[t.category] += Math.abs(t.amount);
      });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const totals = {};
    transactions.forEach((t) => {
      const month = t.date.substring(0, 7);
      if (!totals[month]) totals[month] = { month, income: 0, expenses: 0 };
      if (t.type === 'credit') {
        totals[month].income += t.amount;
      } else {
        totals[month].expenses += Math.abs(t.amount);
      }
    });
    return Object.values(totals).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');

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
    } catch (err) {
      setError(err?.message || 'Something went wrong while processing the file.');
      setTransactions([]);
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const handleLoadDemo = () => {
    setError('');
    setTransactions(buildMockTransactions());
  };

  const averageConfidence =
    transactions.length > 0
      ? (transactions.reduce((sum, t) => sum + t.confidence, 0) / transactions.length) * 100
      : 0;
  const savingsRate = totalIncome > 0 ? (1 - totalExpenses / totalIncome) * 100 : 0;
  const dailySpend = transactions.length > 0 ? totalExpenses / 30 : 0;
  const topCategory = categoryData[0];

  const shouldShowBackendHint =
    error &&
    ['fetch', 'network', 'backend', 'connect', 'cors', 'failed'].some((term) =>
      error.toLowerCase().includes(term)
    );

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div>
            <div className="title">
              <Wallet size={36} />
              AI Personal Finance Tracker
            </div>
            <p className="subtitle">Smart UPI transaction analysis with ML categorization</p>
          </div>
          <div>
            <input
              type="file"
              id="file-upload"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
            <label
              htmlFor="file-upload"
              className="upload-btn"
              style={{ cursor: isProcessing ? 'not-allowed' : 'pointer' }}
            >
              <UploadIcon />
              {isProcessing ? 'Processing...' : 'Upload Statement'}
            </label>
            <button
              type="button"
              className="upload-btn secondary"
              onClick={handleLoadDemo}
              disabled={isProcessing}
            >
              Load Demo Data
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="error-banner">
          {error}
          {shouldShowBackendHint ? ` Make sure the backend is running at ${API_BASE}.` : ''}
        </div>
      ) : null}

      <div className="card">
        <div className="tabs">
          {['dashboard', 'transactions', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div className="grid grid-3">
            <div className="stat-card blue">
              <div className="stat-header">
                <Wallet size={32} />
                <span className="stat-label">Current Balance</span>
              </div>
              <div className="stat-value">₹{balance.toLocaleString()}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-header">
                <TrendingUp />
                <span className="stat-label">Total Income</span>
              </div>
              <div className="stat-value">₹{totalIncome.toLocaleString()}</div>
            </div>
            <div className="stat-card red">
              <div className="stat-header">
                <TrendingDown />
                <span className="stat-label">Total Expenses</span>
              </div>
              <div className="stat-value">₹{totalExpenses.toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <div className="section-title">
                <CalendarIcon />
                Monthly Trend
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="section-title">
                <PieChartIcon />
                Category Distribution
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="section-title">
              <TagIcon />
              Top Spending Categories
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {activeTab === 'transactions' && (
        <div className="card">
          <div className="section-title">
            <FileTextIcon />
            Recent Transactions ({transactions.length})
          </div>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <AlertCircle />
              <p style={{ fontSize: '18px', color: '#6b7280', marginTop: '12px' }}>
                No transactions yet
              </p>
              <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
                Upload a UPI statement to get started
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Confidence</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id}>
                      <td style={{ color: '#6b7280' }}>{txn.date}</td>
                      <td style={{ color: '#1f2937' }}>{txn.description}</td>
                      <td>
                        <span className="badge">{txn.category}</span>
                      </td>
                      <td style={{ color: '#6b7280' }}>{Math.round(txn.confidence * 100)}%</td>
                      <td className={txn.type === 'credit' ? 'amount-credit' : 'amount-debit'}>
                        {txn.type === 'credit' ? '+' : '-'}₹{Math.abs(txn.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <div className="card">
            <h3 className="section-title">AI-Powered Insights</h3>
            <div className="grid grid-2">
              <div className="insight-card blue">
                <h4 className="insight-title">Top Spending Category</h4>
                <p className="insight-value">
                  {topCategory ? `${topCategory.name} - ₹${topCategory.value.toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div className="insight-card green">
                <h4 className="insight-title">Savings Rate</h4>
                <p className="insight-value">{savingsRate.toFixed(1)}% of income saved</p>
              </div>
              <div className="insight-card yellow">
                <h4 className="insight-title">Average Daily Spending</h4>
                <p className="insight-value">₹{dailySpend.toFixed(0)} per day</p>
              </div>
              <div className="insight-card purple">
                <h4 className="insight-title">ML Accuracy</h4>
                <p className="insight-value">{averageConfidence.toFixed(1)}% average confidence</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Detailed Category Breakdown</h3>
            {categoryData.map((category, index) => {
              const percentage = totalExpenses > 0 ? (category.value / totalExpenses) * 100 : 0;
              return (
                <div key={category.name} className="progress-bar">
                  <div className="progress-label">
                    <span style={{ fontWeight: 600, color: '#374151' }}>{category.name}</span>
                    <span style={{ color: '#6b7280' }}>
                      ₹{category.value.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="footer">
        <p>Powered by AI and machine learning. Mock categorization with {Object.keys(categoryRules).length} categories.</p>
      </div>
    </div>
  );
}

export default App;
