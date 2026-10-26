import { ReviewOptions, ReviewResult } from '../types.js';
import { getGitDiff, fetchGitHubPRDiff, analyzeDiffStats } from '../git/git.js';
import { getRulesForLanguages } from '../rules/rules-db.js';
import { resolveEffectiveSettings } from '../config.js';
import { reviewWithGemini } from '../ai/gemini.js';
import { reviewWithOpenAICompatible } from '../ai/openai-compatible.js';
import { calculateReviewScore } from './scoring.js';

export async function runCodeReview(options: ReviewOptions): Promise<ReviewResult> {
  let diffText = '';
  let targetDescription = '';

  // 1. Fetch Diff from PR or Git
  if (options.pr) {
    targetDescription = `GitHub PR: ${options.pr}`;
    diffText = await fetchGitHubPRDiff(options.pr);
  } else {
    const gitDiffResult = getGitDiff(options);
    diffText = gitDiffResult.diff;
    targetDescription = gitDiffResult.description;
  }

  if (!diffText || diffText.trim().length === 0) {
    throw new Error(
      `No code changes detected in "${targetDescription}".\n` +
      `Make sure you have unstaged or staged changes, or specify a branch: revai --branch <feature-branch>`
    );
  }

  // 2. Analyze Stats & Detect Languages
  const stats = analyzeDiffStats(diffText);

  // 3. Select Relevant Preloaded Rules
  const applicableRules = getRulesForLanguages(stats.languagesDetected);
  stats.rulesCheckedCount = applicableRules.length;

  // 4. Resolve Effective Provider, Model, and API Key
  const settings = resolveEffectiveSettings(options);

  if (settings.provider !== 'ollama' && (!settings.apiKey || settings.apiKey.trim() === '')) {
    throw new Error(
      `API Key is missing for provider "${settings.provider}".\n` +
      `Run "revai config" to configure your API key or pass --api-key <your-key>.`
    );
  }

  // 5. Invoke AI Engine (Gemini, Groq, Ollama, OpenAI)
  let aiResponse;
  if (settings.provider === 'gemini') {
    aiResponse = await reviewWithGemini(
      diffText,
      targetDescription,
      applicableRules,
      settings.apiKey || '',
      settings.model || 'gemini-3.5-flash'
    );
  } else {
    aiResponse = await reviewWithOpenAICompatible(
      diffText,
      targetDescription,
      applicableRules,
      settings.apiKey || '',
      settings.model,
      settings.baseUrl
    );
  }

  // 6. Calculate Score & Status
  const score = calculateReviewScore(aiResponse.issues, aiResponse.scores);

  const result: ReviewResult = {
    title: `Code Review: ${targetDescription}`,
    targetDescription: `${targetDescription} [${settings.provider.toUpperCase()} / ${settings.model}]`,
    timestamp: new Date().toISOString(),
    stats,
    score,
    issues: aiResponse.issues || [],
    positiveHighlights: aiResponse.positiveHighlights || [],
    rawDiffSnippet: diffText.slice(0, 5000)
  };

  return result;
}
