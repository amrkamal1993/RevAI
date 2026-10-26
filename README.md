# ⚡ RevAI — 100% Free AI Code Reviewer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org)
[![AI Engine](https://img.shields.io/badge/AI-Google_Gemini_%2F_Groq_%2F_Ollama-orange.svg)](https://aistudio.google.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/amrkamal1993/RevAI)

> **RevAI** is a developer-friendly, zero-cost AI Code Reviewer with **preloaded coding standards** across major programming languages (Flutter/Dart, TypeScript, Python, Go, Java, and more). It delivers actionable reviews, architectural risk explanations, ready-to-copy code fixes, and a comprehensive **Quality Score (0-100)** with letter grades.

---

## 🌟 Why RevAI?

- 💸 **100% Free & Flexible**: Powered by **Google Gemini (3.5 / 3.8 Flash)** by default. Also supports **Groq** (free Llama 3.3 70B), **Ollama** (100% offline local models), and custom OpenAI-compatible endpoints.
- 📐 **Preloaded Language Rules**: Built-in rules for **Flutter/Dart**, **TypeScript/JavaScript**, **Python**, **Go**, **Java**, **PHP**, **Rust**, **OWASP Security**, and **SOLID Principles**.
- 📊 **Quality Scorecard**: Instant 0–100 score + letter grade (`A+` to `F`) with breakdown across Security, Performance, Reliability, Clean Code, and Rule Adherence.
- 🔀 **Universal Git Integration**: Review uncommitted changes, staged files, branches, or live GitHub PRs with a single command.
- 🌐 **Interactive Web Dashboard**: Launch a stunning, dark-mode browser dashboard (`--ui`) with visual diff comparisons and one-click fix copying.
- 📝 **GitHub PR Ready**: Export structured markdown comments ready for CI/CD or PR reviews.

---

## 🚀 Quick Setup (30 Seconds)

### 1. Install Globally (Run Once)
Install RevAI globally on your machine with a single command:

```bash
npm install -g github:amrkamal1993/RevAI
```
*(Or clone and link locally: `git clone https://github.com/amrkamal1993/RevAI.git && cd RevAI && npm install && npm run build && npm link`)*

Now `revai` is available globally in **any repository or terminal** on your machine!

---

### 2. Configure Your API Key & Model (`revai config`)

You have two easy ways to configure your key:

#### Option A: Interactive Setup Wizard (Recommended)
Simply run:
```bash
revai config
```
This launches an interactive wizard that prompts you for your preferred provider, model, and API key:
```
⚙️  RevAI Interactive Configuration Wizard
Available Providers:
  1. gemini  - Google Gemini (3.5/3.8 Flash) [100% Free Tier, Recommended]
  2. groq    - Groq Cloud (Llama 3.3 70B, Ultra-fast Free Tier)
  3. ollama  - Ollama (100% Offline Local Model, Zero Key Needed)
  4. openai  - OpenAI or DeepSeek / Custom Compatible Endpoint

Choose provider [gemini]: gemini
Choose Model name [gemini-3.5-flash]: gemini-3.5-flash
Enter API key: AIzaSy...
✔ Configuration updated successfully!
```

#### Option B: Direct One-Line Setup
```bash
# Save your free Gemini API key:
revai config --set-key "YOUR_GEMINI_API_KEY"

# Or view current configuration:
revai config --show
```

> **💡 Automatic Key Prompt**: If you run `revai` without setting up a key first, the CLI will automatically ask you for your API key and save it permanently!

---

## 🔄 Using Models Other Than Gemini (Groq, Ollama, DeepSeek, OpenAI)

RevAI is model-agnostic. You can switch to any other AI model or local offline engine at any time:

### 1. Switch to Google Gemini 3.8 Flash (Deep Reasoning)
```bash
revai config --set-model gemini-3.8-flash
```

### 2. Switch to Groq (Ultra-Fast & Free Llama 3.3 70B)
Get a free key from [console.groq.com](https://console.groq.com/keys):
```bash
revai config --set-provider groq --set-model llama-3.3-70b-versatile --set-key "gsk_..."
```

### 3. Switch to Ollama (100% Offline & Free — Zero Key Needed)
Run completely offline with your local LLM (e.g., `qwen2.5-coder` or `llama3`):
```bash
revai config --set-provider ollama --set-model qwen2.5-coder
```

### 4. Switch to DeepSeek or OpenAI
```bash
revai config --set-provider openai --set-model deepseek-chat --set-url https://api.deepseek.com/v1 --set-key "sk-..."
```

### 5. Override on the Fly (Without Changing Saved Settings)
```bash
# Test a review with a specific model for one run:
revai --model gemini-3.8-flash
revai --provider groq --model llama-3.3-70b-versatile
revai --provider ollama --model qwen2.5-coder
```

---

## 🛠️ Usage Examples in Any Project

Navigate to **any Git repository** on your computer and run:

```bash
# Review current uncommitted changes (staged + unstaged):
revai

# Review ONLY staged changes (ready to commit):
revai --staged

# Review a feature branch against main:
revai --branch feature/user-auth

# Open interactive Web Dashboard in browser:
revai --ui
revai --branch feature/checkout --ui

# Review a GitHub PR directly from URL:
revai --pr https://github.com/flutter/flutter/pull/12345

# Export Markdown for GitHub/GitLab PR comments:
revai --markdown > pr-review.md
```

### 💡 Pro-Tip: Make it a Native Git Command (`git review`)
```bash
git config --global alias.review "!revai"
```
Now in **any Git project**, you can simply type:
```bash
git review
git review --staged
git review --ui
```

---

## 📊 Expected Output & Review Results

When you run `revai`, you receive a comprehensive audit consisting of:

```
╔═══════════════════════════════════════════════════════════════════════╗
║              ⚡ RevAI — Intelligent AI Code Review Report             ║
╚═══════════════════════════════════════════════════════════════════════╝

  Target:      Branch: feature/user-auth compared to main [GEMINI / gemini-3.5-flash]
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
