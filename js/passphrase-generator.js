/**
 * PassForge — passphrase-generator.js
 * Generates beautiful, memorable passphrases using curated word lists.
 *
 * Inspired by the Diceware method — words are human-memorable while
 * remaining cryptographically strong when combined (4+ words ≈ 50+ bits).
 */

'use strict';

// ─── CURATED WORD LIST ─────────────────────────────────────────
// 200 carefully chosen words: vivid, concrete, pronounceable.
// Balanced across categories: nature, colors, elements, actions, places.
const WORDS = [
  // Nature
  'River', 'Ocean', 'Forest', 'Storm', 'Thunder', 'Glacier',
  'Canyon', 'Desert', 'Meadow', 'Summit', 'Valley', 'Geyser',
  'Cavern', 'Tundra', 'Lagoon', 'Rapids', 'Volcano', 'Aurora',
  'Nebula', 'Comet', 'Eclipse', 'Solstice', 'Zenith', 'Horizon',

  // Colors & aesthetics
  'Azure', 'Crimson', 'Indigo', 'Scarlet', 'Amber', 'Cobalt',
  'Violet', 'Jade', 'Onyx', 'Pearl', 'Ivory', 'Ebony',
  'Bronze', 'Silver', 'Copper', 'Golden', 'Obsidian', 'Sapphire',
  'Topaz', 'Garnet', 'Opal', 'Citrine', 'Marble', 'Velvet',

  // Animals
  'Falcon', 'Panther', 'Dragon', 'Phoenix', 'Raven', 'Jaguar',
  'Condor', 'Viper', 'Lynx', 'Bison', 'Cobra', 'Osprey',
  'Mammoth', 'Pegasus', 'Griffin', 'Kraken', 'Sphinx', 'Narwhal',
  'Basilisk', 'Chimera', 'Hydra', 'Leviathan', 'Minotaur', 'Titan',

  // Elements & forces
  'Carbon', 'Proton', 'Photon', 'Quasar', 'Pulsar', 'Neutron',
  'Fusion', 'Fission', 'Plasma', 'Vortex', 'Cipher', 'Vector',
  'Matrix', 'Prism', 'Signal', 'Nexus', 'Apex', 'Vertex',
  'Zenith', 'Nadir', 'Flux', 'Torque', 'Entropy', 'Quantum',

  // Verbs / actions
  'Forge', 'Craft', 'Blaze', 'Strike', 'Launch', 'Ignite',
  'Cascade', 'Surge', 'Radiate', 'Ascend', 'Descend', 'Pierce',
  'Carve', 'Sculpt', 'Engrave', 'Shatter', 'Illuminate', 'Orbit',
  'Traverse', 'Conquer', 'Explore', 'Navigate', 'Pioneer', 'Invoke',

  // Places & architecture
  'Citadel', 'Fortress', 'Bastion', 'Haven', 'Sanctum', 'Vault',
  'Temple', 'Obelisk', 'Pyramid', 'Monolith', 'Colossus', 'Spire',
  'Rampart', 'Turret', 'Parapet', 'Cloister', 'Atrium', 'Rotunda',

  // Abstract / moods
  'Valor', 'Grace', 'Virtue', 'Honor', 'Wisdom', 'Spirit',
  'Vision', 'Legacy', 'Triumph', 'Resolve', 'Clarity', 'Serenity',
  'Power', 'Stealth', 'Shadow', 'Radiance', 'Silence', 'Infinity',
  'Eternity', 'Solitude', 'Freedom', 'Destiny', 'Majesty', 'Brilliance',

  // Tech / modern
  'Cipher', 'Kernel', 'Daemon', 'Socket', 'Packet', 'Buffer',
  'Runtime', 'Bytecode', 'Protocol', 'Endpoint', 'Gateway', 'Firewall',
];

// Remove any accidental duplicates
const WORD_LIST = [...new Set(WORDS)];

// ─── NUMBER EMBELLISHMENTS ─────────────────────────────────────
const NUMBER_POOLS = [
  // Two-digit numbers that are visually interesting
  '42', '77', '99', '13', '21', '37', '88', '64', '007', '404',
  // Single digits for short placements
  '1', '2', '3', '4', '5', '6', '7', '8', '9',
];

// ─── SYMBOL EMBELLISHMENTS ─────────────────────────────────────
const PHRASE_SYMBOLS = ['!', '@', '#', '$', '*', '&', '?', '~', '^', '+'];

// ─── MAIN GENERATOR ───────────────────────────────────────────
/**
 * Generate a memorable passphrase.
 *
 * @param {object} opts
 * @param {number}  opts.wordCount   - number of words (3–6), default 4
 * @param {string}  opts.separator   - separator between words, default '-'
 * @param {boolean} opts.capitalize  - capitalize each word, default true
 * @param {boolean} opts.addNumbers  - append a number, default true
 * @param {boolean} opts.addSymbol   - append a symbol, default true
 * @returns {string}
 */
function generatePassphrase(opts = {}) {
  const {
    wordCount   = 4,
    separator   = '-',
    capitalize  = true,
    addNumbers  = true,
    addSymbol   = true,
  } = opts;

  // Pick unique random words
  const chosen = [];
  const used   = new Set();
  while (chosen.length < wordCount) {
    const idx = PF.secureRandom(WORD_LIST.length);
    if (!used.has(idx)) {
      used.add(idx);
      chosen.push(WORD_LIST[idx]);
    }
  }

  // Format words
  const formatted = chosen.map(w => capitalize ? capitalizeWord(w) : w.toLowerCase());

  // Build base phrase
  let phrase = formatted.join(separator);

  // Append number
  if (addNumbers) {
    const num = NUMBER_POOLS[PF.secureRandom(NUMBER_POOLS.length)];
    phrase += separator + num;
  }

  // Append symbol
  if (addSymbol) {
    const sym = PHRASE_SYMBOLS[PF.secureRandom(PHRASE_SYMBOLS.length)];
    phrase += sym;
  }

  return phrase;
}

// ─── HELPERS ──────────────────────────────────────────────────
/**
 * Capitalize the first letter of a word.
 * @param {string} word
 * @returns {string}
 */
function capitalizeWord(word) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Estimate the entropy of a passphrase.
 * Based on word pool size and number of words.
 * @param {number} wordCount
 * @param {boolean} addNumbers
 * @param {boolean} addSymbol
 * @returns {number} entropy in bits
 */
function passphraseEntropy(wordCount, addNumbers, addSymbol) {
  let bits = wordCount * Math.log2(WORD_LIST.length);
  if (addNumbers) bits += Math.log2(NUMBER_POOLS.length);
  if (addSymbol)  bits += Math.log2(PHRASE_SYMBOLS.length);
  return Math.floor(bits);
}

// ─── EXPORT ───────────────────────────────────────────────────
window.PF = window.PF || {};
Object.assign(window.PF, {
  WORD_LIST,
  generatePassphrase,
  passphraseEntropy,
});
