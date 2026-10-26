# 🌿 Git Branch, PR & CI/CD Workflow Guide

This guide shows how to run **RevAI** across different stages of your development lifecycle: local working trees, feature branches, pull requests, and automated GitHub Actions.

---

## 💻 1. Local Repository Usage

### Reviewing Local Uncommitted Work
```bash
# Reviews both staged and working tree changes:
revai

# Review ONLY changes staged with "git add":
revai --staged

# Review ONLY unstaged modifications:
revai --working
```

### Reviewing Specific Commits or Files
```bash
# Review the latest commit on HEAD:
revai --commit HEAD

# Review a specific commit hash:
revai --commit a1b2c3d

# Review only a specific file:
revai --file lib/screens/checkout_screen.dart
```

---

## 🔀 2. Branch Comparisons

When working on a feature branch (e.g., `feature/payment-gateway`), you can compare it directly against `main` or any base branch:

```bash
# Compare current branch against main:
revai --branch feature/payment-gateway

# Specify a custom base branch (e.g., dev or staging):
revai --branch feature/payment-gateway --base develop

# Open results in the interactive browser dashboard:
revai --branch feature/payment-gateway --ui
```

---

## 🐙 3. Reviewing GitHub Pull Requests

You can review any public or accessible GitHub PR without even cloning the repository:

```bash
revai --pr https://github.com/flutter/flutter/pull/12345
```

---

## 🚀 4. Automated CI/CD (GitHub Actions)

You can run RevAI automatically on every pull request and post the formatted review directly as a PR comment!

Create `.github/workflows/revai-review.yml`:

```yaml
name: RevAI Automated Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install RevAI
        run: npm install -g revai

      - name: Run Code Review
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: |
          revai --branch ${{ github.head_ref }} --base ${{ github.base_ref }} --markdown -o review.md

      - name: Comment PR
        uses: thollander/actions-comment-pull-request@v2
        with:
          filePath: review.md
```

---

## 🔒 5. Git Pre-Commit Hook

Ensure your code is clean before committing:

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/sh
echo "Running RevAI pre-commit check..."
revai --staged
```
Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```
