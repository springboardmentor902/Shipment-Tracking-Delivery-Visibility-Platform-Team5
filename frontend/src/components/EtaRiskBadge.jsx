import React from 'react'
import { getRiskLevel, RISK_COLORS } from '../constants/eta'

/** A small color-coded "LOW/MEDIUM/HIGH RISK 6.5/10" label. Used inline wherever space is tight. */
export default function EtaRiskBadge({ score }) {
  const level = getRiskLevel(score)
  if (!level) {
    return <span className="eyebrow text-slate">No prediction</span>
  }
  const colors = RISK_COLORS[level]
  return (
    <span className={`eyebrow inline-flex items-center gap-1.5 border px-2 py-1 ${colors.text} ${colors.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {level} RISK {Number(score).toFixed(1)}/10
    </span>
  )
}
