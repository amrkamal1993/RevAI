import pc from 'picocolors';
import { ReviewResult, CodeIssue, Severity } from '../types.js';

function getSeverityBadge(severity: Severity): string {
  switch (severity) {
    case 'critical':
      return pc.bgRed(pc.white(pc.bold(' CRITICAL ')));
    case 'major':
      return pc.bgYellow(pc.black(pc.bold(' MAJOR ')));
    case 'minor':
      return pc.bgCyan(pc.black(pc.bold(' MINOR ')));
    case 'suggestion':
      return pc.bgBlue(pc.white(pc.bold(' INFO ')));
  }
}

function getGradeBadge(grade: string, status: string): string {
  if (grade.startsWith('A')) {
    return pc.bgGreen(pc.black(pc.bold(` GRADE ${grade} • ${status} `)));
  } else if (grade === 'B') {
    return pc.bgCyan(pc.black(pc.bold(` GRADE ${grade} • ${status} `)));
  } else if (grade === 'C') {
    return pc.bgYellow(pc.black(pc.bold(` GRADE ${grade} • ${status} `)));
  } else {
    return pc.bgRed(pc.white(pc.bold(` GRADE ${grade} • ${status} `)));
  }
}

function renderProgressBar(score: number, width = 14): string {
  const filledCount = Math.round((score / 100) * width);
  const emptyCount = Math.max(0, width - filledCount);
  const bar = '█'.repeat(filledCount) + '░'.repeat(emptyCount);
  if (score >= 80) return pc.green(bar);
  if (score >= 60) return pc.yellow(bar);
  return pc.red(bar);
}

export function formatTerminalReport(result: ReviewResult): string {
  const lines: string[] = [];
  const s = result.score;
  const stats = result.stats;

  lines.push('');
  lines.push(pc.bold(pc.cyan('╔═══════════════════════════════════════════════════════════════════════╗')));
  lines.push(pc.bold(pc.cyan('║              ⚡ RevAI — Intelligent AI Code Review Report             ║')));
  lines.push(pc.bold(pc.cyan('╚═══════════════════════════════════════════════════════════════════════╝')));
  lines.push('');

  lines.push(`  ${pc.bold('Target:')}      ${pc.white(result.targetDescription)}`);
  lines.push(`  ${pc.bold('Languages:')}   ${pc.magenta(stats.languagesDetected.join(', ').toUpperCase() || 'MULTI')}`);
  lines.push(`  ${pc.bold('Diff Stats:')}  ${pc.green(`+${stats.additions}`)} ${pc.red(`-${stats.deletions}`)} lines across ${pc.yellow(`${stats.filesChanged} file(s)`)}`);
  lines.push(`  ${pc.bold('Rules:')}       ${pc.blue(`${stats.rulesCheckedCount} preloaded rules audited`)}`);
  lines.push('');

  // Overall Score Banner
  lines.push(pc.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  lines.push(`  ${pc.bold('Overall Score:')}  ${pc.bold(pc.white(`${s.overall}/100`))}  ${getGradeBadge(s.grade, s.status)}`);
  lines.push(`  ${pc.dim(s.summary)}`);
  lines.push(pc.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  lines.push('');

  // Category Breakdown
  lines.push(pc.bold('📊 Category Performance Breakdown:'));
  const cats = [
    { label: '🛡️  Security      ', score: s.security.score },
    { label: '⚡ Performance   ', score: s.performance.score },
    { label: '🐛 Reliability   ', score: s.reliability.score },
    { label: '🧹 Maintainability', score: s.maintainability.score },
    { label: '📐 Rule Adherence ', score: s.rulesAdherence.score },
  ];

  for (const c of cats) {
    const formattedScore = `${c.score}%`.padStart(4, ' ');
    lines.push(`   ${c.label} ${renderProgressBar(c.score)} ${pc.bold(formattedScore)}`);
  }
  lines.push('');

  // Positive Highlights
  if (result.positiveHighlights && result.positiveHighlights.length > 0) {
    lines.push(pc.bold(pc.green('✨ What Went Well (Highlights):')));
    for (const h of result.positiveHighlights) {
      lines.push(`   ${pc.green('✔')} ${pc.dim(h)}`);
    }
    lines.push('');
  }

  // Issues Breakdown
  const criticals = result.issues.filter(i => i.severity === 'critical');
  const majors = result.issues.filter(i => i.severity === 'major');
  const minors = result.issues.filter(i => i.severity === 'minor');
  const suggestions = result.issues.filter(i => i.severity === 'suggestion');

  lines.push(pc.bold(`🔍 Detected Issues & Recommendations (${result.issues.length} total):`));
  lines.push(`   🔴 Critical: ${pc.bold(criticals.length)}   🟠 Major: ${pc.bold(majors.length)}   🟡 Minor: ${pc.bold(minors.length)}   🔵 Suggestions: ${pc.bold(suggestions.length)}`);
  lines.push('');

  if (result.issues.length === 0) {
    lines.push(`   ${pc.green(pc.bold('🎉 Zero issues found! The code looks remarkably clean and well-structured.'))}`);
  } else {
    result.issues.forEach((issue, idx) => {
      const lineRange = issue.lineStart ? `:${issue.lineStart}${issue.lineEnd ? `-${issue.lineEnd}` : ''}` : '';
      const location = `${issue.file}${lineRange}`;

      lines.push(` ${pc.bold(`${idx + 1}.`)} ${getSeverityBadge(issue.severity)} ${pc.bold(pc.white(issue.title))}`);
      lines.push(`    ${pc.dim('File:')} ${pc.underline(pc.cyan(location))}  ${issue.ruleId ? pc.dim(`[Rule: ${issue.ruleId}]`) : ''}`);
      lines.push(`    ${pc.yellow('Problem:')} ${issue.description}`);
      lines.push(`    ${pc.red('Why it matters:')} ${pc.dim(issue.whyItMatters)}`);
      
      if (issue.codeSnippet) {
        lines.push(`    ${pc.dim('Issue Code:')}`);
        issue.codeSnippet.split('\n').forEach(l => lines.push(`      ${pc.red('-')} ${pc.dim(l)}`));
      }

      if (issue.fixedCodeSnippet) {
        lines.push(`    ${pc.green('Suggested Fix:')}`);
        issue.fixedCodeSnippet.split('\n').forEach(l => lines.push(`      ${pc.green('+')} ${pc.white(l)}`));
      } else if (issue.suggestedFix) {
        lines.push(`    ${pc.green('Fix Suggestion:')} ${issue.suggestedFix}`);
      }

      lines.push(pc.dim('   ' + '─'.repeat(68)));
    });
  }

  lines.push('');
  lines.push(pc.dim('💡 Tip: Launch the interactive web dashboard with: ') + pc.cyan(pc.bold('revai --ui')));
  lines.push(pc.dim('💡 Tip: Export to Markdown for GitHub PR comments: ') + pc.cyan(pc.bold('revai --markdown > review.md')));
  lines.push('');

  return lines.join('\n');
}
