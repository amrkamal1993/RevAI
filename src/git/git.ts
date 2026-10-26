import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ReviewOptions, ReviewStats } from '../types.js';

export function isGitRepo(cwd = process.cwd()): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function getCurrentBranch(cwd = process.cwd()): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd, encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

export async function fetchGitHubPRDiff(prUrl: string): Promise<string> {
  // Accepts URL like: https://github.com/owner/repo/pull/123
  let diffUrl = prUrl.trim();
  if (!diffUrl.endsWith('.diff')) {
    diffUrl = diffUrl.replace(/\/+$/, '') + '.diff';
  }

  const response = await fetch(diffUrl, {
    headers: {
      'User-Agent': 'RevAI-Code-Reviewer',
      'Accept': 'text/plain'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub PR diff from ${diffUrl} (Status: ${response.status} ${response.statusText})`);
  }

  return await response.text();
}

export function getGitDiff(options: ReviewOptions, cwd = process.cwd()): { diff: string; description: string } {
  if (options.patch) {
    if (!fs.existsSync(options.patch)) {
      throw new Error(`Patch file not found: ${options.patch}`);
    }
    return {
      diff: fs.readFileSync(options.patch, 'utf-8'),
      description: `Patch file: ${path.basename(options.patch)}`
    };
  }

  if (!isGitRepo(cwd)) {
    throw new Error(`Current directory (${cwd}) is not a Git repository. Run inside a git repository or pass --patch / --pr.`);
  }

  let diffCommand = '';
  let description = '';

  if (options.file) {
    diffCommand = `git diff HEAD -- "${options.file}"`;
    description = `File: ${options.file}`;
  } else if (options.commit) {
    diffCommand = `git show ${options.commit} --stat=0 -p`;
    description = `Commit: ${options.commit}`;
  } else if (options.branch) {
    const base = options.base || 'main';
    // Check if base branch exists, fallback to master if main doesn't exist
    let verifiedBase = base;
    try {
      execSync(`git rev-parse --verify ${verifiedBase}`, { cwd, stdio: 'ignore' });
    } catch {
      verifiedBase = 'master';
    }
    diffCommand = `git diff ${verifiedBase}...${options.branch}`;
    description = `Branch comparison: ${options.branch} compared to ${verifiedBase}`;
  } else if (options.staged) {
    diffCommand = 'git diff --cached';
    description = 'Staged changes (git diff --cached)';
  } else if (options.working) {
    diffCommand = 'git diff';
    description = 'Unstaged working tree changes';
  } else {
    // Default smart mode:
    // 1. Try staged changes first
    const staged = execSync('git diff --cached', { cwd, encoding: 'utf-8' });
    if (staged.trim().length > 0) {
      return { diff: staged, description: 'Staged changes (ready to commit)' };
    }

    // 2. Try working tree + staged (HEAD)
    const workingAndStaged = execSync('git diff HEAD', { cwd, encoding: 'utf-8' });
    if (workingAndStaged.trim().length > 0) {
      return { diff: workingAndStaged, description: 'All uncommitted changes (staged & working tree)' };
    }

    // 3. If working tree is clean, review the latest commit!
    diffCommand = 'git show HEAD --stat=0 -p';
    description = 'Latest commit (HEAD)';
  }

  try {
    const diff = execSync(diffCommand, { cwd, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    return { diff, description };
  } catch (err: any) {
    throw new Error(`Failed to execute Git command "${diffCommand}": ${err.message}`);
  }
}

export function analyzeDiffStats(diffText: string): ReviewStats {
  const lines = diffText.split('\n');
  let additions = 0;
  let deletions = 0;
  const files = new Set<string>();
  const languages = new Set<string>();

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      const match = line.match(/diff --git a\/(.+) b\/(.+)/);
      if (match) {
        const filePath = match[2];
        files.add(filePath);
        const ext = path.extname(filePath).replace('.', '').toLowerCase();
        if (ext) languages.add(ext);
      }
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
    }
  }

  return {
    filesChanged: files.size || 1,
    additions,
    deletions,
    totalLinesChanged: additions + deletions,
    languagesDetected: Array.from(languages),
    rulesCheckedCount: 0
  };
}
