import React from 'react'

export default function ErrorNote({ message }) {
  if (!message) return null
  return (
    <div className="stamp-card border-flag px-4 py-3 mb-4">
      <p className="eyebrow text-flag mb-1">Something went wrong</p>
      <p className="text-sm text-ink">{message}</p>
    </div>
  )
}
