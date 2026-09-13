import React from 'react'

export default function Loader({ label = 'Loading' }) {
  return (
    <div className="flex items-center gap-3 py-10 justify-center text-slate">
      <span className="w-2 h-2 rounded-full bg-beacon animate-ping" />
      <span className="eyebrow">{label}{'\u2026'}</span>
    </div>
  )
}
