/**
 * Automated test suite for Phase 3: Attempts and User History.
 * Directly verifies all completion gate criteria:
 * 1. Completed attempts persist after logout and login.
 * 2. History contains the correct player's attempts, not another player's private history.
 * 3. A retry produces the correct new attempt record.
 * 4. Incomplete attempts do not count as completed.
 * 5. Existing quiz scoring remains correct.
 * 6. Authentication boundaries strictly enforced (401 when logged out).
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
            data: parsedData,
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

async function runHistoryTests() {
  console.log('\n======================================================');
  console.log(' Phase 3: Attempts & User History Test Suite');
  console.log(' Branch: phase-3-attempts-history');
  console.log('======================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  async function test(name, fn) {
    process.stdout.write(`• ${name}... `);
    try {
      await fn();
      console.log('PASSED ✓');
      passedCount++;
    } catch (err) {
      console.log('FAILED ✗');
      console.error('  Error:', err.message);
      failedCount++;
    }
  }

  try {
    await db.initDb();
    const app = createApp();
    server = http.createServer(app);

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    const quizzes = await db.getQuizzes();
    assert.ok(quizzes.length >= 2, 'Requires at least 2 quizzes for history testing');
    const quiz1Id = quizzes[0].id;
    const quiz2Id = quizzes[1].id;

    const q1Questions = await db.getQuestionsByQuizId(quiz1Id, true);
    const q1PerfectAnswers = {};
    q1Questions.forEach((q) => {
      q1PerfectAnswers[q.id] = q.correctIndex;
    });

    // Test 1: Completed attempts persist after logout and login
    let playerACookie = null;
    let attempt1Id = null;
    await test('Gate 1: Completed attempts persist after logout and login', async () => {
      // Register Player A
      const regRes = await makeRequest({
        method: 'POST',
        path: '/api/auth/register',
        body: {
          username: 'player_alpha',
          email: 'alpha@example.com',
          password: 'Password123!',
          role: 'player',
        },
      });
      assert.strictEqual(regRes.statusCode, 201);
      playerACookie = regRes.cookie;

      // Complete Quiz 1
      const submitRes = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${quiz1Id}/submit`,
        body: { answers: q1PerfectAnswers },
        cookie: playerACookie,
      });
      assert.strictEqual(submitRes.statusCode, 200);
      assert.strictEqual(submitRes.data.attemptStatus, 'completed');
      assert.strictEqual(submitRes.data.isCompleted, true);
      assert.strictEqual(submitRes.data.score, q1Questions.length);
      attempt1Id = submitRes.data.attemptId;

      // Log out Player A
      const logoutRes = await makeRequest({
        method: 'POST',
        path: '/api/auth/logout',
        cookie: playerACookie,
      });
      assert.strictEqual(logoutRes.statusCode, 200);

      // Verify unauthenticated user cannot access history (HTTP 401)
      const unauthHistory = await makeRequest({
        path: '/api/player/history',
        cookie: playerACookie,
      });
      assert.strictEqual(unauthHistory.statusCode, 401);

      // Log back in as Player A
      const loginRes = await makeRequest({
        method: 'POST',
        path: '/api/auth/login',
        body: {
          identifier: 'player_alpha',
          password: 'Password123!',
        },
      });
      assert.strictEqual(loginRes.statusCode, 200);
      playerACookie = loginRes.cookie;

      // Check history after re-login
      const historyRes = await makeRequest({
        path: '/api/player/history',
        cookie: playerACookie,
      });
      assert.strictEqual(historyRes.statusCode, 200);
      assert.strictEqual(historyRes.data.count, 1, 'Attempt must persist after logout and login');
      assert.strictEqual(historyRes.data.attempts[0].id, attempt1Id);
      assert.strictEqual(historyRes.data.attempts[0].quiz_id, quiz1Id);
      assert.strictEqual(historyRes.data.attempts[0].score, q1Questions.length);
      assert.strictEqual(historyRes.data.attempts[0].percentage, 100);
      assert.strictEqual(historyRes.data.attempts[0].status, 'completed');
      assert.strictEqual(historyRes.data.stats.totalCompleted, 1);
    });

    // Test 2: History contains the correct player's attempts, not another player's private history
    let playerBCookie = null;
    await test("Gate 2: History contains the correct player's attempts, not another player's private history", async () => {
      // Register Player B
      const regB = await makeRequest({
        method: 'POST',
        path: '/api/auth/register',
        body: {
          username: 'player_beta',
          email: 'beta@example.com',
          password: 'Password456!',
          role: 'player',
        },
      });
      assert.strictEqual(regB.statusCode, 201);
      playerBCookie = regB.cookie;

      // Check Player B initial history -> must be empty
      const historyBInitial = await makeRequest({
        path: '/api/player/history',
        cookie: playerBCookie,
      });
      assert.strictEqual(historyBInitial.statusCode, 200);
      assert.strictEqual(historyBInitial.data.count, 0, "Player B must not see Player A's attempts");

      // Player B completes Quiz 2
      const q2Questions = await db.getQuestionsByQuizId(quiz2Id, true);
      const q2Answers = {};
      q2Questions.forEach((q) => {
        q2Answers[q.id] = q.correctIndex;
      });

      const submitB = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${quiz2Id}/submit`,
        body: { answers: q2Answers },
        cookie: playerBCookie,
      });
      assert.strictEqual(submitB.statusCode, 200);

      // Verify Player B sees only their attempt
      const historyB = await makeRequest({
        path: '/api/player/history',
        cookie: playerBCookie,
      });
      assert.strictEqual(historyB.data.count, 1);
      assert.strictEqual(historyB.data.attempts[0].quiz_id, quiz2Id);

      // Verify Player A still sees only Player A's attempt (Quiz 1, not Quiz 2)
      const historyA = await makeRequest({
        path: '/api/player/history',
        cookie: playerACookie,
      });
      assert.strictEqual(historyA.data.count, 1);
      assert.strictEqual(historyA.data.attempts[0].quiz_id, quiz1Id);
    });

    // Test 3: A retry produces the correct new attempt record
    await test('Gate 3: A retry produces the correct new attempt record', async () => {
      // Player A retries Quiz 1 with different answers (score 3 out of 5)
      const retryAnswers = {};
      q1Questions.forEach((q, idx) => {
        retryAnswers[q.id] = idx < 3 ? q.correctIndex : (q.correctIndex + 1) % 4;
      });

      const retryRes = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${quiz1Id}/submit`,
        body: { answers: retryAnswers },
        cookie: playerACookie,
      });
      assert.strictEqual(retryRes.statusCode, 200);
      assert.strictEqual(retryRes.data.score, 3);
      assert.strictEqual(retryRes.data.percentage, 60);
      assert.notStrictEqual(retryRes.data.attemptId, attempt1Id);

      // Check Player A history now has 2 distinct attempts
      const historyA = await makeRequest({
        path: '/api/player/history',
        cookie: playerACookie,
      });
      assert.strictEqual(historyA.data.count, 2, 'History must contain both initial and retry attempts');
      assert.strictEqual(historyA.data.stats.totalCompleted, 2);

      // Verify latest attempt is first in list (chronological DESC)
      assert.strictEqual(historyA.data.attempts[0].id, retryRes.data.attemptId);
      assert.strictEqual(historyA.data.attempts[0].score, 3);
      assert.strictEqual(historyA.data.attempts[1].id, attempt1Id);
      assert.strictEqual(historyA.data.attempts[1].score, q1Questions.length);
    });

    // Test 4: Incomplete attempts do not count as completed
    await test('Gate 4: Incomplete attempts do not count as completed', async () => {
      // Player A submits an incomplete attempt (only 2 of 5 questions answered)
      const partialAnswers = {
        [q1Questions[0].id]: q1Questions[0].correctIndex,
        [q1Questions[1].id]: q1Questions[1].correctIndex,
      };

      const partialRes = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${quiz1Id}/submit`,
        body: { answers: partialAnswers },
        cookie: playerACookie,
      });
      assert.strictEqual(partialRes.statusCode, 200);
      assert.strictEqual(partialRes.data.attemptStatus, 'incomplete');
      assert.strictEqual(partialRes.data.isCompleted, false);

      // Player A also abandons a quiz halfway
      const abandonRes = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${quiz2Id}/abandon`,
        body: { partialAnswers: {} },
        cookie: playerACookie,
      });
      assert.strictEqual(abandonRes.statusCode, 200);
      assert.strictEqual(abandonRes.data.attemptStatus, 'incomplete');

      // Check completed history: must STILL be exactly 2 completed attempts!
      const historyCompleted = await makeRequest({
        path: '/api/player/history',
        cookie: playerACookie,
      });
      assert.strictEqual(
        historyCompleted.data.count,
        2,
        'Incomplete/abandoned attempts must NOT count as completed attempts'
      );
      assert.strictEqual(historyCompleted.data.stats.totalCompleted, 2);

      // Verify querying with includeIncomplete=true exposes them as incomplete
      const historyAll = await makeRequest({
        path: '/api/player/history?includeIncomplete=true',
        cookie: playerACookie,
      });
      assert.strictEqual(historyAll.data.count, 4, 'All attempts include incomplete ones');
      const incompleteItems = historyAll.data.attempts.filter((a) => a.status === 'incomplete');
      assert.strictEqual(incompleteItems.length, 2, '2 attempts are marked incomplete');
      // Stats totalCompleted still strictly reflects completed quizzes
      assert.strictEqual(historyAll.data.stats.totalCompleted, 2);
    });

    // Test 5: Existing quiz scoring remains correct
    await test('Gate 5: Existing quiz scoring remains correct', async () => {
      // Perfect score calculation
      const perfectScoreRes = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${quiz1Id}/submit`,
        body: { answers: q1PerfectAnswers },
      });
      assert.strictEqual(perfectScoreRes.statusCode, 200);
      assert.strictEqual(perfectScoreRes.data.score, q1Questions.length);
      assert.strictEqual(perfectScoreRes.data.percentage, 100);

      // Empty submission
      const emptyRes = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${quiz1Id}/submit`,
        body: { answers: {} },
      });
      assert.strictEqual(emptyRes.statusCode, 200);
      assert.strictEqual(emptyRes.data.score, 0);
      assert.strictEqual(emptyRes.data.percentage, 0);
    });

  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await db.closeDb();
  }

  console.log('\n------------------------------------------------------');
  console.log(`Results: ${passedCount} passed, ${failedCount} failed`);
  console.log('------------------------------------------------------\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runHistoryTests().catch((err) => {
  console.error('Fatal history test error:', err);
  process.exit(1);
});
