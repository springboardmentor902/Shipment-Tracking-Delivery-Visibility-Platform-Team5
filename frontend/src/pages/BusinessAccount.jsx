import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createBusinessAccount,
  getMyBusinessAccount,
} from '../api/businessAccounts'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import ErrorNote from '../components/ErrorNote'

const INITIAL_FORM = {
  companyName: '',
  gstNumber: '',
  businessAddress: '',
  industryType: '',
}

export default function BusinessAccount() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL_FORM)
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  /*
   * Support both possible user-role formats:
   *
   * user.role  = "BUSINESS_CLIENT"
   *
   * or
   *
   * user.roles = ["BUSINESS_CLIENT"]
   */
  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : []

  const isBusinessClient = userRoles.some(
    (role) =>
      role === 'BUSINESS_CLIENT' ||
      role === 'ROLE_BUSINESS_CLIENT',
  )

  const isAdministrator = userRoles.some(
    (role) =>
      role === 'ADMINISTRATOR' ||
      role === 'ROLE_ADMINISTRATOR' ||
      role === 'ADMIN',
  )

  const canManageBusinessAccount =
    isBusinessClient || isAdministrator

  useEffect(() => {
    let cancelled = false

    async function loadAccount() {
      /*
       * CUSTOMER users do not need a business account.
       * Do not call /business-accounts/me for them because
       * the backend correctly returns 403.
       */
      if (!canManageBusinessAccount) {
        if (!cancelled) {
          setLoading(false)
          setAccount(null)
        }

        return
      }

      try {
        const data = await getMyBusinessAccount()

        if (!cancelled) {
          setAccount(data)

          setForm({
            companyName: data?.companyName || '',
            gstNumber: data?.gstNumber || '',
            businessAddress: data?.businessAddress || '',
            industryType: data?.industryType || '',
          })
        }
      } catch (err) {
        if (!cancelled) {
          const status = err.response?.status

          /*
           * 404 means the business client has not created
           * a business account yet, so the form remains empty.
           */
          if (status === 404) {
            setAccount(null)
          } else if (status === 403) {
            setError(
              'You are not authorized to manage a business account.',
            )
          } else {
            setError(
              err.response?.data?.message ||
                'Could not load your business account.',
            )
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadAccount()

    return () => {
      cancelled = true
    }
  }, [canManageBusinessAccount])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!canManageBusinessAccount) {
      setError(
        'Only business clients can create a business account.',
      )
      return
    }

    if (!form.companyName.trim()) {
      setError('Company name is required.')
      return
    }

    setSubmitting(true)

    try {
      const data = await createBusinessAccount({
        companyName: form.companyName.trim(),
        gstNumber: form.gstNumber.trim(),
        businessAddress: form.businessAddress.trim(),
        industryType: form.industryType.trim(),
      })

      setAccount(data)
      setSuccess('Business account created successfully.')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not create the business account.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loader label="Loading business account" />
  }

  /*
   * Customers can create shipments without a business account,
   * but they cannot create or manage a business account.
   */
  if (!canManageBusinessAccount) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="eyebrow text-slate mb-1">
              Business Setup
            </p>

            <h1 className="font-display font-semibold text-2xl">
              Business Account
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-secondary"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="stamp-card p-6">
          <p className="text-sm text-slate">
            Business account management is available only to
            business clients.
          </p>

          <p className="text-sm text-slate mt-3">
            As a customer, you can create shipments without
            creating a business account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow text-slate mb-1">
            Business Setup
          </p>

          <h1 className="font-display font-semibold text-2xl">
            Business Account
          </h1>

          <p className="text-sm text-slate mt-2">
            Create and manage the business account associated
            with your login.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="btn-secondary"
        >
          Back to Dashboard
        </button>
      </div>

      <ErrorNote message={error} />

      {success && (
        <div className="mb-6 border border-cleared bg-cleared/10 px-4 py-3 text-sm text-ink">
          {success}
        </div>
      )}

      <div className="stamp-card max-w-2xl">
        <div className="px-6 py-5 border-b border-manifest">
          <p className="eyebrow mb-1">
            {account ? 'Account Details' : 'Create Account'}
          </p>

          <h2 className="font-display font-semibold text-lg">
            {account
              ? 'Your business information'
              : 'Set up your business'}
          </h2>

          <p className="text-sm text-slate mt-2">
            Signed in as {user?.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label
                htmlFor="companyName"
                className="field-label"
              >
                Company Name *
              </label>

              <input
                id="companyName"
                name="companyName"
                type="text"
                value={form.companyName}
                onChange={handleChange}
                placeholder="ABC Logistics Pvt Ltd"
                className="field-input"
                required
                disabled={!!account}
              />
            </div>

            <div>
              <label
                htmlFor="gstNumber"
                className="field-label"
              >
                GST Number
              </label>

              <input
                id="gstNumber"
                name="gstNumber"
                type="text"
                value={form.gstNumber}
                onChange={handleChange}
                placeholder="29ABCDE1234F1Z5"
                className="field-input"
                disabled={!!account}
              />
            </div>

            <div>
              <label
                htmlFor="industryType"
                className="field-label"
              >
                Industry Type
              </label>

              <input
                id="industryType"
                name="industryType"
                type="text"
                value={form.industryType}
                onChange={handleChange}
                placeholder="Logistics"
                className="field-input"
                disabled={!!account}
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="businessAddress"
                className="field-label"
              >
                Business Address
              </label>

              <textarea
                id="businessAddress"
                name="businessAddress"
                value={form.businessAddress}
                onChange={handleChange}
                placeholder="Bengaluru, Karnataka"
                className="field-input min-h-24 resize-y"
                rows={3}
                disabled={!!account}
              />
            </div>
          </div>

          {!account && (
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting
                  ? 'Creating...'
                  : 'Create Business Account'}
              </button>
            </div>
          )}

          {account && (
            <div className="mt-6 border-t border-manifest pt-4">
              <p className="text-sm text-cleared">
                ✓ Your business account is already created.
              </p>

              <p className="text-xs text-slate mt-1">
                Business account ID: {account.id}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}