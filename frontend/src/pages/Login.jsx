import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ErrorNote from '../components/ErrorNote'
import RouteLine from '../components/RouteLine'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-ink text-paper flex-col justify-between p-12">
        <div>
          <p className="font-display font-semibold text-xl">ShipTrack Pro</p>
          <p className="eyebrow text-manifest mt-1">Shipment Tracking &amp; Delivery Visibility</p>
        </div>
        <div>
          <p className="eyebrow text-manifest mb-4">Waybill No. STP000000001</p>
          <RouteLine status="IN_TRANSIT" />
        </div>
        <p className="text-sm text-paper/60 max-w-xs">
          Every shipment leaves a paper trail. This one just happens to update itself.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display font-semibold text-2xl mb-1">Sign in</h1>
          <p className="text-sm text-slate mb-8">Track, manage, and confirm shipments.</p>

          <ErrorNote message={error} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="field-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="field-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in\u2026' : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-slate mt-6">
            New here?{' '}
            <Link to="/register" className="text-ink font-medium underline underline-offset-2">
              Create an account
            </Link>
          </p>
          <p className="text-sm text-slate mt-2">
            Just want to check a package?{' '}
            <Link to="/track" className="text-ink font-medium underline underline-offset-2">
              Track a shipment
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
