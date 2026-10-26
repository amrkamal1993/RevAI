import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import dotenv from 'dotenv';

// Load .env from cwd if present
dotenv.config();

const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.revai');
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');

export interface AppConfig {
  geminiApiKey?: string;
  groqApiKey?: string;
  defaultProvider?: 'gemini' | 'groq' | 'ollama';
  defaultModel?: string;
  defaultRulesThreshold?: number;
}

export function loadGlobalConfig(): AppConfig {
  try {
    if (fs.existsSync(GLOBAL_CONFIG_FILE)) {
      const raw = fs.readFileSync(GLOBAL_CONFIG_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // ignore parse error
  }
  return {};
}

export function saveGlobalConfig(config: Partial<AppConfig>): void {
  try {
    if (!fs.existsSync(GLOBAL_CONFIG_DIR)) {
      fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
    }
    const current = loadGlobalConfig();
    const updated = { ...current, ...config };
    fs.writeFileSync(GLOBAL_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save global configuration:', err);
  }
}

export function resolveApiKey(optionsKey?: string, provider = 'gemini'): string | undefined {
  if (optionsKey) return optionsKey;
  
  const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GROQ_API_KEY;
  if (envKey) return envKey;

  const globalCfg = loadGlobalConfig();
  if (provider === 'gemini') {
    return globalCfg.geminiApiKey;
  } else if (provider === 'groq') {
    return globalCfg.groqApiKey;
  }

  return undefined;
}
