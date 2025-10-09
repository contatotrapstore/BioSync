import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthContext } from './contexts/AuthContext';
import { getUser } from './utils/auth';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import Users from './pages/Users';
import Requests from './pages/Requests';
import Subscriptions from './pages/Subscriptions';

// Layout
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">Loading...</Box>;
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (!user.is_admin) {
      return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        Acesso Negado. Apenas administradores.
      </Box>;
    }

    return children;
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="games" element={<Games />} />
          <Route path="users" element={<Users />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="requests" element={<Requests />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}

export default App;
