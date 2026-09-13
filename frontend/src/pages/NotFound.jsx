import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper text-center px-6">
      <p className="eyebrow text-slate mb-2">Error 404</p>
      <h1 className="font-display font-semibold text-3xl mb-4">This shipment doesn't exist.</h1>
      <Link to="/dashboard" className="btn-primary">Back to dashboard</Link>
    </div>
  )
}
