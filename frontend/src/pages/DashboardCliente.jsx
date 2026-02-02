import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, TrendingUp, Calendar, Receipt,
  ArrowUpRight, Clock, CheckCircle2, AlertTriangle,
  DollarSign, Plus
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { AlertaTetoCard, TetoProgressBar } from '../components/AlertaTeto';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

function DashboardCliente() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [alertaVisivel, setAlertaVisivel] = useState(true);
  const { meiAtual } = useAuthStore();

  useEffect(() => {
    fetchDashboard();
  }, [meiAtual]);

  const fetchDashboard = async () => {
    try {
      const { data } = await dashboardAPI.cliente(meiAtual?.id);
      setStats(data);
    } catch (error) {
      toast.error('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const TETO_ANUAL = 81000;
  const percentualTeto = ((stats?.faturamentoAnual || 0) / TETO_ANUAL) * 100;
  const valorDisponivel = TETO_ANUAL - (stats?.faturamentoAnual || 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Olá, {stats?.mei?.nomeFantasia || 'Bem-vindo'}!
          </h1>
          <p className="text-slate-400 mt-1">
            CNPJ: {stats?.mei?.cnpj || 'Não informado'}
          </p>
        </div>
        <Link to="/solicitacoes" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Solicitar Nota
        </Link>
      </div>

      {/* Alerta de Teto */}
      {percentualTeto >= 65 && alertaVisivel && (
        <AlertaTetoCard
          percentual={percentualTeto}
          faturado={stats?.faturamentoAnual}
          onClose={() => setAlertaVisivel(false)}
        />
      )}

      {/* Faturamento Anual */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Faturamento Anual</h2>
          <span className="text-sm text-slate-400">Teto MEI: R$ 81.000,00</span>
        </div>
        
        <TetoProgressBar
          percentual={percentualTeto}
          faturado={stats?.faturamentoAnual}
          showLabel={true}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-sm text-slate-400">Faturado</p>
            <p className="text-xl font-bold text-white">{formatCurrency(stats?.faturamentoAnual)}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-sm text-slate-400">Disponível</p>
            <p className="text-xl font-bold text-green-400">{formatCurrency(valorDisponivel > 0 ? valorDisponivel : 0)}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-sm text-slate-400">% Utilizado</p>
            <p className="text-xl font-bold text-cyan-400">{percentualTeto.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Notas Emitidas</p>
              <p className="text-2xl font-bold text-white mt-1">{stats?.totalNotas || 0}</p>
              <p className="text-xs text-slate-500 mt-1">{stats?.notasMes || 0} este mês</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Faturamento Mensal</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats?.faturamentoMes)}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">+{stats?.variacaoMes || 0}%</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Solicitações</p>
              <p className="text-2xl font-bold text-white mt-1">{stats?.solicitacoesPendentes || 0}</p>
              <p className="text-xs text-amber-400 mt-1">Pendentes</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">DAS a Pagar</p>
              <p className="text-2xl font-bold text-white mt-1">{stats?.dasPendentes || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Próximo: {stats?.proximoDas || '-'}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas Notas */}
        <div className="card">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Últimas Notas</h2>
              <Link to="/notas" className="text-sm text-cyan-400 hover:text-cyan-300">
                Ver todas
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-700/50">
            {stats?.ultimasNotas?.slice(0, 5).map((nota) => (
              <div key={nota.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  nota.status === 'EMITIDA' ? 'bg-green-500/20 text-green-400' :
                  nota.status === 'CANCELADA' ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {nota.cliente?.nome || 'Cliente'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(nota.dataEmissao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatCurrency(nota.valor)}</p>
                  <span className={`badge ${nota.status === 'EMITIDA' ? 'badge-success' : 'badge-danger'}`}>
                    {nota.status}
                  </span>
                </div>
              </div>
            ))}
            {(!stats?.ultimasNotas || stats.ultimasNotas.length === 0) && (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma nota emitida ainda</p>
                <Link to="/solicitacoes" className="text-cyan-400 hover:underline text-sm mt-2 block">
                  Solicite sua primeira nota
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Minhas Solicitações */}
        <div className="card">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Minhas Solicitações</h2>
              <Link to="/solicitacoes" className="text-sm text-cyan-400 hover:text-cyan-300">
                Ver todas
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-700/50">
            {stats?.minhasSolicitacoes?.slice(0, 5).map((sol) => (
              <div key={sol.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  sol.status === 'PENDENTE' ? 'bg-amber-500/20 text-amber-400' :
                  sol.status === 'EM_ANDAMENTO' ? 'bg-blue-500/20 text-blue-400' :
                  sol.status === 'EMITIDA' ? 'bg-green-500/20 text-green-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {sol.status === 'PENDENTE' ? <Clock className="w-5 h-5" /> :
                   sol.status === 'EM_ANDAMENTO' ? <Receipt className="w-5 h-5" /> :
                   sol.status === 'EMITIDA' ? <CheckCircle2 className="w-5 h-5" /> :
                   <AlertTriangle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {sol.descricao}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(sol.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatCurrency(sol.valor)}</p>
                  <span className={`badge ${
                    sol.status === 'PENDENTE' ? 'badge-warning' :
                    sol.status === 'EM_ANDAMENTO' ? 'badge-info' :
                    sol.status === 'EMITIDA' ? 'badge-success' : 'badge-danger'
                  }`}>
                    {sol.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
            {(!stats?.minhasSolicitacoes || stats.minhasSolicitacoes.length === 0) && (
              <div className="p-8 text-center text-slate-400">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma solicitação</p>
                <Link to="/solicitacoes" className="text-cyan-400 hover:underline text-sm mt-2 block">
                  Fazer uma solicitação
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guias DAS */}
      <div className="card">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Guias DAS</h2>
            <Link to="/das" className="text-sm text-cyan-400 hover:text-cyan-300">
              Ver todas
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Competência</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.guiasDas?.slice(0, 5).map((das) => (
                <tr key={das.id}>
                  <td className="font-medium">{das.competencia}</td>
                  <td>{new Date(das.dataVencimento).toLocaleDateString('pt-BR')}</td>
                  <td className="font-medium">{formatCurrency(das.valor)}</td>
                  <td>
                    <span className={`badge ${das.pago ? 'badge-success' : 'badge-warning'}`}>
                      {das.pago ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats?.guiasDas || stats.guiasDas.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    Nenhuma guia DAS
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardCliente;
