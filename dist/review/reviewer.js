import { getGitDiff, fetchGitHubPRDiff, analyzeDiffStats } from '../git/git.js';
import { getRulesForLanguages } from '../rules/rules-db.js';
import { resolveApiKey } from '../config.js';
import { reviewWithGemini } from '../ai/gemini.js';
import { calculateReviewScore } from './scoring.js';
export async function runCodeReview(options) {
    let diffText = '';
    let targetDescription = '';
    // 1. Fetch Diff from PR or Git
    if (options.pr) {
        targetDescription = `GitHub PR: ${options.pr}`;
        diffText = await fetchGitHubPRDiff(options.pr);
    }
    else {
        const gitDiffResult = getGitDiff(options);
        diffText = gitDiffResult.diff;
        targetDescription = gitDiffResult.description;
    }
    if (!diffText || diffText.trim().length === 0) {
        throw new Error(`No code changes detected in "${targetDescription}".\n` +
            `Make sure you have unstaged or staged changes, or specify a branch: revai --branch <feature-branch>`);
    }
    // 2. Analyze Stats & Detect Languages
    const stats = analyzeDiffStats(diffText);
    // 3. Select Relevant Preloaded Rules
    const applicableRules = getRulesForLanguages(stats.languagesDetected);
    stats.rulesCheckedCount = applicableRules.length;
    // 4. Resolve API Key
    const apiKey = resolveApiKey(options.apiKey, options.provider || 'gemini');
    // 5. Invoke AI Engine (Gemini Free Tier)
    const aiResponse = await reviewWithGemini(diffText, targetDescription, applicableRules, apiKey || '', options.model || 'gemini-2.5-flash');
    // 6. Calculate Score & Status
    const score = calculateReviewScore(aiResponse.issues, aiResponse.scores);
    const result = {
        title: `Code Review: ${targetDescription}`,
        targetDescription,
        timestamp: new Date().toISOString(),
        stats,
        score,
        issues: aiResponse.issues || [],
        positiveHighlights: aiResponse.positiveHighlights || [],
        rawDiffSnippet: diffText.slice(0, 5000)
    };
    return result;
}
