export type SwotQuadrant = 'strengths' | 'weaknesses' | 'opportunities' | 'threats' | 'unclassified';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface IPriorityCalculation {
  priority: PriorityLevel;
  severity: PriorityLevel;
  priorityScore: number;
  reason: string;
}

const LEVEL_VALUES: Record<PriorityLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const QUADRANT_BASE_SCORES: Record<SwotQuadrant, number> = {
  strengths: 1,
  opportunities: 2,
  weaknesses: 3,
  threats: 4,
  unclassified: 0,
};

const DEFAULT_SEVERITIES: Record<SwotQuadrant, PriorityLevel> = {
  strengths: 'low',
  opportunities: 'medium',
  weaknesses: 'high',
  threats: 'critical',
  unclassified: 'low',
};

export function calculateItemPriority(
  quadrant: SwotQuadrant,
  impact: PriorityLevel,
  urgency: PriorityLevel,
  severityInput?: PriorityLevel
): IPriorityCalculation {
  const quadrantBase = QUADRANT_BASE_SCORES[quadrant];
  const impactVal = LEVEL_VALUES[impact] ?? 2;
  const urgencyVal = LEVEL_VALUES[urgency] ?? 2;
  
  // If no severity is specified, use quadrant default
  const finalSeverity = severityInput || DEFAULT_SEVERITIES[quadrant];
  const severityVal = LEVEL_VALUES[finalSeverity] ?? 2;

  // Score formula: Sum of values + quadrant base
  const score = quadrantBase + impactVal + urgencyVal + severityVal;

  let priority: PriorityLevel = 'medium';
  if (quadrant === 'unclassified') {
    priority = 'low';
  } else if (score <= 6) {
    priority = 'low';
  } else if (score <= 9) {
    priority = 'medium';
  } else if (score <= 12) {
    priority = 'high';
  } else {
    priority = 'critical';
  }

  const capitalizedQuadrant = quadrant === 'unclassified' 
    ? 'Unclassified' 
    : quadrant.charAt(0).toUpperCase() + quadrant.slice(1);
    
  const reason = `This item is a ${capitalizedQuadrant} with ${impact.toUpperCase()} Impact, ${urgency.toUpperCase()} Urgency, and ${finalSeverity.toUpperCase()} Severity.`;

  return {
    priority,
    severity: finalSeverity,
    priorityScore: score,
    reason,
  };
}
