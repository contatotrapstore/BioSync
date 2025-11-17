import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Forbidden } from './pages/Forbidden';
import { DesignSystemTest } from './pages/DesignSystemTest';
import { DirectionDashboard } from './pages/admin/DirectionDashboard';
import { UsersManagement } from './pages/admin/UsersManagement';
import { ClassesManagement } from './pages/admin/ClassesManagement';
import { SessionsOverview } from './pages/admin/SessionsOverview';
import { SystemSettings } from './pages/admin/SystemSettings';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { SessionCreate } from './pages/teacher/SessionCreate';
import { SessionActive } from './pages/teacher/SessionActive';
import { SessionReport } from './pages/teacher/SessionReport';
import { StudentDashboard } from './pages/student/StudentDashboard';

function App() {
  return (
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
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['direcao']}>
                  <SystemSettings />
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

            {/* Student routes - only aluno */}
            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={['aluno']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Design system (public for now) */}
            <Route path="/design-system" element={<DesignSystemTest />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
