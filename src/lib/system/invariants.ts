export type SystemState = 'active' | 'sealed';

export type InvariantIssueType = 'inability' | 'ambiguity' | 'contradiction';

export interface InvariantIssue {
  type: InvariantIssueType;
  message: string;
  detectedAt: number;
}

export function createInvariantIssue(
  type: InvariantIssueType,
  message: string,
  detectedAt = Date.now()
): InvariantIssue {
  return {
    type,
    message,
    detectedAt,
  };
}

export function shouldSealSystem(issues: InvariantIssue[]): boolean {
  return issues.some(issue =>
    issue.type === 'inability' ||
    issue.type === 'ambiguity' ||
    issue.type === 'contradiction'
  );
}
