# PassForge ⚡

**Passwords That Feel Premium**

> The most beautiful, secure, and memorable password generator on the internet.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![100% Client-Side](https://img.shields.io/badge/Privacy-100%25%20Client--Side-green.svg)](#privacy)

---

## ✨ Features

### 🔐 Three Generation Modes
- **Classic** — Length slider (8–128), character set toggles, exclude ambiguous chars
- **Memorable** — Beautiful passphrases like `Azure-River-42!` you'll actually remember
- **Artistic** — Visually striking patterns: Symmetric, Bookend, Cascade, Wave

### 🎨 Personality Themes
Choose from 6 themes that shape the character palette and interface:
`Cyber` · `Luxury` · `Nature` · `Minimal` · `Cosmic` · `Warrior`

### 📊 Strength Analysis
- Real-time scoring (0–100) with 5 levels: Weak → Fair → Good → Strong → Excellent
- Entropy calculation in bits
- 6 visual criteria indicators
- Animated segmented progress bar with color progression

### 🧪 Test Any Password
Paste any password for instant strength analysis with entropy, length, and charset stats.

### 📜 Password History
Last 10 generated passwords shown as elegant cards — click to reload, one-click copy.

### ✨ Surprise Me
Randomly switches theme, mode, and length for delightful discovery.

---

## 🚀 Getting Started

PassForge is a static website — no build step, no dependencies to install.

### Option 1: Open directly
```bash
# Clone the repo
git clone https://github.com/yourusername/passforge.git
cd passforge

# Open in browser
open index.html
```

### Option 2: Local server (recommended)
```bash
# Python 3
python -m http.server 8080

# OR Node.js
npx serve .

# Then visit http://localhost:8080
```

### Option 3: Deploy
Drop the folder into any static host:
- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop the folder
- **GitHub Pages**: Push to `gh-pages` branch

---

## 🏗️ Project Structure

```
passforge/
├── index.html                  # Entry point
├── css/
│   └── style.css               # All styles (glassmorphism, animations)
├── js/
│   ├── main.js                 # App controller & UI wiring
│   ├── password-generator.js   # Classic & Artistic generators
│   ├── passphrase-generator.js # Memorable passphrase engine
│   ├── strength-meter.js       # Strength analysis & UI
│   └── utils.js                # Shared utilities (crypto, DOM, etc.)
├── assets/
│   └── icons/                  # (reserved for future icons)
├── README.md
├── LICENSE
└── .gitignore
```

---

## 🔒 Privacy & Security

- **100% client-side** — no data ever leaves your browser
- **No analytics**, no trackers, no ads
- Uses **Web Crypto API** (`crypto.getRandomValues`) for true cryptographic randomness
- Implements **rejection sampling** to eliminate modulo bias
- Open source — audit the code yourself

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space`  | Generate new password |
| `Ctrl+C` / `Cmd+C` | Copy current password (when nothing selected) |

---

## 🎨 Design Philosophy

PassForge is built to feel like a **premium $99 security product** that happens to be free. Every detail is intentional:

- **Glassmorphism** glass cards with backdrop blur
- **Ambient glow orbs** that react to the selected theme
- **Particle canvas** background for depth and life
- **Animated strength meter** with smooth color progression
- **Colored password display** — each character class gets its own color
- **Character reveal animation** on generation
- **Satisfying micro-interactions** on every button, slider, and toggle
- **Cormorant Garamond** serif for the hero + **Space Mono** for passwords

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | Semantic HTML5 |
| Styling | Tailwind CSS (CDN) + Custom CSS variables |
| Logic | Vanilla JavaScript (ES2020+) |
| Fonts | Google Fonts (Cormorant Garamond, Space Mono, DM Sans) |
| Crypto | Web Crypto API |
| Storage | localStorage (preferences & history) |

No frameworks, no bundlers, no Node.js required.

---

## 📄 License

MIT © PassForge Contributors — see [LICENSE](LICENSE) for details.

Use it, fork it, build on it. Free forever.

---

<p align="center">Made with ❤️ and a deep love for beautiful security tools</p>
