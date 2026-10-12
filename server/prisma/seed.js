const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database records...');
  await prisma.answer.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.test.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const userPasswordHash = await bcrypt.hash('User@123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      name: 'System Administrator',
      role: 'ADMIN',
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      passwordHash: userPasswordHash,
      name: 'Alex Johnson',
      role: 'USER',
    },
  });

  console.log('Seeding default SMART test...');
  const test = await prisma.test.create({
    data: {
      title: 'SMART Goals Quiz — 25 MCQs',
      description: 'A 25-question assessment evaluating practical competence across all five SMART dimensions: Specific, Measurable, Achievable, Relevant, and Time-bound.',
      timeLimitMinutes: 15,
      passingScorePercent: 70,
      isPublished: true,
    },
  });

  console.log('Seeding 25 SMART questions from SMART_Goals_Quiz_Short_Options.pdf...');

  const questionsData = [
    // ==========================================
    // S — Specific (Q1 - Q5)
    // ==========================================
    {
      category: 'S',
      prompt: 'What does Specific mean?',
      explanation: 'Specific means having a clear target rather than vague or undefined aims.',
      options: [
        { text: 'Clear target', isCorrect: true },
        { text: 'No plan', isCorrect: false },
        { text: 'No deadline', isCorrect: false },
        { text: 'Easy goal', isCorrect: false },
      ],
    },
    {
      category: 'S',
      prompt: 'Which goal is most specific?',
      explanation: '"Practise 10 maths problems daily" is precise about the subject, exact count, and frequency.',
      options: [
        { text: 'Improve more', isCorrect: false },
        { text: 'Study more', isCorrect: false },
        { text: 'Be successful', isCorrect: false },
        { text: 'Practise 10 maths problems daily', isCorrect: true },
      ],
    },
    {
      category: 'S',
      prompt: 'Which coding goal is specific?',
      explanation: '"Learn Python" specifies the exact programming language to focus on.',
      options: [
        { text: 'Be smarter', isCorrect: false },
        { text: 'Work hard', isCorrect: false },
        { text: 'Learn Python', isCorrect: true },
        { text: 'Improve everything', isCorrect: false },
      ],
    },
    {
      category: 'S',
      prompt: 'Which presentation goal is specific?',
      explanation: '"Give a 5-minute AI presentation in class" identifies the exact duration, topic, and context.',
      options: [
        { text: 'Speak well', isCorrect: false },
        { text: 'Be confident', isCorrect: false },
        { text: 'Communicate better', isCorrect: false },
        { text: 'Give a 5-minute AI presentation in class', isCorrect: true },
      ],
    },
    {
      category: 'S',
      prompt: 'Which goal is most specific?',
      explanation: '"Practise Java 30 minutes daily" defines the exact technology, time spent, and recurrence.',
      options: [
        { text: 'Succeed more', isCorrect: false },
        { text: 'Improve skills', isCorrect: false },
        { text: 'Practise Java 30 minutes daily', isCorrect: true },
        { text: 'Study better', isCorrect: false },
      ],
    },

    // ==========================================
    // M — Measurable (Q6 - Q10)
    // ==========================================
    {
      category: 'M',
      prompt: 'What does Measurable mean?',
      explanation: 'Measurable means having quantifiable criteria to track progress and know when the goal is achieved.',
      options: [
        { text: 'Difficult goal', isCorrect: false },
        { text: 'Track progress', isCorrect: true },
        { text: 'No deadline', isCorrect: false },
        { text: 'Vague goal', isCorrect: false },
      ],
    },
    {
      category: 'M',
      prompt: 'Which goal is measurable?',
      explanation: '"Read 12 books in 6 months" provides a concrete number (12 books) and timeframe (6 months) that can be tracked.',
      options: [
        { text: 'Read more', isCorrect: false },
        { text: 'Know more', isCorrect: false },
        { text: 'Read 12 books in 6 months', isCorrect: true },
        { text: 'Be smarter', isCorrect: false },
      ],
    },
    {
      category: 'M',
      prompt: 'Which attendance goal is measurable?',
      explanation: '"Attend 90% of classes this semester" provides a verifiable percentage metric.',
      options: [
        { text: 'Attend regularly', isCorrect: false },
        { text: 'Try harder', isCorrect: false },
        { text: 'Be better', isCorrect: false },
        { text: 'Attend 90% of classes this semester', isCorrect: true },
      ],
    },
    {
      category: 'M',
      prompt: 'Target is 80%, score is 72%. What does measurement show?',
      explanation: 'Comparing the score (72%) to the target (80%) shows that performance is exactly 8% below the target.',
      options: [
        { text: '8% below target', isCorrect: true },
        { text: 'Cancel exam', isCorrect: false },
        { text: 'Stop studying', isCorrect: false },
        { text: 'Remove target', isCorrect: false },
      ],
    },
    {
      category: 'M',
      prompt: 'Which coding goal is measurable?',
      explanation: '"Solve 20 problems weekly" contains a clear numerical target of 20 problems per week.',
      options: [
        { text: 'Be a great coder', isCorrect: false },
        { text: 'Code regularly', isCorrect: false },
        { text: 'Solve 20 problems weekly', isCorrect: true },
        { text: 'Understand more', isCorrect: false },
      ],
    },

    // ==========================================
    // A — Achievable (Q11 - Q15)
    // ==========================================
    {
      category: 'A',
      prompt: 'What does Achievable mean?',
      explanation: 'Achievable means the goal is realistic, feasible, and within reach given your capabilities and resources.',
      options: [
        { text: 'Impossible goal', isCorrect: false },
        { text: 'No plan', isCorrect: false },
        { text: 'Realistic goal', isCorrect: true },
        { text: 'One-day goal', isCorrect: false },
      ],
    },
    {
      category: 'A',
      prompt: 'Which coding goal is achievable?',
      explanation: 'Learning Python basics in 4 weeks is a practical, attainable target for learners.',
      options: [
        { text: 'Learn all languages today', isCorrect: false },
        { text: 'Learn Python basics in 4 weeks', isCorrect: true },
        { text: 'Build complex AI without basics', isCorrect: false },
        { text: 'Become expert without practice', isCorrect: false },
      ],
    },
    {
      category: 'A',
      prompt: 'Exam in 2 days. Best approach?',
      explanation: 'Prioritising key topics and planning study time is achievable within a 2-day timeframe.',
      options: [
        { text: 'Study everything deeply', isCorrect: false },
        { text: 'Skip hard topics', isCorrect: false },
        { text: 'Study without sleep', isCorrect: false },
        { text: 'Prioritise key topics and plan', isCorrect: true },
      ],
    },
    {
      category: 'A',
      prompt: 'Beginner aims for 100 hard problems in 2 days. Best action?',
      explanation: 'Setting a realistic smaller target makes progress achievable without overwhelming burnout.',
      options: [
        { text: 'Set a realistic smaller target', isCorrect: true },
        { text: 'Quit coding', isCorrect: false },
        { text: 'Solve all without breaks', isCorrect: false },
        { text: 'Ignore basics', isCorrect: false },
      ],
    },
    {
      category: 'A',
      prompt: 'Best study goal for a busy student?',
      explanation: '"Revise 1 chapter daily for a week" fits sustainably into a busy schedule.',
      options: [
        { text: 'Study 15 hours daily', isCorrect: false },
        { text: 'Finish syllabus overnight', isCorrect: false },
        { text: 'Revise 1 chapter daily for a week', isCorrect: true },
        { text: 'Master all subjects in a day', isCorrect: false },
      ],
    },

    // ==========================================
    // R — Relevant (Q16 - Q20)
    // ==========================================
    {
      category: 'R',
      prompt: 'What does Relevant mean?',
      explanation: 'Relevant means aligning directly with your broader priorities, needs, and long-term objectives.',
      options: [
        { text: 'Fits your goals', isCorrect: true },
        { text: 'Unrelated plan', isCorrect: false },
        { text: 'Always easy', isCorrect: false },
        { text: 'No purpose', isCorrect: false },
      ],
    },
    {
      category: 'R',
      prompt: 'Future software developer: most relevant goal?',
      explanation: 'Practising programming and building projects directly relates to a career as a software developer.',
      options: [
        { text: 'Practise Python and build projects', isCorrect: true },
        { text: 'Learn random facts', isCorrect: false },
        { text: 'Avoid computers', isCorrect: false },
        { text: 'Focus on unrelated hobbies', isCorrect: false },
      ],
    },
    {
      category: 'R',
      prompt: 'Preparing for maths exam: relevant goal?',
      explanation: 'Solving syllabus questions directly prepares and aligns with succeeding in the maths exam.',
      options: [
        { text: 'Learn dance', isCorrect: false },
        { text: 'Solve syllabus questions', isCorrect: true },
        { text: 'Buy a phone', isCorrect: false },
        { text: 'Watch random videos', isCorrect: false },
      ],
    },
    {
      category: 'R',
      prompt: 'Why should a goal be relevant?',
      explanation: 'A goal must be relevant so that your time and energy match what matters most to your priorities.',
      options: [
        { text: 'Sound impressive', isCorrect: false },
        { text: 'Copy others', isCorrect: false },
        { text: 'Match your priorities', isCorrect: true },
        { text: 'Avoid planning', isCorrect: false },
      ],
    },
    {
      category: 'R',
      prompt: 'Want to improve public speaking: relevant action?',
      explanation: 'Practising short presentations directly enhances public speaking ability and confidence.',
      options: [
        { text: 'Practise short presentations', isCorrect: true },
        { text: 'Memorise unrelated formulas', isCorrect: false },
        { text: 'Avoid speaking', isCorrect: false },
        { text: 'Change wallpaper', isCorrect: false },
      ],
    },

    // ==========================================
    // T — Time-bound (Q21 - Q25)
    // ==========================================
    {
      category: 'T',
      prompt: 'What does Time-bound mean?',
      explanation: 'Time-bound means having an established date or clear deadline by which the goal must be achieved.',
      options: [
        { text: 'Clear deadline', isCorrect: true },
        { text: 'No end date', isCorrect: false },
        { text: 'No plan', isCorrect: false },
        { text: 'Instant completion', isCorrect: false },
      ],
    },
    {
      category: 'T',
      prompt: 'Which goal is time-bound?',
      explanation: '"Finish 2 Java lessons by Friday" establishes an unambiguous, specific deadline (Friday).',
      options: [
        { text: 'Learn Java someday', isCorrect: false },
        { text: 'Improve grades', isCorrect: false },
        { text: 'Finish 2 Java lessons by Friday', isCorrect: true },
        { text: 'Study in future', isCorrect: false },
      ],
    },
    {
      category: 'T',
      prompt: 'Why is a deadline useful?',
      explanation: 'Deadlines create healthy urgency and provide a timeframe to schedule and track progress.',
      options: [
        { text: 'Makes goal impossible', isCorrect: false },
        { text: 'Helps plan and track time', isCorrect: true },
        { text: 'Removes practice', isCorrect: false },
        { text: 'Guarantees success', isCorrect: false },
      ],
    },
    {
      category: 'T',
      prompt: 'Which reading goal is time-bound?',
      explanation: '"Finish 1 book this month" specifies an explicit timeframe (this month).',
      options: [
        { text: 'Read regularly', isCorrect: false },
        { text: 'Read more', isCorrect: false },
        { text: 'Read when possible', isCorrect: false },
        { text: 'Finish 1 book this month', isCorrect: true },
      ],
    },
    {
      category: 'T',
      prompt: 'Which is a complete SMART goal?',
      explanation: '"Solve 15 Python problems weekly for 1 month" satisfies all SMART criteria: Specific (Python problems), Measurable (15 problems), Achievable, Relevant (coding proficiency), and Time-bound (weekly for 1 month).',
      options: [
        { text: 'Get better at coding', isCorrect: false },
        { text: 'Solve 15 Python problems weekly for 1 month', isCorrect: true },
        { text: 'Be best someday', isCorrect: false },
        { text: 'Learn all AI immediately', isCorrect: false },
      ],
    },
  ];

  for (const q of questionsData) {
    await prisma.question.create({
      data: {
        testId: test.id,
        category: q.category,
        prompt: q.prompt,
        explanation: q.explanation,
        options: {
          create: q.options.map((opt) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        },
      },
    });
  }

  console.log('Seeded 25 questions successfully!');
  console.log(`Admin user: ${admin.email}`);
  console.log(`Demo user: ${demoUser.email}`);
  console.log(`Test created: "${test.title}" (ID: ${test.id})`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
