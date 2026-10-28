import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastProvider'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AppSkeleton from './components/AppSkeleton'
import ErrorBoundary from './components/ErrorBoundary'
import NotFound from './pages/NotFound'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))

const Dashboard = lazy(() => import('./pages/resident/Dashboard'))
const MyReports = lazy(() => import('./pages/resident/MyReports'))
const SubmitComplaint = lazy(() => import('./pages/resident/SubmitComplaint'))
const TrackStatus = lazy(() => import('./pages/resident/TrackStatus'))
const Notifications = lazy(() => import('./pages/resident/Notifications'))
const Profile = lazy(() => import('./pages/resident/Profile'))

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminComplaints = lazy(() => import('./pages/admin/AdminComplaints'))
const AdminCases = lazy(() => import('./pages/admin/AdminCases'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'))
const ComplaintRouter = lazy(() => import('./pages/admin/ComplaintRouter'))

const FORMS = {
  7: lazy(() => import('./pages/admin/forms/Form7')),
  8: lazy(() => import('./pages/admin/forms/Form8')),
  9: lazy(() => import('./pages/admin/forms/Form9')),
  10: lazy(() => import('./pages/admin/forms/Form10')),
  11: lazy(() => import('./pages/admin/forms/Form11')),
  13: lazy(() => import('./pages/admin/forms/Form13')),
  14: lazy(() => import('./pages/admin/forms/Form14')),
  15: lazy(() => import('./pages/admin/forms/Form15')),
  16: lazy(() => import('./pages/admin/forms/Form16')),
  18: lazy(() => import('./pages/admin/forms/Form18')),
  19: lazy(() => import('./pages/admin/forms/Form19')),
  20: lazy(() => import('./pages/admin/forms/Form20')),
  22: lazy(() => import('./pages/admin/forms/Form22')),
  25: lazy(() => import('./pages/admin/forms/Form25')),
  27: lazy(() => import('./pages/admin/forms/Form27')),
}

const RESIDENT_ROUTES = [
  ['/dashboard', Dashboard],
  ['/my-reports', MyReports],
  ['/complaints/new', SubmitComplaint],
  ['/track', TrackStatus],
  ['/notifications', Notifications],
  ['/profile', Profile],
]

const ADMIN_ROUTES = [
  ['/admin/dashboard', AdminDashboard],
  ['/admin/complaints', AdminComplaints],
  ['/admin/complaints/:id', ComplaintRouter],
  ['/admin/cases', AdminCases],
  ['/admin/cases/:id', ComplaintRouter],
  ['/admin/users', AdminUsers],
  ['/admin/analytics', AdminAnalytics],
  ['/admin/notifications', AdminNotifications],
  ['/admin/settings', AdminSettings],
  ...Object.entries(FORMS).map(([n, Form]) => [`/admin/complaints/:id/form${n}`, Form]),
]

const isAdmin = (profile) => ['admin', 'staff'].includes(profile?.role)

function HomeRedirect() {
  const { user, profile, loading } = useAuth()
  if (loading) return <AppSkeleton />
  if (!user) return <LandingPage />
  return <Navigate to={isAdmin(profile) ? '/admin/dashboard' : '/dashboard'} replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <AppSkeleton />
  if (user) return <HomeRedirect />
  return children
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<AppSkeleton />}>
                <Routes>
                  <Route path="/" element={<HomeRedirect />} />
                  <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                  <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {RESIDENT_ROUTES.map(([path, Page]) => (
                    <Route key={path} path={path} element={<ProtectedRoute><Page /></ProtectedRoute>} />
                  ))}
                  {ADMIN_ROUTES.map(([path, Page]) => (
                    <Route key={path} path={path} element={<AdminRoute><Page /></AdminRoute>} />
                  ))}

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
