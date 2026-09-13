import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPendingVerifications } from '../api/pod'
import Loader from '../components/Loader'
import ErrorNote from '../components/ErrorNote'

/**
 * The verification queue itself. Clicking a row takes staff to that shipment's detail page,
 * which already renders the full signature image, photo image, and Verify/Dispute buttons
 * (both calling PATCH /api/pod/{shipmentId}/verify) - reused rather than duplicated here.
 */
export default function VerificationQueue() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getPendingVerifications()
      .then(setItems)
      .catch((err) => setError(err.response?.data?.message || 'Could not load the verification queue.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <p className="eyebrow text-slate mb-1">Support / Admin</p>
      <h1 className="font-display font-semibold text-2xl mb-8">Verification Queue</h1>

      <ErrorNote message={error} />

      {loading ? (
        <Loader label="Loading pending proofs" />
      ) : items.length === 0 ? (
        <div className="stamp-card px-6 py-10 text-center">
          <p className="text-sm text-slate">Nothing waiting on verification right now.</p>
        </div>
      ) : (
        <div className="divide-y divide-manifest border-t border-b border-manifest">
          {items.map((pod) => (
            <Link
              key={pod.id}
              to={`/shipments/${pod.shipmentId}`}
              className="flex items-center gap-6 py-4 hover:bg-papershade transition-colors px-2"
            >
              <div className="w-44 shrink-0">
                <p className="font-mono text-sm">{pod.trackingNumber}</p>
                <p className="text-xs text-slate mt-0.5">Delivered to {pod.deliveredToName}</p>
              </div>
              <div className="flex-1">
                {pod.deliveryNotes && <p className="text-sm text-slate truncate">{pod.deliveryNotes}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {pod.signatureUrl && <span className="eyebrow border border-manifest px-2 py-1">Signed</span>}
                {pod.photoUrl && <span className="eyebrow border border-manifest px-2 py-1">Photo</span>}
                <span className="font-mono text-xs text-slate/70">
                  {pod.deliveredAt ? new Date(pod.deliveredAt).toLocaleString() : '\u2014'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
