import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Forbidden } from './pages/Forbidden';
import { DirectionDashboard } from './pages/admin/DirectionDashboard';
import { UsersManagement } from './pages/admin/UsersManagement';
import { ClassesManagement } from './pages/admin/ClassesManagement';
import { SessionsOverview } from './pages/admin/SessionsOverview';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { ClassDetails } from './pages/teacher/ClassDetails';
import { SessionCreate } from './pages/teacher/SessionCreate';
import { SessionActive } from './pages/teacher/SessionActive';
import { SessionReport } from './pages/teacher/SessionReport';
import { StudentDetail } from './pages/teacher/StudentDetail';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { InstallPWABanner } from './components/atoms/InstallPWABanner';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forbidden" element={<Forbidden />} />

            {/* Protected route - generic home */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            {/* Admin routes - only direção */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['direcao']}>
                  <DirectionDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['direcao']}>
                  <UsersManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <ProtectedRoute allowedRoles={['direcao']}>
                  <ClassesManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sessions"
              element={
                <ProtectedRoute allowedRoles={['direcao']}>
                  <SessionsOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/session/:sessionId/report"
              element={
                <ProtectedRoute allowedRoles={['direcao']}>
                  <SessionReport />
                </ProtectedRoute>
              }
            />

            {/* Teacher routes - only professor */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/class/:classId"
              element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <ClassDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/session/create"
              element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <SessionCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/session/:sessionId/active"
              element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <SessionActive />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/session/:sessionId/report"
              element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <SessionReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/student/:studentId"
              element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <StudentDetail />
                </ProtectedRoute>
              }
            />

            {/* Student routes - only aluno */}
            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={['aluno']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global PWA Install Banner - appears for all users on all pages */}
          <InstallPWABanner />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
