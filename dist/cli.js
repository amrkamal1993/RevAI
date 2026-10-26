import { Command } from 'commander';
import fs from 'node:fs';
import readline from 'node:readline/promises';
import pc from 'picocolors';
import { runCodeReview } from './review/reviewer.js';
import { formatTerminalReport } from './formatters/terminal.js';
import { formatMarkdownReport } from './formatters/markdown.js';
import { startUiServer } from './server/ui-server.js';
import { loadGlobalConfig, saveGlobalConfig, resolveEffectiveSettings } from './config.js';
import { CODING_RULES } from './rules/rules-db.js';
const program = new Command();
program
    .name('revai')
    .description('⚡ 100% Free AI Code Reviewer with Preloaded Language Rules & Performance Scoring')
    .version('1.1.0');
// Main Review Command
program
    .command('review', { isDefault: true })
    .description('Run AI Code Review on Git changes, branch, commit, or GitHub PR')
    .option('-s, --staged', 'Review only staged changes (git diff --cached)')
    .option('-w, --working', 'Review unstaged changes')
    .option('-b, --branch <name>', 'Review changes on a branch compared to base (default: main)')
    .option('--base <branch>', 'Base branch for comparison', 'main')
    .option('-c, --commit <hash>', 'Review specific commit (e.g. HEAD)')
    .option('-f, --file <path>', 'Review changes in a specific file')
    .option('-p, --patch <path>', 'Review a raw diff/patch file')
    .option('--pr <url>', 'Review a GitHub Pull Request URL')
    .option('--ui', 'Launch interactive web dashboard in your browser')
    .option('--port <number>', 'Port for web dashboard', '4880')
    .option('-m, --markdown', 'Output GitHub-flavored markdown report')
    .option('-j, --json', 'Output raw JSON report')
    .option('-o, --output <file>', 'Save report output to a file')
    .option('--provider <name>', 'AI Provider (gemini, groq, ollama, openai, custom)', 'gemini')
    .option('--model <name>', 'Model name (e.g. gemini-3.5-flash, gemini-3.8-flash, llama-3.3-70b-versatile, gpt-4o-mini)')
    .option('--base-url <url>', 'Custom API Base URL (for Ollama, DeepSeek, or OpenAI compatible)')
    .action(async (opts) => {
    try {
        const options = {
            staged: opts.staged,
            working: opts.working,
            branch: opts.branch,
            base: opts.base,
            commit: opts.commit,
            file: opts.file,
            patch: opts.patch,
            pr: opts.pr,
            ui: opts.ui,
            port: opts.port ? parseInt(opts.port, 10) : 4880,
            markdown: opts.markdown,
            json: opts.json,
            outputFile: opts.output,
            provider: opts.provider,
            model: opts.model,
            baseUrl: opts.baseUrl
        };
        // Check API Key & Prompt interactively if missing
        const settings = resolveEffectiveSettings(options);
        if (settings.provider !== 'ollama' && (!settings.apiKey || settings.apiKey.trim() === '')) {
            console.log('');
            console.log(pc.yellow(pc.bold(`⚠️  API Key required for provider "${settings.provider}":`)));
            if (settings.provider === 'gemini') {
                console.log(`Google Gemini offers a ${pc.bold('100% FREE tier')}.`);
                console.log(`Get your key in 30 seconds at: ${pc.cyan(pc.underline('https://aistudio.google.com/app/apikey'))}`);
            }
            else if (settings.provider === 'groq') {
                console.log(`Get your free Groq key at: ${pc.cyan(pc.underline('https://console.groq.com/keys'))}`);
            }
            console.log('');
            const inputKey = await promptHidden('Enter your API key (input hidden): ');
            if (!inputKey || !inputKey.trim()) {
                console.log(pc.red('No API key provided. Run "revai config" to set it up.'));
                process.exit(1);
            }
            // Save key permanently
            if (settings.provider === 'gemini') {
                saveGlobalConfig({ geminiApiKey: inputKey.trim() });
            }
            else {
                saveGlobalConfig({ customApiKey: inputKey.trim() });
            }
            console.log(pc.green('✔ API Key saved successfully to ~/.revai/config.json!'));
        }
        console.log(pc.cyan(`⚡ Running AI Code Review using ${pc.bold(settings.provider.toUpperCase())} (${settings.model})...`));
        const result = await runCodeReview(options);
        // JSON output
        if (options.json) {
            const jsonStr = JSON.stringify(result, null, 2);
            if (options.outputFile) {
                fs.writeFileSync(options.outputFile, jsonStr, 'utf-8');
                console.log(pc.green(`✔ JSON report saved to ${options.outputFile}`));
            }
            else {
                console.log(jsonStr);
            }
            return;
        }
        // Markdown output
        if (options.markdown) {
            const mdReport = formatMarkdownReport(result);
            if (options.outputFile) {
                fs.writeFileSync(options.outputFile, mdReport, 'utf-8');
                console.log(pc.green(`✔ Markdown PR report saved to ${options.outputFile}`));
            }
            else {
                console.log(mdReport);
            }
        }
        else {
            // Terminal report
            const terminalReport = formatTerminalReport(result);
            console.log(terminalReport);
            if (options.outputFile) {
                fs.writeFileSync(options.outputFile, formatMarkdownReport(result), 'utf-8');
                console.log(pc.green(`✔ Markdown report saved to ${options.outputFile}`));
            }
        }
        // If --ui is requested, start the local dashboard
        if (options.ui) {
            await startUiServer(result, options.port);
        }
    }
    catch (err) {
        console.error('');
        console.error(pc.red(pc.bold('✖ Review Failed:')), err.message);
        console.error('');
        process.exit(1);
    }
});
// Configuration Command
program
    .command('config')
    .description('Manage RevAI settings, default AI model, and API keys')
    .option('--set-model <model>', 'Set default AI model (e.g. gemini-3.8-flash, llama-3.3-70b-versatile, gpt-4o-mini)')
    .option('--set-provider <provider>', 'Set default AI provider (gemini, groq, ollama, openai, custom)')
    .option('--set-url <url>', 'Set custom base URL (e.g. for Ollama or custom proxy)')
    .option('--show', 'Display current configuration')
    .option('--interactive', 'Run interactive setup wizard')
    .action(async (opts) => {
    // Direct flags handler
    const hasFlags = opts.setModel || opts.setProvider || opts.setUrl;
    if (hasFlags) {
        const updates = {};
        if (opts.setModel)
            updates.defaultModel = opts.setModel;
        if (opts.setProvider)
            updates.defaultProvider = opts.setProvider;
        if (opts.setUrl)
            updates.baseUrl = opts.setUrl;
        saveGlobalConfig(updates);
        console.log(pc.green('✔ Configuration updated successfully in ~/.revai/config.json!'));
        displayConfig();
        return;
    }
    if (opts.show) {
        displayConfig();
        return;
    }
    // Default with no flags: Run interactive wizard!
    await runInteractiveConfig();
});
function displayConfig() {
    const cfg = loadGlobalConfig();
    const settings = resolveEffectiveSettings({});
    console.log('');
    console.log(pc.bold('RevAI Configuration (~/.revai/config.json):'));
    console.log(`  Provider:    ${pc.green(settings.provider.toUpperCase())}`);
    console.log(`  Model:       ${pc.cyan(settings.model)}`);
    if (cfg.baseUrl) {
        console.log(`  Base URL:    ${pc.dim(cfg.baseUrl)}`);
    }
    if (cfg.geminiApiKey) {
        const masked = cfg.geminiApiKey.slice(0, 6) + '...' + cfg.geminiApiKey.slice(-4);
        console.log(`  Gemini Key:  ${pc.green(masked)} (Configured)`);
    }
    else {
        console.log(`  Gemini Key:  ${pc.dim('Not set')}`);
    }
    if (cfg.customApiKey) {
        const masked = cfg.customApiKey.slice(0, 6) + '...' + cfg.customApiKey.slice(-4);
        console.log(`  Custom Key:  ${pc.green(masked)} (Configured)`);
    }
    console.log('');
    console.log(pc.dim('Run "revai config" anytime to launch the interactive setup wizard.'));
    console.log('');
}
async function runInteractiveConfig() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const cfg = loadGlobalConfig();
    const settings = resolveEffectiveSettings({});
    console.log('');
    console.log(pc.bold(pc.cyan('⚙️  RevAI Interactive Configuration Wizard')));
    console.log(pc.dim('Configure your preferred AI model, provider, and API keys permanently.'));
    console.log('');
    // 1. Choose Provider
    console.log(pc.bold('Available Providers:'));
    console.log(`  1. ${pc.green('gemini')}  - Google Gemini (3.5/3.8 Flash) [100% Free Tier, Recommended]`);
    console.log(`  2. ${pc.cyan('groq')}    - Groq Cloud (Llama 3.3 70B, Ultra-fast Free Tier)`);
    console.log(`  3. ${pc.magenta('ollama')}  - Ollama (100% Offline Local Model, Zero Key Needed)`);
    console.log(`  4. ${pc.blue('openai')}  - OpenAI or DeepSeek / Custom Compatible Endpoint`);
    console.log('');
    const providerAns = await rl.question(pc.yellow(`Choose provider [${settings.provider}]: `));
    const provider = (providerAns.trim() || settings.provider).toLowerCase();
    // 2. Choose Model
    let defaultModelForProvider = 'gemini-3.5-flash';
    if (provider === 'groq')
        defaultModelForProvider = 'llama-3.3-70b-versatile';
    else if (provider === 'ollama')
        defaultModelForProvider = 'qwen2.5-coder';
    else if (provider === 'openai')
        defaultModelForProvider = 'gpt-4o-mini';
    const currentModel = cfg.defaultModel || defaultModelForProvider;
    const modelAns = await rl.question(pc.yellow(`Choose Model name [${currentModel}]: `));
    const model = modelAns.trim() || currentModel;
    // 3. Base URL
    let baseUrlToSave = undefined;
    if (provider === 'ollama' || provider === 'custom' || provider === 'openai') {
        const defaultUrl = provider === 'ollama' ? 'http://localhost:11434/v1' : (cfg.baseUrl || 'https://api.openai.com/v1');
        const urlAns = await rl.question(pc.yellow(`Base URL [${defaultUrl}]: `));
        baseUrlToSave = urlAns.trim() || defaultUrl;
    }
    rl.close();
    // 4. API Key (read without terminal echo; environment variables are also supported).
    let keyToSave = undefined;
    if (provider !== 'ollama') {
        const existingKey = provider === 'gemini' ? cfg.geminiApiKey : cfg.customApiKey;
        const masked = existingKey ? `${existingKey.slice(0, 6)}...${existingKey.slice(-4)}` : 'None';
        console.log(pc.dim(`Current Key: ${masked}`));
        const keyAns = await promptHidden('Enter API key (press Enter to keep existing; input hidden): ');
        if (keyAns.trim()) {
            keyToSave = keyAns.trim();
        }
    }
    const updates = {
        defaultProvider: provider,
        defaultModel: model
    };
    if (keyToSave) {
        if (provider === 'gemini')
            updates.geminiApiKey = keyToSave;
        else
            updates.customApiKey = keyToSave;
    }
    if (baseUrlToSave) {
        updates.baseUrl = baseUrlToSave;
    }
    saveGlobalConfig(updates);
    console.log('');
    console.log(pc.bold(pc.green('✔ Configuration updated successfully!')));
    displayConfig();
}
function promptHidden(prompt) {
    const input = process.stdin;
    if (!input.isTTY || typeof input.setRawMode !== 'function' || !process.stdout.isTTY) {
        throw new Error('Hidden API-key input requires an interactive terminal. Set the provider API key in the environment instead.');
    }
    return new Promise((resolve, reject) => {
        let value = '';
        const cleanup = () => {
            input.removeListener('data', onData);
            input.setRawMode(false);
            input.pause();
            process.stdout.write('\n');
        };
        const onData = (buffer) => {
            for (const char of buffer.toString('utf8')) {
                if (char === '\u0003') {
                    cleanup();
                    reject(new Error('API-key entry cancelled.'));
                    return;
                }
                if (char === '\r' || char === '\n') {
                    cleanup();
                    resolve(value);
                    return;
                }
                if (char === '\u007f' || char === '\b') {
                    value = value.slice(0, -1);
                }
                else if (char >= ' ') {
                    value += char;
                }
            }
        };
        process.stdout.write(prompt);
        input.setRawMode(true);
        input.resume();
        input.on('data', onData);
    });
}
// List Preloaded Rules Command
program
    .command('rules')
    .description('List all preloaded coding standards & rules across languages')
    .option('-l, --lang <language>', 'Filter rules by language (ts, dart, py, go, java, php, rust, universal)')
    .action((opts) => {
    console.log('');
    console.log(pc.bold(pc.cyan(`⚡ RevAI Preloaded Rules Database (${CODING_RULES.length} rules loaded):`)));
    console.log('');
    const targetLang = opts.lang ? opts.lang.toLowerCase() : null;
    const isLangMatch = (ruleLang) => {
        if (!targetLang)
            return true;
        if (ruleLang === targetLang)
            return true;
        if ((targetLang === 'flutter' || targetLang === 'dart') && ruleLang === 'dart')
            return true;
        if ((targetLang === 'react' || targetLang === 'next' || targetLang === 'nextjs') && (ruleLang === 'react' || ruleLang === 'nextjs'))
            return true;
        if ((targetLang === 'node' || targetLang === 'nodejs' || targetLang === 'nest' || targetLang === 'nestjs') && (ruleLang === 'nodejs' || ruleLang === 'nestjs'))
            return true;
        if ((targetLang === 'fastapi' || targetLang === 'django' || targetLang === 'py' || targetLang === 'python') && (ruleLang === 'python' || ruleLang === 'fastapi' || ruleLang === 'django'))
            return true;
        if ((targetLang === 'js' || targetLang === 'javascript') && (ruleLang === 'javascript' || ruleLang === 'react'))
            return true;
        if ((targetLang === 'ts' || targetLang === 'typescript') && (ruleLang === 'typescript' || ruleLang === 'react' || ruleLang === 'nextjs'))
            return true;
        if ((targetLang === 'golang' || targetLang === 'go') && ruleLang === 'go')
            return true;
        if ((targetLang === 'spring' || targetLang === 'springboot' || targetLang === 'java') && (ruleLang === 'java' || ruleLang === 'spring'))
            return true;
        if ((targetLang === 'laravel' || targetLang === 'php') && (ruleLang === 'php' || ruleLang === 'laravel'))
            return true;
        return false;
    };
    const filtered = targetLang
        ? CODING_RULES.filter(r => isLangMatch(r.language) || r.language === 'universal')
        : CODING_RULES;
    filtered.forEach(r => {
        console.log(`  ${pc.bold(pc.yellow(`[${r.id}]`))} ${pc.bold(pc.white(r.name))} ${pc.dim(`(${r.language.toUpperCase()} | ${r.severity.toUpperCase()})`)}`);
        console.log(`    ${pc.dim(r.description)}`);
        console.log('');
    });
});
program.parse(process.argv);
