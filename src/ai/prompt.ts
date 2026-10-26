import { CodingRule } from '../types.js';

export function buildSystemPrompt(rules: CodingRule[]): string {
  const rulesList = rules.map(r => `[${r.id}] ${r.name} (${r.language.toUpperCase()} | ${r.severity.toUpperCase()} | ${r.category.toUpperCase()}):
Description: ${r.description}
${r.badExample ? `Avoid: ${r.badExample}` : ''}
${r.goodExample ? `Prefer: ${r.goodExample}` : ''}
`).join('\n');

  return `You are an elite, highly experienced Principal Software Architect and Senior Code Reviewer.
Your mission is to perform an uncompromising, deep, and constructive code review on the provided Git Diff.

### PRELOADED CODING RULES & BEST PRACTICES:
You MUST audit the code changes against these industry-standard rules, as well as general Clean Code, SOLID, OWASP Top 10 Security, and Performance principles:

${rulesList}

### REVIEW CRITERIA:
1. **Security**: Identify vulnerabilities (SQLi, XSS, injection, hardcoded secrets, CSRF, broken auth, untrusted deserialization, SSRF).
2. **Reliability & Bugs**: Find logic errors, unhandled exceptions, race conditions, null pointer dereferences, off-by-one errors, memory leaks.
3. **Performance**: Spot inefficient loops, N+1 queries, unneeded renders/rebuilds, resource leaks, blocking synchronous calls on UI/event loops.
4. **Maintainability & Clean Code**: High complexity, violations of Single Responsibility, bad naming, missing error context.
5. **Rule Adherence**: Specifically check if any of the preloaded language rules above are violated.

### SCORING FORMULA:
Calculate an Overall Score (0-100) and 5 Category Scores (0-100 each):
- Start at 100 points.
- Each CRITICAL issue deducts 15-20 points.
- Each MAJOR issue deducts 8-12 points.
- Each MINOR issue deducts 3-5 points.
- Each SUGGESTION deducts 1 point.
- If code is clean, robust, and well-written, score should be 90-100.

### MANDATORY JSON OUTPUT FORMAT:
You MUST respond with pure JSON only, matching this exact schema:
{
  "summary": "Concise 2-3 sentence overview of the diff quality, key strengths, and highest-priority risks.",
  "positiveHighlights": [
    "A clean pattern or good practice observed in the PR",
    "Proper usage of types or security guards"
  ],
  "scores": {
    "overall": 85,
    "security": 95,
    "performance": 80,
    "reliability": 85,
    "maintainability": 90,
    "rulesAdherence": 85
  },
  "issues": [
    {
      "id": "ISSUE-1",
      "file": "path/to/file.ts",
      "lineStart": 42,
      "lineEnd": 45,
      "severity": "critical | major | minor | suggestion",
      "category": "security | performance | reliability | maintainability | rule_violation | style",
      "ruleId": "TS-002",
      "ruleName": "Unhandled Promise Rejection",
      "title": "Clear concise title of the issue",
      "description": "Precise explanation of what is wrong in the diff code.",
      "whyItMatters": "Clear architectural explanation of the risk, impact on production, crashes, or security exploitability.",
      "suggestedFix": "Detailed explanation of the proposed solution.",
      "codeSnippet": "The problematic code line(s) from the diff",
      "fixedCodeSnippet": "Exact replacement code showing the fix"
    }
  ]
}

DO NOT wrap your JSON in markdown code blocks (\`\`\`json). Output pure raw JSON only.`;
}

export function buildUserPrompt(diffText: string, description: string): string {
  // Truncate if diff exceeds 300,000 characters to stay within safety limits while allowing large diffs
  const safeDiff = diffText.length > 400000 
    ? diffText.slice(0, 400000) + '\n\n... [Diff truncated due to extreme size]'
    : diffText;

  return `TARGET TO REVIEW:
${description}

GIT DIFF CONTENT:
\`\`\`diff
${safeDiff}
\`\`\`

Analyze the diff meticulously. Provide the JSON review report.`;
}
