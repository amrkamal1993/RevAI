import { buildSystemPrompt, buildUserPrompt } from './prompt.js';
import { CodingRule } from '../types.js';

interface ReviewResponse {
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

export async function reviewWithOpenAICompatible(
  diffText: string,
  targetDescription: string,
  rules: CodingRule[],
  apiKey: string,
  modelName: string,
  baseUrl = 'https://api.openai.com/v1'
): Promise<ReviewResponse> {
  const systemPrompt = buildSystemPrompt(rules);
  const userPrompt = buildUserPrompt(diffText, targetDescription);

  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanBaseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (apiKey && apiKey.trim() !== '') {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: modelName,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI Provider API Error (${response.status}) at ${endpoint}: ${errorText}`);
  }

  const data = await response.json() as any;
  const rawContent = data?.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error(`Received empty response from AI model (${modelName}).`);
  }

  let cleanJson = rawContent.trim();
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
  }

  const parsed: ReviewResponse = JSON.parse(cleanJson);
  return parsed;
}
