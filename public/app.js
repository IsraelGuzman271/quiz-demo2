// Quiz Demo - Phase 1 Foundation & Phase 2 Quiz Engine Client Application

let currentUser = null;
let activeQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {}; // map: questionId -> selectedIndex (0-3)

// DOM Elements - Navigation & Shell
const tabQuizzesBtn = document.getElementById('tabQuizzesBtn');
const tabAuthRolesBtn = document.getElementById('tabAuthRolesBtn');
const quizEngineSection = document.getElementById('quizEngineSection');
const authRolesSection = document.getElementById('authRolesSection');
const dbStatusBadge = document.getElementById('dbStatusBadge');
const userHeaderWidget = document.getElementById('userHeaderWidget');
const notificationArea = document.getElementById('notificationArea');

// DOM Elements - Quiz Engine Views
const quizCatalogView = document.getElementById('quizCatalogView');
const quizListGrid = document.getElementById('quizListGrid');

const quizTakingView = document.getElementById('quizTakingView');
const exitQuizBtn = document.getElementById('exitQuizBtn');
const activeQuizTitle = document.getElementById('activeQuizTitle');
const activeQuizCategory = document.getElementById('activeQuizCategory');
const activeQuizDifficulty = document.getElementById('activeQuizDifficulty');
const progressQuestionNum = document.getElementById('progressQuestionNum');
const progressPercent = document.getElementById('progressPercent');
const progressBarFill = document.getElementById('progressBarFill');
const questionNavPills = document.getElementById('questionNavPills');

const questionIndexTag = document.getElementById('questionIndexTag');
const questionPrompt = document.getElementById('questionPrompt');
const answerChoicesGrid = document.getElementById('answerChoicesGrid');
const prevQuestionBtn = document.getElementById('prevQuestionBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const submitQuizBtn = document.getElementById('submitQuizBtn');
const answeredStatusText = document.getElementById('answeredStatusText');

const quizResultsView = document.getElementById('quizResultsView');
const resultsPercentage = document.getElementById('resultsPercentage');
const resultsFraction = document.getElementById('resultsFraction');
const resultsTierBadge = document.getElementById('resultsTierBadge');
const resultsQuizTitle = document.getElementById('resultsQuizTitle');
const resultsMessageText = document.getElementById('resultsMessageText');
const retryQuizBtn = document.getElementById('retryQuizBtn');
const chooseAnotherQuizBtn = document.getElementById('chooseAnotherQuizBtn');
const resultsQuestionsList = document.getElementById('resultsQuestionsList');

// DOM Elements - Auth & Role Verification (Phase 1)
const authFormsContainer = document.getElementById('authFormsContainer');
const authenticatedPanels = document.getElementById('authenticatedPanels');
const loginForm = document.getElementById('loginForm');
const loginIdentifier = document.getElementById('loginIdentifier');
const loginPassword = document.getElementById('loginPassword');
const registerForm = document.getElementById('registerForm');
const regUsername = document.getElementById('regUsername');
const regEmail = document.getElementById('regEmail');
const regPassword = document.getElementById('regPassword');
const regRole = document.getElementById('regRole');
const quickFillPlayerBtn = document.getElementById('quickFillPlayerBtn');
const quickFillAdminBtn = document.getElementById('quickFillAdminBtn');

const bannerAvatar = document.getElementById('bannerAvatar');
const bannerUsername = document.getElementById('bannerUsername');
const bannerRoleBadge = document.getElementById('bannerRoleBadge');
const bannerEmail = document.getElementById('bannerEmail');
const logoutBtn = document.getElementById('logoutBtn');

const testPlayerEndpointBtn = document.getElementById('testPlayerEndpointBtn');
const testAdminEndpointBtn = document.getElementById('testAdminEndpointBtn');
const testResultBox = document.getElementById('testResultBox');
const resultStatusTag = document.getElementById('resultStatusTag');
const resultEndpoint = document.getElementById('resultEndpoint');
const resultBody = document.getElementById('resultBody');

const adminZone = document.getElementById('adminZone');
const adminUsersTableBody = document.getElementById('adminUsersTableBody');
const refreshUsersBtn = document.getElementById('refreshUsersBtn');
const runAdminActionBtn = document.getElementById('runAdminActionBtn');

// ==========================================
// Notifications & Utility
// ==========================================
function showNotification(message, type = 'info') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `<span>${message}</span>`;
  notificationArea.appendChild(alert);

  setTimeout(() => {
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 250);
  }, 4500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Tab Switching
tabQuizzesBtn.addEventListener('click', () => {
  tabQuizzesBtn.classList.add('active');
  tabAuthRolesBtn.classList.remove('active');
  quizEngineSection.classList.remove('hidden');
  authRolesSection.classList.add('hidden');
});

tabAuthRolesBtn.addEventListener('click', () => {
  tabAuthRolesBtn.classList.add('active');
  tabQuizzesBtn.classList.remove('active');
  authRolesSection.classList.remove('hidden');
  quizEngineSection.classList.add('hidden');
});

// Check system health & database state
async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    const data = await res.json();
    dbStatusBadge.className = 'status-pill status-connected';
    dbStatusBadge.innerHTML = `<span class="status-dot"></span><span>${data.database}</span>`;
  } catch (err) {
    dbStatusBadge.className = 'status-pill status-loading';
    dbStatusBadge.innerHTML = `<span class="status-dot"></span><span>DB Offline</span>`;
  }
}

// ==========================================
// PHASE 2: QUIZ ENGINE IMPLEMENTATION
// ==========================================

// 1. Load Quiz Catalog
async function loadQuizzes() {
  quizListGrid.innerHTML = '<div class="card-loading">Loading quizzes from PostgreSQL...</div>';
  try {
    const res = await fetch('/api/quizzes');
    if (!res.ok) throw new Error('Failed to fetch quizzes');
    const data = await res.json();
    const quizzes = data.quizzes || [];

    if (quizzes.length === 0) {
      quizListGrid.innerHTML = '<p class="text-muted">No quizzes available.</p>';
      return;
    }

    quizListGrid.innerHTML = quizzes.map((q) => `
      <div class="quiz-card">
        <div class="quiz-card-header">
          <span class="badge badge-player">${escapeHtml(q.category)}</span>
          <span class="badge ${q.difficulty === 'Hard' ? 'badge-admin' : 'badge-player'}">${escapeHtml(q.difficulty)}</span>
        </div>
        <h3 class="quiz-card-title">${escapeHtml(q.title)}</h3>
        <p class="quiz-card-desc">${escapeHtml(q.description)}</p>
        <div class="quiz-card-footer">
          <span class="quiz-question-count">${q.question_count} Questions</span>
          <button class="btn btn-sm btn-primary" onclick="startQuiz('${escapeHtml(q.id)}')">Start Quiz</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    quizListGrid.innerHTML = '<p class="alert alert-error">Failed to load quizzes from database.</p>';
  }
}

// 2. Start Quiz Flow
window.startQuiz = async function (quizId) {
  try {
    showNotification('Loading quiz questions...', 'info');
    const res = await fetch(`/api/quizzes/${quizId}`);
    if (!res.ok) {
      showNotification('Quiz could not be loaded.', 'error');
      return;
    }

    const data = await res.json();
    activeQuiz = data.quiz;
    currentQuestionIndex = 0;
    userAnswers = {};

    // Validate that questions have exactly four options
    for (const q of activeQuiz.questions) {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        showNotification(`Error: Question ${q.id} does not have exactly four options.`, 'error');
        return;
      }
    }

    // Switch views
    quizCatalogView.classList.add('hidden');
    quizResultsView.classList.add('hidden');
    quizTakingView.classList.remove('hidden');

    // Populate active quiz metadata
    activeQuizTitle.textContent = activeQuiz.title;
    activeQuizCategory.textContent = activeQuiz.category;
    activeQuizDifficulty.textContent = activeQuiz.difficulty;

    renderQuestionNavigator();
    renderCurrentQuestion();
  } catch (err) {
    showNotification('Error starting quiz.', 'error');
  }
};

// 3. Render Question Navigator Pills
function renderQuestionNavigator() {
  if (!activeQuiz) return;
  const questions = activeQuiz.questions;

  questionNavPills.innerHTML = questions.map((q, idx) => {
    const isAnswered = userAnswers[q.id] !== undefined;
    const isCurrent = idx === currentQuestionIndex;
    let classes = 'nav-pill';
    if (isCurrent) classes += ' current';
    if (isAnswered) classes += ' answered';

    return `<button class="${classes}" onclick="jumpToQuestion(${idx})">${idx + 1}</button>`;
  }).join('');
}

window.jumpToQuestion = function (idx) {
  if (!activeQuiz || idx < 0 || idx >= activeQuiz.questions.length) return;
  currentQuestionIndex = idx;
  renderQuestionNavigator();
  renderCurrentQuestion();
};

// 4. Render Current Question
function renderCurrentQuestion() {
  if (!activeQuiz) return;
  const total = activeQuiz.questions.length;
  const q = activeQuiz.questions[currentQuestionIndex];
  const optionLetters = ['A', 'B', 'C', 'D'];

  // Update progress
  progressQuestionNum.textContent = `Question ${currentQuestionIndex + 1} of ${total}`;
  const pct = Math.round(((currentQuestionIndex + 1) / total) * 100);
  progressPercent.textContent = `${pct}% Progress`;
  progressBarFill.style.width = `${pct}%`;

  questionIndexTag.textContent = `QUESTION ${currentQuestionIndex + 1} OF ${total}`;
  questionPrompt.textContent = q.question;

  const currentSelected = userAnswers[q.id];

  // Render exactly four answer choices
  answerChoicesGrid.innerHTML = q.options.map((optText, optIdx) => {
    const isSelected = currentSelected === optIdx;
    return `
      <div class="choice-option ${isSelected ? 'selected' : ''}" onclick="selectAnswer('${q.id}', ${optIdx})">
        <span class="choice-letter">${optionLetters[optIdx]}</span>
        <span class="choice-text">${escapeHtml(optText)}</span>
      </div>
    `;
  }).join('');

  // Update answer status
  if (currentSelected !== undefined) {
    answeredStatusText.textContent = `Selected: Option ${optionLetters[currentSelected]}`;
    answeredStatusText.style.color = '#34d399';
  } else {
    answeredStatusText.textContent = 'Select an option to answer';
    answeredStatusText.style.color = 'var(--text-muted)';
  }

  // Navigation button states
  prevQuestionBtn.disabled = currentQuestionIndex === 0;

  if (currentQuestionIndex === total - 1) {
    nextQuestionBtn.classList.add('hidden');
    submitQuizBtn.classList.remove('hidden');
  } else {
    nextQuestionBtn.classList.remove('hidden');
    submitQuizBtn.classList.add('hidden');
  }

  renderQuestionNavigator();
}

// 5. Select Answer Choice
window.selectAnswer = function (questionId, optionIndex) {
  userAnswers[questionId] = optionIndex;
  renderCurrentQuestion();
};

// 6. Navigation Controls
prevQuestionBtn.addEventListener('click', () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderCurrentQuestion();
  }
});

nextQuestionBtn.addEventListener('click', () => {
  if (activeQuiz && currentQuestionIndex < activeQuiz.questions.length - 1) {
    currentQuestionIndex++;
    renderCurrentQuestion();
  }
});

exitQuizBtn.addEventListener('click', () => {
  quizTakingView.classList.add('hidden');
  quizResultsView.classList.add('hidden');
  quizCatalogView.classList.remove('hidden');
  activeQuiz = null;
});

// 7. Submit Quiz Answers
submitQuizBtn.addEventListener('click', async () => {
  if (!activeQuiz) return;

  const total = activeQuiz.questions.length;
  const answeredCount = Object.keys(userAnswers).length;

  if (answeredCount < total) {
    const unanswered = total - answeredCount;
    const confirmSubmit = window.confirm(
      `You have ${unanswered} unanswered question(s). Unanswered questions will count as incorrect.\n\nDo you want to submit anyway?`
    );
    if (!confirmSubmit) return;
  }

  submitQuizBtn.disabled = true;
  submitQuizBtn.textContent = 'Grading...';

  try {
    const res = await fetch(`/api/quizzes/${activeQuiz.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: userAnswers }),
    });

    const data = await res.json();
    if (!res.ok) {
      showNotification(data.error || 'Failed to submit quiz.', 'error');
      submitQuizBtn.disabled = false;
      submitQuizBtn.textContent = 'Submit Quiz &rarr;';
      return;
    }

    showNotification(`Quiz scored: ${data.score}/${data.totalQuestions} (${data.percentage}%)`, 'success');
    renderResultsPage(data);
  } catch (err) {
    showNotification('Network error submitting quiz.', 'error');
  } finally {
    submitQuizBtn.disabled = false;
    submitQuizBtn.textContent = 'Submit Quiz &rarr;';
  }
});

// 8. Results Page & Question Breakdown
function renderResultsPage(data) {
  quizTakingView.classList.add('hidden');
  quizCatalogView.classList.add('hidden');
  quizResultsView.classList.remove('hidden');

  resultsPercentage.textContent = `${data.percentage}%`;
  resultsFraction.textContent = `${data.score} / ${data.totalQuestions} Correct`;
  resultsQuizTitle.textContent = data.quizTitle;

  if (data.percentage === 100) {
    resultsTierBadge.textContent = 'PERFECT SCORE';
    resultsTierBadge.className = 'badge badge-player';
    resultsMessageText.textContent = 'Outstanding! You achieved 100% accuracy on this challenge.';
  } else if (data.percentage >= 70) {
    resultsTierBadge.textContent = 'PASSED';
    resultsTierBadge.className = 'badge badge-player';
    resultsMessageText.textContent = `Great performance! You passed with ${data.percentage}%.`;
  } else {
    resultsTierBadge.textContent = 'NEEDS PRACTICE';
    resultsTierBadge.className = 'badge badge-admin';
    resultsMessageText.textContent = `You scored ${data.percentage}%. Review the explanations below and retry!`;
  }

  // Render question breakdown
  const optionLetters = ['A', 'B', 'C', 'D'];
  resultsQuestionsList.innerHTML = data.results.map((r, idx) => {
    const itemClass = r.isCorrect ? 'item-correct' : 'item-incorrect';
    const statusBadge = r.isCorrect
      ? '<span class="status-tag status-tag-200">CORRECT ✓</span>'
      : r.unanswered
      ? '<span class="status-tag status-tag-403">UNANSWERED ✗</span>'
      : '<span class="status-tag status-tag-403">INCORRECT ✗</span>';

    const optionsHtml = r.options.map((optText, optIdx) => {
      let optClass = 'breakdown-option-row';
      let icon = '';

      if (optIdx === r.correctIndex) {
        optClass += ' choice-actual-correct';
        icon = '✓ [Correct Answer] ';
      }
      if (optIdx === r.selectedIndex && !r.isCorrect) {
        optClass += ' choice-user-wrong';
        icon = '✗ [Your Choice] ';
      }
      if (optIdx === r.selectedIndex && r.isCorrect) {
        optClass += ' choice-user-correct';
        icon = '✓ [Your Choice] ';
      }

      return `
        <div class="${optClass}">
          <strong>${optionLetters[optIdx]}:</strong> ${escapeHtml(optText)} <span style="font-size:0.75rem; margin-left:auto;">${icon}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="breakdown-item ${itemClass}">
        <div class="breakdown-q-header">
          <span class="breakdown-q-title">Q${idx + 1}. ${escapeHtml(r.question)}</span>
          ${statusBadge}
        </div>
        <div class="breakdown-options-list">
          ${optionsHtml}
        </div>
        <div class="breakdown-explanation">
          <strong>Explanation:</strong> ${escapeHtml(r.explanation)}
        </div>
      </div>
    `;
  }).join('');
}

// 9. Retry and Re-selection Flows
retryQuizBtn.addEventListener('click', () => {
  if (activeQuiz) {
    userAnswers = {};
    currentQuestionIndex = 0;
    quizResultsView.classList.add('hidden');
    quizTakingView.classList.remove('hidden');
    renderQuestionNavigator();
    renderCurrentQuestion();
    showNotification('Quiz reset. Good luck on your retry!', 'info');
  }
});

chooseAnotherQuizBtn.addEventListener('click', () => {
  quizResultsView.classList.add('hidden');
  quizTakingView.classList.add('hidden');
  quizCatalogView.classList.remove('hidden');
  activeQuiz = null;
  loadQuizzes();
});

// ==========================================
// PHASE 1: AUTHENTICATION & ROLE MANAGEMENT
// ==========================================

function updateAuthUI(user) {
  currentUser = user;

  if (user) {
    authFormsContainer.classList.add('hidden');
    authenticatedPanels.classList.remove('hidden');

    bannerAvatar.textContent = user.username.charAt(0).toUpperCase();
    bannerUsername.textContent = user.username;
    bannerEmail.textContent = user.email || 'No email attached';

    bannerRoleBadge.textContent = user.role.toUpperCase();
    bannerRoleBadge.className = `badge badge-${user.role}`;

    userHeaderWidget.innerHTML = `
      <span>Signed in as <strong>${escapeHtml(user.username)}</strong></span>
      <span class="badge badge-${user.role}">${user.role}</span>
    `;

    if (user.role === 'admin') {
      adminZone.classList.remove('hidden');
      loadAdminUsers();
    } else {
      adminZone.classList.add('hidden');
    }
  } else {
    authFormsContainer.classList.remove('hidden');
    authenticatedPanels.classList.add('hidden');
    userHeaderWidget.innerHTML = '<span class="guest-text">Guest Player</span>';
    testResultBox.classList.add('hidden');
  }
}

async function checkSession() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      updateAuthUI(data.user);
    } else {
      updateAuthUI(null);
    }
  } catch (err) {
    updateAuthUI(null);
  }
}

// Registration
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = regUsername.value.trim();
  const email = regEmail.value.trim();
  const password = regPassword.value;
  const role = regRole.value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role }),
    });

    const data = await res.json();
    if (!res.ok) {
      showNotification(data.error || 'Registration failed.', 'error');
      return;
    }

    showNotification(`Registered successfully as ${data.user.role}!`, 'success');
    registerForm.reset();
    updateAuthUI(data.user);
  } catch (err) {
    showNotification('Network error during registration.', 'error');
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const identifier = loginIdentifier.value.trim();
  const password = loginPassword.value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      showNotification(data.error || 'Invalid login.', 'error');
      return;
    }

    showNotification(`Welcome back, ${data.user.username}!`, 'success');
    loginForm.reset();
    updateAuthUI(data.user);
  } catch (err) {
    showNotification('Network error during login.', 'error');
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      showNotification('Logged out successfully.', 'info');
      updateAuthUI(null);
    }
  } catch (err) {
    showNotification('Failed to log out.', 'error');
  }
});

// Quick Fill
quickFillPlayerBtn.addEventListener('click', () => {
  loginIdentifier.value = 'player_qa';
  loginPassword.value = 'Password123!';
  showNotification('Filled QA Player test credentials.', 'info');
});

quickFillAdminBtn.addEventListener('click', () => {
  loginIdentifier.value = 'admin_qa';
  loginPassword.value = 'AdminPass123!';
  showNotification('Filled QA Admin test credentials.', 'info');
});

// Live Role Test Endpoints
testPlayerEndpointBtn.addEventListener('click', async () => {
  await executeEndpointTest('/api/player/dashboard');
});

testAdminEndpointBtn.addEventListener('click', async () => {
  await executeEndpointTest('/api/admin/overview');
});

async function executeEndpointTest(endpoint) {
  testResultBox.classList.remove('hidden');
  resultEndpoint.textContent = endpoint;
  resultStatusTag.textContent = 'Calling...';
  resultStatusTag.className = 'status-tag';

  try {
    const res = await fetch(endpoint);
    const data = await res.json();

    resultStatusTag.textContent = `HTTP ${res.status} ${res.statusText || (res.status === 200 ? 'OK' : res.status === 403 ? 'Forbidden' : 'Error')}`;
    resultStatusTag.className = `status-tag ${res.status === 200 ? 'status-tag-200' : 'status-tag-403'}`;
    resultBody.textContent = JSON.stringify(data, null, 2);

    if (res.status === 200) {
      showNotification(`Endpoint ${endpoint} succeeded (HTTP 200).`, 'success');
    } else if (res.status === 403) {
      showNotification(`Access restriction confirmed: HTTP 403 Forbidden.`, 'error');
    }
  } catch (err) {
    resultStatusTag.textContent = 'Network Error';
    resultStatusTag.className = 'status-tag status-tag-403';
    resultBody.textContent = String(err);
  }
}

// Admin Table
async function loadAdminUsers() {
  if (!currentUser || currentUser.role !== 'admin') return;

  adminUsersTableBody.innerHTML = '<tr><td colspan="5" class="table-loading">Refreshing...</td></tr>';

  try {
    const res = await fetch('/api/admin/overview');
    if (!res.ok) {
      adminUsersTableBody.innerHTML = '<tr><td colspan="5" class="table-error">Failed to load users.</td></tr>';
      return;
    }

    const data = await res.json();
    const users = data.users || [];

    if (users.length === 0) {
      adminUsersTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No users registered yet.</td></tr>';
      return;
    }

    adminUsersTableBody.innerHTML = users.map((u) => `
      <tr>
        <td>#${u.id}</td>
        <td><strong>${escapeHtml(u.username)}</strong></td>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="badge badge-${u.role}">${u.role}</span></td>
        <td>${new Date(u.created_at).toLocaleDateString()} ${new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
      </tr>
    `).join('');
  } catch (err) {
    adminUsersTableBody.innerHTML = '<tr><td colspan="5" class="table-error">Error connecting to database.</td></tr>';
  }
}

refreshUsersBtn.addEventListener('click', loadAdminUsers);

runAdminActionBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/admin/system-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionName: 'database_integrity_ping' }),
    });

    const data = await res.json();
    if (res.ok) {
      showNotification(data.message, 'success');
    } else {
      showNotification(data.error || 'Action failed.', 'error');
    }
  } catch (err) {
    showNotification('Network error executing admin action.', 'error');
  }
});

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  checkHealth();
  checkSession();
  loadQuizzes();
});
