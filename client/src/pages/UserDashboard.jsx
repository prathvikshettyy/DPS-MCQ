import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Clock, Award, CheckCircle2, Sparkles, ArrowRight, User, Hash } from 'lucide-react';

export default function UserDashboard() {
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student details
  const [studentName, setStudentName] = useState(() => localStorage.getItem('smart_student_name') || '');
  const [studentUsn, setStudentUsn] = useState(() => localStorage.getItem('smart_student_usn') || '');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tests');
      if (!res.ok) throw new Error('Failed to load tests');
      const data = await res.json();
      const list = data.tests || [];
      setTests(list);
      if (list.length > 0) {
        setSelectedTestId(list[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = (e) => {
    e.preventDefault();
    setValidationError('');

    const trimmedName = studentName.trim();
    const trimmedUsn = studentUsn.trim().toUpperCase();

    if (!trimmedName) {
      setValidationError('Please enter your Full Name.');
      return;
    }
    if (!trimmedUsn) {
      setValidationError('Please enter your University Seat Number (USN).');
      return;
    }
    if (!selectedTestId) {
      setValidationError('Please select an assessment.');
      return;
    }

    localStorage.setItem('smart_student_name', trimmedName);
    localStorage.setItem('smart_student_usn', trimmedUsn);

    navigate(`/test/${selectedTestId}`, {
      state: {
        candidateName: trimmedName,
        candidateUsn: trimmedUsn,
      },
    });
  };

  const selectedTest = tests.find((t) => t.id === selectedTestId) || tests[0];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10">
      
      {/* Hero Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/20 p-5 sm:p-8 mb-6 sm:mb-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold mb-2.5">
            <Sparkles className="w-3 h-3" />
            Standardized Assessment
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            SMART Goals MCQ Test
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
            Enter your <strong>Full Name</strong> and <strong>USN</strong> to start. Results are scored on the server and synced to the Admin Portal.
          </p>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {[
              { l: 'S', title: 'Specific' },
              { l: 'M', title: 'Measurable' },
              { l: 'A', title: 'Achievable' },
              { l: 'R', title: 'Relevant' },
              { l: 'T', title: 'Time-Bound' },
            ].map((p) => (
              <div key={p.l} className="p-1.5 sm:p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                <span className="font-extrabold text-xs sm:text-sm text-indigo-400 block">{p.l}</span>
                <span className="text-[9px] sm:text-[11px] font-medium text-slate-300 truncate block">{p.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Student Entry & Test Launch Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-5 pb-4 border-b border-slate-800">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400 shrink-0" />
            Candidate Credentials
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Provide your details before launching the assessment
          </p>
        </div>

        {validationError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {validationError}
          </div>
        )}

        <form onSubmit={handleStartAssessment} className="space-y-4 sm:space-y-5">
          <div className="space-y-3.5 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-500 outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                University Seat Number (USN) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. 1MS21CS042"
                  value={studentUsn}
                  onChange={(e) => setStudentUsn(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-500 outline-none font-mono uppercase font-medium"
                />
              </div>
            </div>
          </div>

          {/* Test Info Pill */}
          {selectedTest && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">{selectedTest.title}</h3>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  Active
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-300">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{selectedTest.timeLimitMinutes} Mins</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedTest.totalQuestions} Questions</span>
                </div>
                <span className="text-slate-500">&bull; Pass: {selectedTest.passingScorePercent}%</span>
              </div>
            </div>
          )}

          {/* Big Touch-Friendly Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            Start Assessment
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
