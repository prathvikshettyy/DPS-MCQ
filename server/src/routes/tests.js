const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

// Get all published tests
router.get('/', async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      where: { isPublished: true },
      include: {
        _count: {
          select: { questions: true },
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
      totalQuestions: t._count.questions,
      createdAt: t.createdAt,
    }));

    res.json({ tests: formatted });
  } catch (error) {
    console.error('Fetch tests error:', error);
    res.status(500).json({ error: 'Failed to fetch tests.' });
  }
});

// Get single test public details
router.get('/:id', async (req, res) => {
  try {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!test || !test.isPublished) {
      return res.status(404).json({ error: 'Test not found or not published.' });
    }

    res.json({
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        timeLimitMinutes: test.timeLimitMinutes,
        passingScorePercent: test.passingScorePercent,
        totalQuestions: test._count.questions,
      },
    });
  } catch (error) {
    console.error('Fetch test error:', error);
    res.status(500).json({ error: 'Failed to fetch test details.' });
  }
});

module.exports = router;
