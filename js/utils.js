/**
 * PassForge — utils.js
 * Shared utility functions used across the application.
 */

'use strict';

// ─── DOM HELPERS ───────────────────────────────────────────────
/**
 * Shorthand for document.getElementById
 * @param {string} id
 * @returns {HTMLElement|null}
 */
const $ = (id) => document.getElementById(id);

/**
 * Shorthand for document.querySelector
 * @param {string} sel - CSS selector
 * @param {Element} [ctx=document]
 * @returns {Element|null}
 */
const $$ = (sel, ctx = document) => ctx.querySelector(sel);

/**
 * Shorthand for document.querySelectorAll
 * @param {string} sel - CSS selector
 * @param {Element} [ctx=document]
 * @returns {NodeList}
 */
const $$$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

// ─── CRYPTO ────────────────────────────────────────────────────
/**
 * Generate a cryptographically secure random integer in [0, max)
 * Uses Web Crypto API for true randomness.
 * @param {number} max - exclusive upper bound
 * @returns {number}
 */
function secureRandom(max) {
  if (max <= 0) throw new RangeError('max must be > 0');
  const randomBuffer = new Uint32Array(1);
  // Rejection sampling to avoid modulo bias
  const limit = Math.floor(0xFFFFFFFF / max) * max;
  let rand;
  do {
    crypto.getRandomValues(randomBuffer);
    rand = randomBuffer[0];
  } while (rand >= limit);
  return rand % max;
}

/**
 * Shuffle an array in place using the Fisher-Yates algorithm
 * with cryptographically secure randomness.
 * @param {Array} arr
 * @returns {Array} - same array, mutated
 */
function secureShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick a random element from an array.
 * @param {Array} arr
 * @returns {*}
 */
function randomPick(arr) {
  return arr[secureRandom(arr.length)];
}

// ─── STRING ANALYSIS ───────────────────────────────────────────
/**
 * Determine the character class of a single character.
 * @param {string} char
 * @returns {'upper'|'lower'|'number'|'symbol'}
 */
function charClass(char) {
  if (/[A-Z]/.test(char))   return 'upper';
  if (/[a-z]/.test(char))   return 'lower';
  if (/[0-9]/.test(char))   return 'number';
  return 'symbol';
}

/**
 * Calculate Shannon entropy of a string.
 * @param {string} str
 * @returns {number} - entropy in bits
 */
function shannonEntropy(str) {
  if (!str.length) return 0;
  const freq = {};
  for (const ch of str) freq[ch] = (freq[ch] || 0) + 1;
  return Object.values(freq).reduce((acc, count) => {
    const p = count / str.length;
    return acc - p * Math.log2(p);
  }, 0);
}

/**
 * Calculate password entropy based on charset size and length.
 * @param {number} charsetSize - number of possible characters
 * @param {number} length - password length
 * @returns {number} - entropy in bits
 */
function calcEntropy(charsetSize, length) {
  if (charsetSize <= 0 || length <= 0) return 0;
  return Math.floor(Math.log2(Math.pow(charsetSize, length)));
}

// ─── CLIPBOARD ─────────────────────────────────────────────────
/**
 * Copy text to clipboard. Prefers navigator.clipboard (async),
 * falls back to execCommand for older browsers.
 * @param {string} text
 * @returns {Promise<boolean>} - true on success
 */
async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ─── TIME ──────────────────────────────────────────────────────
/**
 * Format a Date as a relative or short string.
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 5)  return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── DEBOUNCE ──────────────────────────────────────────────────
/**
 * Returns a debounced version of the given function.
 * @param {Function} fn
 * @param {number} delay - milliseconds
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ─── LOCAL STORAGE ─────────────────────────────────────────────
/**
 * Safely read from localStorage.
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
function lsGet(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

/**
 * Safely write to localStorage.
 * @param {string} key
 * @param {*} value
 */
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

// ─── CSS VARIABLE HELPERS ──────────────────────────────────────
/**
 * Set a CSS custom property on :root
 * @param {string} prop - e.g. '--theme-accent'
 * @param {string} value
 */
function setCSSVar(prop, value) {
  document.documentElement.style.setProperty(prop, value);
}

// ─── EXPORT (global namespace) ─────────────────────────────────
window.PF = window.PF || {};
Object.assign(window.PF, {
  $, $$, $$$,
  secureRandom, secureShuffle, randomPick,
  charClass, shannonEntropy, calcEntropy,
  copyToClipboard,
  formatTime,
  debounce,
  lsGet, lsSet,
  setCSSVar,
});
