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
      title: 'SMART Goals Comprehensive Mastery Exam',
      description: 'An authoritative 25-question certification evaluating practical competence across all five SMART dimensions: Specific, Measurable, Achievable, Relevant, and Time-bound.',
      timeLimitMinutes: 15,
      passingScorePercent: 70,
      isPublished: true,
    },
  });

  console.log('Seeding 25 SMART questions...');

  const questionsData = [
    // --- 5 SPECIFIC (S) QUESTIONS ---
    {
      category: 'S',
      prompt: 'Which of the following best exemplifies a "Specific" goal according to the SMART framework?',
      explanation: 'A specific goal eliminates ambiguity by stating exactly what will be done, by whom, and the exact scope rather than vague desires like "improving skills".',
      options: [
        { text: 'I want to be better at programming in general.', isCorrect: false },
        { text: 'Complete a full-stack Node.js and React certification course by building three portfolio web applications.', isCorrect: true },
        { text: 'Try to read more technical documentation whenever I have free time.', isCorrect: false },
        { text: 'Increase overall productivity across all department duties.', isCorrect: false },
      ],
    },
    {
      category: 'S',
      prompt: 'When defining the "Specific" component of SMART, which question is most critical to answer?',
      explanation: 'Specificity answers the classic "W" questions: What needs to be accomplished, Who is responsible, and Which requirements or constraints exist.',
      options: [
        { text: 'What is the cheapest way to finish this project?', isCorrect: false },
        { text: 'What exactly needs to be accomplished, who is involved, and what are the clear boundaries?', isCorrect: true },
        { text: 'How will we celebrate after this goal is achieved?', isCorrect: false },
        { text: 'Can this goal be completed in under 24 hours?', isCorrect: false },
      ],
    },
    {
      category: 'S',
      prompt: 'A marketing team says: "Our goal is to improve customer satisfaction." Why does this statement fail the "Specific" criterion?',
      explanation: 'It lacks specific action details, operational definitions, target touchpoints, and clear definition of what "improvement" constitutes.',
      options: [
        { text: 'Because customer satisfaction cannot ever be improved.', isCorrect: false },
        { text: 'Because it lacks clarity on which customer segments, touchpoints, or specific service aspects will be addressed.', isCorrect: true },
        { text: 'Because satisfaction is exclusively a time-bound attribute.', isCorrect: false },
        { text: 'Because customer goals must strictly be financial figures.', isCorrect: false },
      ],
    },
    {
      category: 'S',
      prompt: 'Which revised statement converts "Eat healthier" into a Specific goal?',
      explanation: 'Specifying exact dietary actions (incorporating vegetables and replacing sugary beverages) provides clear behavioral directives.',
      options: [
        { text: 'Consume a balanced salad and fruit serving at lunch and substitute soda with water on weekdays.', isCorrect: true },
        { text: 'Feel much healthier and energetic over the upcoming months.', isCorrect: false },
        { text: 'Avoid bad food choices whenever possible.', isCorrect: false },
        { text: 'Cook nicer meals when there is enough time.', isCorrect: false },
      ],
    },
    {
      category: 'S',
      prompt: 'In project management, how does high specificity in goal formulation protect a team from project failure?',
      explanation: 'Clear specificity defines boundaries, preventing scope creep and misalignment of stakeholder expectations.',
      options: [
        { text: 'It guarantees that no bugs will ever be discovered during QA.', isCorrect: false },
        { text: 'It prevents scope creep by clarifying deliverables and precise boundaries for stakeholders.', isCorrect: true },
        { text: 'It eliminates the need for any project deadlines or budgets.', isCorrect: false },
        { text: 'It ensures that external market conditions will not change.', isCorrect: false },
      ],
    },

    // --- 5 MEASURABLE (M) QUESTIONS ---
    {
      category: 'M',
      prompt: 'Which key question verifies that a goal satisfies the "Measurable" requirement?',
      explanation: '"Measurable" focuses on objective quantification: "How much?", "How many?", or "How will I know when it is accomplished?".',
      options: [
        { text: 'Who will take the blame if something goes wrong?', isCorrect: false },
        { text: 'How much, how many, or what concrete metric will demonstrate progress and completion?', isCorrect: true },
        { text: 'Is this goal inspirational enough for social media?', isCorrect: false },
        { text: 'Does everyone on the executive team agree immediately?', isCorrect: false },
      ],
    },
    {
      category: 'M',
      prompt: 'Consider the goal: "Reduce server downtime from 1.5% to 0.05% over the next quarter." What makes this goal Measurable?',
      explanation: 'The objective baseline (1.5%) and target rate (0.05%) provide quantifiable numerical metrics that can be audited objectively.',
      options: [
        { text: 'The use of the word "quarter".', isCorrect: false },
        { text: 'The explicit numerical baseline (1.5%) and target percentage (0.05%) uptime metrics.', isCorrect: true },
        { text: 'The assumption that servers never fail.', isCorrect: false },
        { text: 'The technical complexity of server hardware.', isCorrect: false },
      ],
    },
    {
      category: 'M',
      prompt: 'Why is "Do our absolute best to close more enterprise deals" NOT considered Measurable?',
      explanation: 'Subjective terms like "absolute best" lack concrete numbers or quantitative criteria to assess whether success was achieved.',
      options: [
        { text: 'Enterprise sales are inherently impossible to track.', isCorrect: false },
        { text: 'It lacks a numerical quota, percentage increase, or measurable benchmark to determine success.', isCorrect: true },
        { text: 'Closing deals is strictly an HR objective.', isCorrect: false },
        { text: 'Because "best" is already a mathematical maximum.', isCorrect: false },
      ],
    },
    {
      category: 'M',
      prompt: 'Which metric provides the best quantifiable measurement for a customer support team aiming to improve response speed?',
      explanation: 'First Response Time (FRT) in minutes or hours provides a direct, verifiable, continuous numerical measurement.',
      options: [
        { text: 'General team morale during morning standup.', isCorrect: false },
        { text: 'Average First Response Time (FRT) in minutes tracked via the ticketing system.', isCorrect: true },
        { text: 'Number of coffee breaks taken per shift.', isCorrect: false },
        { text: 'Subjective feeling of being fast.', isCorrect: false },
      ],
    },
    {
      category: 'M',
      prompt: 'When tracking progress towards a complex annual goal, what role do interim Measurable milestones play?',
      explanation: 'Interim milestones provide quantifiable checkpoints that allow teams to recalibrate efforts before the final deadline arrives.',
      options: [
        { text: 'They allow team members to skip the final review entirely.', isCorrect: false },
        { text: 'They provide quantifiable checkpoints to evaluate whether the trajectory matches targets.', isCorrect: true },
        { text: 'They replace the need for an overall goal.', isCorrect: false },
        { text: 'They guarantee that no unforeseen delays can ever happen.', isCorrect: false },
      ],
    },

    // --- 5 ACHIEVABLE (A) QUESTIONS ---
    {
      category: 'A',
      prompt: 'What does "Achievable" (or Attainable) mean when evaluating a SMART goal?',
      explanation: 'Achievable means the goal is realistic given current resources, skills, time, and external constraints—stretching capacity without being impossible.',
      options: [
        { text: 'The goal is so simple that anyone can finish it without effort.', isCorrect: false },
        { text: 'The goal is realistic and feasible considering available skills, budget, and constraints.', isCorrect: true },
        { text: 'The goal has already been achieved in the past.', isCorrect: false },
        { text: 'The goal requires hiring 100 new employees regardless of budget.', isCorrect: false },
      ],
    },
    {
      category: 'A',
      prompt: 'A solo bootstrapped startup founder with zero seed capital sets a goal: "Acquire 500 million active users in 30 days." What SMART component is violated?',
      explanation: 'Acquiring 500M users in 30 days with no capital is mathematically and logistically unachievable given realistic constraints.',
      options: [
        { text: 'Achievable, because it ignores realistic capacity, capital, and infrastructure constraints.', isCorrect: true },
        { text: 'Measurable, because 500 million is not a number.', isCorrect: false },
        { text: 'Time-bound, because 30 days is not an acceptable time frame.', isCorrect: false },
        { text: 'Specific, because active users cannot be tracked.', isCorrect: false },
      ],
    },
    {
      category: 'A',
      prompt: 'How should an organization balance "stretch goals" with the "Achievable" criterion of SMART?',
      explanation: 'Stretch goals should inspire peak performance while remaining grounded in operational feasibility, avoiding demotivation from impossible targets.',
      options: [
        { text: 'By setting unattainable targets so employees work 20 hours a day.', isCorrect: false },
        { text: 'By setting ambitious targets that challenge capacity while remaining grounded in plausible execution.', isCorrect: true },
        { text: 'By only setting goals that require zero new effort or skill development.', isCorrect: false },
        { text: 'By ignoring market constraints completely.', isCorrect: false },
      ],
    },
    {
      category: 'A',
      prompt: 'Which step is most effective for confirming whether a proposed engineering goal is genuinely Achievable?',
      explanation: 'Assessing required engineering hours, technical capabilities, dependencies, and available resources verifies achievability.',
      options: [
        { text: 'Conducting a capacity and resource audit comparing required effort against team velocity.', isCorrect: true },
        { text: 'Asking the marketing department to guess the technical difficulty.', isCorrect: false },
        { text: 'Assuming all software third-party libraries will have zero downtime.', isCorrect: false },
        { text: 'Doubling the target without speaking to the engineering leads.', isCorrect: false },
      ],
    },
    {
      category: 'A',
      prompt: 'If a goal is found to be unachievable midway through a sprint due to lost personnel, what is the best SMART practice?',
      explanation: 'SMART goals are dynamic management instruments; adjusting scope or resources maintains engagement and realistic delivery.',
      options: [
        { text: 'Pretend the personnel loss did not happen and demand the same outcome.', isCorrect: false },
        { text: 'Recalibrate the scope or timeline to reflect new resource constraints while preserving core intent.', isCorrect: true },
        { text: 'Abandon goal setting permanently across the organization.', isCorrect: false },
        { text: 'Assign the missing work to an untrained intern without supervision.', isCorrect: false },
      ],
    },

    // --- 5 RELEVANT (R) QUESTIONS ---
    {
      category: 'R',
      prompt: 'What core question must be satisfied to ensure a goal is "Relevant"?',
      explanation: '"Relevant" verifies alignment: Does this goal matter right now, and does it support our broader mission and strategic priorities?',
      options: [
        { text: 'Does this goal align with our core strategic mission and solve an important problem right now?', isCorrect: true },
        { text: 'Is this goal the easiest task on our backlog?', isCorrect: false },
        { text: 'Will this goal require any effort from our team?', isCorrect: false },
        { text: 'Can this goal be completed without using computers?', isCorrect: false },
      ],
    },
    {
      category: 'R',
      prompt: 'A software company facing critical security vulnerabilities prioritizes: "Redesign the decorative internal office mugs." Why does this fail the Relevant test?',
      explanation: 'Mug redesign does not align with the urgent strategic imperative of securing systems and protecting user data.',
      options: [
        { text: 'Because mugs cannot be purchased online.', isCorrect: false },
        { text: 'Because it distracts from the core business priority and urgent mission-critical needs.', isCorrect: true },
        { text: 'Because art is never allowed in tech companies.', isCorrect: false },
        { text: 'Because mugs do not have time limits.', isCorrect: false },
      ],
    },
    {
      category: 'R',
      prompt: 'How does evaluating "Relevance" prevent teams from falling into the "busywork trap"?',
      explanation: 'Relevance ensures that effort is expended on high-impact outcomes that drive actual organizational value, not just activity.',
      options: [
        { text: 'It forces everyone to take more vacation days.', isCorrect: false },
        { text: 'It screens out low-value activities by demanding clear linkage to high-level strategic outcomes.', isCorrect: true },
        { text: 'It automates all manual repetitive tasks with AI.', isCorrect: false },
        { text: 'It removes the need for performance reviews.', isCorrect: false },
      ],
    },
    {
      category: 'R',
      prompt: 'Which of the following scenarios demonstrates strong "Relevance" for a junior data analyst?',
      explanation: 'Learning SQL and dashboarding directly amplifies their core analytical deliverables and career advancement.',
      options: [
        { text: 'Spending 40 hours learning French cuisine techniques during work hours.', isCorrect: false },
        { text: 'Mastering SQL window functions to accelerate reporting turnaround for executive decisions.', isCorrect: true },
        { text: 'Organizing the parking lot permits when it is not part of their role.', isCorrect: false },
        { text: 'Writing poetry about spreadsheets for a personal blog.', isCorrect: false },
      ],
    },
    {
      category: 'R',
      prompt: 'What should a product manager do if an executive proposes a goal that does not appear Relevant to current market data?',
      explanation: 'Professional alignment involves sharing data, showing trade-offs, and verifying strategic coherence.',
      options: [
        { text: 'Immediately accept it without question and cancel customer research.', isCorrect: false },
        { text: 'Present market evidence and collaborate to align the objective with current customer needs.', isCorrect: true },
        { text: 'Resign immediately without discussing the goal.', isCorrect: false },
        { text: 'Hide all customer metrics from the executive team.', isCorrect: false },
      ],
    },

    // --- 5 TIME-BOUND (T) QUESTIONS ---
    {
      category: 'T',
      prompt: 'Which element is essential for a goal to be properly "Time-bound"?',
      explanation: 'Time-bound goals have a clear target date or completion deadline, instilling urgency and enabling scheduling.',
      options: [
        { text: 'A clear target completion date or structured deadline.', isCorrect: true },
        { text: 'An infinite timeline so pressure is minimized.', isCorrect: false },
        { text: 'A requirement that everything be finished in under 5 minutes.', isCorrect: false },
        { text: 'A calendar invitation sent to the entire company.', isCorrect: false },
      ],
    },
    {
      category: 'T',
      prompt: 'Why is "Launch the new mobile checkout flow as soon as possible" NOT effectively Time-bound?',
      explanation: '"As soon as possible" (ASAP) is subjective and lacks an explicit anchor date, making accountability and resource scheduling difficult.',
      options: [
        { text: 'Because checkout flows cannot be scheduled.', isCorrect: false },
        { text: '"As soon as possible" lacks an explicit deadline date, creating ambiguity and weak accountability.', isCorrect: true },
        { text: 'Because "possible" is an illegal word in agile frameworks.', isCorrect: false },
        { text: 'Because mobile apps do not require timeframes.', isCorrect: false },
      ],
    },
    {
      category: 'T',
      prompt: 'Which revised statement best provides a proper Time-bound constraint for publishing a research paper?',
      explanation: '"By November 15, 2026" establishes an unambiguous target date for submission.',
      options: [
        { text: 'Submit the final peer-reviewed manuscript to the ACM Journal by November 15, 2026.', isCorrect: true },
        { text: 'Publish the paper someday when the review committee is happy.', isCorrect: false },
        { text: 'Work on writing whenever the semester feels quiet.', isCorrect: false },
        { text: 'Finish the research eventually.', isCorrect: false },
      ],
    },
    {
      category: 'T',
      prompt: 'How does setting intermediate time-bound deadlines (cadences) help prevent the "Student Syndrome" (procrastination until the final hour)?',
      explanation: 'Interim milestones break large endeavors into incremental deliverables with recurring deadlines, maintaining steady momentum.',
      options: [
        { text: 'It creates continuous micro-deadlines that distribute effort evenly over time.', isCorrect: true },
        { text: 'It eliminates the need to complete the project.', isCorrect: false },
        { text: 'It causes team members to stop working altogether.', isCorrect: false },
        { text: 'It removes the need for QA testing.', isCorrect: false },
      ],
    },
    {
      category: 'T',
      prompt: 'A project schedule includes: "Design finalized by April 10, Beta released by May 15, Global rollout by June 30." Why is this an exemplary Time-bound plan?',
      explanation: 'It establishes chronological milestone gates with explicit dates, enabling sequenced tracking from concept to rollout.',
      options: [
        { text: 'It uses distinct calendar months in alphabetical order.', isCorrect: false },
        { text: 'It provides sequential, clearly dated phased checkpoints enabling milestone accountability.', isCorrect: true },
        { text: 'It guarantees that software bugs will not exist.', isCorrect: false },
        { text: 'It allows the team to skip the design phase if needed.', isCorrect: false },
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
