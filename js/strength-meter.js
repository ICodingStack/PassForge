/**
 * PassForge — strength-meter.js
 * Real-time password strength analysis and visual meter updates.
 *
 * Scoring model considers:
 *  - Length                  (0–30 pts)
 *  - Character set diversity (0–40 pts)
 *  - Pattern penalties       (−0 to −30 pts)
 *  - Entropy bonus           (0–30 pts)
 */

'use strict';

// ─── STRENGTH LEVELS ──────────────────────────────────────────
const STRENGTH_LEVELS = [
  { label: 'Weak',      min: 0,  class: 's-weak',      color: '#f04444', icon: '🔓', segments: 1 },
  { label: 'Fair',      min: 25, class: 's-fair',      color: '#f09044', icon: '🔒', segments: 2 },
  { label: 'Good',      min: 45, class: 's-good',      color: '#f0d044', icon: '🔒', segments: 3 },
  { label: 'Strong',    min: 65, class: 's-strong',    color: '#44c47a', icon: '🛡️', segments: 4 },
  { label: 'Excellent', min: 82, class: 's-excellent', color: '#44ddcc', icon: '⚡', segments: 5 },
];

// ─── MAIN ANALYSIS FUNCTION ────────────────────────────────────
/**
 * Analyse a password and return a comprehensive score object.
 *
 * @param {string} password
 * @returns {{
 *   score:     number,   // 0–100
 *   level:     object,   // one of STRENGTH_LEVELS
 *   entropy:   number,   // bits
 *   criteria: {
 *     length:  boolean,
 *     upper:   boolean,
 *     lower:   boolean,
 *     number:  boolean,
 *     symbol:  boolean,
 *     entropy: boolean,
 *   },
 *   stats: {
 *     length: number,
 *     unique: number,
 *     charsetSize: number,
 *   }
 * }}
 */
function analyzePassword(password) {
  if (!password || typeof password !== 'string') {
    return _emptyResult();
  }

  const len = password.length;

  // ── Character class detection ──
  const hasUpper  = /[A-Z]/.test(password);
  const hasLower  = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  // ── Unique characters ──
  const unique = new Set([...password]).size;

  // ── Charset size estimate ──
  let charset = 0;
  if (hasUpper)  charset += 26;
  if (hasLower)  charset += 26;
  if (hasNumber) charset += 10;
  if (hasSymbol) charset += 30;

  // ── Entropy ──
  const entropy = charset > 0 ? Math.floor(Math.log2(Math.pow(charset, len))) : 0;

  // ── SCORING ──
  let score = 0;

  // 1. Length score (0–30 pts)
  if      (len >= 20) score += 30;
  else if (len >= 16) score += 26;
  else if (len >= 12) score += 20;
  else if (len >= 10) score += 14;
  else if (len >= 8)  score += 8;
  else                score += 2;

  // 2. Character diversity (0–40 pts)
  const sets = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
  score += sets * 10;

  // 3. Entropy bonus (0–20 pts)
  if      (entropy >= 100) score += 20;
  else if (entropy >= 80)  score += 16;
  else if (entropy >= 60)  score += 12;
  else if (entropy >= 40)  score += 8;
  else if (entropy >= 28)  score += 4;

  // 4. Unique chars bonus (0–10 pts)
  const uniqueRatio = unique / len;
  if      (uniqueRatio > 0.85) score += 10;
  else if (uniqueRatio > 0.70) score += 6;
  else if (uniqueRatio > 0.55) score += 3;

  // ── PENALTIES ──

  // Repeated sequences: aaa, 111
  const repeatedSeqs = (password.match(/(.)\1{2,}/g) || []).length;
  score -= repeatedSeqs * 5;

  // Keyboard walks: qwerty, asdf, 1234
  const walks = ['qwerty','asdfgh','zxcvbn','123456','234567','345678','abcdef','password','qazwsx'];
  for (const walk of walks) {
    if (password.toLowerCase().includes(walk)) {
      score -= 15;
      break;
    }
  }

  // Common words / dictionary hits
  const commonWords = ['password','pass','word','admin','login','welcome','secret','master'];
  for (const word of commonWords) {
    if (password.toLowerCase().includes(word)) {
      score -= 12;
      break;
    }
  }

  // Date-like patterns: 1990, 2024, 01/01, etc.
  if (/\b(19|20)\d{2}\b/.test(password) || /\d{2}[\/\-\.]\d{2}/.test(password)) {
    score -= 5;
  }

  // Clamp to [0, 100]
  score = Math.max(0, Math.min(100, score));

  // ── Determine level ──
  const level = _getLevel(score);

  // ── Criteria ──
  const criteria = {
    length:  len >= 12,
    upper:   hasUpper,
    lower:   hasLower,
    number:  hasNumber,
    symbol:  hasSymbol,
    entropy: entropy >= 60,
  };

  return {
    score,
    level,
    entropy,
    criteria,
    stats: { length: len, unique, charsetSize: charset },
  };
}

// ─── HELPERS ──────────────────────────────────────────────────
function _getLevel(score) {
  let level = STRENGTH_LEVELS[0];
  for (const l of STRENGTH_LEVELS) {
    if (score >= l.min) level = l;
  }
  return level;
}

function _emptyResult() {
  return {
    score: 0,
    level: STRENGTH_LEVELS[0],
    entropy: 0,
    criteria: { length: false, upper: false, lower: false, number: false, symbol: false, entropy: false },
    stats: { length: 0, unique: 0, charsetSize: 0 },
  };
}

// ─── UI UPDATE FUNCTIONS ───────────────────────────────────────
/**
 * Update the main strength meter UI.
 * @param {object} analysis - result from analyzePassword()
 */
function updateStrengthMeter(analysis) {
  const { score, level, entropy, criteria } = analysis;

  // Fill bar
  const fill = PF.$('strength-fill');
  if (fill) {
    fill.style.width = `${score}%`;
    // Remove old classes, apply new one
    fill.className = `strength-fill ${level.class}`;
  }

  // Segments — light up based on segments count
  for (let i = 1; i <= 5; i++) {
    const seg = PF.$(`seg-${i}`);
    if (!seg) continue;
    if (i <= level.segments) {
      seg.style.background = `${level.color}44`;
      seg.style.borderColor = `${level.color}66`;
    } else {
      seg.style.background = '';
      seg.style.borderColor = '';
    }
  }

  // Label
  const label = PF.$('strength-label');
  if (label) {
    label.textContent = score > 0 ? level.label : '—';
    label.style.color = score > 0 ? level.color : '';
  }

  // Icon
  const icon = PF.$('strength-icon');
  if (icon) icon.textContent = score > 0 ? level.icon : '🔒';

  // Progressbar aria
  const bar = document.querySelector('.strength-bar-container[role="progressbar"]');
  if (bar) bar.setAttribute('aria-valuenow', score);

  // Criteria dots
  const criteriaMap = [
    ['crit-length', criteria.length],
    ['crit-upper',  criteria.upper],
    ['crit-lower',  criteria.lower],
    ['crit-number', criteria.number],
    ['crit-symbol', criteria.symbol],
    ['crit-entropy', criteria.entropy],
  ];
  criteriaMap.forEach(([id, met]) => {
    const el = PF.$(id);
    if (!el) return;
    el.classList.toggle('met', met);
  });

  // Entropy badge
  const eb = PF.$('entropy-value');
  if (eb) eb.textContent = entropy;

  // Password glow based on strength
  _updatePasswordGlow(level);
}

/**
 * Update the test-password strength meter.
 * @param {object} analysis
 */
function updateTestMeter(analysis) {
  const { score, level, entropy, stats } = analysis;

  const fill = PF.$('test-strength-fill');
  if (fill) {
    fill.style.width = `${score}%`;
    fill.className = `strength-fill ${level.class}`;
  }

  const label = PF.$('test-strength-label');
  if (label) {
    label.textContent = score > 0 ? level.label : '—';
    label.style.color = score > 0 ? level.color : '';
  }

  // Stats chips
  const statsEl = PF.$('test-stats');
  if (statsEl && score > 0) {
    statsEl.innerHTML = `
      <span class="test-stat">Length: ${stats.length}</span>
      <span class="test-stat">Entropy: ~${entropy} bits</span>
      <span class="test-stat">Unique chars: ${stats.unique}</span>
      <span class="test-stat">Charset: ${stats.charsetSize}</span>
    `;
  }

  const result = PF.$('test-result');
  if (result) result.classList.toggle('hidden', score === 0);
}

/**
 * Apply a glow to the password display based on strength level.
 * @param {object} level
 */
function _updatePasswordGlow(level) {
  const glow   = PF.$('password-glow');
  const wrapper = PF.$('password-display-wrapper');
  if (!glow || !wrapper) return;

  if (level.segments === 0) {
    glow.style.opacity = '0';
    wrapper.style.borderColor = '';
    wrapper.style.boxShadow   = '';
    return;
  }

  const alpha = 0.04 + (level.segments / 5) * 0.08;
  glow.style.background = `radial-gradient(ellipse at center, ${level.color}${Math.floor(alpha * 255).toString(16).padStart(2,'0')} 0%, transparent 70%)`;
  glow.style.opacity = '1';
  wrapper.style.borderColor = `${level.color}33`;
  wrapper.style.boxShadow = `0 0 20px ${level.color}18, inset 0 0 20px ${level.color}08`;
}

// ─── EXPORT ───────────────────────────────────────────────────
window.PF = window.PF || {};
Object.assign(window.PF, {
  STRENGTH_LEVELS,
  analyzePassword,
  updateStrengthMeter,
  updateTestMeter,
});
