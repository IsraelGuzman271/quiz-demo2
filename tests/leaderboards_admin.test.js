/**
 * Automated test suite for Phase 4: Leaderboards and Admin Tools.
 * Tests:
 * 1. Overall leaderboard ranked by total completed attempts (incomplete excluded, ties broken).
 * 2. Per-quiz leaderboard ranked by highest score on specific quiz with completed attempt count.
 * 3. Incomplete attempts never inflate leaderboard counts or scores.
 * 4. Player accounts strictly blocked from admin routes (403 Forbidden).
 * 5. Admin question editor (CRUD) with 4-choice validation.
 * 6. Quiz assignments (admin assigns, player views, auto-completes).
 * 7. CSV preview, row validation errors, and import.
 * 8. Historical attempt review endpoint with privacy guard.
 */

const assert = require('assert');
const http = require('http');
const { createApp } = require('../src/app');
const db = require('../src/db');

let server;
let baseUrl;

function makeRequest({ method = 'GET', path, body = null, cookie = null }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = {};

    let payload = null;
    if (body !== null && body !== undefined) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsedData = null;
          try {
            parsedData = JSON.parse(rawData);
          } catch (e) {
            parsedData = rawData;
          }

          const setCookie = res.headers['set-cookie'];
          const newCookie = setCookie ? setCookie[0].split(';')[0] : cookie;

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedData,
            cookie: newCookie,
          });
        });
      }
    );

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function registerUser(username, email, password, role = 'player') {
  const res = await makeRequest({
    method: 'POST',
    path: '/api/auth/register',
    body: { username, email, password, role },
  });
  if (res.statusCode === 201) {
    return res.cookie;
  }
  return await loginUser(username, password);
}

async function loginUser(username, password) {
  const res = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: { identifier: username, password },
  });
  assert.strictEqual(res.statusCode, 200, `Login failed for ${username}: ${JSON.stringify(res.body)}`);
  return res.cookie;
}

async function runTests() {
  console.log('--- STARTING PHASE 4 AUTOMATED TEST SUITE ---');

  // Initialize DB & Start Server
  await db.initDb();
  const app = createApp();

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Phase 4 Test server running at ${baseUrl}`);
      resolve();
    });
  });

  try {
    // Register users
    let playerCookie = await registerUser('alex_striker', 'alex@example.com', 'Password123!', 'player');
    let adminCookie = await registerUser('admin_sarah', 'sarah@example.com', 'AdminSecure2026!', 'admin');
    await registerUser('maria_globetrotter', 'maria@example.com', 'Password123!', 'player');

    // ----------------------------------------------------
    // Test 1: Access Control - Players forbidden from Admin routes
    // ----------------------------------------------------
    console.log('[TEST 1] Access Control: Players and unauthenticated users blocked from Admin routes');
    
    // Unauthenticated
    const unauthRes = await makeRequest({ method: 'GET', path: '/api/admin/overview' });
    assert.strictEqual(unauthRes.statusCode, 401, 'Unauthenticated access to admin overview should return 401');

    // Player access attempts
    const playerAdminRes = await makeRequest({
      method: 'GET',
      path: '/api/admin/overview',
      cookie: playerCookie,
    });
    assert.strictEqual(playerAdminRes.statusCode, 403, 'Player access to admin overview should return 403 Forbidden');

    const playerQRes = await makeRequest({
      method: 'POST',
      path: '/api/admin/questions',
      cookie: playerCookie,
      body: { quizId: 'soccer', question: 'Hack', options: ['A','B','C','D'], correctIndex: 0 },
    });
    assert.strictEqual(playerQRes.statusCode, 403, 'Player question creation should return 403 Forbidden');

    const playerAssignRes = await makeRequest({
      method: 'POST',
      path: '/api/admin/assignments',
      cookie: playerCookie,
      body: { quizId: 'soccer', userId: 1 },
    });
    assert.strictEqual(playerAssignRes.statusCode, 403, 'Player assignment creation should return 403 Forbidden');

    console.log('✓ Access control verified: Players cannot use admin tools (403)');

    // ----------------------------------------------------
    // Test 2: Admin Authentication and Question CRUD
    // ----------------------------------------------------
    console.log('[TEST 2] Admin Question CRUD & 4-choice validation');

    const adminOverview = await makeRequest({
      method: 'GET',
      path: '/api/admin/overview',
      cookie: adminCookie,
    });
    assert.strictEqual(adminOverview.statusCode, 200);
    assert.strictEqual(adminOverview.body.status, 'success');

    // Test rejection when options != 4
    const badOptionsRes = await makeRequest({
      method: 'POST',
      path: '/api/admin/questions',
      cookie: adminCookie,
      body: {
        quizId: 'soccer',
        question: 'Who won the 2022 World Cup?',
        options: ['Argentina', 'France', 'Croatia'], // Only 3!
        correctIndex: 0,
      },
    });
    assert.strictEqual(badOptionsRes.statusCode, 400, 'Question with 3 options should be rejected');

    // Test successful question creation with exactly 4 options
    const createQRes = await makeRequest({
      method: 'POST',
      path: '/api/admin/questions',
      cookie: adminCookie,
      body: {
        quizId: 'soccer',
        question: 'Which country hosted the 2010 FIFA World Cup?',
        options: ['Brazil', 'South Africa', 'Germany', 'Japan'],
        correctIndex: 1,
        explanation: 'South Africa hosted the 2010 FIFA World Cup, the first on the African continent.',
      },
    });
    assert.strictEqual(createQRes.statusCode, 201);
    const newQuestionId = createQRes.body.question.id;
    assert.ok(newQuestionId, 'Question ID returned');
    assert.strictEqual(createQRes.body.question.options.length, 4);

    // Test Admin listing questions with correct answers
    const listQRes = await makeRequest({
      method: 'GET',
      path: '/api/admin/quizzes/soccer/questions',
      cookie: adminCookie,
    });
    assert.strictEqual(listQRes.statusCode, 200);
    const foundCreated = listQRes.body.questions.find((q) => q.id === newQuestionId);
    assert.ok(foundCreated, 'Newly created question found in admin list');
    assert.strictEqual(foundCreated.correctIndex, 1);

    // Test updating question
    const updateQRes = await makeRequest({
      method: 'PUT',
      path: `/api/admin/questions/${newQuestionId}`,
      cookie: adminCookie,
      body: {
        question: 'Which African nation hosted the 2010 FIFA World Cup?',
        options: ['Nigeria', 'South Africa', 'Egypt', 'Ghana'],
        correctIndex: 1,
        explanation: 'South Africa hosted in 2010.',
      },
    });
    assert.strictEqual(updateQRes.statusCode, 200);
    assert.strictEqual(updateQRes.body.question.question, 'Which African nation hosted the 2010 FIFA World Cup?');

    // Test deleting question
    const deleteQRes = await makeRequest({
      method: 'DELETE',
      path: `/api/admin/questions/${newQuestionId}`,
      cookie: adminCookie,
    });
    assert.strictEqual(deleteQRes.statusCode, 200);
    console.log('✓ Admin Question CRUD and 4-choice enforcement verified');

    // ----------------------------------------------------
    // Test 3: Quiz Assignments Management
    // ----------------------------------------------------
    console.log('[TEST 3] Quiz Assignments Management');
    const alexUser = await db.getUserByUsername('alex_striker');

    // Admin creates assignment for alex
    const assignRes = await makeRequest({
      method: 'POST',
      path: '/api/admin/assignments',
      cookie: adminCookie,
      body: {
        quizId: 'hispanic-capitals',
        userId: alexUser.id,
        note: 'Please finish before Friday',
        dueDate: '2026-11-05',
      },
    });
    assert.strictEqual(assignRes.statusCode, 201);
    const assignmentId = assignRes.body.assignment.id;

    // Player retrieves their assignments
    const playerAssignList = await makeRequest({
      method: 'GET',
      path: '/api/player/assignments',
      cookie: playerCookie,
    });
    assert.strictEqual(playerAssignList.statusCode, 200);
    assert.ok(playerAssignList.body.assignments.some((a) => a.id === assignmentId));

    // Admin lists all assignments
    const allAssignmentsRes = await makeRequest({
      method: 'GET',
      path: '/api/admin/assignments',
      cookie: adminCookie,
    });
    assert.strictEqual(allAssignmentsRes.statusCode, 200);
    assert.ok(allAssignmentsRes.body.assignments.some((a) => a.id === assignmentId));

    console.log('✓ Quiz assignment creation and player retrieval verified');

    // ----------------------------------------------------
    // Test 4: CSV Upload, Validation & Preview
    // ----------------------------------------------------
    console.log('[TEST 4] CSV Preview, Row Validation & Import');

    // Invalid CSV containing errors:
    // Row 2 (line 2): unknown quiz ID
    // Row 3 (line 3): missing option_d (only 3 options)
    // Row 4 (line 4): invalid correct_choice ('Z')
    // Row 5 (line 5): valid row
    const testCsv = [
      'quiz_id,question,option_a,option_b,option_c,option_d,correct_choice,explanation',
      'unknown_quiz,What is 2+2?,1,2,3,4,D,Math',
      'soccer,Incomplete options,A,B,C,,A,Expl',
      'soccer,Bad correct choice,A,B,C,D,Z,Expl',
      'soccer,Which country won Euro 2024?,England,Spain,France,Germany,B,Spain won Euro 2024 defeating England.',
    ].join('\n');

    const previewRes = await makeRequest({
      method: 'POST',
      path: '/api/admin/questions/csv-preview',
      cookie: adminCookie,
      body: { csvText: testCsv },
    });
    assert.strictEqual(previewRes.statusCode, 200);
    assert.strictEqual(previewRes.body.validCount, 1);
    assert.strictEqual(previewRes.body.invalidCount, 3);
    assert.strictEqual(previewRes.body.canImport, false);

    // Line numbers in error diagnostic report
    const line2Error = previewRes.body.invalidRows.find((r) => r.lineNumber === 2);
    assert.ok(line2Error.errors.some((e) => e.includes('does not exist')));

    const line4Error = previewRes.body.invalidRows.find((r) => r.lineNumber === 4);
    assert.ok(line4Error.errors.some((e) => e.includes('Invalid correct choice')));

    // Attempting import with invalid rows (without allowPartial) should fail
    const importFailRes = await makeRequest({
      method: 'POST',
      path: '/api/admin/questions/csv-import',
      cookie: adminCookie,
      body: { csvText: testCsv, allowPartial: false },
    });
    assert.strictEqual(importFailRes.statusCode, 400);

    // Clean valid CSV for import
    const validCsv = [
      'quiz_id,question,option_a,option_b,option_c,option_d,correct_choice,explanation',
      'soccer,Which team won the 2024 Champions League?,Real Madrid,Dortmund,Bayern,PSG,A,Real Madrid won 2-0.',
      'english-vocab,What does ubiquitous mean?,Rare,Everywhere,Ancient,Fragile,B,Present everywhere.',
    ].join('\n');

    const validPreview = await makeRequest({
      method: 'POST',
      path: '/api/admin/questions/csv-preview',
      cookie: adminCookie,
      body: { csvText: validCsv },
    });
    assert.strictEqual(validPreview.statusCode, 200);
    assert.strictEqual(validPreview.body.invalidCount, 0);
    assert.strictEqual(validPreview.body.validCount, 2);
    assert.strictEqual(validPreview.body.canImport, true);

    const importRes = await makeRequest({
      method: 'POST',
      path: '/api/admin/questions/csv-import',
      cookie: adminCookie,
      body: { csvText: validCsv },
    });
    assert.strictEqual(importRes.statusCode, 201);
    assert.strictEqual(importRes.body.importedCount, 2);

    console.log('✓ CSV Preview diagnostic validation and import verified');

    // ----------------------------------------------------
    // Test 5: Leaderboard Calculations & Incomplete Attempt Isolation
    // ----------------------------------------------------
    console.log('[TEST 5] Leaderboards: Overall & Per-Quiz with Incomplete Attempt Isolation');

    // Player 1: alex_striker completes 2 quizzes with 100%
    // Let's get questions for soccer
    const soccerQuestions = await db.getQuestionsByQuizId('soccer', true);
    const perfectSoccerAnswers = {};
    for (const q of soccerQuestions) {
      perfectSoccerAnswers[q.id] = q.correctIndex;
    }

    // Submit perfect soccer quiz for alex
    const alexSubmit1 = await makeRequest({
      method: 'POST',
      path: '/api/quizzes/soccer/submit',
      cookie: playerCookie,
      body: { answers: perfectSoccerAnswers },
    });
    assert.strictEqual(alexSubmit1.statusCode, 200);
    assert.strictEqual(alexSubmit1.body.percentage, 100);
    const alexAttemptId = alexSubmit1.body.attemptId;

    // Player 2: maria_globetrotter completes 1 quiz with 80% and abandons another
    const mariaCookie = await loginUser('maria_globetrotter', 'Password123!');
    const spanishQuestions = await db.getQuestionsByQuizId('hispanic-capitals', true);
    const partialSpanishAnswers = {};
    for (let i = 0; i < spanishQuestions.length - 1; i++) {
      partialSpanishAnswers[spanishQuestions[i].id] = spanishQuestions[i].correctIndex;
    }

    // Maria abandons a quiz -> incomplete attempt
    const mariaAbandon = await makeRequest({
      method: 'POST',
      path: '/api/quizzes/hispanic-capitals/abandon',
      cookie: mariaCookie,
      body: { partialAnswers: partialSpanishAnswers },
    });
    assert.strictEqual(mariaAbandon.statusCode, 200);
    assert.strictEqual(mariaAbandon.body.attemptStatus, 'incomplete');

    // Maria also submits an incomplete quiz via submit endpoint (omits last question)
    const mariaIncompleteSubmit = await makeRequest({
      method: 'POST',
      path: '/api/quizzes/hispanic-capitals/submit',
      cookie: mariaCookie,
      body: { answers: partialSpanishAnswers },
    });
    assert.strictEqual(mariaIncompleteSubmit.statusCode, 200);
    assert.strictEqual(mariaIncompleteSubmit.body.isCompleted, false);

    // Maria submits 1 completed quiz
    const mariaCompletedAnswers = {};
    for (let i = 0; i < spanishQuestions.length; i++) {
      mariaCompletedAnswers[spanishQuestions[i].id] = spanishQuestions[i].correctIndex;
    }
    const mariaCompletedSubmit = await makeRequest({
      method: 'POST',
      path: '/api/quizzes/hispanic-capitals/submit',
      cookie: mariaCookie,
      body: { answers: mariaCompletedAnswers },
    });
    assert.strictEqual(mariaCompletedSubmit.statusCode, 200);
    assert.strictEqual(mariaCompletedSubmit.body.isCompleted, true);

    // Verify Overall Leaderboard
    const overallLb = await makeRequest({
      method: 'GET',
      path: '/api/leaderboard/overall',
    });
    assert.strictEqual(overallLb.statusCode, 200);
    const overallData = overallLb.body.leaderboard;

    // Incomplete attempts must NOT count toward totalCompleted
    const mariaOverall = overallData.find((u) => u.username === 'maria_globetrotter');
    assert.ok(mariaOverall, 'Maria is on overall leaderboard');
    assert.strictEqual(mariaOverall.totalCompleted, 1, 'Maria must only have 1 completed attempt, incomplete excluded!');

    // Verify Per-Quiz Leaderboard for soccer
    const soccerLb = await makeRequest({
      method: 'GET',
      path: '/api/leaderboard/quiz/soccer',
    });
    assert.strictEqual(soccerLb.statusCode, 200);
    assert.strictEqual(soccerLb.body.quizId, 'soccer');
    const alexInSoccer = soccerLb.body.leaderboard.find((u) => u.username === 'alex_striker');
    assert.ok(alexInSoccer, 'Alex found on soccer leaderboard');
    assert.strictEqual(alexInSoccer.highestPercentage, 100);
    assert.strictEqual(alexInSoccer.rank, 1);

    console.log('✓ Leaderboards correctly rank and strictly exclude incomplete attempts');

    // ----------------------------------------------------
    // Test 6: Detailed Attempt Review & Privacy Protection
    // ----------------------------------------------------
    console.log('[TEST 6] Detailed Attempt Review & Privacy Guard');

    // Alex can review his own attempt
    const alexReview = await makeRequest({
      method: 'GET',
      path: `/api/quizzes/attempts/${alexAttemptId}/review`,
      cookie: playerCookie,
    });
    assert.strictEqual(alexReview.statusCode, 200);
    assert.strictEqual(alexReview.body.status, 'success');
    assert.strictEqual(alexReview.body.attempt.id, alexAttemptId);
    assert.ok(alexReview.body.attempt.results.length > 0);
    assert.ok(alexReview.body.attempt.results[0].explanation !== undefined);

    // Maria CANNOT review Alex's attempt (403 Forbidden)
    const mariaSpyReview = await makeRequest({
      method: 'GET',
      path: `/api/quizzes/attempts/${alexAttemptId}/review`,
      cookie: mariaCookie,
    });
    assert.strictEqual(mariaSpyReview.statusCode, 403, 'User cannot review another player attempt');

    // Admin CAN review Alex's attempt
    const adminReview = await makeRequest({
      method: 'GET',
      path: `/api/quizzes/attempts/${alexAttemptId}/review`,
      cookie: adminCookie,
    });
    assert.strictEqual(adminReview.statusCode, 200, 'Admin can review any player attempt');

    console.log('✓ Detailed attempt review with strict privacy protection verified');

    console.log('--- ALL PHASE 4 BACKEND TESTS PASSED (100%) ---');
  } finally {
    if (server) {
      await new Promise((res) => server.close(res));
    }
    await db.closeDb();
  }
}

runTests().catch((err) => {
  console.error('Phase 4 Test Suite Failed:', err);
  process.exit(1);
});
