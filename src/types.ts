export type Severity = 'critical' | 'major' | 'minor' | 'suggestion';

export type Category = 
  | 'security'
  | 'performance'
  | 'reliability'
  | 'maintainability'
  | 'rule_violation'
  | 'style';

export interface CodeIssue {
  id: string;
  file: string;
  lineStart?: number;
  lineEnd?: number;
  severity: Severity;
  category: Category;
  ruleId?: string;
  ruleName?: string;
  title: string;
  description: string;
  whyItMatters: string;
  suggestedFix: string;
  codeSnippet?: string;
  fixedCodeSnippet?: string;
}

export interface AIReviewResponse {
  summary: string;
  positiveHighlights: string[];
  scores: {
    overall: number;
    security: number;
    performance: number;
    reliability: number;
    maintainability: number;
    rulesAdherence: number;
  };
  issues: CodeIssue[];
}

export interface CategoryScore {
  name: string;
  score: number; // 0 - 100
  weight: number;
  issuesCount: number;
  criticalCount: number;
  majorCount: number;
}

export interface ReviewScore {
  overall: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL_RISK';
  summary: string;
  security: CategoryScore;
  performance: CategoryScore;
  reliability: CategoryScore;
  maintainability: CategoryScore;
  rulesAdherence: CategoryScore;
}

export interface ReviewStats {
  filesChanged: number;
  additions: number;
  deletions: number;
  totalLinesChanged: number;
  languagesDetected: string[];
  rulesCheckedCount: number;
}

export interface ReviewResult {
  title: string;
  targetDescription: string;
  timestamp: string;
  stats: ReviewStats;
  score: ReviewScore;
  issues: CodeIssue[];
  positiveHighlights: string[];
  rawDiffSnippet?: string;
}

export interface CodingRule {
  id: string;
  language: string; // 'typescript' | 'javascript' | 'python' | 'dart' | 'go' | 'java' | 'php' | 'rust' | 'universal'
  category: Category;
  severity: Severity;
  name: string;
  description: string;
  badExample?: string;
  goodExample?: string;
}

export type AIProvider = 'gemini' | 'groq' | 'ollama' | 'openai' | 'custom';

export interface ReviewOptions {
  staged?: boolean;
  working?: boolean;
  branch?: string;
  base?: string;
  commit?: string;
  file?: string;
  patch?: string;
  pr?: string;
  ui?: boolean;
  port?: number;
  markdown?: boolean;
  json?: boolean;
  outputFile?: string;
  apiKey?: string;
  model?: string;
  provider?: AIProvider;
  baseUrl?: string;
  verbose?: boolean;
}
