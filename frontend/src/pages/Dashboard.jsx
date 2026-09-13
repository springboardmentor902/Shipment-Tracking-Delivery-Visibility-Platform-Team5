import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getCustomerAnalytics, getBusinessAnalytics, getAdminAnalytics } from '../api/analytics'
import { getMyShipments } from '../api/shipments'
import CustomerDashboardView from '../components/dashboard/CustomerDashboardView'
import BusinessDashboardView from '../components/dashboard/BusinessDashboardView'
import AdminDashboardView from '../components/dashboard/AdminDashboardView'
import RouteLine from '../components/RouteLine'
import StatusBadge from '../components/StatusBadge'
import Loader from '../components/Loader'
import ErrorNote from '../components/ErrorNote'

const ANALYTICS_FETCHERS = {
  CUSTOMER: getCustomerAnalytics,
  BUSINESS_CLIENT: getBusinessAnalytics,
  ADMINISTRATOR: getAdminAnalytics,
}

/**
 * Thin router: fetches the analytics endpoint for the current user's role and hands the
 * response to the matching view component. LOGISTICS_OPERATOR and SUPPORT_AGENT don't have
 * a dedicated analytics endpoint (the Analytics Dashboard spec only covers Customer,
 * Business Client, and Admin) - they get a simple relevant-shipments list instead.
 */
export default function Dashboard() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [fallbackShipments, setFallbackShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      const fetcher = ANALYTICS_FETCHERS[user?.role]
      try {
        if (fetcher) {
          const data = await fetcher()
          if (!cancelled) setAnalytics(data)
        } else {
          const list = await getMyShipments()
          if (!cancelled) setFallbackShipments(list)
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load your dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow text-slate mb-1">Overview</p>
          <h1 className="font-display font-semibold text-2xl">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
        </div>
        {['CUSTOMER', 'BUSINESS_CLIENT'].includes(user?.role) && (
          <Link to="/shipments/new" className="btn-primary">+ New Shipment</Link>
        )}
      </div>

      <ErrorNote message={error} />

      {loading ? (
        <Loader label="Loading dashboard" />
      ) : user?.role === 'CUSTOMER' && analytics ? (
        <CustomerDashboardView analytics={analytics} />
      ) : user?.role === 'BUSINESS_CLIENT' && analytics ? (
        <BusinessDashboardView analytics={analytics} />
      ) : user?.role === 'ADMINISTRATOR' && analytics ? (
        <AdminDashboardView analytics={analytics} />
      ) : (
        <div>
          <p className="eyebrow mb-4">Your Shipments</p>
          {fallbackShipments.length === 0 ? (
            <div className="stamp-card px-6 py-10 text-center">
              <p className="text-sm text-slate">Nothing here yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-manifest border-t border-b border-manifest">
              {fallbackShipments.slice(0, 10).map((s) => (
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
      )}
    </div>
  )
}
