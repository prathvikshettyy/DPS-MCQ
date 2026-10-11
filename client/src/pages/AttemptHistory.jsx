import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, Award, CheckCircle2, XCircle, Clock, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';

export default function AttemptHistory() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/attempts/history');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch history');
      setAttempts(data.attempts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
          <History className="w-3.5 h-3.5" /> Candidate Records
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Your Assessment History</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review previous attempts, scores, and track your progress across tests
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No Assessment Attempts Yet</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            You haven't completed any SMART goals certification exams yet.
          </p>
          <Link
            to="/"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
          >
            Browse Available Tests
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Assessment Title</th>
                  <th className="py-4 px-6">Score</th>
                  <th className="py-4 px-6">Accuracy</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Duration</th>
                  <th className="py-4 px-6">Date Completed</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-normal">
                {attempts.map((att) => {
                  const durationMin = Math.floor((att.durationSeconds || 0) / 60);
                  const durationSec = (att.durationSeconds || 0) % 60;
                  const dateStr = new Date(att.completedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-semibold text-white">
                        {att.testTitle}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-100">{att.score}</span>
                        <span className="text-xs text-slate-500"> / {att.totalQuestions}</span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-200">
                        {att.percentage}%
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            att.passed
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {att.passed ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> Failed
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {durationMin}m {durationSec}s
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {dateStr}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/result/${att.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 py-1 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                        >
                          Review Answers
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
