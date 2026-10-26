import { buildSystemPrompt, buildUserPrompt } from './prompt.js';
export async function reviewWithOpenAICompatible(diffText, targetDescription, rules, apiKey, modelName, baseUrl = 'https://api.openai.com/v1') {
    const systemPrompt = buildSystemPrompt(rules);
    const userPrompt = buildUserPrompt(diffText, targetDescription);
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const endpoint = `${cleanBaseUrl}/chat/completions`;
    const headers = {
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
    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
        throw new Error(`Received empty response from AI model (${modelName}).`);
    }
    let cleanJson = rawContent.trim();
    if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    }
    else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(cleanJson);
    return parsed;
}
