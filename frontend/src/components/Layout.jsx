import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'
import { notificacaoService } from '../services/api'
import {
  LayoutDashboard, FileText, Users, BarChart3, Receipt, Calendar,
  Settings, LogOut, Bell, Menu, X, ChevronDown, Building2
} from 'lucide-react'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/notas', icon: FileText, label: 'Notas Fiscais' },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { path: '/das', icon: Receipt, label: 'DAS Mensal' },
  { path: '/calendario', icon: Calendar, label: 'Calendário' },
  { path: '/configuracoes', icon: Settings, label: 'Configurações' },
]

export default function Layout() {
  const navigate = useNavigate()
  const { user, meiAtivo, meis, logout, setMeiAtivo } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificacoes, setNotificacoes] = useState([])
  const [showNotificacoes, setShowNotificacoes] = useState(false)
  const [showMeiSelector, setShowMeiSelector] = useState(false)

  useEffect(() => {
    carregarNotificacoes()
  }, [])

  const carregarNotificacoes = async () => {
    try {
      const response = await notificacaoService.listar()
      setNotificacoes(response.data.data.notificacoes || [])
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const naoLidas = notificacoes.filter(n => !n.lida).length

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 border-r border-slate-800
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">MEI Control</h1>
                <p className="text-xs text-slate-500">Gestão Fiscal</p>
              </div>
            </div>
          </div>

          {/* Seletor de MEI */}
          {meis.length > 0 && (
            <div className="p-4 border-b border-slate-800">
              <div className="relative">
                <button
                  onClick={() => setShowMeiSelector(!showMeiSelector)}
                  className="w-full flex items-center justify-between gap-2 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-sm text-slate-200 truncate">
                      {meiAtivo?.nomeFantasia || meiAtivo?.razaoSocial || 'Selecione'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showMeiSelector ? 'rotate-180' : ''}`} />
                </button>
                
                {showMeiSelector && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-lg border border-slate-700 shadow-lg z-10">
                    {meis.map((mei) => (
                      <button
                        key={mei.id}
                        onClick={() => {
                          setMeiAtivo(mei)
                          setShowMeiSelector(false)
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg ${
                          meiAtivo?.id === mei.id ? 'text-cyan-400 bg-slate-700/50' : 'text-slate-300'
                        }`}
                      >
                        {mei.nomeFantasia || mei.razaoSocial}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Usuário */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.nome?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.nome}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          {/* Notificações */}
          <div className="relative">
            <button
              onClick={() => setShowNotificacoes(!showNotificacoes)}
              className="p-2 text-slate-400 hover:text-white relative"
            >
              <Bell className="w-6 h-6" />
              {naoLidas > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-xs text-white flex items-center justify-center">
                  {naoLidas}
                </span>
              )}
            </button>

            {showNotificacoes && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-50">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="font-semibold text-white">Notificações</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notificacoes.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500 text-center">
                      Nenhuma notificação
                    </p>
                  ) : (
                    notificacoes.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-slate-700/50 hover:bg-slate-700/50 ${
                          !notif.lida ? 'bg-slate-700/30' : ''
                        }`}
                      >
                        <p className="text-sm font-medium text-slate-200">{notif.titulo}</p>
                        <p className="text-xs text-slate-400 mt-1">{notif.mensagem}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
