import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { trackShipment } from '../api/shipments'
import { getCurrentRoute } from '../api/routes'
import { useShipmentTracking } from '../hooks/useShipmentTracking'
import RouteLine from '../components/RouteLine'
import LiveMap from '../components/LiveMap'
import StatusBadge from '../components/StatusBadge'
import ErrorNote from '../components/ErrorNote'
import Loader from '../components/Loader'

export default function TrackPublic() {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('tn') || '')
  const [shipment, setShipment] = useState(null)
  const [route, setRoute] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isTrackable = shipment && !['DELIVERED', 'CANCELLED', 'FAILED_DELIVERY'].includes(shipment.status)
  const { location: liveLocation, connected } = useShipmentTracking(shipment?.id, { enabled: isTrackable && !!route })

  const currentPosition = liveLocation
    ? { lat: Number(liveLocation.latitude), lng: Number(liveLocation.longitude) }
    : route?.lastKnownLatitude != null && route?.lastKnownLongitude != null
      ? { lat: Number(route.lastKnownLatitude), lng: Number(route.lastKnownLongitude) }
      : null

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setError('')
    setLoading(true)
    setShipment(null)
    setRoute(null)
    try {
      const data = await trackShipment(query.trim())
      setShipment(data)
      await getCurrentRoute(data.id)
        .then(setRoute)
        .catch(() => setRoute(null))
    } catch (err) {
      setError(err.response?.data?.message || 'No shipment found with that tracking number.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-manifest px-6 py-5 flex items-center justify-between max-w-4xl mx-auto">
        <Link to="/login" className="font-display font-semibold">ShipTrack Pro</Link>
        <Link to="/login" className="eyebrow underline underline-offset-2">Sign in</Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="eyebrow text-slate mb-2">Track a shipment</p>
        <h1 className="font-display font-semibold text-3xl mb-8">Where's your package?</h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-10">
          <input
            className="field-input flex-1 font-mono"
            placeholder="e.g. STP123456789"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary shrink-0">Track</button>
        </form>

        {loading && <Loader label="Looking up shipment" />}
        <ErrorNote message={error} />

        {shipment && (
          <div className="stamp-card p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="eyebrow mb-1">Tracking No.</p>
                <p className="font-mono text-lg font-medium">{shipment.trackingNumber}</p>
              </div>
              <StatusBadge status={shipment.status} />
            </div>

            <RouteLine status={shipment.status} />

            {isTrackable && route && (
              <div className="mt-6">
                <p className="eyebrow mb-3">Driver Location</p>
                <LiveMap
                  origin={route.origin}
                  destination={route.destination}
                  currentPosition={currentPosition}
                  connected={connected}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-manifest">
              <div>
                <p className="eyebrow mb-1">From</p>
                <p className="text-sm">{shipment.senderAddress}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">To</p>
                <p className="text-sm">{shipment.deliveryAddress}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Estimated delivery</p>
                <p className="text-sm font-mono">{shipment.estimatedDeliveryDate || '\u2014'}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Priority</p>
                <p className="text-sm">{shipment.priority}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
