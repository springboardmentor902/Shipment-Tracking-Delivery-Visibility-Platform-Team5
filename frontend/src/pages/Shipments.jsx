import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyShipments, getAllShipments } from '../api/shipments'
import RouteLine from '../components/RouteLine'
import StatusBadge from '../components/StatusBadge'
import Loader from '../components/Loader'
import ErrorNote from '../components/ErrorNote'

const FILTERS = ['ALL', 'CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

export default function Shipments() {
  const { user } = useAuth()
  const [shipments, setShipments] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetcher = user?.role === 'ADMINISTRATOR' ? getAllShipments : getMyShipments
    fetcher()
      .then(setShipments)
      .catch((err) => setError(err.response?.data?.message || 'Could not load shipments.'))
      .finally(() => setLoading(false))
  }, [user])

  const filtered = filter === 'ALL' ? shipments : shipments.filter((s) => s.status === filter)

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow text-slate mb-1">Manifest</p>
          <h1 className="font-display font-semibold text-2xl">Shipments</h1>
        </div>
        <Link to="/shipments/new" className="btn-primary">+ New Shipment</Link>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'eyebrow px-3 py-1.5 border transition-colors',
              filter === f ? 'bg-ink text-paper border-ink' : 'border-manifest text-slate hover:border-ink',
            ].join(' ')}
          >
            {f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <ErrorNote message={error} />

      {loading ? (
        <Loader label="Loading shipments" />
      ) : filtered.length === 0 ? (
        <div className="stamp-card px-6 py-10 text-center">
          <p className="text-sm text-slate">No shipments match this filter.</p>
        </div>
      ) : (
        <div className="divide-y divide-manifest border-t border-b border-manifest">
          {filtered.map((s) => (
            <Link
              key={s.id}
              to={`/shipments/${s.id}`}
              className="flex items-center gap-6 py-4 hover:bg-papershade transition-colors px-2"
            >
              <div className="w-44 shrink-0">
                <p className="font-mono text-sm">{s.trackingNumber}</p>
                <p className="text-xs text-slate mt-0.5">{s.priority}</p>
              </div>
              <div className="w-48 shrink-0">
                <p className="text-sm truncate">{s.receiverName}</p>
                <p className="text-xs text-slate truncate">{s.deliveryAddress}</p>
              </div>
              <div className="flex-1 hidden md:block">
                <RouteLine status={s.status} compact />
              </div>
              <StatusBadge status={s.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
