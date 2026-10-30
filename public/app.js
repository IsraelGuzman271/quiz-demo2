// Quiz Demo - Phase 1 Foundation, Phase 2 Quiz Engine, Phase 3 Attempts/History & Phase 4 Leaderboards/Admin Tools

let currentUser = null;
let activeQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {}; // map: questionId -> selectedIndex (0-3)
let autoAdvanceTimer = null;
let currentLbType = 'overall'; // 'overall' or 'quiz'
let cachedQuizzes = [];

// DOM Elements - Shell & Tabs
const tabQuizzesBtn = document.getElementById('tabQuizzesBtn');
const tabLeaderboardsBtn = document.getElementById('tabLeaderboardsBtn');
const tabHistoryBtn = document.getElementById('tabHistoryBtn');
const tabAdminBtn = document.getElementById('tabAdminBtn');
const tabAuthRolesBtn = document.getElementById('tabAuthRolesBtn');

const quizEngineSection = document.getElementById('quizEngineSection');
const leaderboardSection = document.getElementById('leaderboardSection');
const historySection = document.getElementById('historySection');
const adminSection = document.getElementById('adminSection');
const authRolesSection = document.getElementById('authRolesSection');

const dbStatusBadge = document.getElementById('dbStatusBadge');
const userHeaderWidget = document.getElementById('userHeaderWidget');
const notificationArea = document.getElementById('notificationArea');

// DOM Elements - Quiz Engine Views
const quizCatalogView = document.getElementById('quizCatalogView');
const quizListGrid = document.getElementById('quizListGrid');
const playerAssignedQuizzesContainer = document.getElementById('playerAssignedQuizzesContainer');
const playerAssignedList = document.getElementById('playerAssignedList');
const assignedQuizzesCountBadge = document.getElementById('assignedQuizzesCountBadge');

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
const resultsViewHistoryBtn = document.getElementById('resultsViewHistoryBtn');
const chooseAnotherQuizBtn = document.getElementById('chooseAnotherQuizBtn');
const resultsQuestionsList = document.getElementById('resultsQuestionsList');

// DOM Elements - Leaderboard Section (Phase 4)
const lbTypeOverallBtn = document.getElementById('lbTypeOverallBtn');
const lbTypeQuizBtn = document.getElementById('lbTypeQuizBtn');
const perQuizSelectorWrap = document.getElementById('perQuizSelectorWrap');
const lbQuizSelect = document.getElementById('lbQuizSelect');
const refreshLeaderboardBtn = document.getElementById('refreshLeaderboardBtn');
const leaderboardTitle = document.getElementById('leaderboardTitle');
const leaderboardSubtitle = document.getElementById('leaderboardSubtitle');
const lbParticipantCount = document.getElementById('lbParticipantCount');
const leaderboardThead = document.getElementById('leaderboardThead');
const leaderboardTbody = document.getElementById('leaderboardTbody');

// DOM Elements - History Section (Phase 3)
const historyGuestBanner = document.getElementById('historyGuestBanner');
const historySignInBtn = document.getElementById('historySignInBtn');
const historyDashboard = document.getElementById('historyDashboard');
const histStatCompleted = document.getElementById('histStatCompleted');
const histStatAvg = document.getElementById('histStatAvg');
const histStatBest = document.getElementById('histStatBest');
const histStatMastered = document.getElementById('histStatMastered');
const historyShowIncompleteCheckbox = document.getElementById('historyShowIncompleteCheckbox');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
const historyTableBody = document.getElementById('historyTableBody');

// DOM Elements - Attempt Review Modal (Phase 4)
const attemptReviewModal = document.getElementById('attemptReviewModal');
const modalQuizTitle = document.getElementById('modalQuizTitle');
const modalAttemptMeta = document.getElementById('modalAttemptMeta');
const modalScoreDisplay = document.getElementById('modalScoreDisplay');
const modalDateDisplay = document.getElementById('modalDateDisplay');
const modalStatusBadge = document.getElementById('modalStatusBadge');
const modalQuestionsBreakdown = document.getElementById('modalQuestionsBreakdown');
const closeAttemptModalBtn = document.getElementById('closeAttemptModalBtn');
const modalDoneBtn = document.getElementById('modalDoneBtn');

// DOM Elements - Admin Tools (Phase 4)
const adminSubtabQuestionsBtn = document.getElementById('adminSubtabQuestionsBtn');
const adminSubtabAssignmentsBtn = document.getElementById('adminSubtabAssignmentsBtn');
const adminSubtabCsvBtn = document.getElementById('adminSubtabCsvBtn');

const adminQuestionsPanel = document.getElementById('adminQuestionsPanel');
const adminAssignmentsPanel = document.getElementById('adminAssignmentsPanel');
const adminCsvPanel = document.getElementById('adminCsvPanel');

const adminQuizFilter = document.getElementById('adminQuizFilter');
const openNewQuestionBtn = document.getElementById('openNewQuestionBtn');
const adminQuestionFormWrap = document.getElementById('adminQuestionFormWrap');
const questionFormTitle = document.getElementById('questionFormTitle');
const cancelQuestionFormBtn = document.getElementById('cancelQuestionFormBtn');
const cancelQuestionSaveBtn = document.getElementById('cancelQuestionSaveBtn');
const adminQuestionForm = document.getElementById('adminQuestionForm');
const adminEditQuestionId = document.getElementById('adminEditQuestionId');
const adminQuestionTargetQuiz = document.getElementById('adminQuestionTargetQuiz');
const adminQuestionText = document.getElementById('adminQuestionText');
const adminOpt0 = document.getElementById('adminOpt0');
const adminOpt1 = document.getElementById('adminOpt1');
const adminOpt2 = document.getElementById('adminOpt2');
const adminOpt3 = document.getElementById('adminOpt3');
const adminQuestionExplanation = document.getElementById('adminQuestionExplanation');
const adminQuestionsTableBody = document.getElementById('adminQuestionsTableBody');

const toggleNewAssignmentBtn = document.getElementById('toggleNewAssignmentBtn');
const newAssignmentFormWrap = document.getElementById('newAssignmentFormWrap');
const createAssignmentForm = document.getElementById('createAssignmentForm');
const assignTargetUser = document.getElementById('assignTargetUser');
const assignTargetQuiz = document.getElementById('assignTargetQuiz');
const assignDueDate = document.getElementById('assignDueDate');
const assignNote = document.getElementById('assignNote');
const cancelAssignBtn = document.getElementById('cancelAssignBtn');
const adminAssignmentsTableBody = document.getElementById('adminAssignmentsTableBody');

const loadSampleCsvBtn = document.getElementById('loadSampleCsvBtn');
const csvFileInput = document.getElementById('csvFileInput');
const csvTextInput = document.getElementById('csvTextInput');
const previewCsvBtn = document.getElementById('previewCsvBtn');
const importCsvBtn = document.getElementById('importCsvBtn');
const clearCsvBtn = document.getElementById('clearCsvBtn');
const csvValidationReportWrap = document.getElementById('csvValidationReportWrap');
const csvReportSummary = document.getElementById('csvReportSummary');
const csvReportBadges = document.getElementById('csvReportBadges');
const csvErrorListContainer = document.getElementById('csvErrorListContainer');
const csvErrorList = document.getElementById('csvErrorList');
const csvValidPreviewContainer = document.getElementById('csvValidPreviewContainer');
const csvPreviewTableBody = document.getElementById('csvPreviewTableBody');

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

// Tab Switching Helper
function switchTab(tab) {
  tabQuizzesBtn.classList.toggle('active', tab === 'quizzes');
  tabLeaderboardsBtn.classList.toggle('active', tab === 'leaderboards');
  tabHistoryBtn.classList.toggle('active', tab === 'history');
  tabAdminBtn.classList.toggle('active', tab === 'admin');
  tabAuthRolesBtn.classList.toggle('active', tab === 'auth');

  quizEngineSection.classList.toggle('hidden', tab !== 'quizzes');
  leaderboardSection.classList.toggle('hidden', tab !== 'leaderboards');
  historySection.classList.toggle('hidden', tab !== 'history');
  adminSection.classList.toggle('hidden', tab !== 'admin');
  authRolesSection.classList.toggle('hidden', tab !== 'auth');

  if (tab === 'quizzes') {
    loadQuizzes();
    loadPlayerAssignments();
  } else if (tab === 'leaderboards') {
    loadLeaderboard();
  } else if (tab === 'history') {
    loadPlayerHistory();
  } else if (tab === 'admin') {
    loadAdminQuestions();
    loadAdminAssignments();
  }
}

tabQuizzesBtn.addEventListener('click', () => switchTab('quizzes'));
tabLeaderboardsBtn.addEventListener('click', () => switchTab('leaderboards'));
tabHistoryBtn.addEventListener('click', () => switchTab('history'));
tabAdminBtn.addEventListener('click', () => switchTab('admin'));
tabAuthRolesBtn.addEventListener('click', () => switchTab('auth'));
historySignInBtn.addEventListener('click', () => switchTab('auth'));
resultsViewHistoryBtn.addEventListener('click', () => switchTab('history'));

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
// PHASE 2: QUIZ ENGINE & AUTO-ADVANCE
// ==========================================

// 1. Load Quiz Catalog
async function loadQuizzes() {
  quizListGrid.innerHTML = '<div class="card-loading">Loading quizzes from PostgreSQL...</div>';
  try {
    const res = await fetch('/api/quizzes');
    if (!res.ok) throw new Error('Failed to fetch quizzes');
    const data = await res.json();
    cachedQuizzes = data.quizzes || [];

    // Populate quiz dropdowns across leaderboard and admin forms
    populateQuizDropdowns(cachedQuizzes);

    if (cachedQuizzes.length === 0) {
      quizListGrid.innerHTML = '<p class="text-muted">No quizzes available.</p>';
      return;
    }

    quizListGrid.innerHTML = cachedQuizzes.map((q) => `
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

// Populate Quiz Dropdowns
function populateQuizDropdowns(quizzes) {
  const optionsHtml = quizzes.map((q) => `<option value="${escapeHtml(q.id)}">${escapeHtml(q.title)}</option>`).join('');

  if (lbQuizSelect) lbQuizSelect.innerHTML = optionsHtml;
  if (adminQuizFilter) adminQuizFilter.innerHTML = optionsHtml;
  if (adminQuestionTargetQuiz) adminQuestionTargetQuiz.innerHTML = optionsHtml;
  if (assignTargetQuiz) assignTargetQuiz.innerHTML = optionsHtml;
}

// Player Assigned Quizzes
async function loadPlayerAssignments() {
  if (!currentUser) {
    playerAssignedQuizzesContainer.classList.add('hidden');
    return;
  }

  try {
    const res = await fetch('/api/player/assignments');
    if (!res.ok) return;
    const data = await res.json();
    const assignments = data.assignments || [];

    if (assignments.length === 0) {
      playerAssignedQuizzesContainer.classList.add('hidden');
      return;
    }

    playerAssignedQuizzesContainer.classList.remove('hidden');
    const pendingCount = assignments.filter((a) => !a.completed).length;
    assignedQuizzesCountBadge.textContent = `${pendingCount} Pending`;

    playerAssignedList.innerHTML = assignments.map((a) => {
      const isDone = a.completed;
      const statusBadge = isDone
        ? '<span class="status-tag status-tag-completed">Completed ✓</span>'
        : '<span class="status-tag status-tag-incomplete">Assigned / In Progress</span>';
      const dueText = a.due_date ? `Due: ${new Date(a.due_date).toLocaleDateString()}` : 'No due date';

      return `
        <div class="assigned-item">
          <div>
            <strong>${escapeHtml(a.quiz_title)}</strong>
            <span class="badge badge-player" style="margin-left:0.5rem;">${escapeHtml(a.category)}</span>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.25rem;">
              ${escapeHtml(dueText)} ${a.note ? `• Note: "${escapeHtml(a.note)}"` : ''}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            ${statusBadge}
            <button class="btn btn-sm btn-primary" onclick="startQuiz('${escapeHtml(a.quiz_id)}')">
              ${isDone ? 'Retake Quiz' : 'Start Quiz &rarr;'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Error loading assignments:', e);
  }
}

// 2. Start Quiz Flow
window.startQuiz = async function (quizId) {
  try {
    switchTab('quizzes');
    showNotification('Loading quiz challenge...', 'info');
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
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
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

  if (currentSelected !== undefined) {
    answeredStatusText.textContent = `Selected: Option ${optionLetters[currentSelected]}`;
    answeredStatusText.style.color = '#34d399';
  } else {
    answeredStatusText.textContent = 'Select an option to answer (auto-advances)';
    answeredStatusText.style.color = 'var(--text-muted)';
  }

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

// 5. Select Answer Choice (With Auto-Advance)
window.selectAnswer = function (questionId, optionIndex) {
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
  userAnswers[questionId] = optionIndex;
  renderCurrentQuestion();

  // If there are more questions, automatically advance after a brief visual cue
  if (activeQuiz && currentQuestionIndex < activeQuiz.questions.length - 1) {
    autoAdvanceTimer = setTimeout(() => {
      currentQuestionIndex++;
      renderCurrentQuestion();
    }, 320);
  } else {
    // Last question answered: highlight submit button
    submitQuizBtn.style.animation = 'pulse 1s ease-in-out';
  }
};

// 6. Navigation Controls
prevQuestionBtn.addEventListener('click', () => {
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderCurrentQuestion();
  }
});

nextQuestionBtn.addEventListener('click', () => {
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
  if (activeQuiz && currentQuestionIndex < activeQuiz.questions.length - 1) {
    currentQuestionIndex++;
    renderCurrentQuestion();
  }
});

// Exit Quiz
exitQuizBtn.addEventListener('click', async () => {
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);
  if (activeQuiz && Object.keys(userAnswers).length > 0) {
    const answeredCount = Object.keys(userAnswers).length;
    const confirmExit = window.confirm(
      `You have answered ${answeredCount} question(s). Exiting now will abandon this attempt (unfinished attempts will not count as completed).\n\nExit quiz?`
    );
    if (!confirmExit) return;

    try {
      await fetch(`/api/quizzes/${activeQuiz.id}/abandon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partialAnswers: userAnswers }),
      });
    } catch (e) {
      // ignore
    }
  }

  quizTakingView.classList.add('hidden');
  quizResultsView.classList.add('hidden');
  quizCatalogView.classList.remove('hidden');
  activeQuiz = null;
  loadQuizzes();
});

// 7. Submit Quiz Answers
submitQuizBtn.addEventListener('click', async () => {
  if (!activeQuiz) return;
  if (autoAdvanceTimer) clearTimeout(autoAdvanceTimer);

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
    if (currentUser) {
      loadPlayerHistory();
      loadPlayerAssignments();
    }
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
          <span style="font-weight:700; width:25px;">${optionLetters[optIdx]}:</span>
          <span>${icon}${escapeHtml(optText)}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="result-question-card ${itemClass}">
        <div class="breakdown-q-header">
          <span class="breakdown-q-num">Question ${idx + 1}</span>
          ${statusBadge}
        </div>
        <p class="breakdown-q-text">${escapeHtml(r.question)}</p>
        <div class="breakdown-options-list">
          ${optionsHtml}
        </div>
        ${r.explanation ? `
          <div class="breakdown-explanation">
            <strong>Explanation:</strong> ${escapeHtml(r.explanation)}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// 9. Retry and Reset
retryQuizBtn.addEventListener('click', () => {
  if (activeQuiz) {
    startQuiz(activeQuiz.id);
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
// PHASE 4: LEADERBOARDS ENGINE
// ==========================================

async function loadLeaderboard() {
  leaderboardTbody.innerHTML = '<tr><td colspan="6" class="table-loading">Loading live leaderboard from database...</td></tr>';

  if (currentLbType === 'overall') {
    leaderboardTitle.textContent = 'Overall Quiz Masters';
    leaderboardSubtitle.textContent = 'Ranked by total completed quizzes. Incomplete attempts excluded. Ties broken by highest average accuracy, then earliest completion.';
    leaderboardThead.innerHTML = `
      <tr>
        <th style="width: 70px;">Rank</th>
        <th>Player</th>
        <th>Total Completed</th>
        <th>Average Accuracy</th>
        <th>Top Percentage</th>
        <th>Last Active</th>
      </tr>
    `;

    try {
      const res = await fetch('/api/leaderboard/overall');
      if (!res.ok) throw new Error('Failed to fetch overall leaderboard');
      const data = await res.json();
      const rows = data.leaderboard || [];

      lbParticipantCount.textContent = `${rows.length} Competitors`;

      if (rows.length === 0) {
        leaderboardTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">No completed quiz attempts recorded yet. Take a quiz to appear on the leaderboard!</td></tr>';
        return;
      }

      leaderboardTbody.innerHTML = rows.map((r) => {
        const rankClass = r.rank === 1 ? 'rank-1' : r.rank === 2 ? 'rank-2' : r.rank === 3 ? 'rank-3' : 'rank-default';
        const lastActive = r.lastCompleted ? new Date(r.lastCompleted).toLocaleDateString() : '--';
        const isCurrent = currentUser && currentUser.username === r.username;

        return `
          <tr style="${isCurrent ? 'background: rgba(59, 130, 246, 0.15); font-weight:600;' : ''}">
            <td><span class="rank-badge ${rankClass}">#${r.rank}</span></td>
            <td><strong>${escapeHtml(r.username)}</strong> ${isCurrent ? '<span class="badge badge-player" style="font-size:0.7rem;">You</span>' : ''}</td>
            <td><strong>${r.totalCompleted}</strong></td>
            <td>${r.avgPercentage}%</td>
            <td>${r.bestPercentage}%</td>
            <td style="font-size:0.8rem; color:var(--text-muted);">${lastActive}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      leaderboardTbody.innerHTML = '<tr><td colspan="6" class="table-error">Failed to load overall leaderboard.</td></tr>';
    }
  } else {
    // Per-Quiz Leaderboard
    const quizId = lbQuizSelect.value || (cachedQuizzes[0] && cachedQuizzes[0].id) || 'soccer';
    const selectedQuiz = cachedQuizzes.find((q) => q.id === quizId);
    const quizTitle = selectedQuiz ? selectedQuiz.title : quizId;

    leaderboardTitle.textContent = `${quizTitle} Rankings`;
    leaderboardSubtitle.textContent = 'Ranked by highest score achieved on this quiz. Incomplete attempts excluded. Shows completed attempt count.';
    leaderboardThead.innerHTML = `
      <tr>
        <th style="width: 70px;">Rank</th>
        <th>Player</th>
        <th>Highest Score</th>
        <th>Best Accuracy</th>
        <th>Completed Attempts</th>
        <th>Achieved At</th>
      </tr>
    `;

    try {
      const res = await fetch(`/api/leaderboard/quiz/${quizId}`);
      if (!res.ok) throw new Error('Failed to fetch quiz leaderboard');
      const data = await res.json();
      const rows = data.leaderboard || [];

      lbParticipantCount.textContent = `${rows.length} Competitors`;

      if (rows.length === 0) {
        leaderboardTbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">No completed attempts for "${escapeHtml(quizTitle)}" yet. Be the first to conquer it!</td></tr>`;
        return;
      }

      leaderboardTbody.innerHTML = rows.map((r) => {
        const rankClass = r.rank === 1 ? 'rank-1' : r.rank === 2 ? 'rank-2' : r.rank === 3 ? 'rank-3' : 'rank-default';
        const achievedDate = r.achievedAt ? new Date(r.achievedAt).toLocaleDateString() : '--';
        const isCurrent = currentUser && currentUser.username === r.username;

        return `
          <tr style="${isCurrent ? 'background: rgba(59, 130, 246, 0.15); font-weight:600;' : ''}">
            <td><span class="rank-badge ${rankClass}">#${r.rank}</span></td>
            <td><strong>${escapeHtml(r.username)}</strong> ${isCurrent ? '<span class="badge badge-player" style="font-size:0.7rem;">You</span>' : ''}</td>
            <td><strong>${r.highestScore} / ${r.totalQuestions}</strong></td>
            <td><strong>${r.highestPercentage}%</strong></td>
            <td>${r.completedAttemptsCount}</td>
            <td style="font-size:0.8rem; color:var(--text-muted);">${achievedDate}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      leaderboardTbody.innerHTML = '<tr><td colspan="6" class="table-error">Failed to load quiz leaderboard.</td></tr>';
    }
  }
}

lbTypeOverallBtn.addEventListener('click', () => {
  currentLbType = 'overall';
  lbTypeOverallBtn.classList.add('active');
  lbTypeQuizBtn.classList.remove('active');
  perQuizSelectorWrap.classList.add('hidden');
  loadLeaderboard();
});

lbTypeQuizBtn.addEventListener('click', () => {
  currentLbType = 'quiz';
  lbTypeQuizBtn.classList.add('active');
  lbTypeOverallBtn.classList.remove('active');
  perQuizSelectorWrap.classList.remove('hidden');
  loadLeaderboard();
});

lbQuizSelect.addEventListener('change', () => {
  if (currentLbType === 'quiz') {
    loadLeaderboard();
  }
});

refreshLeaderboardBtn.addEventListener('click', loadLeaderboard);

// ==========================================
// PHASE 3 & 4: ATTEMPT HISTORY & REVIEW
// ==========================================

async function loadPlayerHistory() {
  if (!currentUser) {
    historyGuestBanner.classList.remove('hidden');
    historyDashboard.classList.add('hidden');
    return;
  }

  historyGuestBanner.classList.add('hidden');
  historyDashboard.classList.remove('hidden');
  historyTableBody.innerHTML = '<tr><td colspan="8" class="table-loading">Loading your history from PostgreSQL...</td></tr>';

  try {
    const includeIncomplete = historyShowIncompleteCheckbox.checked;
    const res = await fetch(`/api/player/history?includeIncomplete=${includeIncomplete}`);
    if (!res.ok) {
      if (res.status === 401) {
        historyGuestBanner.classList.remove('hidden');
        historyDashboard.classList.add('hidden');
        return;
      }
      throw new Error('Failed to fetch history');
    }

    const data = await res.json();
    const stats = data.stats || { totalCompleted: 0, averagePercentage: 0, bestPercentage: 0, quizzesMastered: 0 };
    const attempts = data.attempts || [];

    // Render Stats Cards (Strictly reflects completed attempts)
    histStatCompleted.textContent = stats.totalCompleted;
    histStatAvg.textContent = `${stats.averagePercentage}%`;
    histStatBest.textContent = `${stats.bestPercentage}%`;
    histStatMastered.textContent = stats.quizzesMastered;

    if (attempts.length === 0) {
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No quiz attempts recorded yet.
            <div style="margin-top: 0.75rem;">
              <button class="btn btn-sm btn-primary" onclick="switchTab('quizzes')">Take Your First Quiz</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    historyTableBody.innerHTML = attempts.map((a) => {
      const isCompleted = a.status === 'completed';
      const statusClass = isCompleted ? 'status-tag-completed' : 'status-tag-incomplete';
      const statusLabel = isCompleted ? 'Completed' : 'Incomplete';
      const completedDate = new Date(a.completed_at);
      const formattedDate = `${completedDate.toLocaleDateString()} ${completedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      return `
        <tr>
          <td>#${a.id}</td>
          <td><strong>${escapeHtml(a.quiz_title)}</strong></td>
          <td><span class="badge badge-player">${escapeHtml(a.category || 'General')}</span></td>
          <td>${a.score} / ${a.total_questions}</td>
          <td><strong>${a.percentage}%</strong></td>
          <td><span class="status-tag ${statusClass}">${statusLabel}</span></td>
          <td style="font-size:0.8rem; color: var(--text-muted);">${formattedDate}</td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn-sm btn-primary" onclick="reviewAttempt(${a.id})" title="Review questions & explanations">Review</button>
              <button class="btn-sm btn-ghost" onclick="startQuiz('${escapeHtml(a.quiz_id)}')" title="Take quiz again">Retry</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    historyTableBody.innerHTML = '<tr><td colspan="8" class="table-error">Failed to load history from database.</td></tr>';
  }
}

// Review Historical Attempt (Modal)
window.reviewAttempt = async function (attemptId) {
  try {
    showNotification('Loading attempt breakdown...', 'info');
    const res = await fetch(`/api/quizzes/attempts/${attemptId}/review`);
    if (!res.ok) {
      const err = await res.json();
      showNotification(err.error || 'Failed to retrieve attempt review.', 'error');
      return;
    }

    const data = await res.json();
    const attempt = data.attempt;

    modalQuizTitle.textContent = `${attempt.quizTitle} Review`;
    modalAttemptMeta.textContent = `Attempt #${attempt.id} • Category: ${attempt.category} • Difficulty: ${attempt.difficulty}`;
    modalScoreDisplay.textContent = `${attempt.score} / ${attempt.totalQuestions} (${attempt.percentage}%)`;
    modalDateDisplay.textContent = `Completed: ${new Date(attempt.completedAt).toLocaleString()}`;
    modalStatusBadge.textContent = attempt.status.toUpperCase();
    modalStatusBadge.className = attempt.status === 'completed' ? 'badge badge-player' : 'badge badge-admin';

    const optionLetters = ['A', 'B', 'C', 'D'];
    modalQuestionsBreakdown.innerHTML = attempt.results.map((r, idx) => {
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
            <span style="font-weight:700; width:25px;">${optionLetters[optIdx]}:</span>
            <span>${icon}${escapeHtml(optText)}</span>
          </div>
        `;
      }).join('');

      return `
        <div class="result-question-card ${itemClass}">
          <div class="breakdown-q-header">
            <span class="breakdown-q-num">Question ${idx + 1}</span>
            ${statusBadge}
          </div>
          <p class="breakdown-q-text">${escapeHtml(r.question)}</p>
          <div class="breakdown-options-list">
            ${optionsHtml}
          </div>
          ${r.explanation ? `
            <div class="breakdown-explanation">
              <strong>Explanation:</strong> ${escapeHtml(r.explanation)}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    attemptReviewModal.classList.remove('hidden');
  } catch (err) {
    showNotification('Network error loading attempt review.', 'error');
  }
};

function closeAttemptModal() {
  attemptReviewModal.classList.add('hidden');
}

closeAttemptModalBtn.addEventListener('click', closeAttemptModal);
modalDoneBtn.addEventListener('click', closeAttemptModal);
attemptReviewModal.addEventListener('click', (e) => {
  if (e.target === attemptReviewModal) closeAttemptModal();
});

refreshHistoryBtn.addEventListener('click', loadPlayerHistory);
historyShowIncompleteCheckbox.addEventListener('change', loadPlayerHistory);

// ==========================================
// PHASE 4: ADMIN MANAGEMENT SUITE
// ==========================================

// Admin Subtabs
adminSubtabQuestionsBtn.addEventListener('click', () => switchAdminSubtab('questions'));
adminSubtabAssignmentsBtn.addEventListener('click', () => switchAdminSubtab('assignments'));
adminSubtabCsvBtn.addEventListener('click', () => switchAdminSubtab('csv'));

function switchAdminSubtab(subtab) {
  adminSubtabQuestionsBtn.classList.toggle('active', subtab === 'questions');
  adminSubtabAssignmentsBtn.classList.toggle('active', subtab === 'assignments');
  adminSubtabCsvBtn.classList.toggle('active', subtab === 'csv');

  adminQuestionsPanel.classList.toggle('hidden', subtab !== 'questions');
  adminAssignmentsPanel.classList.toggle('hidden', subtab !== 'assignments');
  adminCsvPanel.classList.toggle('hidden', subtab !== 'csv');

  if (subtab === 'questions') loadAdminQuestions();
  if (subtab === 'assignments') loadAdminAssignments();
}

// 1. Question Editor
async function loadAdminQuestions() {
  if (!currentUser || currentUser.role !== 'admin') return;

  const quizId = adminQuizFilter.value || (cachedQuizzes[0] && cachedQuizzes[0].id) || 'soccer';
  adminQuestionsTableBody.innerHTML = '<tr><td colspan="5" class="table-loading">Loading questions...</td></tr>';

  try {
    const res = await fetch(`/api/admin/quizzes/${quizId}/questions`);
    if (!res.ok) throw new Error('Failed to load questions');
    const data = await res.json();
    const questions = data.questions || [];

    if (questions.length === 0) {
      adminQuestionsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No questions in this quiz yet. Click "+ Add Question" to create one.</td></tr>';
      return;
    }

    const letters = ['A', 'B', 'C', 'D'];
    adminQuestionsTableBody.innerHTML = questions.map((q, idx) => {
      const optionsHtml = q.options.map((opt, i) => {
        const isCorrect = i === q.correctIndex;
        return `<div style="${isCorrect ? 'color:#34d399; font-weight:700;' : 'color:var(--text-muted);'}">
          ${letters[i]}: ${escapeHtml(opt)} ${isCorrect ? '✓' : ''}
        </div>`;
      }).join('');

      return `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${escapeHtml(q.question)}</strong></td>
          <td style="font-size:0.8rem;">${optionsHtml}</td>
          <td style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(q.explanation || 'None')}</td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn-sm btn-outline" onclick="editQuestion('${escapeHtml(q.id)}')">Edit</button>
              <button class="btn-sm btn-outline-danger" onclick="deleteQuestion('${escapeHtml(q.id)}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    adminQuestionsTableBody.innerHTML = '<tr><td colspan="5" class="table-error">Failed to load quiz questions.</td></tr>';
  }
}

adminQuizFilter.addEventListener('change', loadAdminQuestions);

// Question Add/Edit Form Triggers
openNewQuestionBtn.addEventListener('click', () => {
  adminEditQuestionId.value = '';
  questionFormTitle.textContent = 'Add New Question';
  adminQuestionForm.reset();
  adminQuestionTargetQuiz.value = adminQuizFilter.value;
  adminQuestionFormWrap.classList.remove('hidden');
});

cancelQuestionFormBtn.addEventListener('click', () => adminQuestionFormWrap.classList.add('hidden'));
cancelQuestionSaveBtn.addEventListener('click', () => adminQuestionFormWrap.classList.add('hidden'));

window.editQuestion = async function (questionId) {
  try {
    const quizId = adminQuizFilter.value;
    const res = await fetch(`/api/admin/quizzes/${quizId}/questions`);
    if (!res.ok) return;
    const data = await res.json();
    const q = (data.questions || []).find((item) => item.id === questionId);
    if (!q) return;

    adminEditQuestionId.value = q.id;
    questionFormTitle.textContent = `Edit Question (${q.id})`;
    adminQuestionTargetQuiz.value = quizId;
    adminQuestionText.value = q.question;
    adminOpt0.value = q.options[0] || '';
    adminOpt1.value = q.options[1] || '';
    adminOpt2.value = q.options[2] || '';
    adminOpt3.value = q.options[3] || '';
    adminQuestionExplanation.value = q.explanation || '';

    const radio = document.querySelector(`input[name="adminCorrectRadio"][value="${q.correctIndex}"]`);
    if (radio) radio.checked = true;

    adminQuestionFormWrap.classList.remove('hidden');
    adminQuestionFormWrap.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    showNotification('Error loading question for editing.', 'error');
  }
};

window.deleteQuestion = async function (questionId) {
  if (!window.confirm(`Are you sure you want to delete question "${questionId}"?`)) return;
  try {
    const res = await fetch(`/api/admin/questions/${questionId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      showNotification(err.error || 'Failed to delete question.', 'error');
      return;
    }
    showNotification('Question deleted successfully.', 'success');
    loadAdminQuestions();
    loadQuizzes();
  } catch (err) {
    showNotification('Network error deleting question.', 'error');
  }
};

// Save Question (Create or Update)
adminQuestionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const qId = adminEditQuestionId.value;
  const quizId = adminQuestionTargetQuiz.value;
  const question = adminQuestionText.value.trim();
  const options = [
    adminOpt0.value.trim(),
    adminOpt1.value.trim(),
    adminOpt2.value.trim(),
    adminOpt3.value.trim(),
  ];
  const checkedRadio = document.querySelector('input[name="adminCorrectRadio"]:checked');
  const correctIndex = checkedRadio ? parseInt(checkedRadio.value, 10) : 0;
  const explanation = adminQuestionExplanation.value.trim();

  // Validate exactly 4 non-empty options
  if (options.some((opt) => opt === '')) {
    showNotification('All 4 options must be filled in.', 'error');
    return;
  }

  try {
    let res;
    if (qId) {
      // Update
      res = await fetch(`/api/admin/questions/${qId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options, correctIndex, explanation }),
      });
    } else {
      // Create
      res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, question, options, correctIndex, explanation }),
      });
    }

    const data = await res.json();
    if (!res.ok) {
      showNotification(data.error || 'Failed to save question.', 'error');
      return;
    }

    showNotification(qId ? 'Question updated successfully.' : 'Question created successfully.', 'success');
    adminQuestionFormWrap.classList.add('hidden');
    adminQuestionForm.reset();
    adminEditQuestionId.value = '';
    loadAdminQuestions();
    loadQuizzes();
  } catch (err) {
    showNotification('Network error saving question.', 'error');
  }
});

// 2. Quiz Assignments Management
async function loadAdminAssignments() {
  if (!currentUser || currentUser.role !== 'admin') return;

  adminAssignmentsTableBody.innerHTML = '<tr><td colspan="8" class="table-loading">Loading assignments...</td></tr>';

  try {
    const [assignRes, usersRes] = await Promise.all([
      fetch('/api/admin/assignments'),
      fetch('/api/admin/overview'),
    ]);

    if (!assignRes.ok) throw new Error('Failed to load assignments');
    const assignData = await assignRes.json();
    const assignments = assignData.assignments || [];

    if (usersRes.ok) {
      const usersData = await usersRes.json();
      const players = (usersData.users || []).filter((u) => u.role === 'player');
      assignTargetUser.innerHTML = players.map((p) => `<option value="${p.id}">${escapeHtml(p.username)} (${escapeHtml(p.email)})</option>`).join('');
    }

    if (assignments.length === 0) {
      adminAssignmentsTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No quiz assignments created yet.</td></tr>';
      return;
    }

    adminAssignmentsTableBody.innerHTML = assignments.map((a) => {
      const isDone = a.completed;
      const statusBadge = isDone
        ? '<span class="status-tag status-tag-completed">Completed ✓</span>'
        : '<span class="status-tag status-tag-incomplete">Pending</span>';
      const dueDateStr = a.due_date ? new Date(a.due_date).toLocaleDateString() : 'None';

      return `
        <tr>
          <td>#${a.id}</td>
          <td><strong>${escapeHtml(a.player_username || `User #${a.user_id}`)}</strong></td>
          <td>${escapeHtml(a.quiz_title)}</td>
          <td>${escapeHtml(a.assigned_by_username || 'Admin')}</td>
          <td>${dueDateStr}</td>
          <td>${statusBadge}</td>
          <td style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(a.note || 'None')}</td>
          <td>
            <button class="btn-sm btn-outline-danger" onclick="deleteAssignment(${a.id})">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    adminAssignmentsTableBody.innerHTML = '<tr><td colspan="8" class="table-error">Failed to load assignments.</td></tr>';
  }
}

toggleNewAssignmentBtn.addEventListener('click', () => {
  newAssignmentFormWrap.classList.toggle('hidden');
});
cancelAssignBtn.addEventListener('click', () => newAssignmentFormWrap.classList.add('hidden'));

createAssignmentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userId = assignTargetUser.value;
  const quizId = assignTargetQuiz.value;
  const dueDate = assignDueDate.value || null;
  const note = assignNote.value.trim();

  try {
    const res = await fetch('/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, quizId, dueDate, note }),
    });

    const data = await res.json();
    if (!res.ok) {
      showNotification(data.error || 'Failed to create assignment.', 'error');
      return;
    }

    showNotification(data.message || 'Assignment created successfully.', 'success');
    createAssignmentForm.reset();
    newAssignmentFormWrap.classList.add('hidden');
    loadAdminAssignments();
  } catch (err) {
    showNotification('Network error creating assignment.', 'error');
  }
});

window.deleteAssignment = async function (assignmentId) {
  if (!window.confirm('Delete this assignment?')) return;
  try {
    const res = await fetch(`/api/admin/assignments/${assignmentId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      showNotification(err.error || 'Failed to delete assignment.', 'error');
      return;
    }
    showNotification('Assignment deleted successfully.', 'success');
    loadAdminAssignments();
  } catch (err) {
    showNotification('Network error deleting assignment.', 'error');
  }
};

// 3. CSV Upload, Validation & Import
const SAMPLE_CSV = [
  'quiz_id,question,option_a,option_b,option_c,option_d,correct_choice,explanation',
  'soccer,Which country hosted the 2014 FIFA World Cup?,Brazil,Russia,South Africa,Germany,A,Brazil hosted the 2014 tournament with Germany winning the trophy.',
  'hispanic-capitals,What is the capital city of Chile?,Santiago,Valparaíso,Concepción,La Serena,A,Santiago is the capital and largest city of Chile.',
  'football,How many points is a touchdown worth in American football?,3,6,7,2,B,A touchdown is worth 6 points, followed by a PAT try.',
  'english-vocab,Which word describes an object that lasts for a very short time?,Ephemeral,Immutable,Perennial,Ubiquitous,A,Ephemeral means lasting for a very short time.',
].join('\n');

loadSampleCsvBtn.addEventListener('click', () => {
  csvTextInput.value = SAMPLE_CSV;
  showNotification('Loaded sample CSV with 4 valid multi-topic questions.', 'info');
});

clearCsvBtn.addEventListener('click', () => {
  csvTextInput.value = '';
  csvFileInput.value = '';
  csvValidationReportWrap.classList.add('hidden');
  importCsvBtn.classList.add('hidden');
});

csvFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    csvTextInput.value = event.target.result;
    showNotification(`Loaded ${file.name} into editor.`, 'info');
  };
  reader.readAsText(file);
});

let validatedCsvQuestions = [];

previewCsvBtn.addEventListener('click', async () => {
  const text = csvTextInput.value.trim();
  if (!text) {
    showNotification('Please paste CSV text or select a file first.', 'error');
    return;
  }

  previewCsvBtn.disabled = true;
  previewCsvBtn.textContent = 'Validating...';

  try {
    const res = await fetch('/api/admin/questions/csv-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText: text }),
    });

    const data = await res.json();
    if (!res.ok) {
      showNotification(data.error || 'CSV validation failed.', 'error');
      csvValidationReportWrap.classList.add('hidden');
      return;
    }

    csvValidationReportWrap.classList.remove('hidden');
    csvReportSummary.textContent = `CSV Validation Diagnostics (${data.totalRows} Total Rows Processed)`;

    csvReportBadges.innerHTML = `
      <span class="badge badge-player" style="background:rgba(16,185,129,0.2); color:#34d399;">${data.validCount} Valid</span>
      <span class="badge badge-admin" style="background:rgba(239,68,68,0.2); color:#f87171;">${data.invalidCount} Errors</span>
    `;

    validatedCsvQuestions = data.validRows || [];

    // Render Invalid Rows
    if (data.invalidRows && data.invalidRows.length > 0) {
      csvErrorListContainer.classList.remove('hidden');
      csvErrorList.innerHTML = data.invalidRows.map((item) => `
        <div class="csv-error-item">
          <strong>Line ${item.lineNumber}:</strong> ${item.errors.map(escapeHtml).join(' | ')}
          ${item.raw ? `<div style="font-family:monospace; font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">Raw: ${escapeHtml(item.raw)}</div>` : ''}
        </div>
      `).join('');
    } else {
      csvErrorListContainer.classList.add('hidden');
    }

    // Render Valid Rows Table
    if (data.validRows && data.validRows.length > 0) {
      csvValidPreviewContainer.classList.remove('hidden');
      const letters = ['A', 'B', 'C', 'D'];
      csvPreviewTableBody.innerHTML = data.validRows.map((r) => `
        <tr>
          <td>${r.lineNumber}</td>
          <td><code>${escapeHtml(r.quizId)}</code></td>
          <td><strong>${escapeHtml(r.question)}</strong></td>
          <td style="font-size:0.78rem;">${r.options.map(escapeHtml).join(' • ')}</td>
          <td><span class="badge badge-player">Option ${letters[r.correctIndex]}</span></td>
        </tr>
      `).join('');

      importCsvBtn.classList.remove('hidden');
      importCsvBtn.textContent = `Import ${data.validRows.length} Valid Question(s) &rarr;`;
    } else {
      csvValidPreviewContainer.classList.add('hidden');
      importCsvBtn.classList.add('hidden');
    }

    if (data.canImport) {
      showNotification('CSV syntax verified! 100% valid questions ready to import.', 'success');
    } else {
      showNotification(`Found ${data.invalidCount} invalid row(s). Review errors below.`, 'error');
    }
  } catch (err) {
    showNotification('Network error during CSV preview.', 'error');
  } finally {
    previewCsvBtn.disabled = false;
    previewCsvBtn.textContent = 'Preview & Validate CSV';
  }
});

importCsvBtn.addEventListener('click', async () => {
  if (!validatedCsvQuestions || validatedCsvQuestions.length === 0) {
    showNotification('No validated questions to import.', 'error');
    return;
  }

  importCsvBtn.disabled = true;
  importCsvBtn.textContent = 'Importing...';

  try {
    const res = await fetch('/api/admin/questions/csv-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: validatedCsvQuestions }),
    });

    const data = await res.json();
    if (!res.ok) {
      showNotification(data.error || 'Failed to import CSV.', 'error');
      return;
    }

    showNotification(`Success! ${data.importedCount} question(s) imported into database.`, 'success');
    csvValidationReportWrap.classList.add('hidden');
    importCsvBtn.classList.add('hidden');
    csvTextInput.value = '';
    csvFileInput.value = '';
    validatedCsvQuestions = [];
    loadAdminQuestions();
    loadQuizzes();
  } catch (err) {
    showNotification('Network error importing CSV questions.', 'error');
  } finally {
    importCsvBtn.disabled = false;
  }
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
      tabAdminBtn.classList.remove('hidden');
      adminZone.classList.remove('hidden');
      loadAdminUsers();
    } else {
      tabAdminBtn.classList.add('hidden');
      adminZone.classList.add('hidden');
    }

    loadPlayerHistory();
    loadPlayerAssignments();
  } else {
    authFormsContainer.classList.remove('hidden');
    authenticatedPanels.classList.add('hidden');
    tabAdminBtn.classList.add('hidden');
    userHeaderWidget.innerHTML = '<span class="guest-text">Guest Player</span>';
    testResultBox.classList.add('hidden');
    loadPlayerHistory();
    playerAssignedQuizzesContainer.classList.add('hidden');
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
    switchTab('quizzes');
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
    switchTab('quizzes');
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
      switchTab('quizzes');
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
