/**
 * Shared across the ETA widget, the compact risk badge, and the Business Dashboard's
 * "At Risk" list, so the thresholds and colors are defined in exactly one place.
 * delay_risk_score is 0-10 (see backend EtaPredictionServiceImpl).
 */
export const AT_RISK_THRESHOLD = 6

export function getRiskLevel(score) {
  if (score == null) return null
  if (score >= 6) return 'HIGH'
  if (score >= 3) return 'MEDIUM'
  return 'LOW'
}

export const RISK_COLORS = {
  LOW: { text: 'text-cleared', border: 'border-cleared', dot: 'bg-cleared' },
  MEDIUM: { text: 'text-beacon', border: 'border-beacon', dot: 'bg-beacon' },
  HIGH: { text: 'text-flag', border: 'border-flag', dot: 'bg-flag' },
}
