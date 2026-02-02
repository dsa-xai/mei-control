import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from './context/authStore';

// Pages
import Login from './pages/Login';
import Layout from './components/Layout';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardCliente from './pages/DashboardCliente';
import Meis from './pages/Meis';
import Notas from './pages/Notas';
import Solicitacoes from './pages/Solicitacoes';
import DAS from './pages/DAS';
import Clientes from './pages/Clientes';

// Protected Route
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, verificarAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    verificarAuth().finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Dashboard Router
function DashboardRouter() {
  const { isAdmin } = useAuthStore();
  return isAdmin() ? <DashboardAdmin /> : <DashboardCliente />;
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRouter />} />
        <Route path="meis" element={
          <ProtectedRoute adminOnly>
            <Meis />
          </ProtectedRoute>
        } />
        <Route path="notas" element={<Notas />} />
        <Route path="solicitacoes" element={<Solicitacoes />} />
        <Route path="das" element={<DAS />} />
        <Route path="clientes" element={<Clientes />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
