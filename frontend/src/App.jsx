import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './context/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NotasFiscais from './pages/NotasFiscais'
import Clientes from './pages/Clientes'
import Relatorios from './pages/Relatorios'
import DAS from './pages/DAS'
import Calendario from './pages/Calendario'
import Configuracoes from './pages/Configuracoes'
import Layout from './components/Layout'

// Rota protegida
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />
}

// Rota pública (redireciona se logado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }
  
  return !isAuthenticated ? children : <Navigate to="/" />
}

function App() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/registro" element={<PublicRoute><Register /></PublicRoute>} />
      
      {/* Rotas protegidas */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="notas" element={<NotasFiscais />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="das" element={<DAS />} />
        <Route path="calendario" element={<Calendario />} />
        <Route path="configuracoes" element={<Configuracoes />} />
      </Route>
      
      {/* Rota 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
