/**
 * Automated test suite for Phase 2: Quiz Engine.
 * Verifies all completion gate criteria:
 * 1. Players can select, complete, submit, and retry quizzes.
 * 2. Questions have exactly four answer choices and one correct answer.
 * 3. Client endpoint never leaks answers prior to submission.
 * 4. Correct and incorrect answers produce the expected score and percentage.
 * 5. Empty, incomplete, and invalid submissions are handled properly according to spec.
 * 6. Phase 1 authentication and access restrictions remain fully intact.
 */

const assert = require('assert');
const http = require('http');
const { createApp } = require('../src/app');
const db = require('../src/db');

let server;
let baseUrl;

// Helper to make HTTP requests and retain cookies
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

async function runQuizTests() {
  console.log('\n======================================================');
  console.log(' Phase 2: Quiz Engine Test Suite');
  console.log(' Branch: phase-2-quiz-engine');
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
    // Setup DB and Server
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

    // Test 1: Quiz Selection - List of quizzes
    let availableQuizzes = [];
    await test('Gate 1a: GET /api/quizzes returns available quizzes with metadata', async () => {
      const res = await makeRequest({ path: '/api/quizzes' });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.status, 'success');
      assert.ok(Array.isArray(res.data.quizzes), 'Quizzes must be an array');
      assert.ok(res.data.quizzes.length >= 3, 'Must have at least 3 selectable quizzes');

      availableQuizzes = res.data.quizzes;
      const firstQuiz = availableQuizzes[0];
      assert.ok(firstQuiz.id, 'Quiz has ID');
      assert.ok(firstQuiz.title, 'Quiz has title');
      assert.ok(firstQuiz.description, 'Quiz has description');
      assert.ok(firstQuiz.category, 'Quiz has category');
      assert.ok(firstQuiz.difficulty, 'Quiz has difficulty');
      assert.ok(firstQuiz.question_count > 0, 'Quiz has question count');
    });

    // Test 2: Display questions with exactly four answer choices and one correct answer
    const sampleQuizId = availableQuizzes[0].id;
    let quizQuestions = [];
    await test('Gate 2: Quiz questions have exactly four options and omit answers to client', async () => {
      const res = await makeRequest({ path: `/api/quizzes/${sampleQuizId}` });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.status, 'success');
      assert.strictEqual(res.data.quiz.id, sampleQuizId);

      quizQuestions = res.data.quiz.questions;
      assert.ok(quizQuestions.length >= 3, 'Quiz has multiple questions');

      for (const q of quizQuestions) {
        assert.ok(q.id, 'Question has id');
        assert.ok(q.question, 'Question has question text');
        assert.ok(Array.isArray(q.options), 'Question options is an array');
        assert.strictEqual(
          q.options.length,
          4,
          `Question ${q.id} must have EXACTLY 4 answer choices (has ${q.options.length})`
        );
        // Anti-cheat verification: Client must NOT receive answer keys!
        assert.strictEqual(q.correctIndex, undefined, 'correctIndex must not be exposed');
        assert.strictEqual(q.correct_index, undefined, 'correct_index must not be exposed');
        assert.strictEqual(q.explanation, undefined, 'explanation must not be exposed before submission');
      }
    });

    // Verify DB level that each question has exactly one correct answer (index 0-3)
    await test('Gate 2b: Database contains exactly one valid correct answer index (0-3) per question', async () => {
      const dbQuestions = await db.getQuestionsByQuizId(sampleQuizId, true);
      for (const q of dbQuestions) {
        assert.ok(
          Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex <= 3,
          `Question ${q.id} correctIndex must be between 0 and 3 (was ${q.correctIndex})`
        );
      }
    });

    // Test 3: Submit 100% correct answers -> expected score and percentage (100%)
    let firstAttemptId = null;
    await test('Gate 3a: Submit 100% correct answers produces perfect score and percentage (100%)', async () => {
      // Fetch ground truth from DB helper for testing
      const dbQuestions = await db.getQuestionsByQuizId(sampleQuizId, true);
      const perfectAnswers = {};
      dbQuestions.forEach((q) => {
        perfectAnswers[q.id] = q.correctIndex;
      });

      const res = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${sampleQuizId}/submit`,
        body: { answers: perfectAnswers },
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.status, 'success');
      assert.strictEqual(res.data.score, dbQuestions.length);
      assert.strictEqual(res.data.totalQuestions, dbQuestions.length);
      assert.strictEqual(res.data.percentage, 100);
      assert.strictEqual(res.data.passed, true);
      assert.ok(res.data.attemptId, 'Attempt ID returned');
      firstAttemptId = res.data.attemptId;

      // Verify each question result has explanation and marks isCorrect = true
      assert.strictEqual(res.data.results.length, dbQuestions.length);
      res.data.results.forEach((r) => {
        assert.strictEqual(r.isCorrect, true);
        assert.strictEqual(r.unanswered, false);
        assert.ok(r.explanation, 'Result includes explanation');
      });
    });

    // Test 4: Submit partial answers -> expected score and percentage (e.g. 3/5 = 60%)
    await test('Gate 3b: Submit mixed answers produces expected score and percentage', async () => {
      const dbQuestions = await db.getQuestionsByQuizId(sampleQuizId, true);
      const mixedAnswers = {};

      // Make first 3 correct, rest intentionally wrong
      dbQuestions.forEach((q, idx) => {
        if (idx < 3) {
          mixedAnswers[q.id] = q.correctIndex;
        } else {
          // Choose an incorrect index
          mixedAnswers[q.id] = (q.correctIndex + 1) % 4;
        }
      });

      const res = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${sampleQuizId}/submit`,
        body: { answers: mixedAnswers },
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.score, 3);
      assert.strictEqual(res.data.totalQuestions, dbQuestions.length);
      const expectedPercentage = Math.round((3 / dbQuestions.length) * 100);
      assert.strictEqual(res.data.percentage, expectedPercentage);

      // Verify individual result flags
      assert.strictEqual(res.data.results[0].isCorrect, true);
      assert.strictEqual(res.data.results[1].isCorrect, true);
      assert.strictEqual(res.data.results[2].isCorrect, true);
      assert.strictEqual(res.data.results[3].isCorrect, false);
      assert.strictEqual(res.data.results[4].isCorrect, false);
    });

    // Test 5: Empty submission -> score = 0, percentage = 0
    await test('Gate 4a: Empty submission produces 0 score and 0 percentage without error', async () => {
      const res = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${sampleQuizId}/submit`,
        body: { answers: {} },
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.score, 0);
      assert.strictEqual(res.data.percentage, 0);
      assert.strictEqual(res.data.passed, false);
      res.data.results.forEach((r) => {
        assert.strictEqual(r.isCorrect, false);
        assert.strictEqual(r.unanswered, true);
      });
    });

    // Test 6: Incomplete submission (e.g. only 2 questions answered)
    await test('Gate 4b: Incomplete submission correctly grades answered items and counts unanswered as 0', async () => {
      const dbQuestions = await db.getQuestionsByQuizId(sampleQuizId, true);
      // Answer only question 1 correctly, question 2 incorrectly, leave rest untouched
      const partialAnswers = {
        [dbQuestions[0].id]: dbQuestions[0].correctIndex,
        [dbQuestions[1].id]: (dbQuestions[1].correctIndex + 1) % 4,
      };

      const res = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${sampleQuizId}/submit`,
        body: { answers: partialAnswers },
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.score, 1);
      assert.strictEqual(res.data.totalQuestions, dbQuestions.length);
      const expectedPct = Math.round((1 / dbQuestions.length) * 100);
      assert.strictEqual(res.data.percentage, expectedPct);

      assert.strictEqual(res.data.results[0].isCorrect, true);
      assert.strictEqual(res.data.results[0].unanswered, false);
      assert.strictEqual(res.data.results[1].isCorrect, false);
      assert.strictEqual(res.data.results[1].unanswered, false);
      assert.strictEqual(res.data.results[2].unanswered, true);
    });

    // Test 7: Invalid submission (invalid quiz ID or corrupted payload)
    await test('Gate 4c: Invalid submission is rejected safely with clear HTTP error', async () => {
      // Non-existent quiz
      const notFoundRes = await makeRequest({
        method: 'POST',
        path: '/api/quizzes/nonexistent-quiz-xyz/submit',
        body: { answers: {} },
      });
      assert.strictEqual(notFoundRes.statusCode, 404);
      assert.ok(notFoundRes.data.error.includes('not found'));

      // Corrupted answers format (e.g. string instead of object/array)
      const badReqRes = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${sampleQuizId}/submit`,
        body: { answers: 'corrupted_string_not_an_object' },
      });
      assert.strictEqual(badReqRes.statusCode, 400);
      assert.ok(badReqRes.data.error.includes('Invalid submission format'));
    });

    // Test 8: Retry flow
    await test('Gate 5: Retry flow allows retrying quiz and generates new attempt record', async () => {
      const dbQuestions = await db.getQuestionsByQuizId(sampleQuizId, true);
      const retryAnswers = {};
      dbQuestions.forEach((q) => {
        retryAnswers[q.id] = q.correctIndex;
      });

      const retryRes = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${sampleQuizId}/submit`,
        body: { answers: retryAnswers },
      });

      assert.strictEqual(retryRes.statusCode, 200);
      assert.ok(retryRes.data.attemptId);
      assert.notStrictEqual(
        retryRes.data.attemptId,
        firstAttemptId,
        'Retrying quiz creates a distinct new attempt record'
      );
    });

    // Test 9: Authentication & Role preservation from Phase 1
    await test('Gate 6: Phase 1 authentication and role-based restrictions remain unbroken', async () => {
      // 1. Register a player
      const regRes = await makeRequest({
        method: 'POST',
        path: '/api/auth/register',
        body: {
          username: 'quiz_player_test',
          email: 'quizplayer@example.com',
          password: 'Password123!',
          role: 'player',
        },
      });
      assert.strictEqual(regRes.statusCode, 201);
      const playerCookie = regRes.cookie;

      // 2. Player submits a quiz while authenticated
      const submitRes = await makeRequest({
        method: 'POST',
        path: `/api/quizzes/${sampleQuizId}/submit`,
        body: { answers: {} },
        cookie: playerCookie,
      });
      assert.strictEqual(submitRes.statusCode, 200);

      // 3. Player checks their quiz attempts
      const attemptsRes = await makeRequest({
        path: '/api/quizzes/attempts/my',
        cookie: playerCookie,
      });
      assert.strictEqual(attemptsRes.statusCode, 200);
      assert.ok(attemptsRes.data.attempts.length >= 1, 'Player can view their own attempts');

      // 4. Verify player CANNOT access admin endpoint (still 403 Forbidden!)
      const adminRes = await makeRequest({
        path: '/api/admin/overview',
        cookie: playerCookie,
      });
      assert.strictEqual(adminRes.statusCode, 403, 'Player cannot access admin endpoint (403)');

      // 5. Verify unauthenticated request to /api/quizzes/attempts/my returns 401
      const unauthAttempts = await makeRequest({
        path: '/api/quizzes/attempts/my',
      });
      assert.strictEqual(unauthAttempts.statusCode, 401);
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

runQuizTests().catch((err) => {
  console.error('Fatal quiz test error:', err);
  process.exit(1);
});
