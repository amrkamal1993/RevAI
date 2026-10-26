import { CodeIssue, ReviewScore, CategoryScore } from '../types.js';

export function calculateReviewScore(
  issues: CodeIssue[],
  rawScores?: {
    overall?: number;
    security?: number;
    performance?: number;
    reliability?: number;
    maintainability?: number;
    rulesAdherence?: number;
  }
): ReviewScore {
  let baseScore = 100;

  // Deductions:
  // Critical: -20 pts
  // Major: -10 pts
  // Minor: -3 pts
  // Suggestion: -1 pt
  for (const issue of issues) {
    if (issue.severity === 'critical') baseScore -= 20;
    else if (issue.severity === 'major') baseScore -= 10;
    else if (issue.severity === 'minor') baseScore -= 3;
    else if (issue.severity === 'suggestion') baseScore -= 1;
  }

  const calculatedOverall = Math.max(0, Math.min(100, baseScore));

  // If AI model also gave an overall score, blend them (50% calculated deductions, 50% AI holistic judgment)
  const finalOverall = rawScores?.overall 
    ? Math.round((calculatedOverall * 0.6) + (rawScores.overall * 0.4))
    : calculatedOverall;

  // Build category score helper
  function buildCategoryScore(name: string, category: string, rawVal = 100): CategoryScore {
    const catIssues = issues.filter(i => i.category === category);
    const criticals = catIssues.filter(i => i.severity === 'critical').length;
    const majors = catIssues.filter(i => i.severity === 'major').length;
    
    let score = 100 - (criticals * 25) - (majors * 12) - ((catIssues.length - criticals - majors) * 4);
    score = Math.max(0, Math.min(100, score));

    if (rawVal !== undefined) {
      score = Math.round((score * 0.5) + (rawVal * 0.5));
    }

    return {
      name,
      score,
      weight: 1,
      issuesCount: catIssues.length,
      criticalCount: criticals,
      majorCount: majors
    };
  }

  const security = buildCategoryScore('Security', 'security', rawScores?.security);
  const performance = buildCategoryScore('Performance', 'performance', rawScores?.performance);
  const reliability = buildCategoryScore('Reliability', 'reliability', rawScores?.reliability);
  const maintainability = buildCategoryScore('Maintainability', 'maintainability', rawScores?.maintainability);
  const rulesAdherence = buildCategoryScore('Rules Adherence', 'rule_violation', rawScores?.rulesAdherence);

  // Grade & Status assignment
  let grade: ReviewScore['grade'] = 'A+';
  let status: ReviewScore['status'] = 'EXCELLENT';
  let summary = 'Code adheres to high quality and security standards.';

  if (finalOverall >= 92) {
    grade = 'A+';
    status = 'EXCELLENT';
    summary = 'Outstanding quality! Changes are clean, secure, and ready for production merge.';
  } else if (finalOverall >= 82) {
    grade = 'A';
    status = 'EXCELLENT';
    summary = 'High quality code with minor suggestions. Ready to merge after quick polish.';
  } else if (finalOverall >= 70) {
    grade = 'B';
    status = 'GOOD';
    summary = 'Good overall quality. Some minor issues or rule improvements should be addressed.';
  } else if (finalOverall >= 55) {
    grade = 'C';
    status = 'NEEDS_ATTENTION';
    summary = 'Contains multiple major issues or code smells. Needs attention before merging.';
  } else if (finalOverall >= 40) {
    grade = 'D';
    status = 'NEEDS_ATTENTION';
    summary = 'Significant defects, security concerns, or poor maintainability detected.';
  } else {
    grade = 'F';
    status = 'CRITICAL_RISK';
    summary = 'High-risk changes! Critical vulnerabilities or crash-inducing bugs detected.';
  }

  return {
    overall: finalOverall,
    grade,
    status,
    summary,
    security,
    performance,
    reliability,
    maintainability,
    rulesAdherence
  };
}
