import { DrillSessionRecord } from '@models/drill-session-record.model';
import { ScoringCriteria } from '@models/challenge-drill.model';

export interface ADLScoreResult {
  totalScore: number; // 0-1000
  stars: number; // 0-3
  breakdown: {
    timeScore: number; // 0-400
    accuracyScore: number; // 0-400
    groupingScore: number; // 0-200
  };
}

/**
 * Calculate ADL Score for a drill session based on scoring criteria
 *
 * Scoring breakdown:
 * - Time (400 points): Faster completion = higher score
 * - Accuracy (400 points): Lower average distance from center = higher score
 * - Grouping (200 points): Tighter shot grouping = higher score
 *
 * Stars are awarded based on total score:
 * - 3 stars: 900-1000 (90-100%)
 * - 2 stars: 750-899 (75-89%)
 * - 1 star: 600-749 (60-74%)
 * - 0 stars: <600 (<60%)
 */
export function calculateADLScore(
  session: DrillSessionRecord,
  criteria: ScoringCriteria
): ADLScoreResult {
  const { statistics } = session;
  const {
    perfectTime,
    maxAcceptableDistance,
    maxAcceptableGrouping,
    threeStars,
    twoStars,
    oneStar,
  } = criteria;

  // 1. Time Score (400 points max)
  // Formula: min(400, 400 * (perfectTime / actualTime))
  // If you complete in perfectTime or less, you get full 400 points
  const timeScore = Math.min(
    400,
    Math.round(400 * (perfectTime / statistics.totalTime))
  );

  // 2. Accuracy Score (400 points max)
  // Formula: 400 * (1 - (avgDistance / maxAcceptableDistance))
  // Lower average distance from center = higher score
  const accuracyRatio = Math.max(
    0,
    1 - statistics.avgDistance / maxAcceptableDistance
  );
  const accuracyScore = Math.round(400 * accuracyRatio);

  // 3. Grouping Score (200 points max)
  // Formula: 200 * (1 - (grouping / maxAcceptableGrouping))
  // Tighter grouping (lower value) = higher score
  const groupingRatio = Math.max(
    0,
    1 - statistics.grouping / maxAcceptableGrouping
  );
  const groupingScore = Math.round(200 * groupingRatio);

  // Total ADL Score (0-1000)
  const totalScore = timeScore + accuracyScore + groupingScore;

  // Calculate stars based on total score
  let stars = 0;
  if (totalScore >= threeStars) stars = 3;
  else if (totalScore >= twoStars) stars = 2;
  else if (totalScore >= oneStar) stars = 1;

  return {
    totalScore,
    stars,
    breakdown: {
      timeScore,
      accuracyScore,
      groupingScore,
    },
  };
}
