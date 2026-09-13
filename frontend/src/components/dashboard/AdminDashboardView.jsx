import React from 'react'
import { Link } from 'react-router-dom'
import StatCard from './StatCard'
import BreakdownPieChart from './BreakdownPieChart'

/** GET /api/analytics/admin - platform-wide, no ownership filtering. */
export default function AdminDashboardView({ analytics }) {
  const { userSummary, overview, routePerformance, systemMonitoring, availableReportTypes } = analytics

  const fmt = (n, suffix = '') => (n == null ? '\u2014' : `${Math.round(n)}${suffix}`)

  return (
    <div className="space-y-10">
      <section>
        <p className="eyebrow mb-4 pb-2 border-b border-manifest">Platform Shipment Monitoring</p>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Shipments" value={overview.totalShipments} />
          <StatCard label="Active" value={overview.activeShipments} accent="text-beacon" />
          <StatCard label="On-Time Rate" value={`${overview.onTimeDeliveryRate}%`} accent="text-cleared" />
          <StatCard label="Cancelled" value={overview.cancelledShipments} accent="text-flag" />
        </div>
        <BreakdownPieChart data={overview.shipmentsByStatus} />
      </section>

      <section>
        <p className="eyebrow mb-4 pb-2 border-b border-manifest">User Summary</p>
        <div className="grid grid-cols-2 gap-8">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Users" value={userSummary.totalUsers} />
            <StatCard label="Active" value={userSummary.activeUsers} accent="text-cleared" />
            <StatCard label="Inactive" value={userSummary.inactiveUsers} accent="text-slate" />
          </div>
          <BreakdownPieChart data={userSummary.usersByRole} height={180} />
        </div>
      </section>

      <section>
        <p className="eyebrow mb-4 pb-2 border-b border-manifest">Route Performance</p>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Routes" value={routePerformance.totalRoutes} />
          <StatCard label="Avg. Distance" value={fmt(routePerformance.avgDistanceKm, ' km')} />
          <StatCard label="Avg. Estimated" value={fmt(routePerformance.avgEstimatedMinutes, ' min')} />
          <StatCard
            label="Time-Estimate Accuracy"
            value={routePerformance.timeEstimateAccuracyPercent == null ? '\u2014' : `${Math.round(routePerformance.timeEstimateAccuracyPercent)}%`}
            accent={
              routePerformance.timeEstimateAccuracyPercent == null
                ? undefined
                : routePerformance.timeEstimateAccuracyPercent >= 80
                  ? 'text-cleared'
                  : routePerformance.timeEstimateAccuracyPercent >= 60
                    ? 'text-beacon'
                    : 'text-flag'
            }
          />
        </div>

        {(routePerformance.bestPerformingRoute || routePerformance.worstPerformingRoute) && (
          <div className="grid grid-cols-2 gap-4">
            {routePerformance.bestPerformingRoute && (
              <RoutePerformanceCard title="Best Performing Route" accent="text-cleared" entry={routePerformance.bestPerformingRoute} />
            )}
            {routePerformance.worstPerformingRoute && (
              <RoutePerformanceCard title="Worst Performing Route" accent="text-flag" entry={routePerformance.worstPerformingRoute} />
            )}
          </div>
        )}
      </section>

      <section>
        <p className="eyebrow mb-4 pb-2 border-b border-manifest">System Monitoring</p>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/verification-queue" className="stamp-card px-5 py-4 hover:bg-papershade transition-colors block">
            <p className="eyebrow mb-2">Pending POD Verifications</p>
            <p className="font-display text-3xl font-semibold text-beacon">{systemMonitoring.pendingPodVerifications}</p>
            <p className="eyebrow underline underline-offset-2 mt-2 inline-block">Go to queue &rarr;</p>
          </Link>
          <div className="stamp-card px-5 py-4">
            <p className="eyebrow mb-2">At-Risk Shipments</p>
            <p className="font-display text-3xl font-semibold text-flag">{systemMonitoring.atRiskShipmentCount}</p>
          </div>
        </div>
      </section>

      <section>
        <p className="eyebrow mb-4 pb-2 border-b border-manifest">Reports Management</p>
        <div className="grid grid-cols-2 gap-3">
          {(availableReportTypes || []).map((type) => (
            <Link
              key={type}
              to="/reports"
              className="stamp-card px-5 py-4 hover:bg-papershade transition-colors flex items-center justify-between"
            >
              <span className="text-sm font-medium">{type.replace(/_/g, ' ')}</span>
              <span className="eyebrow underline underline-offset-2">Generate &rarr;</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

/** One route in the best/worst performing list - links straight to that shipment. */
function RoutePerformanceCard({ title, accent, entry }) {
  return (
    <Link to={`/shipments/${entry.shipmentId}`} className="stamp-card p-4 hover:bg-papershade transition-colors block">
      <div className="flex items-center justify-between mb-2">
        <p className="eyebrow">{title}</p>
        <span className={`font-mono text-sm font-semibold ${accent}`}>
          {entry.accuracyPercent != null ? `${Math.round(entry.accuracyPercent)}% accurate` : '\u2014'}
        </span>
      </div>
      {entry.trackingNumber && <p className="font-mono text-sm mb-1">{entry.trackingNumber}</p>}
      <p className="text-xs text-slate truncate">{entry.origin} &rarr; {entry.destination}</p>
      <div className="flex items-center gap-4 text-xs text-slate font-mono mt-2">
        <span>{entry.estimatedTimeMinutes} min est.</span>
        <span>{entry.actualTimeMinutes} min actual</span>
        <span>
          {entry.varianceMinutes > 0 ? '+' : ''}{entry.varianceMinutes} min variance
        </span>
      </div>
    </Link>
  )
}
