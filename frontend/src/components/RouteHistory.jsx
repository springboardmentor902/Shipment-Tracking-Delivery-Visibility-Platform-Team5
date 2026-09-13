import React, { useEffect, useState } from 'react'
import { getRouteHistory } from '../api/routes'
import Loader from './Loader'

/**
 * Route Management: the full re-route history for a shipment. Fetches independently of the
 * "current route" state ShipmentDetail already tracks, since a shipment can accumulate
 * several routes over time (a re-route each time conditions change) and this needs to show
 * all of them, not just the active one.
 */
export default function RouteHistory({ shipmentId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getRouteHistory(shipmentId)
      .then((data) => { if (!cancelled) setHistory(data) })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || 'Could not load route history.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [shipmentId])

  if (loading) return <Loader label="Loading route history" />
  if (error) return <p className="text-sm text-flag">{error}</p>
  if (history.length === 0) return <p className="text-sm text-slate">No routes planned yet.</p>

  // Newest first for display, even though the API returns oldest-first (better matches
  // "current route at the top" expectations for a history list).
  const displayOrder = [...history].reverse()

  return (
    <div className="space-y-3">
      {displayOrder.map((route, index) => (
        <div
          key={route.id}
          className={`stamp-card p-4 ${route.isCurrent ? 'border-cleared' : ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="eyebrow">
              {route.isCurrent ? 'Current Route' : `Previous Route \u2014 #${displayOrder.length - index}`}
            </span>
            {route.isCurrent && (
              <span className="eyebrow inline-flex items-center gap-1.5 text-cleared">
                <span className="w-1.5 h-1.5 rounded-full bg-cleared" />
                Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <p className="eyebrow mb-1 text-[10px]">Origin</p>
              <p className="text-sm">{route.origin || '\u2014'}</p>
            </div>
            <div>
              <p className="eyebrow mb-1 text-[10px]">Destination</p>
              <p className="text-sm">{route.destination || '\u2014'}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate font-mono">
            <span>{route.distanceKm != null ? `${route.distanceKm} km` : '\u2014'}</span>
            <span>{route.estimatedTimeMinutes != null ? `${route.estimatedTimeMinutes} min est.` : '\u2014'}</span>
            {route.actualTimeMinutes != null && <span>{route.actualTimeMinutes} min actual</span>}
            <span className="ml-auto">
              {route.createdAt ? new Date(route.createdAt).toLocaleString() : '\u2014'}
            </span>
          </div>

          {route.selectionReason && (
            <p className="text-[11px] text-slate/70 mt-2 pt-2 border-t border-manifest">
              {route.selectionReason}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
