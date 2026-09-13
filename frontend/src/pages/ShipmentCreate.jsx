import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createShipment } from '../api/shipments'
import { getMyBusinessAccount } from '../api/businessAccounts'
import ErrorNote from '../components/ErrorNote'

const EMPTY_PACKAGE = {
  description: '',
  weightKg: '',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  quantity: 1,
  declaredValue: '',
  fragile: false,
}

export default function ShipmentCreate() {
  const navigate = useNavigate()

  const [businessAccount, setBusinessAccount] = useState(null)
  const [accountLoading, setAccountLoading] = useState(true)

  const [form, setForm] = useState({
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    receiverName: '',
    receiverPhone: '',
    receiverEmail: '',
    receiverAddress: '',
    pickupAddress: '',
    deliveryAddress: '',
    priority: 'STANDARD',
  })

  const [packages, setPackages] = useState([{ ...EMPTY_PACKAGE }])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /*
   * Business account is optional.
   *
   * BUSINESS_CLIENT:
   * - If a business account exists, it will be associated with the shipment.
   *
   * CUSTOMER:
   * - If the business-account endpoint returns 403 or 404,
   *   the customer can still create a shipment.
   */
  useEffect(() => {
    let cancelled = false

    async function loadBusinessAccount() {
      try {
        const account = await getMyBusinessAccount()

        if (!cancelled) {
          setBusinessAccount(account)
        }
      } catch (err) {
        if (!cancelled) {
          const status = err.response?.status

          /*
           * 403 means the current user is not allowed to access
           * the business-account endpoint.
           *
           * 404 means no business account exists.
           *
           * Both cases are acceptable because the business account
           * is optional for shipment creation.
           */
          if (status !== 403 && status !== 404) {
            console.warn(
              'Could not load business account:',
              err.response?.data?.message || err.message
            )
          }

          setBusinessAccount(null)
        }
      } finally {
        if (!cancelled) {
          setAccountLoading(false)
        }
      }
    }

    loadBusinessAccount()

    return () => {
      cancelled = true
    }
  }, [])

  const updateField = (key, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }))
  }

  const updatePackage = (idx, key, value) => {
    setPackages((currentPackages) =>
      currentPackages.map((pkg, index) =>
        index === idx
          ? {
              ...pkg,
              [key]: value,
            }
          : pkg
      )
    )
  }

  const addPackage = () => {
    setPackages((currentPackages) => [
      ...currentPackages,
      {
        ...EMPTY_PACKAGE,
      },
    ])
  }

  const removePackage = (idx) => {
    setPackages((currentPackages) =>
      currentPackages.filter((_, index) => index !== idx)
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        ...form,

        /*
         * Add businessId only when a business account exists.
         *
         * CUSTOMER:
         *   No businessId is sent.
         *
         * BUSINESS_CLIENT:
         *   businessId is sent when the account is available.
         */
        ...(businessAccount?.id
          ? {
              businessId: businessAccount.id,
            }
          : {}),

        packages: packages.map((pkg) => ({
          ...pkg,
          weightKg: pkg.weightKg ? Number(pkg.weightKg) : null,
          lengthCm: pkg.lengthCm ? Number(pkg.lengthCm) : null,
          widthCm: pkg.widthCm ? Number(pkg.widthCm) : null,
          heightCm: pkg.heightCm ? Number(pkg.heightCm) : null,
          quantity: Number(pkg.quantity) || 1,
          declaredValue: pkg.declaredValue
            ? Number(pkg.declaredValue)
            : null,
        })),
      }

      const created = await createShipment(payload)

      navigate(`/shipments/${created.id}`)
    } catch (err) {
      const fieldErrors = err.response?.data?.fieldErrors

      const message = fieldErrors
        ? Object.values(fieldErrors).join(' ')
        : err.response?.data?.message || 'Could not create shipment.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <p className="eyebrow text-slate mb-1">New Waybill</p>

      <h1 className="font-display font-semibold text-2xl mb-8">
        Create a shipment
      </h1>

      <ErrorNote message={error} />

      {accountLoading && (
        <p className="text-sm text-slate mb-6">
          Checking business account details...
        </p>
      )}

      {!accountLoading && businessAccount?.id && (
        <div className="mb-6 border border-manifest p-4">
          <p className="text-sm text-slate">
            This shipment will be associated with your business account.
          </p>
        </div>
      )}

      {!accountLoading && !businessAccount?.id && (
        <div className="mb-6 border border-manifest p-4">
          <p className="text-sm text-slate">
            You can create a shipment without a business account.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        <section>
          <p className="eyebrow mb-4 pb-2 border-b border-manifest">
            Sender
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Name</label>
              <input
                required
                className="field-input"
                value={form.senderName}
                onChange={(e) =>
                  updateField('senderName', e.target.value)
                }
              />
            </div>

            <div>
              <label className="field-label">Phone</label>
              <input
                className="field-input"
                value={form.senderPhone}
                onChange={(e) =>
                  updateField('senderPhone', e.target.value)
                }
              />
            </div>

            <div className="col-span-2">
              <label className="field-label">Address</label>
              <input
                required
                className="field-input"
                value={form.senderAddress}
                onChange={(e) =>
                  updateField('senderAddress', e.target.value)
                }
              />
            </div>

            <div className="col-span-2">
              <label className="field-label">Pickup address</label>
              <input
                required
                className="field-input"
                value={form.pickupAddress}
                onChange={(e) =>
                  updateField('pickupAddress', e.target.value)
                }
              />
            </div>
          </div>
        </section>

        <section>
          <p className="eyebrow mb-4 pb-2 border-b border-manifest">
            Receiver
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Name</label>
              <input
                required
                className="field-input"
                value={form.receiverName}
                onChange={(e) =>
                  updateField('receiverName', e.target.value)
                }
              />
            </div>

            <div>
              <label className="field-label">Phone</label>
              <input
                className="field-input"
                value={form.receiverPhone}
                onChange={(e) =>
                  updateField('receiverPhone', e.target.value)
                }
              />
            </div>

            <div className="col-span-2">
              <label className="field-label">Email</label>
              <input
                type="email"
                className="field-input"
                value={form.receiverEmail}
                onChange={(e) =>
                  updateField('receiverEmail', e.target.value)
                }
              />
            </div>

            <div className="col-span-2">
              <label className="field-label">Address</label>
              <input
                required
                className="field-input"
                value={form.receiverAddress}
                onChange={(e) =>
                  updateField('receiverAddress', e.target.value)
                }
              />
            </div>

            <div className="col-span-2">
              <label className="field-label">Delivery address</label>
              <input
                required
                className="field-input"
                value={form.deliveryAddress}
                onChange={(e) =>
                  updateField('deliveryAddress', e.target.value)
                }
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-manifest">
            <p className="eyebrow">Packages</p>

            <button
              type="button"
              onClick={addPackage}
              className="eyebrow underline underline-offset-2"
            >
              + Add package
            </button>
          </div>

          <div className="space-y-4">
            {packages.map((pkg, idx) => (
              <div
                key={idx}
                className="stamp-card p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="eyebrow">
                    Package {idx + 1}
                  </p>

                  {packages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePackage(idx)}
                      className="eyebrow text-flag"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3">
                    <label className="field-label">
                      Description
                    </label>

                    <input
                      required
                      className="field-input"
                      value={pkg.description}
                      onChange={(e) =>
                        updatePackage(
                          idx,
                          'description',
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      Weight (kg)
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      className="field-input"
                      value={pkg.weightKg}
                      onChange={(e) =>
                        updatePackage(
                          idx,
                          'weightKg',
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      className="field-input"
                      value={pkg.quantity}
                      onChange={(e) =>
                        updatePackage(
                          idx,
                          'quantity',
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="field-label">
                      Declared value
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      className="field-input"
                      value={pkg.declaredValue}
                      onChange={(e) =>
                        updatePackage(
                          idx,
                          'declaredValue',
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="col-span-3 flex items-center gap-2 mt-1">
                    <input
                      id={`fragile-${idx}`}
                      type="checkbox"
                      checked={pkg.fragile}
                      onChange={(e) =>
                        updatePackage(
                          idx,
                          'fragile',
                          e.target.checked
                        )
                      }
                    />

                    <label
                      htmlFor={`fragile-${idx}`}
                      className="text-sm"
                    >
                      Fragile
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="eyebrow mb-4 pb-2 border-b border-manifest">
            Priority
          </p>

          <div className="flex gap-3">
            {['STANDARD', 'EXPRESS'].map((priority) => (
              <button
                type="button"
                key={priority}
                onClick={() => updateField('priority', priority)}
                className={[
                  'eyebrow px-4 py-2 border transition-colors',
                  form.priority === priority
                    ? 'bg-ink text-paper border-ink'
                    : 'border-manifest text-slate hover:border-ink',
                ].join(' ')}
              >
                {priority}
              </button>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Creating shipment…' : 'Create shipment'}
        </button>
      </form>
    </div>
  )
}