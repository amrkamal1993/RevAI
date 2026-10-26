# ⚡ RevAI — 100% Free AI Code Reviewer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org)
[![AI Engine](https://img.shields.io/badge/AI-Google_Gemini_Flash_(100%25_Free)-orange.svg)](https://aistudio.google.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/amrkamal1993/RevAI)

> **RevAI** is a developer-friendly, zero-cost AI Code Reviewer with **preloaded coding standards** across major programming languages (Flutter/Dart, TypeScript, Python, Go, Java, and more). It delivers actionable code reviews, architectural risk explanations, ready-to-copy code fixes, and a comprehensive **Quality Score (0-100)** with letter grades.

---

## 🌟 Why RevAI?

- 💸 **100% Free**: Powered by Google Gemini Flash via Google AI Studio (generous free tier: 15 req/min and 1,000,000 token context window).
- 📐 **Preloaded Language Rules**: Built-in rules for **Flutter/Dart**, **TypeScript/JavaScript**, **Python**, **Go**, **Java**, **PHP**, **Rust**, **OWASP Security**, and **SOLID Principles**.
- 📊 **Quality Scorecard**: Instant 0–100 score + letter grade (`A+` to `F`) with breakdown across Security, Performance, Reliability, Clean Code, and Rule Adherence.
- 🔀 **Frictionless Git Integration**: Review uncommitted changes, staged files, branches, or live GitHub PRs with a single command.
- 🌐 **Interactive Web Dashboard**: Launch a stunning, dark-mode browser dashboard (`--ui`) with visual diff comparisons and one-click fix copying.
- 📝 **GitHub PR Ready**: Export structured markdown comments ready for CI/CD or PR reviews.

---

## 🚀 Quick Setup (30 Seconds)

### 1. Install RevAI Globally
You can install RevAI directly from GitHub:

```bash
git clone https://github.com/amrkamal1993/RevAI.git
cd RevAI
npm install
npm run build
npm link
```
*(Now `revai` is available globally in any terminal!)*

### 2. Get a 100% Free Gemini API Key
1. Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2. Click **"Create API Key"** (zero credit card required).

### 3. Save Your Key (One-time Setup)
Save your API key permanently so you never need to type it again:
```bash
revai config --set-key "YOUR_GEMINI_API_KEY"
```

---

## 🛠️ Usage Examples

Navigate to **any Git repository** on your machine and run:

### Review Working Changes in Current Project
```bash
# Reviews all current uncommitted changes:
revai

# Review ONLY staged changes (ready to commit):
revai --staged

# Review ONLY unstaged changes:
revai --working
```

### Review a Feature Branch
Compare any branch against `main` (or a custom base):
```bash
# Compare feature-branch against main:
revai --branch feature/user-auth

# Compare against develop or staging:
revai --branch feature/user-auth --base develop
```

### Launch Interactive Web Dashboard (`--ui`)
Open an interactive, dark-mode dashboard in your browser:
```bash
revai --ui
# Or with a branch:
revai --branch feature/checkout --ui
```

### Review a GitHub Pull Request Directly
Review any pull request on GitHub without cloning the repo:
```bash
revai --pr https://github.com/flutter/flutter/pull/12345
```

### Export Markdown for GitHub / GitLab PR Comments
```bash
revai --markdown > pr-review.md
```

### List Preloaded Coding Rules
```bash
# List all 26+ built-in rules:
revai rules

# Filter rules by language:
revai rules --lang flutter
revai rules --lang ts
revai rules --lang py
```

---

## 📊 Expected Output & Review Results

When you run `revai`, you receive a comprehensive audit consisting of:

```
╔═══════════════════════════════════════════════════════════════════════╗
║              ⚡ RevAI — Intelligent AI Code Review Report             ║
╚═══════════════════════════════════════════════════════════════════════╝

  Target:      Branch: feature/user-auth compared to main
  Languages:   DART, TS
  Diff Stats:  +24 -1 lines across 2 file(s)
  Rules:       15 preloaded rules audited

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Overall Score:  88/100   GRADE A • EXCELLENT 
  High quality code with minor suggestions. Ready to merge after quick polish.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Category Performance Breakdown:
   🛡️  Security       █████████████░  95%
   ⚡ Performance    ██████████░░░░  82%
   🐛 Reliability    ███████████░░░  86%
   🧹 Maintainability ████████████░░  88%
   📐 Rule Adherence  ████████████░░  89%

🔍 Detected Issues & Recommendations (2 total):
   🔴 Critical: 0   🟠 Major: 1   🟡 Minor: 1   🔵 Suggestions: 0

 1.  MAJOR  TextEditingController is never disposed
    File: lib/screens/login_screen.dart:10  [Rule: FLUTTER-002]
    Problem: _passwordController is created but dispose() is never overridden.
    Why it matters: Retaining active controller listeners in memory leads to progressive memory leaks.
    Suggested Fix:
      + @override
      + void dispose() {
      +   _passwordController.dispose();
      +   super.dispose();
      + }
```

### Letter Grade Breakdown:
- 🟢 **Grade A+ / A (80 - 100)**: Clean, robust, production-ready.
- 🟡 **Grade B (70 - 79)**: Good overall quality with minor improvements suggested.
- 🟠 **Grade C / D (40 - 69)**: Needs attention before merging; contains major issues.
- 🔴 **Grade F (< 40)**: Critical security vulnerabilities or crash-inducing defects detected.

---

## 📚 Deep-Dive Documentation

Explore our comprehensive guides in the [`docs/`](docs/) directory:

- 💙 **[Flutter Rules, Skills & Best Practices](docs/flutter-rules-and-skills.md)**: Mounted checks, controller disposal, widget rebuild optimization, and clean architecture.
- 🏛️ **[SOLID & Clean Code Principles](docs/solid-principles.md)**: Single Responsibility, cognitive complexity, guard clauses, and dependency inversion.
- 🌐 **[Supported Languages & Frameworks Matrix](docs/languages-and-frameworks.md)**: Detailed breakdown of Dart, TypeScript, Python, Go, Java, PHP, and Rust rules.
- 🌿 **[Git Branch, PR & CI/CD Guide](docs/branch-and-ci-guide.md)**: Using RevAI with branch comparisons, pre-commit hooks, and GitHub Actions pipelines.

---

## 👥 Contributing

Contributions, new language rules, and feature requests are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingRule`)
3. Commit your Changes (`git commit -m 'Add new rule for Python'`)
4. Push to the Branch (`git push origin feature/AmazingRule`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

*Made with ❤️ by [Amr Kamal](https://github.com/amrkamal1993) — Powered by Google Gemini.*
