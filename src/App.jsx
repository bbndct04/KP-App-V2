import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/resident/Dashboard'
import MyReports from './pages/resident/MyReports'
import SubmitComplaint from './pages/resident/SubmitComplaint'
import TrackStatus from './pages/resident/TrackStatus'
import Notifications from './pages/resident/Notifications'
import Profile from './pages/resident/Profile'
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminComplaints from './pages/admin/AdminComplaints'
import AdminUsers from './pages/admin/AdminUsers'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import Form7 from './pages/admin/forms/Form7'
import Form8 from './pages/admin/forms/Form8'
import Form9 from './pages/admin/forms/Form9'
import Form10 from './pages/admin/forms/Form10'
import Form11 from './pages/admin/forms/Form11'
import Form16 from './pages/admin/forms/Form16'
import Form20 from './pages/admin/forms/Form20'
import Form13 from './pages/admin/forms/Form13'
import Form14 from './pages/admin/forms/Form14'
import Form15 from './pages/admin/forms/Form15'
import Form18 from './pages/admin/forms/Form18'
import Form19 from './pages/admin/forms/Form19'
import Form22 from './pages/admin/forms/Form22'
import Form25 from './pages/admin/forms/Form25'
import Form27 from './pages/admin/forms/Form27'
import CaseDetail from './pages/admin/CaseDetail'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reports"
            element={
              <ProtectedRoute>
                <MyReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/complaints/new"
            element={
              <ProtectedRoute>
                <SubmitComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/track"
            element={
              <ProtectedRoute>
                <TrackStatus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <AdminRoute>
                <AdminComplaints />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AdminAnalytics />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form7"
            element={
              <AdminRoute>
                <Form7 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form8"
            element={
              <AdminRoute>
                <Form8 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form9"
            element={
              <AdminRoute>
                <Form9 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form10"
            element={
              <AdminRoute>
                <Form10 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form11"
            element={
              <AdminRoute>
                <Form11 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form13"
            element={
              <AdminRoute>
                <Form13 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form14"
            element={
              <AdminRoute>
                <Form14 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form15"
            element={
              <AdminRoute>
                <Form15 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form16"
            element={
              <AdminRoute>
                <Form16 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form18"
            element={
              <AdminRoute>
                <Form18 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form19"
            element={
              <AdminRoute>
                <Form19 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form20"
            element={
              <AdminRoute>
                <Form20 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form22"
            element={
              <AdminRoute>
                <Form22 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form25"
            element={
              <AdminRoute>
                <Form25 />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/complaints/:id/form27"
            element={
              <AdminRoute>
                <Form27 />
              </AdminRoute>
            }
          />
          <Route path="/admin/complaints/:id" element={<AdminRoute><CaseDetail /></AdminRoute>} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App