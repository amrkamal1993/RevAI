import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
export function isGitRepo(cwd = process.cwd()) {
    try {
        execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd, stdio: 'ignore' });
        return true;
    }
    catch {
        return false;
    }
}
export function getCurrentBranch(cwd = process.cwd()) {
    try {
        return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd, encoding: 'utf-8' }).trim();
    }
    catch {
        return 'unknown';
    }
}
export async function fetchGitHubPRDiff(prUrl) {
    const parsedUrl = new URL(prUrl.trim());
    const match = parsedUrl.pathname.match(/^\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/pull\/(\d+)(?:\.diff)?\/?$/);
    if (parsedUrl.protocol !== 'https:' ||
        parsedUrl.hostname !== 'github.com' ||
        parsedUrl.port ||
        parsedUrl.username ||
        parsedUrl.password ||
        parsedUrl.search ||
        parsedUrl.hash ||
        !match) {
        throw new Error('Invalid GitHub PR URL. Expected https://github.com/{owner}/{repo}/pull/{number}.');
    }
    const diffUrl = `https://github.com/${match[1]}/${match[2]}/pull/${match[3]}.diff`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let response;
    try {
        response = await fetch(diffUrl, {
            headers: {
                'User-Agent': 'RevAI-Code-Reviewer',
                'Accept': 'text/plain'
            },
            redirect: 'error',
            signal: controller.signal
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch GitHub PR diff (Status: ${response.status} ${response.statusText})`);
        }
        const maxBytes = 5 * 1024 * 1024;
        const declaredLength = Number(response.headers.get('content-length'));
        if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
            throw new Error('GitHub PR diff is too large (maximum 5 MB).');
        }
        if (!response.body)
            return '';
        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            received += value.byteLength;
            if (received > maxBytes) {
                await reader.cancel();
                throw new Error('GitHub PR diff is too large (maximum 5 MB).');
            }
            chunks.push(value);
        }
        const content = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
            content.set(chunk, offset);
            offset += chunk.byteLength;
        }
        return new TextDecoder().decode(content);
    }
    finally {
        clearTimeout(timeout);
    }
}
function git(cwd, args, options) {
    return execFileSync('git', args, { cwd, encoding: options.encoding, maxBuffer: options.maxBuffer });
}
function resolveCommitish(value, label, cwd) {
    const candidate = value.trim();
    if (!candidate || candidate.startsWith('-')) {
        throw new Error(`Invalid ${label}: ${value}`);
    }
    try {
        return git(cwd, ['rev-parse', '--verify', '--end-of-options', `${candidate}^{commit}`], { encoding: 'utf-8' }).trim();
    }
    catch {
        throw new Error(`Invalid ${label}: ${value}`);
    }
}
export function getGitDiff(options, cwd = process.cwd()) {
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
    let diffArgs = [];
    let description = '';
    if (options.file) {
        diffArgs = ['diff', 'HEAD', '--no-ext-diff', '--no-textconv', '--', options.file];
        description = `File: ${options.file}`;
    }
    else if (options.commit) {
        const commit = resolveCommitish(options.commit, 'commit', cwd);
        diffArgs = ['show', '--stat=0', '-p', '--no-ext-diff', '--no-textconv', commit];
        description = `Commit: ${commit.slice(0, 12)}`;
    }
    else if (options.branch) {
        const base = options.base || 'main';
        // Check if base branch exists, fallback to master if main doesn't exist
        let verifiedBase;
        let verifiedBaseName = base;
        try {
            verifiedBase = resolveCommitish(base, 'base branch', cwd);
        }
        catch {
            if (base !== 'main')
                throw new Error(`Invalid base branch: ${base}`);
            verifiedBaseName = 'master';
            verifiedBase = resolveCommitish('master', 'base branch', cwd);
        }
        const branch = resolveCommitish(options.branch, 'branch', cwd);
        diffArgs = ['diff', '--no-ext-diff', '--no-textconv', `${verifiedBase}...${branch}`, '--'];
        description = `Branch comparison: ${options.branch} compared to ${verifiedBaseName}`;
    }
    else if (options.staged) {
        diffArgs = ['diff', '--cached', '--no-ext-diff', '--no-textconv'];
        description = 'Staged changes (git diff --cached)';
    }
    else if (options.working) {
        diffArgs = ['diff', '--no-ext-diff', '--no-textconv'];
        description = 'Unstaged working tree changes';
    }
    else {
        // Default smart mode:
        // 1. Try staged changes first
        const staged = git(cwd, ['diff', '--cached', '--no-ext-diff', '--no-textconv'], { encoding: 'utf-8' });
        if (staged.trim().length > 0) {
            return { diff: staged, description: 'Staged changes (ready to commit)' };
        }
        // 2. Try working tree + staged (HEAD)
        const workingAndStaged = git(cwd, ['diff', 'HEAD', '--no-ext-diff', '--no-textconv'], { encoding: 'utf-8' });
        if (workingAndStaged.trim().length > 0) {
            return { diff: workingAndStaged, description: 'All uncommitted changes (staged & working tree)' };
        }
        // 3. If working tree is clean, review the latest commit!
        diffArgs = ['show', '--stat=0', '-p', '--no-ext-diff', '--no-textconv', 'HEAD'];
        description = 'Latest commit (HEAD)';
    }
    try {
        const diff = git(cwd, diffArgs, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        return { diff, description };
    }
    catch (err) {
        throw new Error(`Failed to execute Git command: ${err.message}`);
    }
}
export function analyzeDiffStats(diffText) {
    const lines = diffText.split('\n');
    let additions = 0;
    let deletions = 0;
    const files = new Set();
    const languages = new Set();
    for (const line of lines) {
        if (line.startsWith('diff --git ')) {
            const match = line.match(/diff --git a\/(.+) b\/(.+)/);
            if (match) {
                const filePath = match[2];
                files.add(filePath);
                const ext = path.extname(filePath).replace('.', '').toLowerCase();
                if (ext)
                    languages.add(ext);
            }
        }
        else if (line.startsWith('+') && !line.startsWith('+++')) {
            additions++;
        }
        else if (line.startsWith('-') && !line.startsWith('---')) {
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
