/**
 * PassForge — main.js
 * Application controller: wires up all UI interactions,
 * manages state, orchestrates generation and display.
 */

'use strict';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
const State = {
  // Current password
  password:   '',
  mode:       'classic',       // 'classic' | 'memorable' | 'artistic'
  theme:      PF.THEMES[0],   // active personality theme
  artisticStyle: 'symmetric',

  // Classic options
  classic: {
    length:           20,
    uppercase:        true,
    lowercase:        true,
    numbers:          true,
    symbols:          true,
    excludeAmbiguous: false,
  },

  // Memorable options
  memorable: {
    wordCount:   4,
    separator:   '-',
    capitalize:  true,
    addNumbers:  true,
    addSymbol:   true,
  },

  // Password history (max 10)
  history: PF.lsGet('pf_history', []),

  // Dark/light mode
  darkMode: true,

  // Toast timeout handle
  _toastTimer: null,
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  loadPersistedState();
  initThemeToggle();
  initModeToggle();
  initClassicControls();
  initMemorableControls();
  initArtisticControls();
  initThemeGrid();
  initActionButtons();
  initTestPassword();
  renderHistory();
  initParticleCanvas();

  // Initial generation
  generate();
});

// ─── LOAD PERSISTED STATE ──────────────────────────────────────
function loadPersistedState() {
  const saved = PF.lsGet('pf_state', null);
  if (saved) {
    if (saved.classic)   Object.assign(State.classic, saved.classic);
    if (saved.memorable) Object.assign(State.memorable, saved.memorable);
    if (saved.darkMode !== undefined) State.darkMode = saved.darkMode;
    if (saved.theme) {
      const t = PF.THEMES.find(t => t.id === saved.theme);
      if (t) State.theme = t;
    }
    if (saved.artisticStyle) State.artisticStyle = saved.artisticStyle;
  }

  // Apply dark mode
  if (!State.darkMode) {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
    PF.$('theme-icon-dark').classList.add('hidden');
    PF.$('theme-icon-light').classList.remove('hidden');
  }
}

// ─── SAVE STATE ────────────────────────────────────────────────
const saveState = PF.debounce(() => {
  PF.lsSet('pf_state', {
    classic:   State.classic,
    memorable: State.memorable,
    darkMode:  State.darkMode,
    theme:     State.theme.id,
    artisticStyle: State.artisticStyle,
  });
  PF.lsSet('pf_history', State.history);
}, 400);

// ═══════════════════════════════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════════════════════════════
function initThemeToggle() {
  PF.$('theme-toggle').addEventListener('click', () => {
    State.darkMode = !State.darkMode;
    document.documentElement.classList.toggle('dark',  State.darkMode);
    document.documentElement.classList.toggle('light', !State.darkMode);
    PF.$('theme-icon-dark').classList.toggle('hidden',  !State.darkMode);
    PF.$('theme-icon-light').classList.toggle('hidden', State.darkMode);
    saveState();
  });
}

// ═══════════════════════════════════════════════════════════════
// MODE TOGGLE (Classic / Memorable / Artistic)
// ═══════════════════════════════════════════════════════════════
function initModeToggle() {
  const tabs = document.querySelectorAll('.mode-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      switchMode(mode);
    });
  });
}

function switchMode(mode) {
  State.mode = mode;

  // Update tab UI
  document.querySelectorAll('.mode-tab').forEach(t => {
    const isActive = t.dataset.mode === mode;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive);
  });

  // Show/hide panels
  const classicControls = PF.$('panel-classic');
  const memorablePanel  = PF.$('panel-memorable');
  const artisticPanel   = PF.$('panel-artistic');

  if (classicControls)  classicControls.classList.toggle('hidden', mode !== 'classic');
  if (memorablePanel)   memorablePanel.classList.toggle('hidden',  mode !== 'memorable');
  if (artisticPanel)    artisticPanel.classList.toggle('hidden',   mode !== 'artistic');

  generate();
}

// ═══════════════════════════════════════════════════════════════
// CLASSIC CONTROLS
// ═══════════════════════════════════════════════════════════════
function initClassicControls() {
  // Length slider
  const slider = PF.$('length-slider');
  const display = PF.$('length-value');

  slider.value = State.classic.length;
  display.textContent = State.classic.length;

  slider.addEventListener('input', () => {
    State.classic.length = parseInt(slider.value, 10);
    display.textContent = slider.value;
    _animateLengthBadge();
    generate();
    saveState();
  });

  // Checkboxes
  const checkboxMap = [
    ['toggle-uppercase', 'uppercase'],
    ['toggle-lowercase', 'lowercase'],
    ['toggle-numbers',   'numbers'],
    ['toggle-symbols',   'symbols'],
    ['toggle-ambiguous', 'excludeAmbiguous'],
  ];

  checkboxMap.forEach(([id, key]) => {
    const el = PF.$(id);
    if (!el) return;
    el.checked = State.classic[key];
    el.addEventListener('change', () => {
      // Prevent all checkboxes being unchecked
      const checked = ['uppercase','lowercase','numbers','symbols']
        .filter(k => k !== key && State.classic[k]);
      if (!el.checked && key !== 'excludeAmbiguous' && checked.length === 0) {
        el.checked = true;
        showToast('⚠️', 'At least one character set must be enabled');
        return;
      }
      State.classic[key] = el.checked;
      generate();
      saveState();
    });
  });
}

function _animateLengthBadge() {
  const badge = document.querySelector('.length-badge');
  if (!badge) return;
  badge.style.transform = 'scale(1.15)';
  setTimeout(() => { badge.style.transform = ''; }, 200);
}

// ═══════════════════════════════════════════════════════════════
// MEMORABLE CONTROLS
// ═══════════════════════════════════════════════════════════════
function initMemorableControls() {
  const wc  = PF.$('word-count');
  const sep = PF.$('word-separator');
  const cap = PF.$('phrase-capitalize');
  const num = PF.$('phrase-numbers');
  const sym = PF.$('phrase-symbols');

  if (wc)  { wc.value  = State.memorable.wordCount;  wc.addEventListener('change', () => { State.memorable.wordCount = parseInt(wc.value); generate(); saveState(); }); }
  if (sep) { sep.value = State.memorable.separator;  sep.addEventListener('change', () => { State.memorable.separator = sep.value; generate(); saveState(); }); }
  if (cap) { cap.checked = State.memorable.capitalize;  cap.addEventListener('change', () => { State.memorable.capitalize = cap.checked; generate(); saveState(); }); }
  if (num) { num.checked = State.memorable.addNumbers;  num.addEventListener('change', () => { State.memorable.addNumbers = num.checked; generate(); saveState(); }); }
  if (sym) { sym.checked = State.memorable.addSymbol;   sym.addEventListener('change', () => { State.memorable.addSymbol = sym.checked; generate(); saveState(); }); }
}

// ═══════════════════════════════════════════════════════════════
// ARTISTIC CONTROLS
// ═══════════════════════════════════════════════════════════════
function initArtisticControls() {
  const btns = document.querySelectorAll('.artistic-style-btn');
  btns.forEach(btn => {
    if (btn.dataset.style === State.artisticStyle) {
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
    }
    btn.addEventListener('click', () => {
      btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-checked', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      State.artisticStyle = btn.dataset.style;
      generate();
      saveState();
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// PERSONALITY THEME GRID
// ═══════════════════════════════════════════════════════════════
function initThemeGrid() {
  const grid = PF.$('theme-grid');
  if (!grid) return;

  PF.THEMES.forEach(theme => {
    const btn = document.createElement('button');
    btn.className = 'theme-btn' + (theme.id === State.theme.id ? ' active' : '');
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', theme.id === State.theme.id ? 'true' : 'false');
    btn.setAttribute('aria-label', `${theme.name} theme`);
    btn.style.setProperty('--theme-btn-accent', theme.accent);
    btn.innerHTML = `
      <span class="theme-emoji">${theme.emoji}</span>
      <span class="theme-name">${theme.name}</span>
    `;
    btn.addEventListener('click', () => selectTheme(theme, btn));
    grid.appendChild(btn);
  });

  // Apply initial theme
  applyTheme(State.theme);
}

function selectTheme(theme, clickedBtn) {
  State.theme = theme;

  // Update button states
  document.querySelectorAll('.theme-btn').forEach(b => {
    const isActive = b === clickedBtn;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-checked', isActive);
  });

  applyTheme(theme);
  generate();
  saveState();
}

function applyTheme(theme) {
  PF.setCSSVar('--theme-accent', theme.accent);
  PF.setCSSVar('--theme-glow',   theme.glow);
  PF.setCSSVar('--orb-1', theme.orb1 || 'rgba(85,55,240,0.12)');
  PF.setCSSVar('--orb-2', theme.orb2 || 'rgba(85,170,255,0.08)');
}

// ═══════════════════════════════════════════════════════════════
// ACTION BUTTONS
// ═══════════════════════════════════════════════════════════════
function initActionButtons() {
  // Generate
  PF.$('btn-generate').addEventListener('click', () => {
    generate();
    _animateGenerateBtn();
  });

  // Surprise
  PF.$('btn-surprise').addEventListener('click', () => {
    doSurprise();
  });

  // Copy
  PF.$('btn-copy').addEventListener('click', () => {
    copyPassword();
  });

  // Clear history
  PF.$('btn-clear-history').addEventListener('click', () => {
    State.history = [];
    renderHistory();
    PF.lsSet('pf_history', []);
    showToast('🗑️', 'History cleared');
  });

  // Keyboard shortcut: Space or Enter to generate (when no input focused)
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      generate();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !window.getSelection().toString()) {
      e.preventDefault();
      copyPassword();
    }
  });
}

function _animateGenerateBtn() {
  const btn = PF.$('btn-generate');
  if (!btn) return;
  const svg = btn.querySelector('svg');
  if (svg) {
    svg.style.transform = 'rotate(180deg)';
    svg.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => { svg.style.transform = ''; }, 400);
  }
}

// ═══════════════════════════════════════════════════════════════
// GENERATION ENGINE
// ═══════════════════════════════════════════════════════════════
function generate() {
  let password = '';

  switch (State.mode) {
    case 'classic':
      password = PF.generateClassic({
        ...State.classic,
        symbolSet: State.theme.symbolSet,
      });
      break;

    case 'memorable':
      password = PF.generatePassphrase(State.memorable);
      break;

    case 'artistic':
      password = PF.generateArtistic(State.artisticStyle, {
        ...State.classic,
        symbolSet: State.theme.symbolSet || PF.CHARSETS.symbols,
      });
      break;
  }

  State.password = password;
  displayPassword(password);

  // Analyze and update meters
  const analysis = PF.analyzePassword(password);
  PF.updateStrengthMeter(analysis);

  // Update entropy display
  const eb = PF.$('entropy-value');
  if (eb) {
    let entropy = analysis.entropy;
    // For memorable, override with phrase entropy
    if (State.mode === 'memorable') {
      entropy = PF.passphraseEntropy(
        State.memorable.wordCount,
        State.memorable.addNumbers,
        State.memorable.addSymbol
      );
      eb.textContent = entropy;
    }
  }

  // Add to history
  addToHistory(password, analysis);
}

// ═══════════════════════════════════════════════════════════════
// SURPRISE MODE
// ═══════════════════════════════════════════════════════════════
function doSurprise() {
  const { mode, theme, length } = PF.generateSurprise();

  // Switch theme
  const themeBtn = Array.from(document.querySelectorAll('.theme-btn'))
    .find(b => b.querySelector('.theme-name')?.textContent === theme.name);
  if (themeBtn) selectTheme(theme, themeBtn);

  // Switch mode
  switchMode(mode);

  // Update length if classic
  if (mode === 'classic') {
    State.classic.length = length;
    const slider = PF.$('length-slider');
    const display = PF.$('length-value');
    if (slider)  slider.value = length;
    if (display) display.textContent = length;
  }

  generate();
  showToast('✨', 'Surprise password generated!');
}

// ═══════════════════════════════════════════════════════════════
// PASSWORD DISPLAY
// ═══════════════════════════════════════════════════════════════
function displayPassword(password) {
  const container = PF.$('password-text');
  if (!container) return;

  // Build colored spans for each character
  const fragment = document.createDocumentFragment();
  [...password].forEach((char, i) => {
    const span = document.createElement('span');
    span.textContent = char;
    const cls = PF.charClass(char);
    span.className = `char-${cls} char-reveal`;
    span.style.animationDelay = `${Math.min(i * 12, 200)}ms`;
    fragment.appendChild(span);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
}

// ═══════════════════════════════════════════════════════════════
// COPY PASSWORD
// ═══════════════════════════════════════════════════════════════
async function copyPassword(text) {
  const pw = text || State.password;
  if (!pw) return;

  const ok = await PF.copyToClipboard(pw);
  if (!ok) {
    showToast('✗', 'Copy failed — try selecting manually');
    return;
  }

  // Animate copy button
  const btn   = PF.$('btn-copy');
  const copy  = PF.$('copy-icon');
  const check = PF.$('check-icon');
  const label = PF.$('copy-label');

  if (btn)   btn.classList.add('copied');
  if (copy)  copy.classList.add('hidden');
  if (check) check.classList.remove('hidden');
  if (label) label.textContent = 'Copied!';

  showToast('✓', 'Password copied to clipboard');

  setTimeout(() => {
    if (btn)   btn.classList.remove('copied');
    if (copy)  copy.classList.remove('hidden');
    if (check) check.classList.add('hidden');
    if (label) label.textContent = 'Copy';
  }, 2000);
}

// ═══════════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════════
function addToHistory(password, analysis) {
  // Avoid consecutive duplicates
  if (State.history[0]?.password === password) return;

  State.history.unshift({
    password,
    score:   analysis.score,
    color:   analysis.level.color,
    time:    Date.now(),
  });

  // Limit to 10
  if (State.history.length > 10) State.history.pop();

  renderHistory();
  saveState();
}

function renderHistory() {
  const list  = PF.$('history-list');
  const empty = PF.$('history-empty');
  if (!list) return;

  if (State.history.length === 0) {
    list.innerHTML = '';
    if (empty) {
      empty.style.display = '';
      list.appendChild(empty);
    }
    return;
  }

  // Remove empty state
  if (empty) empty.style.display = 'none';

  // Keep track of existing cards to avoid full re-render
  const existingIds = new Set(
    Array.from(list.querySelectorAll('.history-card')).map(el => el.dataset.id)
  );

  // Prepend new entries
  const existingPasswords = new Set(
    Array.from(list.querySelectorAll('.history-password')).map(el => el.textContent)
  );

  list.innerHTML = '';
  State.history.forEach((entry, i) => {
    const card = createHistoryCard(entry, i);
    list.appendChild(card);
  });
}

function createHistoryCard(entry, idx) {
  const card = document.createElement('div');
  card.className = 'history-card';
  card.dataset.id = `${entry.time}`;

  const timeStr = PF.formatTime(new Date(entry.time));

  card.innerHTML = `
    <div class="history-strength-dot" style="background:${entry.color}; box-shadow: 0 0 6px ${entry.color}88;" aria-hidden="true"></div>
    <div class="history-password" title="${entry.password}" aria-label="Password: ${entry.password.replace(/./g, '*')}">${entry.password}</div>
    <div class="history-meta">
      <span class="history-time">${timeStr}</span>
      <button class="history-copy-btn" aria-label="Copy this password" title="Copy">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </div>
  `;

  // Copy button
  card.querySelector('.history-copy-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    copyPassword(entry.password);
  });

  // Click card to use as current password
  card.addEventListener('click', () => {
    State.password = entry.password;
    displayPassword(entry.password);
    const analysis = PF.analyzePassword(entry.password);
    PF.updateStrengthMeter(analysis);
    showToast('↑', 'Password loaded');
  });

  return card;
}

// ═══════════════════════════════════════════════════════════════
// TEST PASSWORD
// ═══════════════════════════════════════════════════════════════
function initTestPassword() {
  const input = PF.$('test-password-input');
  const visBtn = PF.$('test-visibility-toggle');
  const eyeOpen   = PF.$('eye-open');
  const eyeClosed = PF.$('eye-closed');

  if (!input) return;

  const handleInput = PF.debounce(() => {
    const val = input.value;
    if (!val) {
      const result = PF.$('test-result');
      if (result) result.classList.add('hidden');
      return;
    }
    const analysis = PF.analyzePassword(val);
    PF.updateTestMeter(analysis);
  }, 150);

  input.addEventListener('input', handleInput);

  // Visibility toggle
  visBtn?.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    eyeOpen?.classList.toggle('hidden',  isPassword);
    eyeClosed?.classList.toggle('hidden', !isPassword);
  });
}

// ═══════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════
function showToast(icon, message) {
  const toast   = PF.$('toast');
  const iconEl  = PF.$('toast-icon');
  const msgEl   = PF.$('toast-message');

  if (!toast) return;

  if (iconEl) iconEl.textContent = icon;
  if (msgEl)  msgEl.textContent  = message;

  toast.classList.remove('hide');
  toast.classList.add('show');

  clearTimeout(State._toastTimer);
  State._toastTimer = setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.classList.remove('show', 'hide'), 300);
  }, 2200);
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE CANVAS
// ═══════════════════════════════════════════════════════════════
function initParticleCanvas() {
  const canvas = PF.$('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h, particles, raf;

  function resize() {
    w = canvas.width  = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createParticles() {
    const count = Math.min(40, Math.floor(w * h / 40000));
    particles = Array.from({ length: count }, () => ({
      x:  Math.random() * w,
      y:  Math.random() * h,
      r:  Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      a:  Math.random() * 0.4 + 0.05,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    const isDark = !document.documentElement.classList.contains('light');
    const color  = isDark ? '160, 160, 255' : '80, 80, 200';

    particles.forEach(p => {
      p.x = (p.x + p.vx + w) % w;
      p.y = (p.y + p.vy + h) % h;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${p.a})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(draw);
  }

  const onResize = PF.debounce(() => {
    resize();
    createParticles();
  }, 200);

  window.addEventListener('resize', onResize);
  resize();
  createParticles();
  draw();

  // Pause when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else draw();
  });
}
