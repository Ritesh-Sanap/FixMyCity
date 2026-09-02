import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'

// Citizen pages
import Welcome from './pages/citizen/Welcome'
import CitizenHome from './pages/citizen/Home'
import ReportProblem from './pages/citizen/ReportProblem'
import AIAnalysis from './pages/citizen/AIAnalysis'
import ComplaintDetail from './pages/citizen/ComplaintDetail'
import MyReports from './pages/citizen/MyReports'
import NearbyIssues from './pages/citizen/NearbyIssues'
import SOSHome from './pages/citizen/SOSHome'
import SOSActive from './pages/citizen/SOSActive'
import SafetyMap from './pages/citizen/SafetyMap'
import Settings from './pages/citizen/Settings'

// Officer pages
import OfficerDashboard from './pages/officer/Dashboard'
import IssueDetail from './pages/officer/IssueDetail'

function RequireAuth({ children, role }: { children: React.ReactNode; role?: 'citizen' | 'officer' | 'admin' }) {
  const { isLoggedIn, user } = useAuthStore()
  if (!isLoggedIn) return <Navigate to="/" replace />
  if (role === 'officer' && user?.role === 'citizen') return <Navigate to="/citizen/home" replace />
  if (role === 'citizen' && user?.role !== 'citizen') return <Navigate to="/officer/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { isLoggedIn, user } = useAuthStore()

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/"
        element={
          isLoggedIn
            ? <Navigate to={user?.role === 'citizen' ? '/citizen/home' : '/officer/dashboard'} replace />
            : <Welcome />
        }
      />

      {/* Citizen routes */}
      <Route path="/citizen/home" element={<RequireAuth role="citizen"><CitizenHome /></RequireAuth>} />
      <Route path="/citizen/report" element={<RequireAuth role="citizen"><ReportProblem /></RequireAuth>} />
      <Route path="/citizen/ai-analysis" element={<RequireAuth role="citizen"><AIAnalysis /></RequireAuth>} />
      <Route path="/citizen/issue/:issueId" element={<RequireAuth><ComplaintDetail /></RequireAuth>} />
      <Route path="/citizen/my-reports" element={<RequireAuth role="citizen"><MyReports /></RequireAuth>} />
      <Route path="/citizen/nearby" element={<RequireAuth role="citizen"><NearbyIssues /></RequireAuth>} />
      <Route path="/citizen/sos" element={<RequireAuth role="citizen"><SOSHome /></RequireAuth>} />
      <Route path="/citizen/sos/active" element={<RequireAuth role="citizen"><SOSActive /></RequireAuth>} />
      <Route path="/citizen/safety-map" element={<RequireAuth role="citizen"><SafetyMap /></RequireAuth>} />
      <Route path="/citizen/settings" element={<RequireAuth role="citizen"><Settings /></RequireAuth>} />

      {/* Officer routes */}
      <Route path="/officer/dashboard" element={<RequireAuth role="officer"><OfficerDashboard /></RequireAuth>} />
      <Route path="/officer/issue/:issueId" element={<RequireAuth role="officer"><IssueDetail /></RequireAuth>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
