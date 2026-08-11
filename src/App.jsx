import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginSignup } from './pages/LoginSignup.jsx'
import { Onboarding } from './pages/Onboarding.jsx'
import { userService } from './services/user.service'

// There is no dashboard yet, so a user who finished onboarding stays on /login
function RootRedirect() {
  const loggedinUser = userService.getLoggedinUser()

  if (!loggedinUser) return <Navigate to="/login" replace />
  if (!loggedinUser.onboardingCompleted) return <Navigate to="/onboarding" replace />
  return <Navigate to="/login" replace />
}

function OnboardingRoute() {
  const loggedinUser = userService.getLoggedinUser()

  if (!loggedinUser || loggedinUser.onboardingCompleted) return <Navigate to="/login" replace />
  return <Onboarding />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginSignup />} />
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
