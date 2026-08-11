import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginSignup } from './pages/LoginSignup.jsx'
import { Onboarding } from './pages/Onboarding.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { userService } from './services/user.service'

function RootRedirect() {
  const loggedinUser = userService.getLoggedinUser()

  if (!loggedinUser) return <Navigate to="/login" replace />
  if (!loggedinUser.onboardingCompleted) return <Navigate to="/onboarding" replace />
  return <Navigate to="/dashboard" replace />
}

function OnboardingRoute() {
  const loggedinUser = userService.getLoggedinUser()

  if (!loggedinUser) return <Navigate to="/login" replace />
  if (loggedinUser.onboardingCompleted) return <Navigate to="/dashboard" replace />
  return <Onboarding />
}

function DashboardRoute() {
  const loggedinUser = userService.getLoggedinUser()

  if (!loggedinUser) return <Navigate to="/login" replace />
  if (!loggedinUser.onboardingCompleted) return <Navigate to="/onboarding" replace />
  return <Dashboard />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginSignup />} />
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
