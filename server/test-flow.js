const http = require('http');

const API_BASE = 'http://localhost:5000';

async function makeRequest(path, options = {}) {
  const url = new URL(path, API_BASE);
  const headers = options.headers || {};
  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url.toString(), {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  // Extract set-cookie if any
  const cookie = res.headers.get('set-cookie');

  return { status: res.status, data, cookie, headers: res.headers };
}

async function runTests() {
  console.log('🚀 Starting Automated Full-Stack Flow Tests...\n');

  // 1. Health check
  console.log('Test 1: Health check');
  const health = await makeRequest('/api/health');
  if (health.status !== 200 || health.data.status !== 'ok') {
    throw new Error(`Health check failed: ${JSON.stringify(health)}`);
  }
  console.log('✅ Health check passed (200 OK)');

  // 2. Admin Login
  console.log('\nTest 2: Admin Login');
  const adminLogin = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@example.com', password: 'Admin@123' },
  });
  if (adminLogin.status !== 200 || adminLogin.data.user.role !== 'ADMIN') {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLogin)}`);
  }
  const adminToken = adminLogin.data.token;
  console.log(`✅ Admin logged in as ${adminLogin.data.user.email} (Role: ${adminLogin.data.user.role})`);

  // 3. User Login
  console.log('\nTest 3: User Login');
  const userLogin = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'user@example.com', password: 'User@123' },
  });
  if (userLogin.status !== 200 || userLogin.data.user.role !== 'USER') {
    throw new Error(`User login failed: ${JSON.stringify(userLogin)}`);
  }
  const userToken = userLogin.data.token;
  console.log(`✅ Demo user logged in as ${userLogin.data.user.email} (Role: ${userLogin.data.user.role})`);

  // 4. Role Protection: Candidate tries to access Admin route
  console.log('\nTest 4: Candidate Accessing Admin Route (Role Protection)');
  const forbiddenCheck = await makeRequest('/api/admin/tests', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (forbiddenCheck.status !== 403) {
    throw new Error(`Expected 403 Forbidden for non-admin, got ${forbiddenCheck.status}`);
  }
  console.log('✅ Candidate correctly denied access (403 Forbidden)');

  // 5. Admin Accessing Admin Route
  console.log('\nTest 5: Admin Accessing Admin Route');
  const adminTests = await makeRequest('/api/admin/tests', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (adminTests.status !== 200 || !Array.isArray(adminTests.data.tests)) {
    throw new Error(`Admin tests fetch failed: ${JSON.stringify(adminTests)}`);
  }
  console.log(`✅ Admin tests retrieved successfully (${adminTests.data.tests.length} tests found)`);
  const testId = adminTests.data.tests[0].id;

  // 6. Public / Candidate Test Discovery
  console.log('\nTest 6: Candidate Discovering Published Tests');
  const publicTests = await makeRequest('/api/tests');
  if (publicTests.status !== 200 || publicTests.data.tests.length === 0) {
    throw new Error('Public tests fetch failed');
  }
  console.log(`✅ Public test catalog retrieved (${publicTests.data.tests[0].totalQuestions} questions)`);

  // 7. Security Audit: Start Attempt & Ensure isCorrect / explanations NEVER LEAK
  console.log('\nTest 7: Start Test Attempt & Validate Client-Side Data Security');
  const startAttempt = await makeRequest('/api/attempts/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { testId },
  });
  if (startAttempt.status !== 200 && startAttempt.status !== 201) {
    throw new Error(`Start attempt failed: ${JSON.stringify(startAttempt)}`);
  }
  const attemptId = startAttempt.data.attemptId;
  const questions = startAttempt.data.questions;
  console.log(`✅ Attempt created (ID: ${attemptId}) with ${questions.length} questions`);

  // Audit: verify none of the questions or options have isCorrect or explanation
  for (const q of questions) {
    if (q.explanation !== undefined) {
      throw new Error(`SECURITY VIOLATION: Question explanation was sent to client prior to submission!`);
    }
    for (const opt of q.options) {
      if (opt.isCorrect !== undefined) {
        throw new Error(`SECURITY VIOLATION: Option isCorrect was sent to client prior to submission!`);
      }
    }
  }
  console.log('🔒 Security Verified: isCorrect and explanations are strictly shielded on the server!');

  // 8. Submit Answers (server-side scoring)
  console.log('\nTest 8: Submit Test Answers & Server-Side Scoring');
  // Select the first option for all questions
  const mockAnswers = questions.map((q) => ({
    questionId: q.id,
    selectedOptionId: q.options[0].id,
  }));

  const submitRes = await makeRequest(`/api/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { answers: mockAnswers },
  });
  if (submitRes.status !== 200) {
    throw new Error(`Submit failed: ${JSON.stringify(submitRes)}`);
  }
  console.log(`✅ Assessment submitted! Score: ${submitRes.data.score}/${submitRes.data.totalQuestions} (${submitRes.data.percentage}%)`);
  console.log(`   Pillars evaluated: Specific (${submitRes.data.categoryBreakdown.S.percent}%), Measurable (${submitRes.data.categoryBreakdown.M.percent}%), Achievable (${submitRes.data.categoryBreakdown.A.percent}%), Relevant (${submitRes.data.categoryBreakdown.R.percent}%), Time-bound (${submitRes.data.categoryBreakdown.T.percent}%)`);

  // 9. Resubmission Prevention
  console.log('\nTest 9: Prevent Resubmission');
  const resubmitCheck = await makeRequest(`/api/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { answers: mockAnswers },
  });
  if (resubmitCheck.status !== 400) {
    throw new Error(`Expected 400 error on resubmission, got ${resubmitCheck.status}`);
  }
  console.log('✅ Resubmission blocked with 400 Bad Request');

  // 10. Admin Review of Attempt
  console.log('\nTest 10: Admin Inspects User Submissions');
  const adminAttempts = await makeRequest('/api/admin/attempts', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (adminAttempts.status !== 200 || adminAttempts.data.attempts.length === 0) {
    throw new Error('Admin attempts list failed');
  }
  console.log(`✅ Admin retrieved submissions list (found ${adminAttempts.data.attempts.length} attempts)`);

  // 11. Admin Analytics
  console.log('\nTest 11: Admin Analytics Dashboard Calculation');
  const analytics = await makeRequest('/api/admin/analytics', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (analytics.status !== 200) {
    throw new Error('Analytics failed');
  }
  console.log(`✅ Analytics calculated: Avg Score: ${analytics.data.summary.averageScorePercent}%, Pass Rate: ${analytics.data.summary.passRatePercent}%`);
  console.log(`   Dimensions accuracy: ${analytics.data.scoreByCategory.map(c => `${c.categoryKey}: ${c.accuracyPercent}%`).join(', ')}`);

  // 12. CSV Export
  console.log('\nTest 12: Admin CSV Export');
  const csvExport = await makeRequest('/api/admin/attempts/export/csv', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (csvExport.status !== 200 || !csvExport.data.includes('Candidate Name')) {
    throw new Error('CSV export failed');
  }
  console.log('✅ CSV Export generated valid spreadsheet data');

  console.log('\n🎉 ALL 12 AUTOMATED TESTS PASSED SUCCESSFULLY! 🎯\n');
}

// Start temporary server if not running, then execute
const serverProc = require('./src/index.js');
setTimeout(() => {
  runTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Test failed:', err);
      process.exit(1);
    });
}, 1000);
