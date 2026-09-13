import React from 'react'

export default function StatCard({ label, value, accent }) {
  return (
    <div className="stamp-card px-5 py-4">
      <p className="eyebrow mb-2">{label}</p>
      <p className={`font-display text-3xl font-semibold ${accent || 'text-ink'}`}>{value}</p>
    </div>
  )
}
