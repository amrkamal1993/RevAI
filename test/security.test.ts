import assert from 'node:assert';
import http from 'node:http';
import { fetchGitHubPRDiff, getGitDiff } from '../src/git/git.js';
import { validateAIReviewResponse } from '../src/ai/response.js';
import { calculateReviewScore } from '../src/review/scoring.js';
import { startUiServer } from '../src/server/ui-server.js';
import { CodeIssue, ReviewResult } from '../src/types.js';

console.log('🛡️  Running RevAI Security & Regression Test Suite...\n');

// 1. Test Git Command Injection & Argument Validation
console.log('1. Testing Git command injection protections:');
assert.throws(
  () => getGitDiff({ commit: '--upload-pack=evil' }),
  /Invalid commit/,
  'Failed to reject flag injection in commit option'
);
assert.throws(
  () => getGitDiff({ branch: '-b' }),
  /Invalid branch/,
  'Failed to reject flag injection in branch option'
);
assert.throws(
  () => getGitDiff({ commit: 'bad commit; rm -rf /' }),
  /Invalid commit/,
  'Failed to reject arbitrary shell command in commit'
);
console.log('   ✔ Flag injection and arbitrary commit values successfully blocked.');

// 2. Test GitHub PR Diff URL Validation
console.log('2. Testing GitHub PR URL validation:');
const invalidUrls = [
  'http://github.com/owner/repo/pull/123', // Insecure HTTP
  'https://evil-github.com/owner/repo/pull/123', // Phishing host
  'https://github.com/owner/repo/pull/notanumber', // Non-numeric PR
  'https://user:pass@github.com/owner/repo/pull/123', // Credentials in URL
  'https://github.com:8443/owner/repo/pull/123', // Custom port
  'https://github.com/owner/repo/pull/123?param=evil', // Query parameters
  'https://github.com/owner/repo/pull/123#frag', // Hash fragments
  'ftp://github.com/owner/repo/pull/123' // Unsupported scheme
];

for (const url of invalidUrls) {
  assert.rejects(
    async () => await fetchGitHubPRDiff(url),
    /Invalid GitHub PR URL/,
    `Expected URL to be rejected: ${url}`
  );
}
console.log(`   ✔ Rejected ${invalidUrls.length} malicious/malformed GitHub PR URLs.`);

// 3. Test AI Response Validation & Sanitization
console.log('3. Testing AI Response Validation (src/ai/response.ts):');
// Valid payload
const validAIResponse = {
  summary: 'Code looks generally good.',
  positiveHighlights: ['Clean architecture', 'Good typing'],
  scores: {
    overall: 85,
    security: 90,
    performance: 80,
    reliability: 85,
    maintainability: 85,
    rulesAdherence: 85
  },
  issues: [
    {
      id: 'ISSUE-1',
      file: 'src/index.ts',
      lineStart: 10,
      lineEnd: 20,
      severity: 'critical',
      category: 'security',
      title: 'SQL Injection',
      description: 'Unescaped user input passed to query.',
      whyItMatters: 'Allows database tampering.',
      suggestedFix: 'Use parameterized queries.'
    }
  ]
};

const validated = validateAIReviewResponse(validAIResponse);
assert.strictEqual(validated.issues.length, 1);
assert.strictEqual(validated.scores.overall, 85);

// Invalid severities or categories
assert.throws(
  () => validateAIReviewResponse({ ...validAIResponse, issues: [{ ...validAIResponse.issues[0], severity: 'extreme' }] }),
  /invalid severity/
);
assert.throws(
  () => validateAIReviewResponse({ ...validAIResponse, issues: [{ ...validAIResponse.issues[0], category: 'unknown_cat' }] }),
  /invalid category/
);
// Inverted line range
assert.throws(
  () => validateAIReviewResponse({ ...validAIResponse, issues: [{ ...validAIResponse.issues[0], lineStart: 50, lineEnd: 20 }] }),
  /invalid line range/
);
// Score out of bounds
assert.throws(
  () => validateAIReviewResponse({ ...validAIResponse, scores: { ...validAIResponse.scores, overall: 150 } }),
  /invalid "overall" score/
);
assert.throws(
  () => validateAIReviewResponse({ ...validAIResponse, scores: { ...validAIResponse.scores, security: -5 } }),
  /invalid "security" score/
);
console.log('   ✔ Validated schema types, severity constraints, line ranges, and score boundaries.');

// 4. Test Score Inflation Prevention
console.log('4. Testing Score Inflation Prevention (src/review/scoring.ts):');
const criticalIssues: CodeIssue[] = [
  {
    id: 'C1',
    file: 'auth.ts',
    severity: 'critical',
    category: 'security',
    title: 'Crit 1',
    description: 'desc',
    whyItMatters: 'why',
    suggestedFix: 'fix'
  },
  {
    id: 'C2',
    file: 'auth.ts',
    severity: 'critical',
    category: 'security',
    title: 'Crit 2',
    description: 'desc',
    whyItMatters: 'why',
    suggestedFix: 'fix'
  }
];

// Deductions: critical is -20 pts each. Two criticals: 100 - 20 - 20 = 60.
const scoreWithHighAiSuggestion = calculateReviewScore(criticalIssues, {
  overall: 99,
  security: 100,
  performance: 100,
  reliability: 100,
  maintainability: 100,
  rulesAdherence: 100
});

// The AI score of 99 should NOT inflate the score above 60
assert.strictEqual(
  scoreWithHighAiSuggestion.overall,
  60,
  `Expected score to remain capped at calculated deductions (60), but got ${scoreWithHighAiSuggestion.overall}`
);

// If AI proposes a lower score (e.g. 20), it is allowed to lower it
const scoreWithLowAiSuggestion = calculateReviewScore(criticalIssues, {
  overall: 20,
  security: 20,
  performance: 20,
  reliability: 20,
  maintainability: 20,
  rulesAdherence: 20
});
assert.strictEqual(
  scoreWithLowAiSuggestion.overall,
  20,
  `AI should be allowed to lower the score, expected 20, got ${scoreWithLowAiSuggestion.overall}`
);
console.log('   ✔ AI model cannot inflate score above defect deductions; down-scoring permitted.');

// 5. Test UI Server Host & Route Restrictions
console.log('5. Testing UI Server Security (src/server/ui-server.ts):');
async function testServer() {
  const mockResult: ReviewResult = {
    title: 'Test',
    targetDescription: 'Testing',
    timestamp: new Date().toISOString(),
    stats: { additions: 1, deletions: 1, filesChanged: 1, languagesDetected: ['ts'], rulesCheckedCount: 1 },
    score: scoreWithHighAiSuggestion,
    issues: [],
    positiveHighlights: ['All good']
  };

  const testPort = 5991;
  const server = await startUiServer(mockResult, testPort);

  function request(path: string, options: { method?: string; headers?: Record<string, string> } = {}): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: testPort,
          path,
          method: options.method || 'GET',
          headers: options.headers
        },
        (res) => {
          let body = '';
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => {
            resolve({ status: res.statusCode || 0, headers: res.headers, body });
          });
        }
      );
      req.on('error', reject);
      req.end();
    });
  }

  try {
    // Valid GET request to root
    const rootRes = await request('/', { headers: { Host: `127.0.0.1:${testPort}` } });
    assert.strictEqual(rootRes.status, 200);
    assert.strictEqual(rootRes.headers['x-frame-options'], 'DENY');
    assert.strictEqual(rootRes.headers['x-content-type-options'], 'nosniff');
    assert(rootRes.headers['content-security-policy']?.includes("frame-ancestors 'none'"));

    // Host header spoofing / DNS rebinding protection
    const spoofedHostRes = await request('/', { headers: { Host: 'attacker-controlled.site' } });
    assert.strictEqual(spoofedHostRes.status, 403, 'Expected 403 for external/spoofed Host header');

    // HTTP method other than GET
    const postRes = await request('/', { method: 'POST', headers: { Host: `127.0.0.1:${testPort}` } });
    assert.strictEqual(postRes.status, 405, 'Expected 405 Method Not Allowed for POST');

    // Unknown route
    const notFoundRes = await request('/etc/passwd', { headers: { Host: `127.0.0.1:${testPort}` } });
    assert.strictEqual(notFoundRes.status, 404, 'Expected 404 for unknown route');

    console.log('   ✔ UI Server correctly enforces Host checks, method limits, 404s, and security headers.');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

await testServer();

console.log('\n🔒 ALL SECURITY TESTS PASSED SUCCESSFULLY!\n');
