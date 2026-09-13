import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getShipment } from '../api/shipments'
import { submitPod } from '../api/pod'
import { uploadFile } from '../api/files'
import SignaturePad from '../components/SignaturePad'
import StatusBadge from '../components/StatusBadge'
import Loader from '../components/Loader'
import ErrorNote from '../components/ErrorNote'

export default function CompleteDelivery() {
  const { id } = useParams()
  const navigate = useNavigate()
  const signaturePadRef = useRef(null)

  const [shipment, setShipment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signatureDrawn, setSignatureDrawn] = useState(false)

  const [deliveredToName, setDeliveredToName] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null)

  useEffect(() => {
    getShipment(id)
      .then((s) => {
        setShipment(s)
        setDeliveredToName(s.receiverName || '')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load this shipment.'))
      .finally(() => setLoading(false))
  }, [id])

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!deliveredToName.trim()) {
      setError('Recipient name is required.')
      return
    }
    if (signaturePadRef.current.isEmpty()) {
      setError('A signature is required before completing delivery.')
      return
    }

    setSubmitting(true)
    try {
      const signatureBlob = await signaturePadRef.current.getBlob()
      const signatureFile = new File([signatureBlob], 'signature.png', { type: 'image/png' })
      const { url: signatureUrl } = await uploadFile(signatureFile)

      let photoUrl
      if (photoFile) {
        const uploaded = await uploadFile(photoFile)
        photoUrl = uploaded.url
      }

      await submitPod(id, {
        deliveredToName: deliveredToName.trim(),
        deliveryNotes,
        signatureUrl,
        photoUrl,
      })

      navigate(`/shipments/${id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete delivery. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader label="Loading shipment" />
  if (error && !shipment) return <ErrorNote message={error} />
  if (!shipment) return null

  const alreadyHandled = ['DELIVERED', 'CANCELLED'].includes(shipment.status)

  return (
    <div className="max-w-2xl">
      <p className="eyebrow text-slate mb-1">Complete Delivery</p>
      <div className="flex items-center gap-3 mb-8">
        <h1 className="font-mono font-medium text-2xl">{shipment.trackingNumber}</h1>
        <StatusBadge status={shipment.status} />
      </div>

      {alreadyHandled ? (
        <div className="stamp-card px-6 py-10 text-center">
          <p className="text-sm text-slate">
            {shipment.status === 'DELIVERED'
              ? 'This shipment has already been delivered.'
              : 'This shipment was cancelled and cannot be completed.'}
          </p>
          <button onClick={() => navigate(`/shipments/${id}`)} className="btn-secondary mt-4">
            Back to shipment
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <ErrorNote message={error} />

          <section>
            <p className="eyebrow mb-4 pb-2 border-b border-manifest">Recipient</p>
            <div>
              <label className="field-label">Delivered to</label>
              <input
                required
                className="field-input"
                value={deliveredToName}
                onChange={(e) => setDeliveredToName(e.target.value)}
              />
            </div>
          </section>

          <section>
            <p className="eyebrow mb-4 pb-2 border-b border-manifest">Signature</p>
            <SignaturePad ref={signaturePadRef} onDrawStateChange={setSignatureDrawn} />
          </section>

          <section>
            <p className="eyebrow mb-4 pb-2 border-b border-manifest">Delivery Photo (optional)</p>
            <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handlePhotoChange} className="text-sm" />
            {photoPreviewUrl && (
              <img
                src={photoPreviewUrl}
                alt="Delivery photo preview"
                className="mt-3 max-h-48 border border-manifest"
              />
            )}
          </section>

          <section>
            <p className="eyebrow mb-4 pb-2 border-b border-manifest">Delivery Notes</p>
            <textarea
              className="field-input min-h-[80px]"
              placeholder="e.g. Left with front desk, gate code used, etc."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
            />
          </section>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !signatureDrawn || !deliveredToName.trim()}
              className="btn-primary"
            >
              {submitting ? 'Completing delivery\u2026' : 'Complete Delivery'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
