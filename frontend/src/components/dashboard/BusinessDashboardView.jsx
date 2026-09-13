import React from 'react'
import { Link } from 'react-router-dom'
import StatCard from './StatCard'
import BreakdownPieChart from './BreakdownPieChart'
import EtaRiskBadge from '../EtaRiskBadge'

/** GET /api/analytics/business - scoped to this business client's own business only. */
export default function BusinessDashboardView({ analytics }) {
  const { overview, delayAnalysis, customerActivity } = analytics

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Shipments" value={overview.totalShipments} />
        <StatCard label="Active" value={overview.activeShipments} accent="text-beacon" />
        <StatCard label="On-Time Rate" value={`${overview.onTimeDeliveryRate}%`} accent="text-cleared" />
        <StatCard label="Cancelled" value={overview.cancelledShipments} accent="text-flag" />
      </div>

      <div className="mb-10">
        <p className="eyebrow mb-4 pb-2 border-b border-manifest">Logistics Overview</p>
        <BreakdownPieChart data={overview.shipmentsByStatus} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="eyebrow text-flag">
          At Risk {delayAnalysis.atRiskShipmentCount > 0 && `(${delayAnalysis.atRiskShipmentCount})`}
        </p>
        {delayAnalysis.avgDelayRiskScore != null && (
          <p className="text-xs text-slate">
            Avg. risk across active shipments: <EtaRiskBadge score={delayAnalysis.avgDelayRiskScore} />
          </p>
        )}
      </div>

      {!delayAnalysis.atRiskShipments || delayAnalysis.atRiskShipments.length === 0 ? (
        <div className="stamp-card px-6 py-6 text-center mb-10">
          <p className="text-sm text-slate">No shipments currently above the delay-risk threshold.</p>
        </div>
      ) : (
        <div className="divide-y divide-manifest border-t border-b border-manifest mb-10">
          {delayAnalysis.atRiskShipments.map((s) => (
            <Link
              key={s.shipmentId}
              to={`/shipments/${s.shipmentId}`}
              className="flex items-center gap-6 py-3 hover:bg-papershade transition-colors px-2"
            >
              <div className="w-40 shrink-0">
                <p className="font-mono text-sm">{s.trackingNumber}</p>
                <p className="text-xs text-slate mt-0.5">{s.status?.replace(/_/g, ' ')}</p>
              </div>
              <div className="flex-1">
                {s.predictedDeliveryTime && (
                  <p className="text-xs text-slate">
                    Predicted {new Date(s.predictedDeliveryTime).toLocaleString()}
                  </p>
                )}
              </div>
              <EtaRiskBadge score={s.delayRiskScore} />
            </Link>
          ))}
        </div>
      )}

      <p className="eyebrow mb-4 pb-2 border-b border-manifest">Customer Activity</p>
      <p className="text-sm text-slate mb-4">
        {customerActivity.distinctCustomerCount} distinct {customerActivity.distinctCustomerCount === 1 ? 'customer has' : 'customers have'} received shipments from your business.
      </p>

      {customerActivity.topCustomers.length === 0 ? (
        <div className="stamp-card px-6 py-8 text-center">
          <p className="text-sm text-slate">No delivery activity yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-manifest border-t border-b border-manifest mb-10">
          {customerActivity.topCustomers.map((c) => (
            <div key={c.receiverEmail} className="flex items-center justify-between py-3 px-2">
              <div>
                <p className="text-sm font-medium">{c.receiverName}</p>
                <p className="text-xs text-slate">{c.receiverEmail}</p>
              </div>
              <p className="font-mono text-sm">{c.shipmentCount} shipment{c.shipmentCount === 1 ? '' : 's'}</p>
            </div>
          ))}
        </div>
      )}

      <Link to="/shipments" className="eyebrow underline underline-offset-2">View all shipments &rarr;</Link>
    </div>
  )
}
