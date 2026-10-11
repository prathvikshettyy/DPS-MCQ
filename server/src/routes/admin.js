const express = require('express');
const prisma = require('../prisma');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply requireAdmin to all admin routes
router.use(requireAdmin);

// ==========================================
// 1. TESTS MANAGEMENT (CRUD)
// ==========================================

// Get all tests (including drafts/unpublished) with metrics
router.get('/tests', async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      include: {
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = tests.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      timeLimitMinutes: t.timeLimitMinutes,
      passingScorePercent: t.passingScorePercent,
      isPublished: t.isPublished,
      totalQuestions: t._count.questions,
      totalAttempts: t._count.attempts,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    res.json({ tests: formatted });
  } catch (error) {
    console.error('Admin fetch tests error:', error);
    res.status(500).json({ error: 'Failed to fetch tests.' });
  }
});

// Create a new test
router.post('/tests', async (req, res) => {
  try {
    const { title, description, timeLimitMinutes, passingScorePercent, isPublished } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const test = await prisma.test.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        timeLimitMinutes: Number(timeLimitMinutes) || 15,
        passingScorePercent: Number(passingScorePercent) || 70,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      },
    });

    res.status(201).json({ test });
  } catch (error) {
    console.error('Admin create test error:', error);
    res.status(500).json({ error: 'Failed to create test.' });
  }
});

// Update an existing test
router.put('/tests/:id', async (req, res) => {
  try {
    const { title, description, timeLimitMinutes, passingScorePercent, isPublished } = req.body;

    const test = await prisma.test.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description && { description: description.trim() }),
        ...(timeLimitMinutes !== undefined && { timeLimitMinutes: Number(timeLimitMinutes) }),
        ...(passingScorePercent !== undefined && { passingScorePercent: Number(passingScorePercent) }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
      },
    });

    res.json({ test });
  } catch (error) {
    console.error('Admin update test error:', error);
    res.status(500).json({ error: 'Failed to update test.' });
  }
});

// Delete a test
router.delete('/tests/:id', async (req, res) => {
  try {
    await prisma.test.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Test and associated records deleted successfully.' });
  } catch (error) {
    console.error('Admin delete test error:', error);
    res.status(500).json({ error: 'Failed to delete test.' });
  }
});

// ==========================================
// 2. QUESTIONS MANAGEMENT (CRUD)
// ==========================================

// Get all questions for a specific test
router.get('/tests/:testId/questions', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      where: { testId: req.params.testId },
      include: {
        options: {
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ questions });
  } catch (error) {
    console.error('Admin fetch questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
});

// Create question for a test (with exactly 4 options, 1 correct)
router.post('/tests/:testId/questions', async (req, res) => {
  try {
    const { testId } = req.params;
    const { prompt, category, explanation, options } = req.body;

    if (!prompt || !category || !explanation || !Array.isArray(options)) {
      return res.status(400).json({
        error: 'Prompt, category (S/M/A/R/T), explanation, and 4 options are required.',
      });
    }

    const validCategories = ['S', 'M', 'A', 'R', 'T'];
    const normCategory = category.toUpperCase();
    if (!validCategories.includes(normCategory)) {
      return res.status(400).json({ error: 'Category must be one of: S, M, A, R, T' });
    }

    if (options.length !== 4) {
      return res.status(400).json({ error: 'Exactly 4 options must be provided.' });
    }

    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      return res.status(400).json({ error: 'Exactly one option must be marked as correct.' });
    }

    const question = await prisma.question.create({
      data: {
        testId,
        prompt: prompt.trim(),
        category: normCategory,
        explanation: explanation.trim(),
        options: {
          create: options.map((opt) => ({
            text: opt.text.trim(),
            isCorrect: Boolean(opt.isCorrect),
          })),
        },
      },
      include: {
        options: true,
      },
    });

    res.status(201).json({ question });
  } catch (error) {
    console.error('Admin create question error:', error);
    res.status(500).json({ error: 'Failed to create question.' });
  }
});

// Update a question and its options
router.put('/questions/:id', async (req, res) => {
  try {
    const { prompt, category, explanation, options } = req.body;
    const questionId = req.params.id;

    const validCategories = ['S', 'M', 'A', 'R', 'T'];
    const normCategory = category ? category.toUpperCase() : undefined;
    if (normCategory && !validCategories.includes(normCategory)) {
      return res.status(400).json({ error: 'Category must be one of: S, M, A, R, T' });
    }

    if (options) {
      if (options.length !== 4) {
        return res.status(400).json({ error: 'Exactly 4 options must be provided.' });
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        return res.status(400).json({ error: 'Exactly one option must be marked as correct.' });
      }
    }

    // Update transaction
    const updated = await prisma.$transaction(async (tx) => {
      const q = await tx.question.update({
        where: { id: questionId },
        data: {
          ...(prompt && { prompt: prompt.trim() }),
          ...(normCategory && { category: normCategory }),
          ...(explanation && { explanation: explanation.trim() }),
        },
      });

      if (options) {
        // Delete old options and recreate
        await tx.option.deleteMany({ where: { questionId } });
        await tx.option.createMany({
          data: options.map((opt) => ({
            questionId,
            text: opt.text.trim(),
            isCorrect: Boolean(opt.isCorrect),
          })),
        });
      }

      return tx.question.findUnique({
        where: { id: questionId },
        include: { options: true },
      });
    });

    res.json({ question: updated });
  } catch (error) {
    console.error('Admin update question error:', error);
    res.status(500).json({ error: 'Failed to update question.' });
  }
});

// Delete a question
router.delete('/questions/:id', async (req, res) => {
  try {
    await prisma.question.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Question deleted successfully.' });
  } catch (error) {
    console.error('Admin delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question.' });
  }
});

// ==========================================
// 3. USER ATTEMPTS (Search, Filter, Detail, Delete)
// ==========================================

// Get all attempts with search and filter
router.get('/attempts', async (req, res) => {
  try {
    const { search, testId, status, sortBy = 'newest' } = req.query;

    const where = {};

    if (testId && testId !== 'all') {
      where.testId = testId;
    }

    if (status === 'passed') {
      where.passed = true;
      where.completedAt = { not: null };
    } else if (status === 'failed') {
      where.passed = false;
      where.completedAt = { not: null };
    } else if (status === 'in_progress') {
      where.completedAt = null;
    }

    if (search) {
      const term = String(search).trim();
      where.OR = [
        { candidateName: { contains: term } },
        { candidateUsn: { contains: term } },
        { user: { name: { contains: term } } },
        { test: { title: { contains: term } } },
      ];
    }

    let orderBy = { startedAt: 'desc' };
    if (sortBy === 'highest') {
      orderBy = { score: 'desc' };
    } else if (sortBy === 'lowest') {
      orderBy = { score: 'asc' };
    } else if (sortBy === 'oldest') {
      orderBy = { startedAt: 'asc' };
    }

    const attempts = await prisma.attempt.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        test: { select: { id: true, title: true, passingScorePercent: true } },
      },
      orderBy,
    });

    const formatted = attempts.map((att) => {
      const percentage =
        att.completedAt && att.totalQuestions > 0
          ? Math.round(((att.score || 0) / att.totalQuestions) * 100)
          : null;

      const durationSeconds = att.completedAt
        ? Math.round((new Date(att.completedAt).getTime() - new Date(att.startedAt).getTime()) / 1000)
        : null;

      return {
        id: att.id,
        candidateName: att.candidateName || att.user?.name || 'Student',
        candidateUsn: att.candidateUsn || 'N/A',
        candidateEmail: att.user?.email || '—',
        testId: att.test.id,
        testTitle: att.test.title,
        score: att.score,
        totalQuestions: att.totalQuestions,
        percentage,
        passed: att.passed,
        durationSeconds,
        startedAt: att.startedAt,
        completedAt: att.completedAt,
        status: att.completedAt ? (att.passed ? 'PASSED' : 'FAILED') : 'IN_PROGRESS',
      };
    });

    res.json({ attempts: formatted });
  } catch (error) {
    console.error('Admin fetch attempts error:', error);
    res.status(500).json({ error: 'Failed to retrieve attempts.' });
  }
});

// Single attempt detail with each question, candidate answer, correct answer, and explanation
router.get('/attempts/:id', async (req, res) => {
  try {
    const attempt = await prisma.attempt.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        test: true,
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
            selectedOption: true,
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt record not found.' });
    }

    const durationSeconds = attempt.completedAt
      ? Math.round((new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000)
      : null;

    const percentage =
      attempt.completedAt && attempt.totalQuestions > 0
        ? Math.round(((attempt.score || 0) / attempt.totalQuestions) * 100)
        : null;

    const categoryStats = {
      S: { total: 0, correct: 0, name: 'Specific' },
      M: { total: 0, correct: 0, name: 'Measurable' },
      A: { total: 0, correct: 0, name: 'Achievable' },
      R: { total: 0, correct: 0, name: 'Relevant' },
      T: { total: 0, correct: 0, name: 'Time-Bound' },
    };

    const questionDetails = attempt.answers.map((ans) => {
      const q = ans.question;
      const catKey = q.category.toUpperCase();
      if (categoryStats[catKey]) {
        categoryStats[catKey].total += 1;
        if (ans.isCorrect) categoryStats[catKey].correct += 1;
      }

      const correctOption = q.options.find((o) => o.isCorrect);

      return {
        questionId: q.id,
        category: q.category,
        prompt: q.prompt,
        explanation: q.explanation,
        selectedOptionId: ans.selectedOptionId,
        selectedOptionText: ans.selectedOption?.text || 'Not answered',
        correctOptionId: correctOption?.id,
        correctOptionText: correctOption?.text || '',
        isCorrect: ans.isCorrect,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      };
    });

    const categoryBreakdown = {};
    for (const [key, val] of Object.entries(categoryStats)) {
      categoryBreakdown[key] = {
        name: val.name,
        total: val.total,
        correct: val.correct,
        percent: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
      };
    }

    res.json({
      attempt: {
        id: attempt.id,
        candidateName: attempt.candidateName || attempt.user?.name || 'Student',
        candidateUsn: attempt.candidateUsn || 'N/A',
        candidate: {
          name: attempt.candidateName || attempt.user?.name || 'Student',
          usn: attempt.candidateUsn || 'N/A',
          email: attempt.user?.email || '—',
        },
        testTitle: attempt.test.title,
        testPassingScore: attempt.test.passingScorePercent,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        percentage,
        passed: attempt.passed,
        durationSeconds,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        categoryBreakdown,
        answers: questionDetails,
      },
    });
  } catch (error) {
    console.error('Admin fetch attempt detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve attempt details.' });
  }
});

// Delete attempt record
router.delete('/attempts/:id', async (req, res) => {
  try {
    await prisma.attempt.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Attempt record deleted successfully.' });
  } catch (error) {
    console.error('Admin delete attempt error:', error);
    res.status(500).json({ error: 'Failed to delete attempt.' });
  }
});

// ==========================================
// 4. CSV EXPORT
// ==========================================
router.get('/attempts/export/csv', async (req, res) => {
  try {
    const attempts = await prisma.attempt.findMany({
      include: {
        user: { select: { name: true, email: true } },
        test: { select: { title: true, passingScorePercent: true } },
      },
      orderBy: { startedAt: 'desc' },
    });

    const headers = [
      'Attempt ID',
      'USN',
      'Student Name',
      'Candidate Email',
      'Test Title',
      'Score',
      'Total Questions',
      'Accuracy (%)',
      'Status',
      'Duration (seconds)',
      'Started At',
      'Completed At',
    ];

    const rows = attempts.map((att) => {
      const percentage =
        att.completedAt && att.totalQuestions > 0
          ? Math.round(((att.score || 0) / att.totalQuestions) * 100)
          : '';
      const durationSeconds = att.completedAt
        ? Math.round((new Date(att.completedAt).getTime() - new Date(att.startedAt).getTime()) / 1000)
        : '';
      const status = att.completedAt ? (att.passed ? 'PASSED' : 'FAILED') : 'IN_PROGRESS';

      const usn = att.candidateUsn || 'N/A';
      const name = att.candidateName || att.user?.name || 'Student';
      const email = att.user?.email || '—';

      return [
        att.id,
        `"${usn.replace(/"/g, '""')}"`,
        `"${name.replace(/"/g, '""')}"`,
        `"${email.replace(/"/g, '""')}"`,
        `"${att.test.title.replace(/"/g, '""')}"`,
        att.score !== null ? att.score : '',
        att.totalQuestions,
        percentage,
        status,
        durationSeconds,
        att.startedAt ? new Date(att.startedAt).toISOString() : '',
        att.completedAt ? new Date(att.completedAt).toISOString() : '',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="smart_goals_test_results.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to export CSV.' });
  }
});

// ==========================================
// 5. ANALYTICS DASHBOARD
// ==========================================
router.get('/analytics', async (req, res) => {
  try {
    const completedAttempts = await prisma.attempt.findMany({
      where: { completedAt: { not: null } },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    const totalCompleted = completedAttempts.length;
    const passedCount = completedAttempts.filter((a) => a.passed).length;
    const passRate = totalCompleted > 0 ? Math.round((passedCount / totalCompleted) * 100) : 0;

    let totalScoreSum = 0;
    let totalQuestionsSum = 0;

    completedAttempts.forEach((a) => {
      totalScoreSum += a.score || 0;
      totalQuestionsSum += a.totalQuestions || 0;
    });

    const averageScorePercent =
      totalQuestionsSum > 0 ? Math.round((totalScoreSum / totalQuestionsSum) * 100) : 0;

    // Category accuracy stats
    const categoryTotals = {
      S: { total: 0, correct: 0, name: 'Specific' },
      M: { total: 0, correct: 0, name: 'Measurable' },
      A: { total: 0, correct: 0, name: 'Achievable' },
      R: { total: 0, correct: 0, name: 'Relevant' },
      T: { total: 0, correct: 0, name: 'Time-Bound' },
    };

    // Question hardness tracking
    const questionPerformance = new Map(); // questionId -> { prompt, category, totalAnswered, correctCount }

    completedAttempts.forEach((attempt) => {
      attempt.answers.forEach((ans) => {
        const q = ans.question;
        const cat = q.category.toUpperCase();
        if (categoryTotals[cat]) {
          categoryTotals[cat].total += 1;
          if (ans.isCorrect) categoryTotals[cat].correct += 1;
        }

        if (!questionPerformance.has(q.id)) {
          questionPerformance.set(q.id, {
            id: q.id,
            prompt: q.prompt,
            category: q.category,
            totalAnswered: 0,
            correctCount: 0,
          });
        }
        const qStat = questionPerformance.get(q.id);
        qStat.totalAnswered += 1;
        if (ans.isCorrect) qStat.correctCount += 1;
      });
    });

    const scoreByCategory = Object.entries(categoryTotals).map(([key, val]) => ({
      categoryKey: key,
      categoryName: val.name,
      totalAnswered: val.total,
      correctCount: val.correct,
      accuracyPercent: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
    }));

    // Hardest questions: sorted by accuracy ascending (lowest accuracy first)
    const hardestQuestions = Array.from(questionPerformance.values())
      .filter((q) => q.totalAnswered > 0)
      .map((q) => ({
        id: q.id,
        prompt: q.prompt,
        category: q.category,
        totalAnswered: q.totalAnswered,
        correctRatePercent: Math.round((q.correctCount / q.totalAnswered) * 100),
      }))
      .sort((a, b) => a.correctRatePercent - b.correctRatePercent)
      .slice(0, 5);

    // Distribution: buckets [0-40, 41-60, 61-80, 81-100]
    const distribution = [
      { range: '0-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-79%', count: 0 },
      { range: '80-100%', count: 0 },
    ];

    completedAttempts.forEach((att) => {
      const pct = att.totalQuestions > 0 ? (att.score / att.totalQuestions) * 100 : 0;
      if (pct <= 40) distribution[0].count += 1;
      else if (pct <= 60) distribution[1].count += 1;
      else if (pct < 80) distribution[2].count += 1;
      else distribution[3].count += 1;
    });

    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const totalTests = await prisma.test.count();

    res.json({
      summary: {
        totalCompletedAttempts: totalCompleted,
        totalUsers,
        totalTests,
        passRatePercent: passRate,
        averageScorePercent,
      },
      scoreByCategory,
      hardestQuestions,
      scoreDistribution: distribution,
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: 'Failed to compile analytics.' });
  }
});

module.exports = router;
