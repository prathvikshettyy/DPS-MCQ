import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Shield,
  BarChart3,
  Users,
  BookOpen,
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Edit,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Check,
  X,
  FileQuestion,
  TrendingUp,
  Award,
} from 'lucide-react';

export default function AdminPortal() {
  const { user } = useAuth();

  // Active Tab: 'analytics' | 'attempts' | 'tests' | 'questions'
  const [activeTab, setActiveTab] = useState('analytics');

  // =====================================
  // 1. ANALYTICS STATE
  // =====================================
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // =====================================
  // 2. ATTEMPTS STATE
  // =====================================
  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedAttemptDetail, setSelectedAttemptDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // =====================================
  // 3. TESTS CRUD STATE
  // =====================================
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testFormData, setTestFormData] = useState({
    title: '',
    description: '',
    timeLimitMinutes: 15,
    passingScorePercent: 70,
    isPublished: true,
  });

  // =====================================
  // 4. QUESTIONS CRUD STATE
  // =====================================
  const [selectedTestForQuestions, setSelectedTestForQuestions] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('ALL');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionFormData, setQuestionFormData] = useState({
    prompt: '',
    category: 'S',
    explanation: '',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

  // Load initial data
  useEffect(() => {
    loadAnalytics();
    loadTests();
  }, []);

  useEffect(() => {
    if (activeTab === 'attempts') {
      loadAttempts();
    } else if (activeTab === 'tests') {
      loadTests();
    } else if (activeTab === 'questions' && selectedTestForQuestions) {
      loadQuestions(selectedTestForQuestions);
    }
  }, [activeTab]);

  // Set default test for questions tab once tests are loaded
  useEffect(() => {
    if (tests.length > 0 && !selectedTestForQuestions) {
      setSelectedTestForQuestions(tests[0].id);
      loadQuestions(tests[0].id);
    }
  }, [tests]);

  // =====================================
  // API LOADERS
  // =====================================
  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadAttempts = async () => {
    try {
      setLoadingAttempts(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (sortBy) params.append('sortBy', sortBy);

      const res = await fetch(`/api/admin/attempts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts || []);
      }
    } catch (err) {
      console.error('Attempts load error:', err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const loadTests = async () => {
    try {
      setLoadingTests(true);
      const res = await fetch('/api/admin/tests');
      if (res.ok) {
        const data = await res.json();
        setTests(data.tests || []);
      }
    } catch (err) {
      console.error('Tests load error:', err);
    } finally {
      setLoadingTests(false);
    }
  };

  const loadQuestions = async (testId) => {
    try {
      setLoadingQuestions(true);
      const res = await fetch(`/api/admin/tests/${testId}/questions`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error('Questions load error:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const viewAttemptDetail = async (attemptId) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`/api/admin/attempts/${attemptId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAttemptDetail(data.attempt);
      }
    } catch (err) {
      console.error('Detail load error:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const deleteAttempt = async (attemptId) => {
    if (!confirm('Are you sure you want to delete this candidate submission record?')) return;
    try {
      const res = await fetch(`/api/admin/attempts/${attemptId}`, { method: 'DELETE' });
      if (res.ok) {
        setAttempts((prev) => prev.filter((a) => a.id !== attemptId));
        if (selectedAttemptDetail?.id === attemptId) {
          setSelectedAttemptDetail(null);
        }
        loadAnalytics();
      }
    } catch (err) {
      console.error('Delete attempt error:', err);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    window.location.href = '/api/admin/attempts/export/csv';
  };

  // =====================================
  // TEST CRUD HANDLERS
  // =====================================
  const openCreateTestModal = () => {
    setEditingTest(null);
    setTestFormData({
      title: '',
      description: '',
      timeLimitMinutes: 15,
      passingScorePercent: 70,
      isPublished: true,
    });
    setShowTestModal(true);
  };

  const openEditTestModal = (test) => {
    setEditingTest(test);
    setTestFormData({
      title: test.title,
      description: test.description,
      timeLimitMinutes: test.timeLimitMinutes,
      passingScorePercent: test.passingScorePercent,
      isPublished: test.isPublished,
    });
    setShowTestModal(true);
  };

  const handleSaveTest = async (e) => {
    e.preventDefault();
    try {
      const url = editingTest ? `/api/admin/tests/${editingTest.id}` : '/api/admin/tests';
      const method = editingTest ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testFormData),
      });

      if (res.ok) {
        setShowTestModal(false);
        loadTests();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save test');
      }
    } catch (err) {
      console.error('Save test error:', err);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!confirm('Delete this assessment and all of its questions and attempts?')) return;
    try {
      const res = await fetch(`/api/admin/tests/${testId}`, { method: 'DELETE' });
      if (res.ok) {
        loadTests();
        if (selectedTestForQuestions === testId) {
          setSelectedTestForQuestions('');
          setQuestions([]);
        }
      }
    } catch (err) {
      console.error('Delete test error:', err);
    }
  };

  // =====================================
  // QUESTION CRUD HANDLERS
  // =====================================
  const openCreateQuestionModal = () => {
    setEditingQuestion(null);
    setQuestionFormData({
      prompt: '',
      category: 'S',
      explanation: '',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    });
    setShowQuestionModal(true);
  };

  const openEditQuestionModal = (q) => {
    setEditingQuestion(q);
    setQuestionFormData({
      prompt: q.prompt,
      category: q.category,
      explanation: q.explanation,
      options: q.options.map((o) => ({
        text: o.text,
        isCorrect: o.isCorrect,
      })),
    });
    setShowQuestionModal(true);
  };

  const handleOptionCorrectChange = (index) => {
    setQuestionFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      })),
    }));
  };

  const handleOptionTextChange = (index, text) => {
    setQuestionFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? { ...opt, text } : opt)),
    }));
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!selectedTestForQuestions) {
      alert('Please select a test first.');
      return;
    }

    try {
      const url = editingQuestion
        ? `/api/admin/questions/${editingQuestion.id}`
        : `/api/admin/tests/${selectedTestForQuestions}/questions`;
      const method = editingQuestion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionFormData),
      });

      if (res.ok) {
        setShowQuestionModal(false);
        loadQuestions(selectedTestForQuestions);
        loadTests();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save question');
      }
    } catch (err) {
      console.error('Save question error:', err);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, { method: 'DELETE' });
      if (res.ok) {
        loadQuestions(selectedTestForQuestions);
        loadTests();
      }
    } catch (err) {
      console.error('Delete question error:', err);
    }
  };

  const categoryNames = {
    S: 'Specific',
    M: 'Measurable',
    A: 'Achievable',
    R: 'Relevant',
    T: 'Time-Bound',
  };

  const categoryBarColors = {
    S: '#6366f1', // Indigo
    M: '#10b981', // Emerald
    A: '#f59e0b', // Amber
    R: '#8b5cf6', // Violet
    T: '#f43f5e', // Rose
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" /> Administrative Control Center
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">SMART Assessment Analytics & Records</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time candidate submissions, evaluation diagnostics, and assessment bank management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 mb-8 overflow-x-auto">
        {[
          { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart3 },
          { id: 'attempts', label: 'Candidate Submissions', icon: Users },
          { id: 'tests', label: 'Manage Assessments', icon: BookOpen },
          { id: 'questions', label: 'Question Bank', icon: FileQuestion },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ANALYTICS & INSIGHTS                               */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-2">
                <span>Completed Attempts</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {analytics?.summary?.totalCompletedAttempts || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Across all published tests</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-2">
                <span>Average Accuracy</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {analytics?.summary?.averageScorePercent || 0}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Mean candidate score</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-2">
                <span>Pass Rate (&ge;70%)</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {analytics?.summary?.passRatePercent || 0}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Qualification benchmark</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase mb-2">
                <span>Total Registered</span>
                <BookOpen className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {analytics?.summary?.totalUsers || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Candidate accounts in system</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SMART Pillars Accuracy Bar Chart */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Score by SMART Category
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Candidate accuracy rates grouped by goal dimension
                </p>
              </div>

              {analytics?.scoreByCategory ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.scoreByCategory.map((c) => ({
                        name: `${c.categoryKey} - ${c.categoryName}`,
                        accuracy: c.accuracyPercent,
                        letter: c.categoryKey,
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#f8fafc',
                        }}
                        formatter={(val) => [`${val}%`, 'Accuracy']}
                      />
                      <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                        {analytics.scoreByCategory.map((entry) => (
                          <Cell
                            key={entry.categoryKey}
                            fill={categoryBarColors[entry.categoryKey] || '#6366f1'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                  No submission data available yet
                </div>
              )}
            </div>

            {/* Score Distribution Chart */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  Score Distribution
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Volume of candidate scores grouped by percentage tiers
                </p>
              </div>

              {analytics?.scoreDistribution ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.scoreDistribution}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="range" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#f8fafc',
                        }}
                        formatter={(val) => [val, 'Submissions']}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                  No distribution data available
                </div>
              )}
            </div>
          </div>

          {/* Hardest Questions Panel */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Hardest Questions (Lowest Accuracy)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pinpoint conceptual misunderstandings among candidates across specific questions
              </p>
            </div>

            {analytics?.hardestQuestions && analytics.hardestQuestions.length > 0 ? (
              <div className="space-y-3">
                {analytics.hardestQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-200 line-clamp-1">
                          {q.prompt}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                            Dimension: {categoryNames[q.category] || q.category}
                          </span>
                          <span>Evaluated {q.totalAnswered} times</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-rose-400">
                        {q.correctRatePercent}%
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-slate-500">
                        Correct Rate
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">
                No attempt submissions recorded yet to compute question difficulty.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CANDIDATE SUBMISSIONS TABLE                        */}
      {/* ========================================================= */}
      {activeTab === 'attempts' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by USN, Student Name, test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadAttempts()}
                className="w-full bg-slate-800/80 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setTimeout(loadAttempts, 0);
                }}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="passed">Passed (&ge;70%)</option>
                <option value="failed">Failed (&lt;70%)</option>
                <option value="in_progress">In Progress</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setTimeout(loadAttempts, 0);
                }}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="highest">Sort: Highest Score</option>
                <option value="lowest">Sort: Lowest Score</option>
                <option value="oldest">Sort: Oldest</option>
              </select>

              <button
                onClick={loadAttempts}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Submissions Table & Mobile Cards */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loadingAttempts ? (
              <div className="py-16 text-center text-slate-400 text-xs sm:text-sm">
                <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                Loading candidate submissions...
              </div>
            ) : attempts.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs sm:text-sm">
                No candidate submissions matching your search criteria.
              </div>
            ) : (
              <>
                {/* 1. Mobile Card View (< md) */}
                <div className="block md:hidden divide-y divide-slate-800/80 p-2">
                  {attempts.map((att) => {
                    const durationMin = Math.floor((att.durationSeconds || 0) / 60);
                    const durationSec = (att.durationSeconds || 0) % 60;
                    const dateStr = att.completedAt
                      ? new Date(att.completedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Active';

                    return (
                      <div key={att.id} className="p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            USN: {att.candidateUsn || 'N/A'}
                          </span>
                          {att.status === 'PASSED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Passed
                            </span>
                          )}
                          {att.status === 'FAILED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <XCircle className="w-3 h-3" /> Failed
                            </span>
                          )}
                          {att.status === 'IN_PROGRESS' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3" /> In Progress
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="text-sm font-bold text-white">{att.candidateName}</div>
                          <div className="text-xs text-slate-400">{att.testTitle}</div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-800/60">
                          <div>
                            Score: <strong className="text-white">{att.score !== null ? `${att.score}/${att.totalQuestions}` : '—'}</strong> ({att.percentage !== null ? `${att.percentage}%` : '—'})
                          </div>
                          <div className="text-slate-400 text-[11px]">{dateStr}</div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          {att.completedAt && (
                            <button
                              onClick={() => viewAttemptDetail(att.id)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Audit Answers
                            </button>
                          )}
                          <button
                            onClick={() => deleteAttempt(att.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 bg-slate-800/60"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Desktop Full Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-6">USN</th>
                        <th className="py-3.5 px-6">Student Name</th>
                        <th className="py-3.5 px-6">Test Title</th>
                        <th className="py-3.5 px-6">Score</th>
                        <th className="py-3.5 px-6">Accuracy</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6">Duration</th>
                        <th className="py-3.5 px-6">Date</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {attempts.map((att) => {
                        const durationMin = Math.floor((att.durationSeconds || 0) / 60);
                        const durationSec = (att.durationSeconds || 0) % 60;
                        const dateStr = att.completedAt
                          ? new Date(att.completedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Active';

                        return (
                          <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-4 px-6 font-mono font-bold text-indigo-400">
                              {att.candidateUsn || 'N/A'}
                            </td>
                            <td className="py-4 px-6 font-semibold text-white">
                              {att.candidateName}
                            </td>
                            <td className="py-4 px-6 text-slate-300 font-medium">
                              {att.testTitle}
                            </td>
                            <td className="py-4 px-6">
                              {att.score !== null ? (
                                <>
                                  <span className="font-bold text-white">{att.score}</span>
                                  <span className="text-xs text-slate-500"> / {att.totalQuestions}</span>
                                </>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {att.percentage !== null ? (
                                <span className="font-bold text-slate-200">{att.percentage}%</span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {att.status === 'PASSED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" /> Passed
                                </span>
                              )}
                              {att.status === 'FAILED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  <XCircle className="w-3 h-3" /> Failed
                                </span>
                              )}
                              {att.status === 'IN_PROGRESS' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <Clock className="w-3 h-3" /> In Progress
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-xs text-slate-400">
                              {att.durationSeconds !== null ? `${durationMin}m ${durationSec}s` : '—'}
                            </td>
                            <td className="py-4 px-6 text-xs text-slate-400">{dateStr}</td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {att.completedAt && (
                                  <button
                                    onClick={() => viewAttemptDetail(att.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                                    title="Audit Candidate Answers"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteAttempt(att.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                  title="Delete Attempt"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: TESTS MANAGEMENT (CRUD)                            */}
      {/* ========================================================= */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Configured Assessment Tests</h2>
            <button
              onClick={openCreateTestModal}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Assessment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        test.isPublished
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {test.isPublished ? 'Published' : 'Draft / Unpublished'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Pass threshold: {test.passingScorePercent}%
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{test.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-6">
                    {test.description}
                  </p>
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-800/40 text-xs text-slate-300 mb-6">
                    <div>
                      Questions: <strong className="text-white">{test.totalQuestions}</strong>
                    </div>
                    <div>
                      Time Limit: <strong className="text-white">{test.timeLimitMinutes}m</strong>
                    </div>
                    <div className="col-span-2 text-slate-400">
                      Submissions: <strong className="text-white">{test.totalAttempts}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setSelectedTestForQuestions(test.id);
                        setActiveTab('questions');
                        loadQuestions(test.id);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-400 transition-colors"
                    >
                      Edit Questions
                    </button>
                    <button
                      onClick={() => openEditTestModal(test)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Settings"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete Test"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: QUESTION BANK MANAGEMENT (CRUD)                    */}
      {/* ========================================================= */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                Select Assessment:
              </label>
              <select
                value={selectedTestForQuestions}
                onChange={(e) => {
                  setSelectedTestForQuestions(e.target.value);
                  loadQuestions(e.target.value);
                }}
                className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none font-medium"
              >
                {tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.totalQuestions} Questions)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Category pill filter */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {['ALL', 'S', 'M', 'A', 'R', 'T'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setQuestionCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      questionCategoryFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={openCreateQuestionModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/25 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </button>
            </div>
          </div>

          {/* Questions List */}
          {loadingQuestions ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
              Loading question inventory...
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-sm">
              No questions found for this test. Click "Add Question" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {questions
                .filter((q) => questionCategoryFilter === 'ALL' || q.category === questionCategoryFilter)
                .map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-xl transition-all"
                  >
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {categoryNames[q.category] || q.category} ({q.category})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditQuestionModal(q)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit Question"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-base font-semibold text-white mb-4 leading-relaxed">
                      {q.prompt}
                    </h4>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={opt.id || optIdx}
                          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                            opt.isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium'
                              : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center font-bold shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-snug">{opt.text}</span>
                          {opt.isCorrect && (
                            <span className="ml-auto text-[10px] uppercase font-bold text-emerald-400">
                              Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-400">
                        <strong className="text-slate-300">Explanation: </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CANDIDATE DETAIL AUDIT VIEW                        */}
      {/* ========================================================= */}
      {selectedAttemptDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full my-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Candidate Submission Audit
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {selectedAttemptDetail.candidateName || selectedAttemptDetail.candidate?.name}
                </h2>
                <div className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    USN: {selectedAttemptDetail.candidateUsn || selectedAttemptDetail.candidate?.usn || 'N/A'}
                  </span>
                  <span>&bull; {selectedAttemptDetail.testTitle}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedAttemptDetail(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <div className="text-xs text-slate-400">Total Score</div>
                <div className="text-xl font-bold text-white">
                  {selectedAttemptDetail.score} / {selectedAttemptDetail.totalQuestions}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <div className="text-xs text-slate-400">Accuracy</div>
                <div className="text-xl font-bold text-white">
                  {selectedAttemptDetail.percentage}%
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <div className="text-xs text-slate-400">Status</div>
                <div
                  className={`text-sm font-bold mt-1 ${
                    selectedAttemptDetail.passed ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {selectedAttemptDetail.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <div className="text-xs text-slate-400">Duration</div>
                <div className="text-xl font-bold text-white">
                  {Math.floor((selectedAttemptDetail.durationSeconds || 0) / 60)}m{' '}
                  {(selectedAttemptDetail.durationSeconds || 0) % 60}s
                </div>
              </div>
            </div>

            {/* Answers Audit List */}
            <h3 className="text-base font-bold text-white mb-4">
              Individual Question Evaluation
            </h3>
            <div className="space-y-4">
              {selectedAttemptDetail.answers?.map((ans, idx) => (
                <div
                  key={ans.questionId || idx}
                  className={`p-4 rounded-xl border ${
                    ans.isCorrect
                      ? 'bg-slate-800/20 border-slate-800'
                      : 'bg-rose-500/5 border-rose-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-xs font-semibold text-slate-400">
                      Q #{idx + 1} &bull; Dimension: {categoryNames[ans.category] || ans.category}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        ans.isCorrect
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {ans.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-white mb-3">{ans.prompt}</p>

                  <div className="space-y-1.5 text-xs">
                    <div className="p-2 rounded-lg bg-slate-800/60 flex items-center justify-between">
                      <span className="text-slate-400">Candidate Choice:</span>
                      <span
                        className={ans.isCorrect ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}
                      >
                        {ans.selectedOptionText}
                      </span>
                    </div>

                    {!ans.isCorrect && (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                        <span className="text-emerald-300">Correct Answer:</span>
                        <span className="text-emerald-200 font-semibold">{ans.correctOptionText}</span>
                      </div>
                    )}
                  </div>

                  {ans.explanation && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300">
                      <strong>SMART Explanation: </strong>
                      {ans.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedAttemptDetail(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TEST CREATE / EDIT                                 */}
      {/* ========================================================= */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingTest ? 'Edit Assessment Settings' : 'Create New Assessment'}
            </h3>

            <form onSubmit={handleSaveTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={testFormData.title}
                  onChange={(e) => setTestFormData({ ...testFormData, title: e.target.value })}
                  placeholder="e.g. SMART Goals Certification"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Description *
                </label>
                <textarea
                  value={testFormData.description}
                  onChange={(e) => setTestFormData({ ...testFormData, description: e.target.value })}
                  rows={3}
                  placeholder="Explain assessment purpose and target audience..."
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Time Limit (Mins)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={testFormData.timeLimitMinutes}
                    onChange={(e) =>
                      setTestFormData({ ...testFormData, timeLimitMinutes: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Pass Score (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={testFormData.passingScorePercent}
                    onChange={(e) =>
                      setTestFormData({ ...testFormData, passingScorePercent: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="publishedCheckbox"
                  checked={testFormData.isPublished}
                  onChange={(e) =>
                    setTestFormData({ ...testFormData, isPublished: e.target.checked })
                  }
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="publishedCheckbox" className="text-sm font-medium text-slate-300">
                  Publish to Candidates catalog immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25"
                >
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: QUESTION CREATE / EDIT                             */}
      {/* ========================================================= */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full my-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingQuestion ? 'Edit SMART Question' : 'Add New SMART Question'}
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Question Prompt *
                </label>
                <textarea
                  value={questionFormData.prompt}
                  onChange={(e) =>
                    setQuestionFormData({ ...questionFormData, prompt: e.target.value })
                  }
                  rows={2}
                  placeholder="Enter the question scenario or prompt..."
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  SMART Dimension *
                </label>
                <select
                  value={questionFormData.category}
                  onChange={(e) =>
                    setQuestionFormData({ ...questionFormData, category: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="S">S - Specific (Precision & Scope)</option>
                  <option value="M">M - Measurable (Quantification & Milestones)</option>
                  <option value="A">A - Achievable (Realism & Capacity)</option>
                  <option value="R">R - Relevant (Strategic Alignment)</option>
                  <option value="T">T - Time-Bound (Deadlines & Cadence)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  4 Options (Select radio for the correct option) *
                </label>
                <div className="space-y-2">
                  {questionFormData.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700"
                    >
                      <input
                        type="radio"
                        name="correctOptionRadio"
                        checked={opt.isCorrect}
                        onChange={() => handleOptionCorrectChange(idx)}
                        className="text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                        title="Mark as correct answer"
                      />
                      <span className="w-5 font-bold text-xs text-slate-400">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                        required
                        className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  SMART Explanation / Rationale *
                </label>
                <textarea
                  value={questionFormData.explanation}
                  onChange={(e) =>
                    setQuestionFormData({ ...questionFormData, explanation: e.target.value })
                  }
                  rows={2}
                  placeholder="Explain why the selected option fulfills or violates the SMART principle..."
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
