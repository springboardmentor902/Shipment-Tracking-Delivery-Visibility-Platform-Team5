import React from 'react'
import { Link } from 'react-router-dom'
import StatCard from './StatCard'
import BreakdownPieChart from './BreakdownPieChart'
import RouteLine from '../RouteLine'
import StatusBadge from '../StatusBadge'

/** GET /api/analytics/customer - scoped to this customer's own shipments only. */
export default function CustomerDashboardView({ analytics }) {
  const { activeShipmentCount, totalShipments, shipmentsByStatus, shipmentHistory, avgTransitHours, shipmentsByPriority } = analytics

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard label="Active Shipments" value={activeShipmentCount} accent="text-beacon" />
        <StatCard label="Total Shipments" value={totalShipments} />
        <StatCard
          label="Avg. Transit Time"
          value={avgTransitHours != null ? `${Math.round(avgTransitHours)}h` : '\u2014'}
        />
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
          <p className="eyebrow mb-4 pb-2 border-b border-manifest">Shipment Status Breakdown</p>
          <BreakdownPieChart data={shipmentsByStatus} />
        </div>
        <div>
          <p className="eyebrow mb-4 pb-2 border-b border-manifest">Priority Mix</p>
          <BreakdownPieChart data={shipmentsByPriority} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="eyebrow">Shipment History</p>
        <Link to="/shipments" className="eyebrow underline underline-offset-2">View all &rarr;</Link>
      </div>

      {!shipmentHistory || shipmentHistory.length === 0 ? (
        <div className="stamp-card px-6 py-10 text-center">
          <p className="text-sm text-slate mb-4">No shipments yet.</p>
          <Link to="/shipments/new" className="btn-secondary">Create a shipment</Link>
        </div>
      ) : (
        <div className="divide-y divide-manifest border-t border-b border-manifest">
          {shipmentHistory.map((s) => (
            <Link
              key={s.id}
              to={`/shipments/${s.id}`}
              className="flex items-center gap-6 py-4 hover:bg-papershade transition-colors px-2"
            >
              <div className="w-40 shrink-0">
                <p className="font-mono text-sm">{s.trackingNumber}</p>
                <p className="text-xs text-slate mt-0.5">{s.receiverName}</p>
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
