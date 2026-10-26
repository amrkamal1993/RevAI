import { buildSystemPrompt, buildUserPrompt } from './prompt.js';
import { validateAIReviewResponse } from './response.js';
export async function reviewWithGemini(diffText, targetDescription, rules, apiKey, modelName = 'gemini-3.5-flash') {
    if (!apiKey || apiKey.trim() === '') {
        throw new Error(`Gemini API Key is missing!\n` +
            `You can get a 100% FREE API key in 30 seconds from Google AI Studio:\n` +
            `👉 https://aistudio.google.com/app/apikey\n\n` +
            `Then set it using one of the following:\n` +
            `  • export GEMINI_API_KEY="your-key-here"\n` +
            `  • run "revai config" for hidden interactive input`);
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
    let lastError = null;
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
            const data = await response.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) {
                throw new Error('Received empty response from Gemini API.');
            }
            // Clean markdown code blocks if the model wrapped it
            let cleanJson = rawText.trim();
            if (cleanJson.startsWith('```json')) {
                cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
            }
            else if (cleanJson.startsWith('```')) {
                cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
            }
            return validateAIReviewResponse(JSON.parse(cleanJson));
        }
        catch (err) {
            lastError = err;
            if (err.message?.includes('404')) {
                continue;
            }
            throw err;
        }
    }
    throw lastError || new Error('Failed to review code with Gemini API.');
}
