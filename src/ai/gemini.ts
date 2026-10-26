import { buildSystemPrompt, buildUserPrompt } from './prompt.js';
import { CodingRule } from '../types.js';

interface GeminiReviewResponse {
  summary: string;
  positiveHighlights: string[];
  scores: {
    overall: number;
    security: number;
    performance: number;
    reliability: number;
    maintainability: number;
    rulesAdherence: number;
  };
  issues: Array<{
    id: string;
    file: string;
    lineStart?: number;
    lineEnd?: number;
    severity: 'critical' | 'major' | 'minor' | 'suggestion';
    category: 'security' | 'performance' | 'reliability' | 'maintainability' | 'rule_violation' | 'style';
    ruleId?: string;
    ruleName?: string;
    title: string;
    description: string;
    whyItMatters: string;
    suggestedFix: string;
    codeSnippet?: string;
    fixedCodeSnippet?: string;
  }>;
}

export async function reviewWithGemini(
  diffText: string,
  targetDescription: string,
  rules: CodingRule[],
  apiKey: string,
  modelName = 'gemini-3.5-flash'
): Promise<GeminiReviewResponse> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      `Gemini API Key is missing!\n` +
      `You can get a 100% FREE API key in 30 seconds from Google AI Studio:\n` +
      `👉 https://aistudio.google.com/app/apikey\n\n` +
      `Then set it using one of the following:\n` +
      `  • export GEMINI_API_KEY="your-key-here"\n` +
      `  • revai config --set-key "your-key-here"\n` +
      `  • revai review --api-key "your-key-here"`
    );
  }

  const systemPrompt = buildSystemPrompt(rules);
  const userPrompt = buildUserPrompt(diffText, targetDescription);

  const candidateModels = [
    modelName,
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash'
  ];

  // Deduplicate models
  const modelsToTry = Array.from(new Set(candidateModels));

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt + '\n\n' + userPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1, // low temperature for consistent, strict code analysis
          responseMimeType: 'application/json'
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        // If 404, maybe this model name isn't active yet, try next
        if (response.status === 404) {
          lastError = new Error(`Model ${model} not found (404). Trying fallback...`);
          continue;
        }
        throw new Error(`Google Gemini API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as any;
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Received empty response from Gemini API.');
      }

      // Clean markdown code blocks if the model wrapped it
      let cleanJson = rawText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed: GeminiReviewResponse = JSON.parse(cleanJson);
      return parsed;
    } catch (err: any) {
      lastError = err;
      if (err.message?.includes('404')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Failed to review code with Gemini API.');
}
