import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  AlertCircle,
  History,
  Target,
  Sparkles,
  User,
  Hash,
} from 'lucide-react';

export default function TestResult() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [result, setResult] = useState(location.state?.resultData || null);
  const [loading, setLoading] = useState(!location.state?.resultData);
  const [error, setError] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    if (!result && attemptId) {
      fetchAttemptResult();
    }
  }, [attemptId]);

  const fetchAttemptResult = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/attempts/${attemptId}/review`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve assessment results.');
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
        <p className="text-slate-400 text-xs sm:text-sm font-medium">Calculating score & diagnostic breakdown...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto my-10 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-1.5">Result Unavailable</h2>
        <p className="text-slate-400 text-xs mb-4">{error || 'Could not find attempt details.'}</p>
        <Link
          to="/"
          className="inline-flex px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
        >
          Back to Tests
        </Link>
      </div>
    );
  }

  const durationSec = result.durationSeconds || result.timeTakenSeconds || 0;
  const durationMin = Math.floor(durationSec / 60);
  const remainingSec = durationSec % 60;

  const categoryNames = {
    S: 'Specific',
    M: 'Measurable',
    A: 'Achievable',
    R: 'Relevant',
    T: 'Time-Bound',
  };

  const filteredReview = (result.review || []).filter((item) => {
    if (filterCategory === 'ALL') return true;
    return item.category === filterCategory;
  });

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-10">

      {/* Hero Result Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-10 mb-6 sm:mb-8 shadow-2xl relative overflow-hidden backdrop-blur-xl text-center">

        {/* Subtle Glow */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none ${result.passed ? 'bg-emerald-500/10' : 'bg-rose-500/10'
            }`}
        />

        <div className="relative z-10 max-w-xl mx-auto">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3.5 border shadow-inner">
            {result.passed ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Assessment Passed
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400">
                <XCircle className="w-3.5 h-3.5" /> Needs Improvement
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
            {result.passed ? 'Test Completed Successfully!' : 'Assessment Completed'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mb-3.5">
            {result.testTitle || 'SMART Goals Certification Exam'}
          </p>

          {/* Student Name & USN Banner */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 mb-5 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3 text-indigo-400" /> Student:
            </span>
            <span className="font-bold text-white">
              {result.candidateName || location.state?.candidateName || 'Candidate'}
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Hash className="w-3 h-3 text-indigo-400" /> USN:
            </span>
            <span className="font-mono font-bold text-indigo-400">
              {result.candidateUsn || location.state?.candidateUsn || 'N/A'}
            </span>
          </div>

          {/* Score Display Card */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 grid grid-cols-3 gap-2 sm:gap-6 mb-6">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">
                Score
              </div>
              <div className="text-2xl sm:text-4xl font-black text-white flex items-baseline justify-center gap-0.5">
                <span className={result.passed ? 'text-emerald-400' : 'text-amber-400'}>
                  {result.score}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 font-semibold">/{result.totalQuestions}</span>
              </div>
            </div>

            <div className="border-x border-slate-700/60 px-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">
                Accuracy
              </div>
              <div className="text-2xl sm:text-4xl font-black text-white">
                {result.percentage}%
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">
                Duration
              </div>
              <div className="text-sm sm:text-xl font-bold text-slate-200 flex items-center justify-center gap-1 mt-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{durationMin}m {remainingSec}s</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <Link
              to="/"
              className="py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retake Test
            </Link>

            <Link
              to="/admin"
              className="py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Award className="w-3.5 h-3.5" />
              Admin Portal
            </Link>
          </div>
        </div>
      </div>

      {/* SMART Category Competency Matrix */}
      {result.categoryBreakdown && (
        <div className="mb-6 sm:mb-8">
          <div className="mb-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Pillar Competency Breakdown
            </h2>
            <p className="text-[11px] text-slate-400">
              Performance breakdown across the 5 dimensions of SMART
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {Object.entries(result.categoryBreakdown).map(([letter, data]) => {
              const pct = data.percent;
              const isStrong = pct >= 70;

              return (
                <div
                  key={letter}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                        {letter}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isStrong ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}
                      >
                        {pct}%
                      </span>
                    </div>

                    <div className="font-bold text-xs text-white truncate">{data.name}</div>
                    <div className="text-[10px] text-slate-400 mb-2.5">
                      {data.correct}/{data.total} correct
                    </div>
                  </div>

                  <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isStrong ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Question Review */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Full Answer Review</h2>
            <p className="text-[11px] text-slate-400">Review selected options with SMART explanations</p>
          </div>

          {/* Category Filter Pills (Mobile Horizontal Scroll) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scroll-touch">
            {['ALL', 'S', 'M', 'A', 'R', 'T'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${filterCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
              >
                {cat === 'ALL' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-4">
          {filteredReview.map((item, idx) => {
            const isCorrect = item.isCorrect;

            return (
              <div
                key={item.questionId || idx}
                className={`p-3.5 sm:p-5 rounded-xl border ${isCorrect
                    ? 'bg-slate-800/20 border-slate-800'
                    : 'bg-rose-500/5 border-rose-500/20'
                  }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 font-bold text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {categoryNames[item.category] || item.category}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isCorrect
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                      }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Incorrect
                      </>
                    )}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-semibold text-white mb-3 leading-snug">
                  {item.prompt}
                </h3>

                {/* Options display */}
                <div className="space-y-1.5 mb-3">
                  {item.options.map((opt) => {
                    const isSelected = opt.id === item.selectedOptionId;
                    const isTheCorrectOne = opt.id === item.correctOptionId || opt.isCorrect;

                    let optBorder = 'border-slate-800 bg-slate-800/30 text-slate-400';
                    if (isTheCorrectOne) {
                      optBorder = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200 font-medium';
                    } else if (isSelected && !isTheCorrectOne) {
                      optBorder = 'border-rose-500/60 bg-rose-500/10 text-rose-300 line-through';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 ${optBorder}`}
                      >
                        <div className="flex items-start gap-2">
                          {isTheCorrectOne ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          ) : isSelected ? (
                            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0 mt-0.5" />
                          )}
                          <span className="leading-snug">{opt.text}</span>
                        </div>

                        <div className="shrink-0 text-[10px] font-bold">
                          {isTheCorrectOne && <span className="text-emerald-400">Correct</span>}
                          {isSelected && !isTheCorrectOne && <span className="text-rose-400">Chosen</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {item.explanation && (
                  <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-200 leading-relaxed">
                    <strong className="text-indigo-400 block mb-0.5">SMART Rationale:</strong>
                    {item.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
