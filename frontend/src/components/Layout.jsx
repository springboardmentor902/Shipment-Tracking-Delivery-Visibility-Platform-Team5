import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'

const BASE_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/shipments', label: 'Shipments' },
  { to: '/shipments/new', label: 'New Shipment' },
]

const REPORTS_ROLES = ['CUSTOMER', 'BUSINESS_CLIENT', 'ADMINISTRATOR']
const VERIFICATION_QUEUE_ROLES = ['ADMINISTRATOR', 'SUPPORT_AGENT']

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItem = (to, label, key) => (
    <NavLink
      key={key || to}
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) =>
        [
          'px-3 py-2.5 text-sm font-medium transition-colors',
          isActive ? 'bg-paper text-ink' : 'text-paper/80 hover:bg-white/10',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  )

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-60 shrink-0 bg-ink text-paper flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="font-display font-semibold text-lg tracking-tight">ShipTrack Pro</p>
          <p className="eyebrow text-manifest mt-1">Delivery Visibility</p>
        </div>

        <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
          {BASE_NAV_ITEMS.map((item) => navItem(item.to, item.label))}

          {user?.role === 'BUSINESS_CLIENT' &&
            navItem('/business-account', 'Business Account')}
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              [
                'px-3 py-2.5 text-sm font-medium transition-colors flex items-center justify-between',
                isActive ? 'bg-paper text-ink' : 'text-paper/80 hover:bg-white/10',
              ].join(' ')
            }
          >
            <span className="flex items-center gap-2">
              <Bell size={15} />
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="font-mono text-[10px] bg-beacon text-ink px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </NavLink>
          {VERIFICATION_QUEUE_ROLES.includes(user?.role) &&
            navItem('/verification-queue', 'Verification Queue')}
          {REPORTS_ROLES.includes(user?.role) && navItem('/reports', 'Reports & Export')}
          {user?.role === 'ADMINISTRATOR' && navItem('/admin', 'Admin')}
        </nav>

        <div className="px-6 py-5 border-t border-white/10">
          <p className="text-sm font-medium truncate">{user?.fullName}</p>
          <p className="eyebrow text-manifest mt-0.5">{user?.role?.replace(/_/g, ' ')}</p>
          <button
            onClick={handleLogout}
            className="mt-3 eyebrow text-paper/70 hover:text-beacon transition-colors"
          >
            Sign out &rarr;
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="flex justify-end px-8 pt-6">
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-9 h-9 flex items-center justify-center border border-manifest hover:border-ink transition-colors"
            aria-label="Notifications"
          >
            <Bell size={16} className="text-ink" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 font-mono text-[10px] bg-beacon text-ink px-1 min-w-[16px] text-center rounded-full leading-[16px]">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
        <div className="max-w-6xl mx-auto px-8 pb-10 -mt-2">{children}</div>
      </main>
    </div>
  )
}
