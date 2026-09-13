import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ErrorNote from '../components/ErrorNote'

const ROLES = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'BUSINESS_CLIENT', label: 'Business Client' },
  { value: 'LOGISTICS_OPERATOR', label: 'Logistics Operator' },
  { value: 'SUPPORT_AGENT', label: 'Support Agent' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'CUSTOMER',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      const fieldErrors = err.response?.data?.fieldErrors
      const message = fieldErrors
        ? Object.values(fieldErrors).join(' ')
        : err.response?.data?.message || 'Registration failed.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-paper">
      <div className="w-full max-w-md">
        <p className="eyebrow text-slate mb-2">ShipTrack Pro</p>
        <h1 className="font-display font-semibold text-2xl mb-1">Create an account</h1>
        <p className="text-sm text-slate mb-8">Register to create and track shipments.</p>

        <ErrorNote message={error} />
        {success && (
          <div className="stamp-card border-cleared px-4 py-3 mb-4">
            <p className="eyebrow text-cleared mb-1">Account created</p>
            <p className="text-sm text-ink">Redirecting to sign in{'\u2026'}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label" htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              required
              className="field-input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
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
              minLength={8}
              className="field-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="phone">Phone</label>
            <input
              id="phone"
              className="field-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="role">I am a{'\u2026'}</label>
            <select
              id="role"
              className="field-input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Creating account\u2026' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-slate mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-ink font-medium underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
