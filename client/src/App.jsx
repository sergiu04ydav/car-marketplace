import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';

/* ── Rută protejată: dacă nu ești logat → /login ─────────── */
function PrivateRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div style={{ minHeight: '100vh', background: '#f8fafc' }} />;
  return user ? children : <Navigate to="/login" replace />;
}

/* ── Rută admin: dacă nu ești admin → /dashboard ─────────── */
function AdminRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div style={{ minHeight: '100vh', background: '#f8fafc' }} />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

/* ── Rută publică: dacă ești logat → /dashboard ─────────── */
function PublicRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div style={{ minHeight: '100vh', background: '#f8fafc' }} />;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

/* ── Routes ───────────────────────────────────────────────── */
function AppRoutes() {
  const { user, ready } = useAuth();
  if (!ready) return <div style={{ minHeight: '100vh', background: '#f8fafc' }} />;

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Home />}
      />

      <Route path="/login"           element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/register"        element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/forgot-password" element={<Auth />} />
      <Route path="/reset-password"  element={<Auth />} />

      <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

      <Route
        path="/dashboard"
        element={<PrivateRoute><Dashboard /></PrivateRoute>}
      />

      <Route
        path="/profile"
        element={<PrivateRoute><Profile /></PrivateRoute>}
      />

      {/* Profil public — vizibil fără autentificare */}
      <Route path="/profile/:userId" element={<Profile />} />

      {/* Admin Panel — accesibil doar de admini */}
      <Route
        path="/admin"
        element={<AdminRoute><AdminPanel /></AdminRoute>}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}