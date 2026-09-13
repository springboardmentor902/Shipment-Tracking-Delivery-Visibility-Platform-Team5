import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import TrackPublic from './pages/TrackPublic'
import Dashboard from './pages/Dashboard'
import Shipments from './pages/Shipments'
import ShipmentCreate from './pages/ShipmentCreate'
import ShipmentDetail from './pages/ShipmentDetail'
import CompleteDelivery from './pages/CompleteDelivery'
import Notifications from './pages/Notifications'
import VerificationQueue from './pages/VerificationQueue'
import Reports from './pages/Reports'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'
import BusinessAccount from './pages/BusinessAccount'

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/track" element={<TrackPublic />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      <Route
  path="/business-account"
  element={
    <ProtectedRoute roles={['BUSINESS_CLIENT']}>
      <BusinessAccount />
    </ProtectedRoute>
  }
/>

      <Route path="/shipments" element={<ProtectedRoute><Shipments /></ProtectedRoute>} />
      <Route path="/shipments/new" element={<ProtectedRoute><ShipmentCreate /></ProtectedRoute>} />
      <Route path="/shipments/:id" element={<ProtectedRoute><ShipmentDetail /></ProtectedRoute>} />
      <Route
        path="/shipments/:id/deliver"
        element={
          <ProtectedRoute roles={['LOGISTICS_OPERATOR']}>
            <CompleteDelivery />
          </ProtectedRoute>
        }
      />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route
        path="/verification-queue"
        element={
          <ProtectedRoute roles={['ADMINISTRATOR', 'SUPPORT_AGENT']}>
            <VerificationQueue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={['CUSTOMER', 'BUSINESS_CLIENT', 'ADMINISTRATOR']}>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMINISTRATOR']}>
            <Admin />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
