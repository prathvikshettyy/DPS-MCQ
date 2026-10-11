const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

// 1. Start a new test attempt with Name and USN
router.post('/start', async (req, res) => {
  try {
    const { testId, candidateName, candidateUsn } = req.body;
    if (!testId) {
      return res.status(400).json({ error: 'testId is required.' });
    }

    const name = (candidateName || req.user?.name || '').trim();
    const usn = (candidateUsn || '').trim().toUpperCase();

    if (!name || !usn) {
      return res.status(400).json({ error: 'Candidate Full Name and USN are required to begin the assessment.' });
    }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            options: {
              select: { id: true, text: true }, // NEVER expose isCorrect to client!
            },
          },
        },
      },
    });

    if (!test || (!test.isPublished && req.user?.role !== 'ADMIN')) {
      return res.status(404).json({ error: 'Test not found or not published.' });
    }

    if (!test.questions || test.questions.length === 0) {
      return res.status(400).json({ error: 'This test does not have any questions yet.' });
    }

    // Check if there is an active uncompleted attempt for this student and test
    const activeAttempt = await prisma.attempt.findFirst({
      where: {
        testId: test.id,
        candidateUsn: usn,
        completedAt: null,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (activeAttempt) {
      const now = new Date();
      const elapsedMinutes = (now.getTime() - new Date(activeAttempt.startedAt).getTime()) / (1000 * 60);
      const gracePeriodMinutes = 2;

      if (elapsedMinutes < test.timeLimitMinutes + gracePeriodMinutes) {
        // Sanitize questions (strip explanation and isCorrect)
        const sanitizedQuestions = test.questions.map((q) => ({
          id: q.id,
          category: q.category,
          prompt: q.prompt,
          options: q.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
          })),
        }));

        return res.json({
          attemptId: activeAttempt.id,
          candidateName: activeAttempt.candidateName,
          candidateUsn: activeAttempt.candidateUsn,
          isResumed: true,
          startedAt: activeAttempt.startedAt,
          test: {
            id: test.id,
            title: test.title,
            description: test.description,
            timeLimitMinutes: test.timeLimitMinutes,
            passingScorePercent: test.passingScorePercent,
            totalQuestions: test.questions.length,
          },
          questions: sanitizedQuestions,
        });
      } else {
        // Timed out attempt: auto-finalize
        await prisma.attempt.update({
          where: { id: activeAttempt.id },
          data: {
            completedAt: new Date(new Date(activeAttempt.startedAt).getTime() + test.timeLimitMinutes * 60000),
            score: 0,
            passed: false,
          },
        });
      }
    }

    // Create a new Attempt record
    const newAttempt = await prisma.attempt.create({
      data: {
        testId: test.id,
        candidateName: name,
        candidateUsn: usn,
        userId: req.user?.id || null,
        totalQuestions: test.questions.length,
        startedAt: new Date(),
        completedAt: null,
      },
    });

    // Sanitize questions: NEVER send isCorrect or explanation before submission!
    const sanitizedQuestions = test.questions.map((q) => ({
      id: q.id,
      category: q.category,
      prompt: q.prompt,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
      })),
    }));

    res.status(201).json({
      attemptId: newAttempt.id,
      candidateName: newAttempt.candidateName,
      candidateUsn: newAttempt.candidateUsn,
      isResumed: false,
      startedAt: newAttempt.startedAt,
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        timeLimitMinutes: test.timeLimitMinutes,
        passingScorePercent: test.passingScorePercent,
        totalQuestions: test.questions.length,
      },
      questions: sanitizedQuestions,
    });
  } catch (error) {
    console.error('Start attempt error:', error);
    res.status(500).json({ error: 'Failed to initiate test attempt.' });
  }
});

// 2. Submit test attempt (Strict server-side scoring & one-time submission guarantee)
router.post('/:id/submit', async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { answers } = req.body;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found.' });
    }

    // STRICT RULE: No resubmission allowed!
    if (attempt.completedAt !== null) {
      return res.status(400).json({
        error: 'This test attempt has already been submitted and scored. Resubmission is not permitted.',
      });
    }

    const submissionTime = new Date();
    const answerMap = new Map();
    if (Array.isArray(answers)) {
      answers.forEach((ans) => {
        if (ans.questionId) {
          answerMap.set(ans.questionId, ans.selectedOptionId || null);
        }
      });
    }

    let calculatedScore = 0;
    const categoryStats = {
      S: { total: 0, correct: 0, name: 'Specific' },
      M: { total: 0, correct: 0, name: 'Measurable' },
      A: { total: 0, correct: 0, name: 'Achievable' },
      R: { total: 0, correct: 0, name: 'Relevant' },
      T: { total: 0, correct: 0, name: 'Time-Bound' },
    };

    const reviewItems = [];
    const answerRecordsToCreate = [];

    // Evaluate each question strictly on server
    for (const q of attempt.test.questions) {
      const selectedOptionId = answerMap.get(q.id) || null;
      const correctOption = q.options.find((opt) => opt.isCorrect);
      const isCorrect = selectedOptionId ? correctOption?.id === selectedOptionId : false;

      if (isCorrect) {
        calculatedScore += 1;
      }

      const catKey = q.category.toUpperCase();
      if (categoryStats[catKey]) {
        categoryStats[catKey].total += 1;
        if (isCorrect) categoryStats[catKey].correct += 1;
      }

      answerRecordsToCreate.push({
        attemptId: attempt.id,
        questionId: q.id,
        selectedOptionId: selectedOptionId,
        isCorrect: isCorrect,
      });

      reviewItems.push({
        questionId: q.id,
        category: q.category,
        prompt: q.prompt,
        explanation: q.explanation,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
        selectedOptionId,
        correctOptionId: correctOption?.id || null,
        isCorrect,
      });
    }

    const totalQuestions = attempt.test.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((calculatedScore / totalQuestions) * 100) : 0;
    const passed = percentage >= attempt.test.passingScorePercent;

    // Persist evaluation atomically
    await prisma.$transaction([
      prisma.answer.createMany({
        data: answerRecordsToCreate,
      }),
      prisma.attempt.update({
        where: { id: attempt.id },
        data: {
          completedAt: submissionTime,
          score: calculatedScore,
          passed: passed,
        },
      }),
    ]);

    const timeTakenSeconds = Math.max(
      0,
      Math.round((submissionTime.getTime() - new Date(attempt.startedAt).getTime()) / 1000)
    );

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
      attemptId: attempt.id,
      candidateName: attempt.candidateName,
      candidateUsn: attempt.candidateUsn,
      testTitle: attempt.test.title,
      score: calculatedScore,
      totalQuestions,
      percentage,
      passed,
      passingScorePercent: attempt.test.passingScorePercent,
      timeTakenSeconds,
      completedAt: submissionTime,
      categoryBreakdown,
      review: reviewItems,
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(500).json({ error: 'Failed to evaluate and record test submission.' });
  }
});

// 3. User attempt history
router.get('/history', async (req, res) => {
  try {
    const { usn } = req.query;

    const where = { completedAt: { not: null } };
    if (usn) {
      where.candidateUsn = String(usn).trim().toUpperCase();
    } else if (req.user?.id) {
      where.userId = req.user.id;
    } else {
      return res.json({ attempts: [] });
    }

    const attempts = await prisma.attempt.findMany({
      where,
      include: {
        test: {
          select: {
            id: true,
            title: true,
            timeLimitMinutes: true,
            passingScorePercent: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    const formatted = attempts.map((att) => {
      const percentage = att.totalQuestions > 0 ? Math.round((att.score / att.totalQuestions) * 100) : 0;
      const durationSeconds = Math.round(
        (new Date(att.completedAt).getTime() - new Date(att.startedAt).getTime()) / 1000
      );
      return {
        id: att.id,
        candidateName: att.candidateName,
        candidateUsn: att.candidateUsn,
        testId: att.testId,
        testTitle: att.test.title,
        score: att.score,
        totalQuestions: att.totalQuestions,
        percentage,
        passed: att.passed,
        durationSeconds,
        completedAt: att.completedAt,
      };
    });

    res.json({ attempts: formatted });
  } catch (error) {
    console.error('Fetch attempt history error:', error);
    res.status(500).json({ error: 'Failed to fetch attempt history.' });
  }
});

// 4. View single attempt review
router.get('/:id/review', async (req, res) => {
  try {
    const attempt = await prisma.attempt.findUnique({
      where: { id: req.params.id },
      include: {
        test: true,
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found.' });
    }

    if (!attempt.completedAt) {
      return res.status(400).json({ error: 'This attempt is still in progress and cannot be reviewed yet.' });
    }

    const durationSeconds = Math.round(
      (new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000
    );
    const percentage = attempt.totalQuestions > 0 ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;

    const categoryStats = {
      S: { total: 0, correct: 0, name: 'Specific' },
      M: { total: 0, correct: 0, name: 'Measurable' },
      A: { total: 0, correct: 0, name: 'Achievable' },
      R: { total: 0, correct: 0, name: 'Relevant' },
      T: { total: 0, correct: 0, name: 'Time-Bound' },
    };

    const reviewItems = attempt.answers.map((ans) => {
      const q = ans.question;
      const catKey = q.category.toUpperCase();
      if (categoryStats[catKey]) {
        categoryStats[catKey].total += 1;
        if (ans.isCorrect) categoryStats[catKey].correct += 1;
      }

      const correctOpt = q.options.find((o) => o.isCorrect);

      return {
        questionId: q.id,
        category: q.category,
        prompt: q.prompt,
        explanation: q.explanation,
        selectedOptionId: ans.selectedOptionId,
        correctOptionId: correctOpt?.id,
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
      attemptId: attempt.id,
      candidateName: attempt.candidateName,
      candidateUsn: attempt.candidateUsn,
      testTitle: attempt.test.title,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      percentage,
      passed: attempt.passed,
      passingScorePercent: attempt.test.passingScorePercent,
      durationSeconds,
      completedAt: attempt.completedAt,
      startedAt: attempt.startedAt,
      categoryBreakdown,
      review: reviewItems,
    });
  } catch (error) {
    console.error('Fetch review error:', error);
    res.status(500).json({ error: 'Failed to retrieve review details.' });
  }
});

module.exports = router;
