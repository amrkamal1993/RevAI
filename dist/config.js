import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
// Load .env from cwd if present
dotenv.config();
const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.revai');
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');
export function loadGlobalConfig() {
    try {
        if (fs.existsSync(GLOBAL_CONFIG_FILE)) {
            const raw = fs.readFileSync(GLOBAL_CONFIG_FILE, 'utf-8');
            return JSON.parse(raw);
        }
    }
    catch {
        // ignore parse error
    }
    return {};
}
export function saveGlobalConfig(config) {
    let temporaryFile;
    try {
        if (!fs.existsSync(GLOBAL_CONFIG_DIR)) {
            fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true, mode: 0o700 });
        }
        // Restrict both the directory and the file: the config may contain API credentials.
        if (process.platform !== 'win32')
            fs.chmodSync(GLOBAL_CONFIG_DIR, 0o700);
        const current = loadGlobalConfig();
        const updated = { ...current, ...config };
        temporaryFile = `${GLOBAL_CONFIG_FILE}.${randomUUID()}.tmp`;
        fs.writeFileSync(temporaryFile, JSON.stringify(updated, null, 2), { encoding: 'utf-8', mode: 0o600, flag: 'wx' });
        if (process.platform !== 'win32')
            fs.chmodSync(temporaryFile, 0o600);
        fs.renameSync(temporaryFile, GLOBAL_CONFIG_FILE);
    }
    catch (err) {
        console.error('Failed to save global configuration:', err);
        throw new Error('Could not save RevAI configuration securely. Check permissions on ~/.revai.');
    }
    finally {
        if (temporaryFile && fs.existsSync(temporaryFile)) {
            try {
                fs.unlinkSync(temporaryFile);
            }
            catch { /* best-effort temporary-file cleanup */ }
        }
    }
}
export function resolveEffectiveSettings(options) {
    const globalCfg = loadGlobalConfig();
    // 1. Resolve Provider (CLI flag > global config > default 'gemini')
    const provider = options.provider || globalCfg.defaultProvider || 'gemini';
    // 2. Resolve Model (CLI flag > global config > provider default)
    let defaultModelForProvider = 'gemini-3.5-flash';
    if (provider === 'groq')
        defaultModelForProvider = 'llama-3.3-70b-versatile';
    else if (provider === 'ollama')
        defaultModelForProvider = 'qwen2.5-coder';
    else if (provider === 'openai')
        defaultModelForProvider = 'gpt-4o-mini';
    const model = options.model || globalCfg.defaultModel || defaultModelForProvider;
    // 3. Resolve API Key
    let apiKey = options.apiKey;
    if (!apiKey) {
        if (provider === 'gemini') {
            apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || globalCfg.geminiApiKey;
        }
        else if (provider === 'groq') {
            apiKey = process.env.GROQ_API_KEY || globalCfg.customApiKey;
        }
        else if (provider === 'openai') {
            apiKey = process.env.OPENAI_API_KEY || globalCfg.customApiKey;
        }
        else {
            apiKey = globalCfg.customApiKey || process.env.CUSTOM_API_KEY;
        }
    }
    // 4. Resolve Base URL
    let baseUrl = options.baseUrl || globalCfg.baseUrl;
    if (!baseUrl) {
        if (provider === 'groq')
            baseUrl = 'https://api.groq.com/openai/v1';
        else if (provider === 'ollama')
            baseUrl = 'http://localhost:11434/v1';
        else if (provider === 'openai')
            baseUrl = 'https://api.openai.com/v1';
    }
    return { provider, model, apiKey, baseUrl };
}
export function resolveApiKey(optionsKey, provider = 'gemini') {
    return resolveEffectiveSettings({ apiKey: optionsKey, provider }).apiKey;
}
