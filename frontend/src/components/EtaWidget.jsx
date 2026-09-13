import React from 'react'
import EtaRiskBadge from './EtaRiskBadge'
import { getRiskLevel, RISK_COLORS } from '../constants/eta'

/**
 * The ETA + delay-risk widget, per the ETA Prediction module spec: predicted delivery
 * time, delay risk (color-coded), and confidence. Used on the shipment detail page (full),
 * and reused compactly wherever ETA needs to sit alongside live tracking info.
 *
 * Props:
 *  - eta: EtaPredictionResponse | null
 *  - onRecalculate: optional () => void - only rendered if provided (staff/business only,
 *    matching the backend's POST /api/eta/{id}/predict role restriction)
 *  - busy: boolean - disables the recalculate button while a request is in flight
 */
export default function EtaWidget({ eta, onRecalculate, busy }) {
  const level = eta ? getRiskLevel(eta.delayRiskScore) : null
  const colors = level ? RISK_COLORS[level] : null

  return (
    <div className="stamp-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="eyebrow">ETA Prediction</p>
        {onRecalculate && (
          <button onClick={onRecalculate} disabled={busy} className="eyebrow underline underline-offset-2">
            Recalculate
          </button>
        )}
      </div>

      {eta ? (
        <>
          <div className="mb-3">
            <p className="eyebrow mb-1">Predicted delivery</p>
            <p className="font-mono text-sm">{new Date(eta.predictedDeliveryTime).toLocaleString()}</p>
          </div>

          <div className="mb-3">
            <p className="eyebrow mb-1.5">Delay risk</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-manifest/60 relative overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 ${colors?.dot}`}
                  style={{ width: `${Math.min(100, (Number(eta.delayRiskScore) / 10) * 100)}%` }}
                />
              </div>
              <span className={`font-mono text-sm ${colors?.text}`}>{Number(eta.delayRiskScore).toFixed(1)}/10</span>
            </div>
            <div className="mt-1.5">
              <EtaRiskBadge score={eta.delayRiskScore} />
            </div>
          </div>

          <dl className="space-y-2 text-sm pt-3 border-t border-manifest">
            <div className="flex justify-between">
              <dt className="text-slate">Confidence</dt>
              <dd className="font-mono">{Number(eta.confidenceScore).toFixed(0)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate">Last calculated</dt>
              <dd className="font-mono">{new Date(eta.calculatedAt).toLocaleTimeString()}</dd>
            </div>
          </dl>

          {eta.factors && (
            <p className="text-[11px] text-slate/70 mt-3 pt-3 border-t border-manifest leading-relaxed">
              {eta.factors}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-slate">No prediction available yet.</p>
      )}
    </div>
  )
}
