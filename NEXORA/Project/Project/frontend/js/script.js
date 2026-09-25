'use strict';

//////////////Utility funcs

function animateCounter(element, start, end, duration) {
  if (!element) return;

  const numStart = Number(start) || 0;
  const numEnd = Number(end) || 0;

  if (isNaN(numEnd)) {
    element.textContent = end || '0';
    return;
  }

  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    element.textContent = Math.floor(progress * (numEnd - numStart) + numStart);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.textContent = numEnd;
    }
  };
  window.requestAnimationFrame(step);
}

//////////////////for auth
function getUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);
    if (!user || !user.id) {
      localStorage.removeItem('user');
      return null;
    }
    return user;
  } catch (err) {
    localStorage.removeItem('user');
    return null;
  }
}

function isLoggedIn() {
  return getUser() !== null;
}

function logout() {
  localStorage.removeItem('user');
  sessionStorage.removeItem('redirect_after_login');
  fetch('http://127.0.0.1:5000/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
}

/////////////////////login logout button//////////
function updateNavbarAuthState() {
  const user = getUser();

  const loginBtn  = document.getElementById('nav-login-btn');
  const logoutBtn = document.getElementById('nav-logout-btn');
  const greeting  = document.getElementById('nav-user-greeting');
  const adminLink = document.getElementById('nav-admin-link');
  const isAdmin = Boolean(user && (
    user.role === 'admin' ||
    user.is_admin === true ||
    user.is_admin === 1 ||
    user.is_admin === '1'
  ));

  if (loginBtn)  loginBtn.style.display  = user ? 'none' : '';
  if (logoutBtn) logoutBtn.style.display = user ? '' : 'none';
  if (adminLink) adminLink.style.display = isAdmin ? '' : 'none';

  if (greeting) {
    greeting.style.display = user ? '' : 'none';
    if (user) greeting.textContent = 'Hi, ' + user.full_name;
  }
}

updateNavbarAuthState();

const navLogoutBtn = document.getElementById('nav-logout-btn');
if (navLogoutBtn) {
  navLogoutBtn.addEventListener('click', () => {
    logout();
    updateNavbarAuthState();
    window.location.href = 'index.html';
  });
}

const PAGE_MAP = {
  home: 'index.html',
  assessment: 'assessment.html',
  chatbot: 'chatbot.html',
  psychologists: 'psychologists.html',
  admin: 'admin.html',
  login: 'auth.html',
};

function goToPage(pageId) {
  if (pageId === 'assessment' && !isLoggedIn()) {
    sessionStorage.setItem('redirect_after_login', 'assessment.html');
    window.location.href = 'auth.html';
    return;
  }
  const target = PAGE_MAP[pageId];
  if (target) window.location.href = target;
}

document.querySelectorAll('[data-page]').forEach(el => {
  if (el.tagName === 'A') {
    if (el.dataset.page === 'assessment') {
      el.addEventListener('click', e => {
        if (!isLoggedIn()) {
          e.preventDefault();
          sessionStorage.setItem('redirect_after_login', 'assessment.html');
          window.location.href = 'auth.html';
        }
      });
    }
    return;
  }
  el.addEventListener('click', e => {
    e.preventDefault();
    goToPage(el.dataset.page);
  });
});

document.querySelectorAll('a[href*="assessment.html"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    if (!isLoggedIn()) {
      e.preventDefault();
      sessionStorage.setItem('redirect_after_login', 'assessment.html');
      window.location.href = 'auth.html';
    }
  });
});


const navbar = document.querySelector('.navbar-custom');

if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 24);
  }, { passive: true });
}

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

//////////////for pass
function addPasswordToggle(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const wrapper = input.closest('.input-icon-wrap');
  if (!wrapper) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'password-toggle';
  btn.setAttribute('aria-label', 'Toggle password visibility');
  btn.innerHTML = '<i class="fas fa-eye"></i>';

  btn.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
  });

  wrapper.appendChild(btn);
}

  /////////////ASSESSMENT PHQ-9,LIFESTYLE, NGROK/COLAB API, FLASK HISTORY
   

const TOTAL_QUESTIONS = 12;

function updateAssessmentProgress() {
  const answered = document.querySelectorAll(
    '.question-card input[type="radio"]:checked'
  ).length;

  const pct = Math.round((answered / TOTAL_QUESTIONS) * 100);

  const fill = document.getElementById('assessment-progress-fill');
  const label = document.getElementById('assessment-progress-label');

  if (fill) fill.style.width = pct + '%';
  if (label) {
    label.textContent = answered + ' of ' + TOTAL_QUESTIONS + ' answered';
  }
}

document.querySelectorAll('.question-card input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', () => {
    updateAssessmentProgress();
    const card = radio.closest('.question-card');
    if (card) {
      card.style.borderColor = '';
      card.style.boxShadow = '';
      card.classList.add('answered');
      card.style.animation = 'none';
      void card.offsetHeight;
      card.style.animation = 'answerPulse .4s ease';
    }
  });
});

async function saveAssessmentToBackend(phqScore, phqSeverity, lifestyleRisk) {
  const user = getUser();
  if (!user) return false;

  try {
    const response = await fetch('http://127.0.0.1:5000/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        phq_score: phqScore,
        phq_severity: phqSeverity,
        lifestyle_risk: lifestyleRisk
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to save assessment history:', data.message);
      return false;
    }

    console.log('Saved to Flask history backend:', data);
    return true;
  } catch (err) {
    console.error('Failed to save assessment history to Flask:', err);
    return false;
  }
}


function getRiskTier(label) {
  const value = (label || '').toLowerCase();
  if (value.includes('severe') || value === 'high') return 'high';
  if (value.includes('moderate')) return 'moderate';
  return 'low';
}

const RISK_TIER_LABEL = { low: 'Low Risk', moderate: 'Moderate Risk', high: 'High Risk' };

function renderHistorySkeleton(count) {
  return Array.from({ length: count || 2 }).map(() => `
    <div class="history-card skeleton">
      <div class="skeleton-line w-40"></div>
      <div class="skeleton-line w-70"></div>
      <div class="skeleton-line w-50"></div>
    </div>
  `).join('');
}


async function fetchAssessmentHistory() {
  const user = getUser();
  if (!user) return;

  const historyList = document.getElementById('history-list');
  if (!historyList) return;

  historyList.innerHTML = renderHistorySkeleton(2);

  try {
    const response = await fetch(`http://127.0.0.1:5000/api/assessments/history?user_id=${user.id}`);
    const data = await response.json();

    if (response.ok && data.history && data.history.length > 0) {
      historyList.innerHTML = data.history.map((item, index) => {
        const score = item.phq_score !== undefined ? item.phq_score : 'N/A';
        const severity = item.phq_severity || 'N/A';
        const risk = item.lifestyle_risk || 'N/A';
        const tier = getRiskTier(severity);

        const dateObj = item.created_at ? new Date(item.created_at) : null;
        const dateStr = dateObj
          ? dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Recent';
        const timeStr = dateObj
          ? dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
          : '';

        return `
          <div class="history-card tier-${tier}" style="animation-delay:${index * 60}ms;">
            <div class="history-card-top">
              <div class="history-date">
                <i class="fas fa-calendar-day"></i>
                <span>${dateStr}${timeStr ? ' · ' + timeStr : ''}</span>
              </div>
              <span class="risk-badge tier-${tier}">${RISK_TIER_LABEL[tier]}</span>
            </div>

            <div class="history-card-body">
              <div class="history-score">
                <span class="history-score-num">${score}</span>
                <span class="history-score-label">/ 27 PHQ-9</span>
              </div>
              <div class="history-meta">
                <div class="history-meta-row">
                  <span class="history-meta-label">Severity</span>
                  <span class="history-meta-value">${severity}</span>
                </div>
                <div class="history-meta-row">
                  <span class="history-meta-label">Lifestyle</span>
                  <span class="history-meta-value">${risk}</span>
                </div>
              </div>
            </div>

            <div class="history-details">
              <p>Recorded ${dateStr}${timeStr ? ' at ' + timeStr : ''}. This is a screening signal, not a diagnosis - use it to track how you're feeling over time.</p>
            </div>

            <div class="history-actions">
              <button type="button" class="btn-history-ghost btn-view-details">
                <i class="fas fa-chevron-down"></i> View Details
              </button>
              <button type="button" class="btn-history-ghost btn-history-chat">
                <i class="fas fa-comment-dots"></i> Discuss with Chatbot
              </button>
            </div>
          </div>
        `;
      }).join('');

      historyList.querySelectorAll('.btn-view-details').forEach(btn => {
        btn.addEventListener('click', () => {
          const card = btn.closest('.history-card');
          const isExpanded = card.classList.toggle('expanded');
          btn.innerHTML = isExpanded
            ? '<i class="fas fa-chevron-up"></i> Hide Details'
            : '<i class="fas fa-chevron-down"></i> View Details';
        });
      });

      historyList.querySelectorAll('.btn-history-chat').forEach(btn => {
        btn.addEventListener('click', () => goToPage('chatbot'));
      });

    } else {
      historyList.innerHTML = `
        <div class="history-empty">
          <i class="fas fa-inbox"></i>
          <p>No past assessments found. Take your first screening above to start tracking your results.</p>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error fetching assessment history:', err);
    historyList.innerHTML = `
      <div class="history-empty history-empty-error">
        <i class="fas fa-triangle-exclamation"></i>
        <p>Unable to load past assessment history. Please try again.</p>
      </div>
    `;
  }
}

const assessmentForm = document.getElementById('assessment-form');

if (assessmentForm) {
  assessmentForm.addEventListener('submit', async e => {
    e.preventDefault();

    if (!isLoggedIn()) {
      sessionStorage.setItem('redirect_after_login', 'assessment.html');
      window.location.href = 'auth.html';
      return;
    }

    let allAnswered = true;
    let firstUnansweredCard = null;

    const answers = [];

    for (let i = 1; i <= 9; i++) {
      const selected = assessmentForm.querySelector(`input[name="q${i}"]:checked`);
      const card = assessmentForm.querySelector(`[data-question="${i}"]`);

      if (!selected) {
        allAnswered = false;
        if (card) {
          card.style.borderColor = '#f4a261';
          card.style.boxShadow = '0 0 0 3px rgba(244,162,97,.18)';
          if (!firstUnansweredCard) firstUnansweredCard = card;
        }
      } else {
        answers.push(parseInt(selected.value, 10));
        if (card) {
          card.style.borderColor = '';
          card.style.boxShadow = '';
        }
      }
    }

    const sleepSelected = assessmentForm.querySelector('input[name="sleep_quality"]:checked');
    const studySelected = assessmentForm.querySelector('input[name="study_pressure"]:checked');
    const financialSelected = assessmentForm.querySelector('input[name="financial_pressure"]:checked');

    if (!sleepSelected || !studySelected || !financialSelected) {
      allAnswered = false;
    }

    if (!allAnswered) {
      showAlert(
        'assessment-alert',
        'Please answer all assessment questions before submitting.',
        'error'
      );

      if (firstUnansweredCard) {
        firstUnansweredCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const requestData = {
      answers: answers,
      sleep_quality: parseInt(sleepSelected.value, 10),
      study_pressure: parseInt(studySelected.value, 10),
      financial_pressure: parseInt(financialSelected.value, 10)
    };

    console.log('Sending assessment payload:', requestData);

    try {
      const response = await fetch(
        'https://eastcoast-bullfight-left.ngrok-free.dev/predict',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify(requestData)
        }
      );

      const result = await response.json();
      console.log('Ngrok/Colab API response:', result);

      if (!response.ok || (result.success !== undefined && !result.success)) {
        throw new Error(result.error || 'Assessment API request failed.');
      }

      displayResult(result);

      const phqObj = result.phq9 || {};
      const phqScore = Number(
        typeof phqObj === 'object' ? (phqObj.phq_total ?? phqObj.total ?? phqObj.score ?? 0) : phqObj
      );
      const phqSeverity = phqObj.phq_severity || phqObj.severity || 'Moderate';
      const lifestyleRisk = result.lifestyle_risk || 'Low';

      const saved = await saveAssessmentToBackend(phqScore, phqSeverity, lifestyleRisk);

    
      if (saved) {
        await fetchAssessmentHistory();
      }

    } catch (error) {
      console.error('Assessment API error:', error);
      showAlert(
        'assessment-alert',
        'Unable to connect to the Google Colab server via Ngrok. Please verify that your Colab notebook and tunnel are active.',
        'error'
      );
    }
  });
}

////////////for the resutl

function displayResult(apiResult) {
  const resultSection = document.getElementById('result-section');
  const resultCard    = document.getElementById('result-card');
  const resultIcon    = document.getElementById('result-icon');
  const resultTitle   = document.getElementById('result-title');
  const resultDesc    = document.getElementById('result-desc');
  const resultScore   = document.getElementById('result-score');
  const resultLevel   = document.getElementById('result-level');
  const suggestionsEl = document.getElementById('suggestions');

  if (!resultSection) return;

  const phqObj = apiResult.phq9 || {};
  const phqScore = Number(
    typeof phqObj === 'object' ? (phqObj.phq_total ?? phqObj.total ?? phqObj.score ?? 0) : phqObj
  );
  const phqSeverity = phqObj.phq_severity || phqObj.severity || 'Moderate';
  const suicideRisk = phqObj.suicide_risk_flag || false;

  let riskClass;
  let title;
  let description;
  let icon;

  switch (phqSeverity) {
    case 'Minimal':
      riskClass = 'low-risk';
      title = 'Minimal Depressive Symptoms';
      description = 'Your PHQ-9 responses indicate minimal depressive symptoms. Continue maintaining healthy habits and monitor how you feel.';
      icon = 'fa-smile-beam';
      break;

    case 'Mild':
      riskClass = 'low-risk';
      title = 'Mild Depressive Symptoms';
      description = 'Your PHQ-9 responses indicate mild depressive symptoms. Consider supportive self-care strategies and monitor your wellbeing.';
      icon = 'fa-smile';
      break;

    case 'Moderate':
      riskClass = 'high-risk';
      title = 'Moderate Depressive Symptoms';
      description = 'Your PHQ-9 responses indicate moderate depressive symptoms. Consider speaking with a qualified mental health professional.';
      icon = 'fa-meh';
      break;

    case 'Moderately Severe':
      riskClass = 'high-risk';
      title = 'Moderately Severe Depressive Symptoms';
      description = 'Your PHQ-9 responses indicate moderately severe depressive symptoms. Professional mental health support is recommended.';
      icon = 'fa-sad-tear';
      break;

    case 'Severe':
      riskClass = 'high-risk';
      title = 'Severe Depressive Symptoms';
      description = 'Your PHQ-9 responses indicate severe depressive symptoms. Please seek professional mental health support promptly.';
      icon = 'fa-heart-broken';
      break;

    default:
      riskClass = 'low-risk';
      title = 'Assessment Complete';
      description = 'Your PHQ-9 assessment has been completed.';
      icon = 'fa-chart-bar';
  }

  if (resultCard) resultCard.className = 'result-card ' + riskClass;
  if (resultIcon) resultIcon.innerHTML = `<i class="fas ${icon}"></i>`;
  if (resultTitle) resultTitle.textContent = title;
  if (resultDesc) resultDesc.textContent = description;
  if (resultLevel) resultLevel.textContent = 'PHQ-9 Score — ' + phqSeverity;

  if (suicideRisk && resultDesc) {
    resultDesc.textContent += ' Your response to the self-harm question indicates that additional support should be sought promptly.';
  }

  const lifestyleRisk = apiResult.lifestyle_risk || 'Low';

  let lifestyleResult = document.getElementById('lifestyle-result');

  if (!lifestyleResult) {
    lifestyleResult = document.createElement('div');
    lifestyleResult.id = 'lifestyle-result';
    lifestyleResult.className = 'suggestion-card mt-3';

    const suggestionsContainer = document.querySelector('#result-section .row');
    if (suggestionsContainer) {
      suggestionsContainer.parentNode.insertBefore(lifestyleResult, suggestionsContainer);
    } else {
      resultSection.appendChild(lifestyleResult);
    }
  }

  lifestyleResult.innerHTML = `
    <div style="font-size:.75rem; text-transform:uppercase; letter-spacing:.08em; color:var(--text-soft); margin-bottom:.35rem;">
      Supplementary Lifestyle-Based Risk
    </div>
    <h4 style="margin-bottom:.5rem;">
      Lifestyle Risk: <strong>${lifestyleRisk}</strong>
    </h4>
    <p style="color:var(--text-mid); margin-bottom:0;">
      This is a supplementary machine-learning indicator based on lifestyle factors. It is not a diagnosis.
    </p>
  `;

  const lowSuggestions = [
    { icon: 'fa-leaf', text: 'Practice mindful breathing for 5-10 minutes daily' },
    { icon: 'fa-walking', text: 'Take a 20-minute walk in natural light each day' },
    { icon: 'fa-moon', text: 'Maintain a consistent sleep schedule' },
    { icon: 'fa-book-open', text: 'Keep a daily gratitude or mood journal' },
    { icon: 'fa-users', text: 'Connect with a trusted friend or family member' },
    { icon: 'fa-music', text: 'Engage in hobbies that bring you joy' }
  ];

  const highSuggestions = [
    { icon: 'fa-user-md', text: 'Speak with a licensed psychologist or therapist' },
    { icon: 'fa-phone', text: 'Contact a mental health helpline if you need immediate support' },
    { icon: 'fa-hands-helping', text: 'Let someone you trust know how you are feeling' },
    { icon: 'fa-bed', text: 'Prioritise rest, nutrition, and gentle movement' },
    { icon: 'fa-comments', text: 'Try talking to our AI support chatbot for guidance' }
  ];

  const suggestions = riskClass === 'low-risk' ? lowSuggestions : highSuggestions;

  if (suggestionsEl) {
    suggestionsEl.innerHTML = suggestions
      .map(s => `<li><i class="fas ${s.icon}"></i><span>${s.text}</span></li>`)
      .join('');
  }

  resultSection.style.display = 'block';
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (resultScore) {
    animateCounter(resultScore, 0, phqScore, 1100);
  }
}

  ////////// Psychologists Page

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    const filterValue = chip.getAttribute('data-filter');

    document.querySelectorAll('.col-xl-4.col-md-6').forEach(cardWrapper => {
      if (!cardWrapper.querySelector('.doctor-card')) return;

      if (filterValue === 'all') {
        cardWrapper.style.display = 'block';
      } else {
        const categories = cardWrapper.getAttribute('data-categories') || '';
        if (categories.toLowerCase().includes(filterValue.toLowerCase())) {
          cardWrapper.style.display = 'block';
        } else {
          cardWrapper.style.display = 'none';
        }
      }
    });
  });
});

//////////Login plus signup

const authTabs   = document.querySelectorAll('.auth-tab');
const loginForm  = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.target;
    if (loginForm)  loginForm.style.display  = (target === 'login')  ? 'block' : 'none';
    if (signupForm) signupForm.style.display = (target === 'signup') ? 'block' : 'none';
    hideAlert('login-alert');
    hideAlert('signup-alert');
  });
});

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setFieldState(input, valid, message) {
  if (!input) return false;
  const fb = input.parentElement.nextElementSibling
    || input.closest('.form-group')?.querySelector('.invalid-feedback');

  input.classList.toggle('is-invalid', !valid);
  input.classList.toggle('is-valid', valid);

  if (!valid && fb && fb.classList.contains('invalid-feedback')) {
    fb.textContent = message;
  }
  return valid;
}

function attachBlurValidation(input, validatorFn) {
  if (!input) return;
  input.addEventListener('blur', () => {
    if (input.value) validatorFn(input);
  });
  input.addEventListener('input', () => {
    if (input.classList.contains('is-invalid')) {
      input.classList.remove('is-invalid');
      input.classList.remove('is-valid');
    }
  });
}

if (loginForm) {
  const emailEl = loginForm.querySelector('#login-email');
  const passEl  = loginForm.querySelector('#login-password');

  attachBlurValidation(emailEl, el => setFieldState(el, validateEmail(el.value), 'Enter a valid email address.'));
  attachBlurValidation(passEl,  el => setFieldState(el, el.value.length >= 6, 'Password must be at least 6 characters.'));

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v1 = setFieldState(emailEl, validateEmail(emailEl.value), 'Enter a valid email address.');
    const v2 = setFieldState(passEl,  passEl.value.length >= 6,     'Password must be at least 6 characters.');

    if (v1 && v2) {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailEl.value.trim(),
            password: passEl.value
          })
        });

        const data = await response.json();

        if (response.ok) {
          showAlert('login-alert', `<i class="fas fa-check-circle me-2"></i>${data.message}`, 'success');

          localStorage.setItem('user', JSON.stringify(data.user));
          updateNavbarAuthState();

          const redirectTarget = sessionStorage.getItem('redirect_after_login');
          if (redirectTarget) {
            sessionStorage.removeItem('redirect_after_login');
            setTimeout(() => {
              window.location.href = redirectTarget;
            }, 1000);
          } else {
            setTimeout(() => {
              goToPage('home');
            }, 1000);
          }

        } else {
          showAlert('login-alert', `<i class="fas fa-exclamation-circle me-2"></i>${data.message}`, 'error');
        }
      } catch (err) {
        console.error('Login error:', err);
        showAlert('login-alert', '<i class="fas fa-exclamation-circle me-2"></i>Unable to connect to authentication server.', 'error');
      }
    } else {
      showAlert('login-alert', '<i class="fas fa-exclamation-circle me-2"></i>Please fix the errors below.', 'error');
    }
  });
}

if (signupForm) {
  const nameEl    = signupForm.querySelector('#signup-name');
  const emailEl   = signupForm.querySelector('#signup-email');
  const passEl    = signupForm.querySelector('#signup-password');
  const confirmEl = signupForm.querySelector('#signup-confirm');

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v1 = setFieldState(nameEl,    nameEl.value.trim().length >= 2, 'Please enter your full name.');
    const v2 = setFieldState(emailEl,   validateEmail(emailEl.value),    'Enter a valid email address.');
    const v3 = setFieldState(passEl,    passEl.value.length >= 8,        'Password must be at least 8 characters.');
    const v4 = setFieldState(confirmEl, confirmEl.value === passEl.value, 'Passwords do not match.');

    if (v1 && v2 && v3 && v4) {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: nameEl.value.trim(),
            email: emailEl.value.trim(),
            password: passEl.value
          })
        });

        const data = await response.json();

        if (response.ok) {
          showAlert('signup-alert', `<i class="fas fa-check-circle me-2"></i>${data.message}`, 'success');

          setTimeout(() => {
            authTabs.forEach(t => t.classList.remove('active'));
            const loginTab = document.querySelector('[data-target="login"]');
            if (loginTab) loginTab.classList.add('active');
            if (loginForm)  loginForm.style.display  = 'block';
            if (signupForm) signupForm.style.display = 'none';
          }, 2000);
        } else {
          showAlert('signup-alert', `<i class="fas fa-exclamation-circle me-2"></i>${data.message}`, 'error');
        }
      } catch (err) {
        console.error('Signup error:', err);
        showAlert('signup-alert', '<i class="fas fa-exclamation-circle me-2"></i>Unable to connect to server.', 'error');
      }
    }
  });
}

////////////////////forgot password

const forgotForm = document.getElementById('forgot-form');
const forgotLink = document.getElementById('forgot-password-link');
const backToLoginLink = document.getElementById('back-to-login-link');

if (forgotLink) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (loginForm) loginForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'block';
    authTabs.forEach(t => t.classList.remove('active'));
    hideAlert('login-alert');
    hideAlert('signup-alert');
    hideAlert('forgot-alert');
  });
}

if (backToLoginLink) {
  backToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (forgotForm) forgotForm.style.display = 'none';
    const loginTab = document.querySelector('.auth-tab[data-target="login"]');
    if (loginTab) loginTab.click();
  });
}

authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    if (forgotForm) forgotForm.style.display = 'none';
  });
});

if (forgotForm) {
  const fEmail = forgotForm.querySelector('#forgot-email');
  const fPass  = forgotForm.querySelector('#forgot-password');
  const fConf  = forgotForm.querySelector('#forgot-confirm');

  attachBlurValidation(fEmail, el => setFieldState(el, validateEmail(el.value), 'Enter a valid email address.'));
  attachBlurValidation(fPass,  el => setFieldState(el, el.value.length >= 6, 'Password must be at least 6 characters.'));
  attachBlurValidation(fConf,  el => setFieldState(el, el.value === fPass.value, 'Passwords do not match.'));

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v1 = setFieldState(fEmail, validateEmail(fEmail.value), 'Enter a valid email address.');
    const v2 = setFieldState(fPass,  fPass.value.length >= 6, 'Password must be at least 6 characters.');
    const v3 = setFieldState(fConf,  fConf.value === fPass.value && fConf.value.length >= 6, 'Passwords do not match.');

    if (!v1 || !v2 || !v3) {
      showAlert('forgot-alert', '<i class="fas fa-exclamation-circle me-2"></i>Please fill in all fields correctly.', 'error');
      return;
    }

    const submitBtn = forgotForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating password...';
    }

    try {
      const resp = await fetch('http://127.0.0.1:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fEmail.value.trim(), new_password: fPass.value })
      });
      const data = await resp.json();

      if (resp.ok) {
        showAlert('forgot-alert', `<i class="fas fa-check-circle me-2"></i>${data.message || 'Password reset successfully!'}`, 'success');
        setTimeout(() => {
          const resetEmail = fEmail.value.trim();
          forgotForm.reset();
          forgotForm.style.display = 'none';
          const loginTab = document.querySelector('.auth-tab[data-target="login"]');
          if (loginTab) loginTab.click();
          const loginEmail = document.getElementById('login-email');
          if (loginEmail) loginEmail.value = resetEmail;
          showAlert('login-alert', '<i class="fas fa-check-circle me-2"></i>Password updated! Please log in with your new password.', 'success');
        }, 1400);
      } else {
        showAlert('forgot-alert', `<i class="fas fa-exclamation-circle me-2"></i>${data.message || 'Password reset failed.'}`, 'error');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      showAlert('forgot-alert', '<i class="fas fa-exclamation-triangle me-2"></i>Unable to connect to authentication server.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });
}


function showAlert(id, html, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = html;
  el.className = `alert-custom alert-${type} show`;
  setTimeout(() => { el.classList.remove('show'); }, 5000);
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

//////////////Button for psychologist
document.querySelectorAll('.btn-contact').forEach(btn => {
  btn.addEventListener('click', () => {
    goToPage('chatbot');
  });
});

///////////////button for result page
const talkToChatBtn = document.getElementById('talk-to-chat-btn');
if (talkToChatBtn) talkToChatBtn.addEventListener('click', () => goToPage('chatbot'));

const retakeBtn = document.getElementById('retake-btn');
if (retakeBtn) {
  retakeBtn.addEventListener('click', () => {
    document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
    document.querySelectorAll('.question-card').forEach(c => {
      c.style.borderColor = '';
      c.style.boxShadow   = '';
      c.classList.remove('answered');
    });
    const rs = document.getElementById('result-section');
    if (rs) rs.style.display = 'none';
    updateAssessmentProgress();
    const af = document.getElementById('assessment-form');
    if (af) af.scrollIntoView({ behavior: 'smooth' });
  });
}


document.addEventListener('DOMContentLoaded', () => {
  const isAssessmentPage = window.location.pathname.includes('assessment.html');

  if (isAssessmentPage && !isLoggedIn()) {
    sessionStorage.setItem('redirect_after_login', 'assessment.html');
    window.location.href = 'auth.html';
    return;
  }

  updateAssessmentProgress();

  ['login-password', 'signup-password', 'signup-confirm'].forEach(addPasswordToggle);

  const viewHistoryBtn = document.getElementById('view-history-btn');
  const historySection = document.getElementById('history-section');

  if (viewHistoryBtn && isLoggedIn()) {
    viewHistoryBtn.style.display = 'inline-block';

    viewHistoryBtn.addEventListener('click', () => {
      if (historySection) {
        const isHidden = historySection.style.display === 'none' || !historySection.style.display;
        if (isHidden) {
          fetchAssessmentHistory();
          historySection.style.display = 'block';
          viewHistoryBtn.innerHTML = '<i class="fas fa-eye-slash me-1"></i> Hide Past Results';
        } else {
          historySection.style.display = 'none';
          viewHistoryBtn.innerHTML = '<i class="fas fa-history me-1"></i> View Past Results';
        }
      }
    });
  }

  document.querySelectorAll('.step-card, .doctor-card, .suggestion-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    revealObserver.observe(el);
  });

  const revealStyle = document.createElement('style');
  revealStyle.textContent = `.visible { opacity: 1 !important; transform: translateY(0) !important; }`;
  document.head.appendChild(revealStyle);

  document.querySelectorAll('.doctor-card').forEach((card, i) => {
    card.style.transitionDelay = (i * 0.06) + 's';
  });
});