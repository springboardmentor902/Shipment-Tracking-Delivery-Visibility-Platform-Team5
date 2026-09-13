import React, { useEffect, useMemo, useState } from 'react'
import client from '../api/client'
import {
  assignOperator,
  getAllShipments,
} from '../api/shipments'
import Loader from '../components/Loader'
import ErrorNote from '../components/ErrorNote'

const ROLES = [
  'CUSTOMER',
  'BUSINESS_CLIENT',
  'LOGISTICS_OPERATOR',
  'SUPPORT_AGENT',
  'ADMINISTRATOR',
]

export default function Admin() {
  // -----------------------------
  // User management state
  // -----------------------------
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [roleError, setRoleError] = useState('')

  // -----------------------------
  // Shipment assignment state
  // -----------------------------
  const [shipments, setShipments] = useState([])
  const [shipmentsLoading, setShipmentsLoading] = useState(true)
  const [shipmentsError, setShipmentsError] = useState('')

  const [selectedShipmentId, setSelectedShipmentId] = useState('')
  const [selectedOperatorId, setSelectedOperatorId] = useState('')

  const [assigning, setAssigning] = useState(false)
  const [assignmentError, setAssignmentError] = useState('')
  const [assignmentSuccess, setAssignmentSuccess] = useState('')

  // -----------------------------
  // Load users and shipments
  // -----------------------------
  useEffect(() => {
    loadUsers()
    loadShipments()
  }, [])

  async function loadUsers() {
    setUsersLoading(true)
    setUsersError('')

    try {
      const data = await client
        .get('/admin/users')
        .then((r) => r.data)

      setUsers(data)
    } catch (err) {
      setUsersError(
        err.response?.data?.message ||
          'Could not load users.',
      )
    } finally {
      setUsersLoading(false)
    }
  }

  async function loadShipments() {
    setShipmentsLoading(true)
    setShipmentsError('')

    try {
      const data = await getAllShipments()
      setShipments(data)
    } catch (err) {
      setShipmentsError(
        err.response?.data?.message ||
          'Could not load shipments.',
      )
    } finally {
      setShipmentsLoading(false)
    }
  }

  // -----------------------------
  // Filter only Logistics Operators
  // -----------------------------
  const operators = useMemo(
    () =>
      users.filter(
        (user) => user.role === 'LOGISTICS_OPERATOR',
      ),
    [users],
  )

  // -----------------------------
  // User role change
  // -----------------------------
  const handleRoleChange = async (id, role) => {
    setRoleError('')

    try {
      const updated = await client
        .put(`/admin/users/${id}/role`, { role })
        .then((r) => r.data)

      setUsers((prev) =>
        prev.map((u) => (u.id === id ? updated : u)),
      )

      // If an operator role was changed, refresh the
      // shipment assignment section's operator list.
      await loadUsers()
    } catch (err) {
      setRoleError(
        err.response?.data?.message ||
          'Could not update user role.',
      )
    }
  }

  // -----------------------------
  // Shipment assignment
  // -----------------------------
  const handleAssignOperator = async (event) => {
    event.preventDefault()

    setAssignmentError('')
    setAssignmentSuccess('')

    if (!selectedShipmentId) {
      setAssignmentError('Please select a shipment.')
      return
    }

    if (!selectedOperatorId) {
      setAssignmentError('Please select a Logistics Operator.')
      return
    }

    setAssigning(true)

    try {
      const updatedShipment = await assignOperator(
        Number(selectedShipmentId),
        Number(selectedOperatorId),
      )

      // Update the assigned shipment in the current list.
      setShipments((prev) =>
        prev.map((shipment) =>
          shipment.id === updatedShipment.id
            ? updatedShipment
            : shipment,
        ),
      )

      const operator = operators.find(
        (user) => user.id === Number(selectedOperatorId),
      )

      setAssignmentSuccess(
        `Shipment ${updatedShipment.trackingNumber || `#${updatedShipment.id}`} assigned to ${operator?.fullName || 'the selected operator'}.`,
      )

      // Clear selections after successful assignment.
      setSelectedShipmentId('')
      setSelectedOperatorId('')
    } catch (err) {
      setAssignmentError(
        err.response?.data?.message ||
          'Could not assign shipment.',
      )
    } finally {
      setAssigning(false)
    }
  }

  // -----------------------------
  // Helper: display operator name
  // -----------------------------
  const getOperatorName = (operatorId) => {
    if (!operatorId) return 'Unassigned'

    const operator = users.find(
      (user) => user.id === operatorId,
    )

    return operator
      ? `${operator.fullName} (${operator.email})`
      : `Operator #${operatorId}`
  }

  // -----------------------------
  // Initial loading
  // -----------------------------
  if (usersLoading && shipmentsLoading) {
    return <Loader label="Loading admin console" />
  }

  return (
    <div>
      <p className="eyebrow text-slate mb-1">
        Control Room
      </p>

      <h1 className="font-display font-semibold text-2xl mb-8">
        Admin Console
      </h1>

      {/* =========================================
          SHIPMENT ASSIGNMENT SECTION
      ========================================== */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="eyebrow text-slate mb-1">
              Operations
            </p>

            <h2 className="font-display font-semibold text-xl">
              Shipment Assignment
            </h2>

            <p className="text-sm text-slate mt-2">
              Assign shipments to Logistics Operators.
            </p>
          </div>

          <button
            type="button"
            onClick={loadShipments}
            className="btn-secondary"
            disabled={shipmentsLoading}
          >
            {shipmentsLoading ? 'Refreshing...' : 'Refresh Shipments'}
          </button>
        </div>

        <ErrorNote message={shipmentsError} />
        <ErrorNote message={assignmentError} />

        {assignmentSuccess && (
          <div className="stamp-card border-cleared px-4 py-3 mb-4">
            <p className="eyebrow text-cleared mb-1">
              Assignment Complete
            </p>

            <p className="text-sm text-ink">
              {assignmentSuccess}
            </p>
          </div>
        )}

        <div className="stamp-card">
          <form
            onSubmit={handleAssignOperator}
            className="p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Shipment dropdown */}
              <div>
                <label
                  htmlFor="shipment"
                  className="field-label"
                >
                  Select Shipment
                </label>

                <select
                  id="shipment"
                  className="field-input"
                  value={selectedShipmentId}
                  onChange={(e) => {
                    setSelectedShipmentId(e.target.value)
                    setAssignmentError('')
                    setAssignmentSuccess('')
                  }}
                  disabled={shipmentsLoading}
                >
                  <option value="">
                    {shipmentsLoading
                      ? 'Loading shipments...'
                      : 'Choose a shipment'}
                  </option>

                  {shipments.map((shipment) => (
                    <option
                      key={shipment.id}
                      value={shipment.id}
                    >
                      {shipment.trackingNumber ||
                        `Shipment #${shipment.id}`}{' '}
                      — {shipment.status || 'UNKNOWN'}
                    </option>
                  ))}
                </select>

                <p className="text-xs text-slate mt-1.5">
                  Select the shipment you want to assign.
                </p>
              </div>

              {/* Operator dropdown */}
              <div>
                <label
                  htmlFor="operator"
                  className="field-label"
                >
                  Select Logistics Operator
                </label>

                <select
                  id="operator"
                  className="field-input"
                  value={selectedOperatorId}
                  onChange={(e) => {
                    setSelectedOperatorId(e.target.value)
                    setAssignmentError('')
                    setAssignmentSuccess('')
                  }}
                  disabled={usersLoading}
                >
                  <option value="">
                    {usersLoading
                      ? 'Loading operators...'
                      : operators.length === 0
                        ? 'No Logistics Operators found'
                        : 'Choose an operator'}
                  </option>

                  {operators.map((operator) => (
                    <option
                      key={operator.id}
                      value={operator.id}
                    >
                      {operator.fullName} — {operator.email}
                    </option>
                  ))}
                </select>

                <p className="text-xs text-slate mt-1.5">
                  Only users with the LOGISTICS_OPERATOR role
                  are shown.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-slate">
                Assignment requires Administrator access.
              </p>

              <button
                type="submit"
                className="btn-primary"
                disabled={
                  assigning ||
                  shipmentsLoading ||
                  usersLoading ||
                  !selectedShipmentId ||
                  !selectedOperatorId
                }
              >
                {assigning
                  ? 'Assigning...'
                  : 'Assign Operator'}
              </button>
            </div>
          </form>
        </div>

        {/* =========================================
            CURRENT SHIPMENT ASSIGNMENTS
        ========================================== */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="eyebrow text-slate mb-1">
                Current Allocation
              </p>

              <h3 className="font-display font-semibold text-lg">
                Shipment Assignments
              </h3>
            </div>

            <p className="text-xs text-slate">
              {shipments.length} shipment
              {shipments.length !== 1 ? 's' : ''}
            </p>
          </div>

          {shipments.length === 0 ? (
            <div className="border-t border-b border-manifest py-8 text-center">
              <p className="text-sm text-slate">
                No shipments found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-b border-manifest">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-manifest">
                    <th className="eyebrow py-3 px-2">
                      Shipment
                    </th>

                    <th className="eyebrow py-3 px-2">
                      Status
                    </th>

                    <th className="eyebrow py-3 px-2">
                      Assigned Operator
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {shipments.map((shipment) => (
                    <tr
                      key={shipment.id}
                      className="border-b border-manifest last:border-b-0"
                    >
                      <td className="py-4 px-2">
                        <p className="text-sm font-medium">
                          {shipment.trackingNumber ||
                            `Shipment #${shipment.id}`}
                        </p>

                        <p className="text-xs text-slate mt-1">
                          ID: {shipment.id}
                        </p>
                      </td>

                      <td className="py-4 px-2">
                        <span className="text-xs font-mono uppercase">
                          {shipment.status || 'UNKNOWN'}
                        </span>
                      </td>

                      <td className="py-4 px-2">
                        <p
                          className={
                            shipment.assignedOperatorId
                              ? 'text-sm text-ink'
                              : 'text-sm text-slate'
                          }
                        >
                          {getOperatorName(
                            shipment.assignedOperatorId,
                          )}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* =========================================
          EXISTING USER MANAGEMENT SECTION
      ========================================== */}
      <section>
        <p className="eyebrow text-slate mb-1">
          Administration
        </p>

        <h2 className="font-display font-semibold text-xl mb-5">
          User Management
        </h2>

        <ErrorNote message={usersError} />
        <ErrorNote message={roleError} />

        {usersLoading ? (
          <Loader label="Loading users" />
        ) : (
          <div className="divide-y divide-manifest border-t border-b border-manifest">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between py-3 px-2 gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {u.fullName}
                  </p>

                  <p className="text-xs text-slate truncate">
                    {u.email}
                  </p>

                  <p className="text-[10px] font-mono text-slate mt-1">
                    USER ID: {u.id}
                  </p>
                </div>

                <select
                  className="field-input w-48 shrink-0"
                  value={u.role}
                  onChange={(e) =>
                    handleRoleChange(
                      u.id,
                      e.target.value,
                    )
                  }
                >
                  {ROLES.map((role) => (
                    <option
                      key={role}
                      value={role}
                    >
                      {role.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}