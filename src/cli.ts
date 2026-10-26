import { Command } from 'commander';
import fs from 'node:fs';
import pc from 'picocolors';
import { runCodeReview } from './review/reviewer.js';
import { formatTerminalReport } from './formatters/terminal.js';
import { formatMarkdownReport } from './formatters/markdown.js';
import { startUiServer } from './server/ui-server.js';
import { loadGlobalConfig, saveGlobalConfig, resolveApiKey } from './config.js';
import { CODING_RULES } from './rules/rules-db.js';
import { ReviewOptions } from './types.js';

const program = new Command();

program
  .name('revai')
  .description('⚡ 100% Free AI Code Reviewer with Preloaded Language Rules & Performance Scoring')
  .version('1.0.0');

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
  .option('--api-key <key>', 'Google Gemini API Key (or set GEMINI_API_KEY env)')
  .option('--model <name>', 'Gemini model name', 'gemini-3.5-flash')
  .action(async (opts) => {
    try {
      const options: ReviewOptions = {
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
        apiKey: opts.apiKey,
        model: opts.model
      };

      // Check API Key
      const key = resolveApiKey(options.apiKey);
      if (!key) {
        console.log('');
        console.log(pc.yellow(pc.bold('⚠️  Gemini API Key Required:')));
        console.log(`RevAI uses Google's powerful Gemini model, which offers a ${pc.bold('100% FREE tier')}.`);
        console.log(`Get your free key in 30 seconds at: ${pc.cyan(pc.underline('https://aistudio.google.com/app/apikey'))}`);
        console.log('');
        console.log('You can save it permanently by running:');
        console.log(`  ${pc.green('revai config --set-key <YOUR_FREE_API_KEY>')}`);
        console.log('');
        console.log('Or pass it for this run only:');
        console.log(`  ${pc.green('revai --api-key <YOUR_FREE_API_KEY>')}`);
        console.log('');
        process.exit(1);
      }

      console.log(pc.cyan('⚡ Analyzing code changes & auditing against preloaded rules...'));

      const result = await runCodeReview(options);

      // JSON output
      if (options.json) {
        const jsonStr = JSON.stringify(result, null, 2);
        if (options.outputFile) {
          fs.writeFileSync(options.outputFile, jsonStr, 'utf-8');
          console.log(pc.green(`✔ JSON report saved to ${options.outputFile}`));
        } else {
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
        } else {
          console.log(mdReport);
        }
      } else {
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

    } catch (err: any) {
      console.error('');
      console.error(pc.red(pc.bold('✖ Review Failed:')), err.message);
      console.error('');
      process.exit(1);
    }
  });

// Configuration Command
program
  .command('config')
  .description('Manage global RevAI configuration and free API keys')
  .option('--set-key <key>', 'Save Google Gemini API key permanently')
  .option('--show', 'Display current configuration')
  .action((opts) => {
    if (opts.setKey) {
      saveGlobalConfig({ geminiApiKey: opts.setKey });
      console.log(pc.green('✔ Gemini API key saved successfully in ~/.revai/config.json!'));
      console.log(pc.dim('You can now run "revai" anywhere without entering your key.'));
      return;
    }

    if (opts.show || Object.keys(opts).length === 0) {
      const cfg = loadGlobalConfig();
      console.log(pc.bold('RevAI Configuration (~/.revai/config.json):'));
      if (cfg.geminiApiKey) {
        const masked = cfg.geminiApiKey.slice(0, 6) + '...' + cfg.geminiApiKey.slice(-4);
        console.log(`  Gemini API Key: ${pc.green(masked)} (Configured)`);
      } else {
        console.log(`  Gemini API Key: ${pc.red('Not set')}`);
        console.log(`  Get free key at: ${pc.cyan('https://aistudio.google.com/app/apikey')}`);
      }
    }
  });

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
    const isLangMatch = (ruleLang: string) => {
      if (!targetLang) return true;
      if (ruleLang === targetLang) return true;
      if ((targetLang === 'flutter' || targetLang === 'dart') && ruleLang === 'dart') return true;
      if ((targetLang === 'js' || targetLang === 'javascript') && ruleLang === 'javascript') return true;
      if ((targetLang === 'ts' || targetLang === 'typescript') && (ruleLang === 'typescript' || ruleLang === 'javascript')) return true;
      if ((targetLang === 'py' || targetLang === 'python') && ruleLang === 'python') return true;
      if ((targetLang === 'golang' || targetLang === 'go') && ruleLang === 'go') return true;
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
