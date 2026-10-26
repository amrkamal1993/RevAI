import fs from 'node:fs';
import path from 'node:path';
import { analyzeDiffStats } from '../src/git/git.js';
import { getRulesForLanguages } from '../src/rules/rules-db.js';
import { calculateReviewScore } from '../src/review/scoring.js';
import { formatTerminalReport } from '../src/formatters/terminal.js';
import { formatMarkdownReport } from '../src/formatters/markdown.js';
import { getDashboardHtml } from '../src/server/web-template.js';
import { CodeIssue, ReviewResult } from '../src/types.js';

console.log('🧪 Running RevAI Unit & Visual Verification Tests...\n');

// 1. Test Diff Parsing & Language Detection
const diffContent = fs.readFileSync(path.join(process.cwd(), 'test/sample.diff'), 'utf-8');
const stats = analyzeDiffStats(diffContent);

console.log(`✔ Stats analyzed: +${stats.additions} / -${stats.deletions} lines across ${stats.filesChanged} file(s)`);
console.log(`✔ Detected languages: ${stats.languagesDetected.join(', ')}`);

if (!stats.languagesDetected.includes('dart') || !stats.languagesDetected.includes('ts')) {
  console.error('❌ Failed: Expected dart and ts to be detected');
  process.exit(1);
}

// 2. Test Rules Filter
const rules = getRulesForLanguages(stats.languagesDetected);
console.log(`✔ Matched ${rules.length} applicable preloaded rules for Dart & TypeScript`);
stats.rulesCheckedCount = rules.length;

// 3. Test Mock Issues & Scoring Engine
const mockIssues: CodeIssue[] = [
  {
    id: 'ISSUE-1',
    file: 'lib/screens/login_screen.dart',
    lineStart: 17,
    lineEnd: 19,
    severity: 'critical',
    category: 'reliability',
    ruleId: 'FLUTTER-001',
    ruleName: 'Missing "mounted" Check After Async Gap',
    title: 'setState() called after await without mounted check',
    description: 'An async gap exists between http.post and setState(). If the user navigates away before the network request finishes, calling setState will throw FlutterError and crash.',
    whyItMatters: 'Causes unhandled Flutter runtime exceptions in production when users pop the route quickly.',
    suggestedFix: 'Verify "if (!mounted) return;" immediately following any await statement before calling setState.',
    codeSnippet: 'final response = await http.post(Uri.parse(...));\nsetState(() { _isLoading = false; });',
    fixedCodeSnippet: 'final response = await http.post(Uri.parse(...));\nif (!mounted) return;\nsetState(() { _isLoading = false; });'
  },
  {
    id: 'ISSUE-2',
    file: 'lib/screens/login_screen.dart',
    lineStart: 10,
    lineEnd: 10,
    severity: 'major',
    category: 'performance',
    ruleId: 'FLUTTER-002',
    ruleName: 'Undisposed Controllers or Subscriptions',
    title: 'TextEditingController is never disposed',
    description: 'The _passwordController is created as a member variable of _LoginScreenState but dispose() is never overridden.',
    whyItMatters: 'Undisposed controllers accumulate in memory and retain listeners, causing subtle memory leaks in long-running apps.',
    suggestedFix: 'Implement the dispose() lifecycle method and call _passwordController.dispose().',
    codeSnippet: 'final TextEditingController _passwordController = TextEditingController();',
    fixedCodeSnippet: '@override\nvoid dispose() {\n  _passwordController.dispose();\n  super.dispose();\n}'
  },
  {
    id: 'ISSUE-3',
    file: 'src/services/auth.ts',
    lineStart: 1,
    lineEnd: 1,
    severity: 'critical',
    category: 'security',
    ruleId: 'SEC-001',
    ruleName: 'Hardcoded Secret / API Key / Password',
    title: 'Hardcoded JWT secret token committed to repository',
    description: 'A production secret "sk_live_super_secret_production_key_123456" is stored as a plain string constant in source code.',
    whyItMatters: 'Anyone with read access to the repository or decompiled bundle can forge authentication tokens and impersonate users.',
    suggestedFix: 'Move secret to environment variables or a secure key store.',
    codeSnippet: 'export const JWT_SECRET = "sk_live_super_secret_production_key_123456";',
    fixedCodeSnippet: 'export const JWT_SECRET = process.env.JWT_SECRET;'
  },
  {
    id: 'ISSUE-4',
    file: 'src/services/auth.ts',
    lineStart: 3,
    lineEnd: 3,
    severity: 'major',
    category: 'maintainability',
    ruleId: 'TS-001',
    ruleName: 'Avoid "any" Type',
    title: 'Usage of "any" disables TypeScript static typing',
    description: 'The "payload: any" parameter disables compiler safety and type checking for the auth flow.',
    whyItMatters: 'Leads to unverified property accesses at runtime, increasing runtime crash probability.',
    suggestedFix: 'Define a dedicated interface such as LoginPayload with required fields.',
    codeSnippet: 'export async function loginUser(payload: any)',
    fixedCodeSnippet: 'interface LoginPayload {\n  role: number;\n  username: string;\n}\n\nexport async function loginUser(payload: LoginPayload)'
  }
];

const score = calculateReviewScore(mockIssues, {
  overall: 48,
  security: 40,
  performance: 65,
  reliability: 50,
  maintainability: 60,
  rulesAdherence: 45
});

console.log(`✔ Score calculated: ${score.overall}/100 (Grade: ${score.grade}, Status: ${score.status})`);

const mockResult: ReviewResult = {
  title: 'Code Review: test/sample.diff',
  targetDescription: 'Sample feature branch: auth-flow-fixes',
  timestamp: new Date().toISOString(),
  stats,
  score,
  issues: mockIssues,
  positiveHighlights: [
    'Clean separation of concerns with asynchronous network login call',
    'Proper use of StatefulWidget for managing dynamic login state'
  ],
  rawDiffSnippet: diffContent
};

// 4. Test Terminal Formatter Output
const terminalOutput = formatTerminalReport(mockResult);
console.log('\n--- TERMINAL REPORT PREVIEW ---\n' + terminalOutput);

// 5. Test Markdown PR Generator Output
const mdOutput = formatMarkdownReport(mockResult);
fs.writeFileSync(path.join(process.cwd(), 'test/test-report.md'), mdOutput, 'utf-8');
console.log('✔ Markdown report generated and saved to test/test-report.md');

// 6. Test Web Dashboard HTML Output
const htmlOutput = getDashboardHtml(mockResult);
fs.writeFileSync(path.join(process.cwd(), 'test/test-dashboard.html'), htmlOutput, 'utf-8');
console.log('✔ Interactive Web Dashboard HTML saved to test/test-dashboard.html');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
