/**
 * PassForge — password-generator.js
 * Classic and Artistic password generation engines.
 */

'use strict';

// ─── CHARACTER SETS ────────────────────────────────────────────
const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers:   '0123456789',
  symbols:   '!@#$%^&*()-_=+[]{}|;:,.<>?',

  // Ambiguous characters to optionally exclude
  ambiguous:   'O0Il1',
  ambiguousRe: /[O0Il1]/g,
};

// ─── PERSONALITY THEMES ────────────────────────────────────────
/**
 * Each theme defines:
 *  - name, emoji: display
 *  - accent, glow: CSS values applied to :root when active
 *  - symbolSet: overridden symbol chars for the theme
 *  - charBias: optional extra weight toward certain char types
 */
const THEMES = [
  {
    id: 'cyber',
    name: 'Cyber',
    emoji: '⚡',
    accent: '#00ffcc',
    glow:   'rgba(0, 255, 204, 0.25)',
    orb1:   'rgba(0, 180, 100, 0.12)',
    orb2:   'rgba(0, 255, 200, 0.08)',
    symbolSet: '!@#$%^&*<>[]{}',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    emoji: '💎',
    accent: '#f5c542',
    glow:   'rgba(245, 197, 66, 0.25)',
    orb1:   'rgba(200, 150, 20, 0.12)',
    orb2:   'rgba(245, 197, 66, 0.08)',
    symbolSet: '#$*+-=~°',
  },
  {
    id: 'nature',
    name: 'Nature',
    emoji: '🌿',
    accent: '#44e888',
    glow:   'rgba(68, 232, 136, 0.22)',
    orb1:   'rgba(20, 160, 80, 0.12)',
    orb2:   'rgba(68, 232, 100, 0.08)',
    symbolSet: '@#*+._~',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    emoji: '◽',
    accent: '#aaaacc',
    glow:   'rgba(170, 170, 204, 0.18)',
    orb1:   'rgba(100, 100, 160, 0.08)',
    orb2:   'rgba(120, 120, 180, 0.05)',
    symbolSet: '.-_+',
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    emoji: '✦',
    accent: '#cc88ff',
    glow:   'rgba(204, 136, 255, 0.25)',
    orb1:   'rgba(100, 40, 200, 0.14)',
    orb2:   'rgba(160, 80, 255, 0.09)',
    symbolSet: '*@#$^~°•',
  },
  {
    id: 'warrior',
    name: 'Warrior',
    emoji: '⚔️',
    accent: '#ff4444',
    glow:   'rgba(255, 68, 68, 0.22)',
    orb1:   'rgba(180, 20, 20, 0.12)',
    orb2:   'rgba(255, 80, 40, 0.08)',
    symbolSet: '!@#$%!@#',
  },
];

// ─── CLASSIC PASSWORD GENERATOR ────────────────────────────────
/**
 * Generate a classic random password.
 * Guarantees at least one character from each enabled set.
 *
 * @param {object} opts
 * @param {number}  opts.length      - desired length (8–128)
 * @param {boolean} opts.uppercase
 * @param {boolean} opts.lowercase
 * @param {boolean} opts.numbers
 * @param {boolean} opts.symbols
 * @param {boolean} opts.excludeAmbiguous
 * @param {string}  [opts.symbolSet] - override symbol characters
 * @returns {string}
 */
function generateClassic(opts) {
  const {
    length = 20,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    excludeAmbiguous = false,
    symbolSet = CHARSETS.symbols,
  } = opts;

  // Build the full charset
  let pool = '';
  const guaranteed = [];

  if (uppercase) {
    let chars = CHARSETS.uppercase;
    if (excludeAmbiguous) chars = chars.replace(CHARSETS.ambiguousRe, '');
    pool += chars;
    guaranteed.push(PF.randomPick([...chars]));
  }
  if (lowercase) {
    let chars = CHARSETS.lowercase;
    if (excludeAmbiguous) chars = chars.replace(CHARSETS.ambiguousRe, '');
    pool += chars;
    guaranteed.push(PF.randomPick([...chars]));
  }
  if (numbers) {
    let chars = CHARSETS.numbers;
    if (excludeAmbiguous) chars = chars.replace(CHARSETS.ambiguousRe, '');
    pool += chars;
    guaranteed.push(PF.randomPick([...chars]));
  }
  if (symbols) {
    const chars = symbolSet;
    pool += chars;
    guaranteed.push(PF.randomPick([...chars]));
  }

  if (!pool) pool = CHARSETS.lowercase; // fallback

  // Fill remaining slots
  const remaining = [];
  for (let i = guaranteed.length; i < length; i++) {
    remaining.push(pool[PF.secureRandom(pool.length)]);
  }

  // Combine, shuffle, return
  const all = [...guaranteed, ...remaining];
  return PF.secureShuffle(all).join('');
}

// ─── ARTISTIC PASSWORD GENERATOR ───────────────────────────────
/**
 * Generate visually striking "artistic" passwords.
 * @param {string} style - 'symmetric' | 'bookend' | 'cascade' | 'wave'
 * @param {object} opts  - same as generateClassic opts
 * @returns {string}
 */
function generateArtistic(style = 'symmetric', opts = {}) {
  const baseOpts = {
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
    symbolSet: CHARSETS.symbols,
    ...opts,
  };

  switch (style) {
    case 'symmetric':  return _artisticSymmetric(baseOpts);
    case 'bookend':    return _artisticBookend(baseOpts);
    case 'cascade':    return _artisticCascade(baseOpts);
    case 'wave':       return _artisticWave(baseOpts);
    default:           return generateClassic(baseOpts);
  }
}

/**
 * Symmetric: mirrors first half onto second half with symbol core.
 * e.g. "Xk7#!#7kX" style palindromic structure.
 */
function _artisticSymmetric(opts) {
  const half = Math.floor(opts.length / 2);
  const first = generateClassic({ ...opts, length: half, symbols: false });
  const sym   = opts.symbols
    ? opts.symbolSet[PF.secureRandom(opts.symbolSet.length)]
    : '';
  const mid   = opts.length % 2 === 1 ? sym : '';
  const second = [...first].reverse().join('');
  return first + mid + second;
}

/**
 * Bookend: wraps a core password in matching symbol brackets.
 * e.g. "<<Gx8mPw!>>"
 */
function _artisticBookend(opts) {
  const BRACKETS = ['<>', '[]', '{}', '«»', '⟨⟩', '()', '||'];
  const bracket  = BRACKETS[PF.secureRandom(BRACKETS.length)];
  const inner    = generateClassic({ ...opts, length: opts.length - 4, symbols: true });
  const sym      = opts.symbolSet[PF.secureRandom(opts.symbolSet.length)] || '!';
  return bracket[0] + bracket[0] + inner + sym + bracket[1] + bracket[1];
}

/**
 * Cascade: alternates uppercase-lowercase-number in a rhythmic pattern.
 * e.g. "Aa1Bb2Cc3..."
 */
function _artisticCascade(opts) {
  const upper = [...(opts.excludeAmbiguous
    ? CHARSETS.uppercase.replace(CHARSETS.ambiguousRe, '')
    : CHARSETS.uppercase)];
  const lower = [...(opts.excludeAmbiguous
    ? CHARSETS.lowercase.replace(CHARSETS.ambiguousRe, '')
    : CHARSETS.lowercase)];
  const nums  = [...(opts.excludeAmbiguous
    ? CHARSETS.numbers.replace(CHARSETS.ambiguousRe, '')
    : CHARSETS.numbers)];
  const syms  = [...opts.symbolSet];

  const result = [];
  const pattern = ['upper', 'lower', 'number', 'symbol'];
  for (let i = 0; i < opts.length; i++) {
    const type = pattern[i % pattern.length];
    switch (type) {
      case 'upper':  result.push(upper[PF.secureRandom(upper.length)]); break;
      case 'lower':  result.push(lower[PF.secureRandom(lower.length)]); break;
      case 'number': result.push(nums[PF.secureRandom(nums.length)]);   break;
      case 'symbol': result.push(syms[PF.secureRandom(syms.length)]);   break;
    }
  }
  return result.join('');
}

/**
 * Wave: groups of 4 chars separated by symbols, creating a visual rhythm.
 * e.g. "Xk7m!Pw4n@Jd8c"
 */
function _artisticWave(opts) {
  const core = generateClassic({ ...opts, length: opts.length, symbols: false });
  const syms = [...opts.symbolSet];
  const result = [];
  for (let i = 0; i < core.length; i++) {
    result.push(core[i]);
    if ((i + 1) % 4 === 0 && i < core.length - 1) {
      result.push(syms[PF.secureRandom(syms.length)]);
    }
  }
  return result.join('').slice(0, opts.length + 3); // allow slightly longer for aesthetics
}

// ─── CHARSET SIZE (for entropy calculation) ────────────────────
/**
 * Returns the total character pool size given options.
 * @param {object} opts
 * @returns {number}
 */
function charsetSize(opts) {
  let size = 0;
  if (opts.uppercase) size += 26;
  if (opts.lowercase) size += 26;
  if (opts.numbers)   size += 10;
  if (opts.symbols)   size += (opts.symbolSet || CHARSETS.symbols).length;
  if (opts.excludeAmbiguous) size -= Math.min(size, 5);
  return Math.max(size, 1);
}

// ─── SURPRISE GENERATOR ────────────────────────────────────────
/**
 * Generates a surprising password using a random style and theme combo.
 * @returns {{password: string, mode: string, style: string}}
 */
function generateSurprise() {
  const modes   = ['classic', 'classic', 'memorable', 'artistic']; // weighted
  const mode    = modes[PF.secureRandom(modes.length)];
  const theme   = THEMES[PF.secureRandom(THEMES.length)];
  const lengths = [16, 18, 20, 24, 28];
  const length  = lengths[PF.secureRandom(lengths.length)];

  return { mode, theme, length };
}

// ─── EXPORT ────────────────────────────────────────────────────
window.PF = window.PF || {};
Object.assign(window.PF, {
  CHARSETS,
  THEMES,
  generateClassic,
  generateArtistic,
  charsetSize,
  generateSurprise,
});
