import React, { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getShipment, cancelShipment, updateShipmentStatus } from '../api/shipments'
import { getTimeline, addTrackingEvent } from '../api/tracking'
import { getEta, recalculateEta } from '../api/eta'
import { getPod, verifyPod } from '../api/pod'
import { getCurrentRoute, planRoute, postDriverLocation } from '../api/routes'
import { useShipmentTracking } from '../hooks/useShipmentTracking'
import RouteLine from '../components/RouteLine'
import RouteHistory from '../components/RouteHistory'
import LiveMap from '../components/LiveMap'
import EtaWidget from '../components/EtaWidget'
import EtaRiskBadge from '../components/EtaRiskBadge'
import StatusBadge from '../components/StatusBadge'
import Loader from '../components/Loader'
import ErrorNote from '../components/ErrorNote'

const NEXT_STATUS = {
  CREATED: 'PICKED_UP',
  PICKED_UP: 'IN_TRANSIT',
  IN_TRANSIT: 'OUT_FOR_DELIVERY',
}

export default function ShipmentDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [shipment, setShipment] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [eta, setEta] = useState(null)
  const [pod, setPod] = useState(null)
  const [route, setRoute] = useState(null)
  const [locationForm, setLocationForm] = useState({ latitude: '', longitude: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false);
  const [eventForm, setEventForm] = useState({ location: '', notes: '' })

  // POD submission is genuinely LOGISTICS_OPERATOR-only on the backend ("Logistics
  // Operators to submit the proof of delivery"). Route planning, tracking events, and
  // driver location posting are LOGISTICS_OPERATOR/ADMINISTRATOR only too - a business
  // client doesn't plan routes or post GPS coordinates.
  const isOperator = user?.role === 'LOGISTICS_OPERATOR'
  const canOperate = ['LOGISTICS_OPERATOR', 'ADMINISTRATOR'].includes(user?.role)
  // Status updates specifically also allow BUSINESS_CLIENT - the backend restricts them to
  // updating only shipments belonging to their own business (403 otherwise), so this is
  // intentionally broader than canOperate rather than an alias for it.
  const canUpdateStatus = ['LOGISTICS_OPERATOR', 'ADMINISTRATOR', 'BUSINESS_CLIENT'].includes(user?.role)
  const canVerifyPod = user?.role === 'ADMINISTRATOR' || user?.role === 'SUPPORT_AGENT'
  const canCancel = ['CUSTOMER', 'BUSINESS_CLIENT', 'ADMINISTRATOR'].includes(user?.role) &&
    !['DELIVERED', 'CANCELLED'].includes(shipment?.status)
  const isTrackable = shipment && !['DELIVERED', 'CANCELLED', 'FAILED_DELIVERY'].includes(shipment.status)

  // Connects on mount, subscribes to /topic/shipment/{id}/location, and unsubscribes /
  // disconnects automatically on unmount or navigation away (see useShipmentTracking).
  const { location: liveLocation, connected } = useShipmentTracking(id, { enabled: isTrackable && !!route })

  const currentPosition = liveLocation
    ? { lat: Number(liveLocation.latitude), lng: Number(liveLocation.longitude) }
    : route?.lastKnownLatitude != null && route?.lastKnownLongitude != null
      ? { lat: Number(route.lastKnownLatitude), lng: Number(route.lastKnownLongitude) }
      : null

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const s = await getShipment(id)
      setShipment(s)
      const events = await getTimeline(id).catch(() => [])
      setTimeline(events)
      await getEta(id).then(setEta).catch(() => setEta(null))
      await getPod(id).then(setPod).catch(() => setPod(null))
      await getCurrentRoute(id)
        .then(setRoute)
        .catch(() => setRoute(null))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load this shipment.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleCancel = async () => {
    const reason = window.prompt('Reason for cancellation?')
    if (!reason) return
    setBusy(true)
    setActionError('')
    try {
      const updated = await cancelShipment(id, reason)
      setShipment(updated)
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not cancel shipment.')
    } finally {
      setBusy(false)
    }
  }

  const handleAdvanceStatus = async () => {
    const next = NEXT_STATUS[shipment.status]
    if (!next) return
    setBusy(true)
    setActionError('')
    try {
      const updated = await updateShipmentStatus(id, next)
      setShipment(updated)
      const events = await getTimeline(id)
      setTimeline(events)
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not update status.')
    } finally {
      setBusy(false)
    }
  }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    setBusy(true)
    setActionError('')
    try {
      await addTrackingEvent(id, { status: shipment.status, ...eventForm })
      setEventForm({ location: '', notes: '' })
      setTimeline(await getTimeline(id))
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not log tracking event.')
    } finally {
      setBusy(false)
    }
  }

  const handlePlanRoute = async () => {
    setBusy(true)
    setActionError('')
    try {
      const created = await planRoute(id, {
        origin: shipment.pickupAddress,
        destination: shipment.deliveryAddress,
      })
      setRoute(created)
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not plan route.')
    } finally {
      setBusy(false)
    }
  }

  const handlePostLocation = async (e) => {
    e.preventDefault()
    if (!route) return
    setBusy(true)
    setActionError('')
    try {
      const updated = await postDriverLocation(route.id, {
        latitude: Number(locationForm.latitude),
        longitude: Number(locationForm.longitude),
      })
      setRoute(updated)
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not post location.')
    } finally {
      setBusy(false)
    }
  }

  const handleRecalculateEta = async () => {
    setBusy(true)
    try {
      setEta(await recalculateEta(id))
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not recalculate ETA.')
    } finally {
      setBusy(false)
    }
  }

  const handleVerifyPod = async (approved) => {
    setBusy(true)
    setActionError('')
    try {
      setPod(await verifyPod(id, approved))
      const s = await getShipment(id)
      setShipment(s)
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not verify proof of delivery.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loader label="Loading shipment" />
  if (error) return <ErrorNote message={error} />
  if (!shipment) return null

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="eyebrow text-slate mb-1">Waybill</p>
          <h1 className="font-mono font-medium text-2xl">{shipment.trackingNumber}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={shipment.status} />
          {canCancel && (
            <button onClick={handleCancel} disabled={busy} className="btn-secondary">Cancel</button>
          )}
          {canUpdateStatus && NEXT_STATUS[shipment.status] && (
            <button onClick={handleAdvanceStatus} disabled={busy} className="btn-primary">
              Mark {NEXT_STATUS[shipment.status].replace(/_/g, ' ')}
            </button>
          )}
        </div>
      </div>

      <ErrorNote message={actionError} />

      <div className="stamp-card p-6 mb-8">
        <RouteLine status={shipment.status} />
      </div>

      {isTrackable && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-manifest">
            <div className="flex items-center gap-3">
              <p className="eyebrow">Live Tracking</p>
              {eta && <EtaRiskBadge score={eta.delayRiskScore} />}
            </div>
            {canOperate && (
              <button onClick={handlePlanRoute} disabled={busy} className="eyebrow underline underline-offset-2">
                {route ? 'Re-route' : 'Plan route'}
              </button>
            )}
          </div>

          {route ? (
            <>
              <LiveMap
                origin={route.origin}
                destination={route.destination}
                currentPosition={currentPosition}
                connected={connected}
              />
              {canOperate && (
                <form onSubmit={handlePostLocation} className="stamp-card p-4 mt-4 flex items-end gap-3">
                  <div className="flex-1">
                    <label className="field-label">Latitude</label>
                    <input
                      required
                      type="number"
                      step="any"
                      className="field-input"
                      value={locationForm.latitude}
                      onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="field-label">Longitude</label>
                    <input
                      required
                      type="number"
                      step="any"
                      className="field-input"
                      value={locationForm.longitude}
                      onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })}
                    />
                  </div>
                  <button type="submit" disabled={busy} className="btn-secondary shrink-0">
                    Post location
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="stamp-card px-6 py-8 text-center">
              <p className="text-sm text-slate">
                {canOperate ? 'No route planned yet.' : 'The driver has not started this route yet.'}
              </p>
            </div>
          )}
        </section>
      )}

      <div className="grid grid-cols-3 gap-8 mb-10">
        <div className="col-span-2 space-y-8">
          <section>
            <p className="eyebrow mb-4 pb-2 border-b border-manifest">Route</p>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="eyebrow mb-1">Sender</p>
                <p className="text-sm font-medium">{shipment.senderName}</p>
                <p className="text-sm text-slate">{shipment.senderAddress}</p>
                <p className="text-sm text-slate">{shipment.senderPhone}</p>
              </div>
              <div>
                <p className="eyebrow mb-1">Receiver</p>
                <p className="text-sm font-medium">{shipment.receiverName}</p>
                <p className="text-sm text-slate">{shipment.receiverAddress}</p>
                <p className="text-sm text-slate">{shipment.receiverPhone}</p>
              </div>
            </div>
          </section>

          <section>
            <p className="eyebrow mb-4 pb-2 border-b border-manifest">Route History</p>
            <RouteHistory key={route?.id || 'none'} shipmentId={id} />
          </section>

          <section>
            <p className="eyebrow mb-4 pb-2 border-b border-manifest">Packages</p>
            <div className="space-y-2">
              {shipment.packages?.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b border-manifest/50">
                  <span>{p.description}{p.fragile && <span className="text-flag eyebrow ml-2">FRAGILE</span>}</span>
                  <span className="font-mono text-slate">{p.weightKg ?? '\u2014'} kg &times; {p.quantity}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="eyebrow mb-4 pb-2 border-b border-manifest">Tracking Timeline</p>
            <div className="space-y-4">
              {timeline.length === 0 && <p className="text-sm text-slate">No tracking events logged yet.</p>}
              {timeline.map((ev) => (
                <div key={ev.id} className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-beacon mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{ev.status.replace(/_/g, ' ')}{ev.location && ` \u2014 ${ev.location}`}</p>
                    {ev.notes && <p className="text-sm text-slate">{ev.notes}</p>}
                    <p className="font-mono text-xs text-slate/70 mt-0.5">
                      {new Date(ev.eventTimestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {canOperate && (
              <form onSubmit={handleAddEvent} className="stamp-card p-4 mt-4 space-y-3">
                <p className="eyebrow">Log an update</p>
                <input
                  className="field-input"
                  placeholder="Location"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                />
                <input
                  className="field-input"
                  placeholder="Notes"
                  value={eventForm.notes}
                  onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                />
                <button type="submit" disabled={busy} className="btn-secondary">Add event</button>
              </form>
            )}
          </section>

          {isOperator && shipment.status === 'OUT_FOR_DELIVERY' && !pod && (
            <section>
              <p className="eyebrow mb-4 pb-2 border-b border-manifest">Proof of Delivery</p>
              <div className="stamp-card px-6 py-8 text-center">
                <p className="text-sm text-slate mb-4">
                  Capture the recipient's signature and complete this delivery.
                </p>
                <Link to={`/shipments/${id}/deliver`} className="btn-primary inline-flex">
                  Complete Delivery
                </Link>
              </div>
            </section>
          )}

          {pod && (
            <section>
              <p className="eyebrow mb-4 pb-2 border-b border-manifest">Proof of Delivery</p>
              <div className="stamp-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm">Delivered to <span className="font-medium">{pod.deliveredToName}</span></p>
                  <StatusBadge status={pod.verificationStatus === 'VERIFIED' ? 'DELIVERED' : pod.verificationStatus === 'DISPUTED' ? 'CANCELLED' : 'CREATED'} />
                </div>
                {pod.deliveryNotes && <p className="text-sm text-slate mb-3">{pod.deliveryNotes}</p>}

                {(pod.signatureUrl || pod.photoUrl) && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {pod.signatureUrl && (
                      <div>
                        <p className="eyebrow mb-1.5">Signature</p>
                        <img
                          src={pod.signatureUrl}
                          alt="Recipient signature"
                          className="w-full border border-manifest bg-paper"
                        />
                      </div>
                    )}
                    {pod.photoUrl && (
                      <div>
                        <p className="eyebrow mb-1.5">Delivery Photo</p>
                        <img
                          src={pod.photoUrl}
                          alt="Delivery photo"
                          className="w-full h-32 object-cover border border-manifest"
                        />
                      </div>
                    )}
                  </div>
                )}

                {pod.deliveredAt && (
                  <p className="font-mono text-xs text-slate/70 mb-3">
                    Delivered {new Date(pod.deliveredAt).toLocaleString()}
                  </p>
                )}

                {canVerifyPod && pod.verificationStatus === 'PENDING' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleVerifyPod(true)} disabled={busy} className="btn-primary">Verify &amp; confirm delivery</button>
                    <button onClick={() => handleVerifyPod(false)} disabled={busy} className="btn-secondary">Dispute</button>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="stamp-card p-5">
            <p className="eyebrow mb-3">Shipment Info</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate">Priority</dt><dd>{shipment.priority}</dd></div>
              <div className="flex justify-between"><dt className="text-slate">Created</dt><dd className="font-mono">{new Date(shipment.createdAt).toLocaleDateString()}</dd></div>
              <div className="flex justify-between"><dt className="text-slate">Est. delivery</dt><dd className="font-mono">{shipment.estimatedDeliveryDate || '\u2014'}</dd></div>
              {shipment.actualDeliveryDate && (
                <div className="flex justify-between"><dt className="text-slate">Delivered</dt><dd className="font-mono">{shipment.actualDeliveryDate}</dd></div>
              )}
            </dl>
          </div>

          <EtaWidget
            eta={eta}
            onRecalculate={
              ['LOGISTICS_OPERATOR', 'BUSINESS_CLIENT', 'ADMINISTRATOR'].includes(user?.role)
                ? handleRecalculateEta
                : undefined
            }
            busy={busy}
          />
        </aside>
      </div>
    </div>
  )
}
