import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  User,
  Hash,
} from 'lucide-react';

export default function TakeTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student details
  const [studentName, setStudentName] = useState(
    () => location.state?.candidateName || localStorage.getItem('smart_student_name') || ''
  );
  const [studentUsn, setStudentUsn] = useState(
    () => location.state?.candidateUsn || localStorage.getItem('smart_student_usn') || ''
  );

  const [attemptId, setAttemptId] = useState(null);
  const [testInfo, setTestInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User selections: Map of questionId -> selectedOptionId
  const [selectedAnswers, setSelectedAnswers] = useState({});

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    if (!studentName || !studentUsn) {
      const promptName = prompt('Enter your Full Name:', studentName || 'Candidate');
      const promptUsn = prompt('Enter your USN (University Seat Number):', studentUsn || 'USN001');

      if (!promptName || !promptUsn) {
        navigate('/');
        return;
      }

      setStudentName(promptName);
      setStudentUsn(promptUsn.toUpperCase());
      localStorage.setItem('smart_student_name', promptName);
      localStorage.setItem('smart_student_usn', promptUsn.toUpperCase());
      startOrResumeAttempt(promptName, promptUsn.toUpperCase());
    } else {
      startOrResumeAttempt(studentName, studentUsn);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testId]);

  const startOrResumeAttempt = async (nameToUse, usnToUse) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          candidateName: nameToUse,
          candidateUsn: usnToUse,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize test attempt.');
      }

      setAttemptId(data.attemptId);
      setTestInfo(data.test);
      setQuestions(data.questions);

      if (data.candidateName) setStudentName(data.candidateName);
      if (data.candidateUsn) setStudentUsn(data.candidateUsn);

      const startedAtMs = new Date(data.startedAt).getTime();
      const nowMs = Date.now();
      const elapsedSeconds = Math.floor((nowMs - startedAtMs) / 1000);
      const totalAllowedSeconds = data.test.timeLimitMinutes * 60;
      const remaining = Math.max(0, totalAllowedSeconds - elapsedSeconds);

      setSecondsRemaining(remaining);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmitOnTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmitOnTimeout = () => {
    alert('Time limit reached! Your assessment will now be automatically submitted.');
    submitTestAnswers();
  };

  const handleSelectOption = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const submitTestAnswers = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const answersPayload = Object.entries(selectedAnswers).map(([qId, optId]) => ({
        questionId: qId,
        selectedOptionId: optId,
      }));

      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersPayload }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit test.');
      }

      // Cache submission locally so it permanently persists across all browser refreshes
      try {
        const raw = localStorage.getItem('smart_admin_cached_attempts');
        const list = raw ? JSON.parse(raw) : [];
        const newSubmission = {
          id: attemptId,
          candidateName: studentName,
          candidateUsn: studentUsn,
          candidateEmail: '—',
          testId: testId,
          testTitle: test?.title || 'SMART Goals Quiz — 25 MCQs',
          score: data.score,
          totalQuestions: data.totalQuestions,
          percentage: data.percentage,
          passed: data.passed,
          durationSeconds: data.timeTakenSeconds || 0,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          status: data.passed ? 'PASSED' : 'FAILED',
        };
        const exists = list.some((item) => item.id === attemptId);
        if (!exists) {
          list.unshift(newSubmission);
          localStorage.setItem('smart_admin_cached_attempts', JSON.stringify(list));
        }
      } catch (_) {}

      navigate(`/result/${attemptId}`, {
        state: {
          resultData: data,
          candidateName: studentName,
          candidateUsn: studentUsn,
        },
      });
    } catch (err) {
      alert(`Submission error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
        <p className="text-slate-400 text-xs sm:text-sm font-medium text-center">Loading assessment environment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-10 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-1.5">Unable to Start Test</h2>
        <p className="text-slate-400 text-xs mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
        >
          Return to Start
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isUrgent = secondsRemaining < 120;

  const categoryNames = {
    S: 'Specific',
    M: 'Measurable',
    A: 'Achievable',
    R: 'Relevant',
    T: 'Time-Bound',
  };

  const categoryColors = {
    S: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    M: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    A: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    R: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    T: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      
      {/* Top Bar: Mobile Compact */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-5 mb-4 shadow-xl backdrop-blur-md">
        
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Candidate identity tags */}
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1 text-slate-200 text-xs font-bold bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 truncate max-w-[140px] sm:max-w-xs">
              <User className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="truncate">{studentName}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-indigo-300 text-xs font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 shrink-0">
              <Hash className="w-3 h-3 text-indigo-400" />
              {studentUsn}
            </span>
          </div>

          {/* Timer Card: compact on mobile */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border shrink-0 ${
              isUrgent
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                : 'bg-slate-800/80 border-slate-700/80 text-indigo-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs sm:text-sm font-black font-mono tracking-wider">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Progress details */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>
              Question <strong className="text-white">{currentIndex + 1}</strong> of {totalQuestions}
            </span>
            <span>
              <strong className="text-indigo-400">{answeredCount}</strong> answered
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Question Display */}
      {currentQuestion && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-7 mb-4 shadow-xl">
          
          <div className="flex items-center justify-between gap-2 mb-4">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                categoryColors[currentQuestion.category] || 'bg-indigo-500/10 text-indigo-400'
              }`}
            >
              Dimension: {categoryNames[currentQuestion.category] || currentQuestion.category} ({currentQuestion.category})
            </span>
            <span className="text-xs font-semibold text-slate-400">
              #{currentIndex + 1}
            </span>
          </div>

          <h2 className="text-base sm:text-xl font-bold text-white leading-relaxed mb-5">
            {currentQuestion.prompt}
          </h2>

          {/* Options Grid */}
          <div className="space-y-2.5">
            {currentQuestion.options.map((option, idx) => {
              const optionLetter = String.fromCharCode(65 + idx);
              const isSelected = selectedAnswers[currentQuestion.id] === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                  className={`w-full p-3 sm:p-4 rounded-xl text-left border transition-all flex items-start gap-3 active:scale-[0.99] ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 text-slate-300'
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {optionLetter}
                  </div>
                  <div className="pt-1 text-xs sm:text-sm leading-relaxed">
                    {option.text}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Question Jump Palette (Mobile Horizontal Scroll) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-4 shadow-xl">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 text-center sm:text-left">
          Questions Navigator ({answeredCount}/{totalQuestions})
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scroll-touch justify-start sm:justify-center flex-nowrap sm:flex-wrap">
          {questions.map((q, idx) => {
            const isAnswered = Boolean(selectedAnswers[q.id]);
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50'
                    : isAnswered
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Controls: Large Touch-friendly Previous / Next / Submit */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="w-1/3 py-3 px-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center gap-1 active:scale-[0.98]"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
            className="w-2/3 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            Next Question
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-2/3 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            Submit Assessment
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mobile-Friendly Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3.5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 max-w-sm w-full shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white text-center mb-1.5">
              Submit Assessment?
            </h3>

            <p className="text-xs text-slate-400 text-center mb-4 leading-relaxed">
              Student: <strong className="text-white">{studentName}</strong> ({studentUsn})<br/>
              Answered: <strong className="text-indigo-400">{answeredCount}</strong> of <strong>{totalQuestions}</strong>.
              {totalQuestions - answeredCount > 0 && (
                <span className="block text-amber-400 font-semibold mt-1">
                  {totalQuestions - answeredCount} unanswered questions will be marked incorrect.
                </span>
              )}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
              >
                Review More
              </button>
              <button
                onClick={submitTestAnswers}
                disabled={isSubmitting}
                className="w-1/2 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1"
              >
                {isSubmitting ? 'Scoring...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
