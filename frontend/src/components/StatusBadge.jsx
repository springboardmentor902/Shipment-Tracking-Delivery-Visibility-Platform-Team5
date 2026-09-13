import React from 'react'

const STYLES = {
  CREATED: 'text-slate border-manifest',
  PICKED_UP: 'text-beacon border-beacon',
  IN_TRANSIT: 'text-beacon border-beacon',
  OUT_FOR_DELIVERY: 'text-beacon border-beacon',
  DELIVERED: 'text-cleared border-cleared',
  CANCELLED: 'text-flag border-flag',
  FAILED_DELIVERY: 'text-flag border-flag',
}

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || 'text-slate border-manifest'
  return (
    <span className={`eyebrow inline-block border px-2 py-1 ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}
