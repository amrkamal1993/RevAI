const severities = new Set(['critical', 'major', 'minor', 'suggestion']);
const categories = new Set([
    'security', 'performance', 'reliability', 'maintainability', 'rule_violation', 'style'
]);
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function requiredText(value, field, maxLength) {
    if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
        throw new Error(`AI review response has an invalid "${field}" field.`);
    }
    return value;
}
function optionalText(value, field, maxLength) {
    if (value === undefined || value === null)
        return undefined;
    return requiredText(value, field, maxLength);
}
function score(value, field) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
        throw new Error(`AI review response has an invalid "${field}" score.`);
    }
    return value;
}
function validateIssue(value, index) {
    if (!isRecord(value))
        throw new Error(`AI review response issue ${index + 1} is invalid.`);
    const severity = value.severity;
    const category = value.category;
    if (typeof severity !== 'string' || !severities.has(severity)) {
        throw new Error(`AI review response issue ${index + 1} has an invalid severity.`);
    }
    if (typeof category !== 'string' || !categories.has(category)) {
        throw new Error(`AI review response issue ${index + 1} has an invalid category.`);
    }
    const lineStart = value.lineStart;
    const lineEnd = value.lineEnd;
    for (const [name, line] of [['lineStart', lineStart], ['lineEnd', lineEnd]]) {
        if (line !== undefined && (!Number.isSafeInteger(line) || line < 1 || line > 10_000_000)) {
            throw new Error(`AI review response issue ${index + 1} has an invalid ${name}.`);
        }
    }
    if (typeof lineStart === 'number' && typeof lineEnd === 'number' && lineEnd < lineStart) {
        throw new Error(`AI review response issue ${index + 1} has an invalid line range.`);
    }
    return {
        id: requiredText(value.id, `issues[${index}].id`, 200),
        file: requiredText(value.file, `issues[${index}].file`, 1000),
        lineStart: lineStart,
        lineEnd: lineEnd,
        severity: severity,
        category: category,
        ruleId: optionalText(value.ruleId, `issues[${index}].ruleId`, 200),
        ruleName: optionalText(value.ruleName, `issues[${index}].ruleName`, 500),
        title: requiredText(value.title, `issues[${index}].title`, 1000),
        description: requiredText(value.description, `issues[${index}].description`, 5000),
        whyItMatters: requiredText(value.whyItMatters, `issues[${index}].whyItMatters`, 5000),
        suggestedFix: requiredText(value.suggestedFix, `issues[${index}].suggestedFix`, 5000),
        codeSnippet: optionalText(value.codeSnippet, `issues[${index}].codeSnippet`, 20000),
        fixedCodeSnippet: optionalText(value.fixedCodeSnippet, `issues[${index}].fixedCodeSnippet`, 20000)
    };
}
export function validateAIReviewResponse(value) {
    if (!isRecord(value) || !isRecord(value.scores)) {
        throw new Error('AI provider returned a response with an invalid structure.');
    }
    if (!Array.isArray(value.issues) || value.issues.length > 200) {
        throw new Error('AI review response must contain no more than 200 issues.');
    }
    if (!Array.isArray(value.positiveHighlights) || value.positiveHighlights.length > 30) {
        throw new Error('AI review response contains an invalid positiveHighlights list.');
    }
    return {
        summary: requiredText(value.summary, 'summary', 2000),
        positiveHighlights: value.positiveHighlights.map((item, index) => requiredText(item, `positiveHighlights[${index}]`, 500)),
        scores: {
            overall: score(value.scores.overall, 'overall'),
            security: score(value.scores.security, 'security'),
            performance: score(value.scores.performance, 'performance'),
            reliability: score(value.scores.reliability, 'reliability'),
            maintainability: score(value.scores.maintainability, 'maintainability'),
            rulesAdherence: score(value.scores.rulesAdherence, 'rulesAdherence')
        },
        issues: value.issues.map(validateIssue)
    };
}
