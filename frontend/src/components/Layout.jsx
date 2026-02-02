import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Users, Receipt, Calendar,
  Building2, Bell, LogOut, Menu, X, ChevronDown
} from 'lucide-react';
import useAuthStore from '../context/authStore';
import { notificacaoAPI } from '../services/api';

function Layout() {
  const navigate = useNavigate();
  const { usuario, meiAtual, logout, isAdmin, setMeiAtual } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [meiSelectorOpen, setMeiSelectorOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState({ naoLidas: 0 });

  // Menu items baseado no role
  const menuItems = isAdmin() ? [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/meis', label: 'MEIs', icon: Building2 },
    { path: '/notas', label: 'Notas Fiscais', icon: FileText },
    { path: '/solicitacoes', label: 'Solicitações', icon: Receipt },
    { path: '/das', label: 'Guias DAS', icon: Calendar },
    { path: '/clientes', label: 'Clientes', icon: Users },
  ] : [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/notas', label: 'Minhas Notas', icon: FileText },
    { path: '/solicitacoes', label: 'Solicitar Nota', icon: Receipt },
    { path: '/das', label: 'Guias DAS', icon: Calendar },
  ];

  // Buscar notificações
  useEffect(() => {
    const fetchNotificacoes = async () => {
      try {
        const { data } = await notificacaoAPI.listar({ limit: 5 });
        setNotificacoes(data);
      } catch (e) {
        // Ignora erro
      }
    };
    fetchNotificacoes();
    const interval = setInterval(fetchNotificacoes, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMeiSelect = (mei) => {
    setMeiAtual(mei);
    setMeiSelectorOpen(false);
  };

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
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800
        transform transition-transform duration-300 lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">MEI Control</h1>
                  <p className="text-xs text-slate-500">v2.0</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MEI Selector (Admin) */}
          {isAdmin() && usuario?.meis?.length > 0 && (
            <div className="p-4 border-b border-slate-800">
              <label className="text-xs text-slate-500 mb-2 block">MEI Ativo</label>
              <div className="relative">
                <button
                  onClick={() => setMeiSelectorOpen(!meiSelectorOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-lg text-left hover:bg-slate-800 transition-colors"
                >
                  <span className="text-sm text-slate-300 truncate">
                    {meiAtual?.nomeFantasia || meiAtual?.razaoSocial || 'Todos'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${meiSelectorOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {meiSelectorOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 z-50">
                    <button
                      onClick={() => handleMeiSelect(null)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 ${!meiAtual ? 'text-cyan-400 bg-slate-700/50' : 'text-slate-300'}`}
                    >
                      Todos os MEIs
                    </button>
                    {usuario.meis.map((mei) => (
                      <button
                        key={mei.id}
                        onClick={() => handleMeiSelect(mei)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 truncate ${meiAtual?.id === mei.id ? 'text-cyan-400 bg-slate-700/50' : 'text-slate-300'}`}
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
                  {usuario?.nome?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{usuario?.nome}</p>
                <p className="text-xs text-slate-500 truncate">{usuario?.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              {/* Notificações */}
              <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {notificacoes.naoLidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notificacoes.naoLidas > 9 ? '9+' : notificacoes.naoLidas}
                  </span>
                )}
              </button>

              {/* Role Badge */}
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${isAdmin() ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                {isAdmin() ? 'Admin' : 'Cliente'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
