import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, FileText, TrendingUp, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Users, Calendar,
  DollarSign, Receipt, Clock, CheckCircle2
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { AlertaTetoCard, TetoStatusBadge } from '../components/AlertaTeto';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import toast from 'react-hot-toast';

function DashboardAdmin() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [alertasVisiveis, setAlertasVisiveis] = useState({});

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await dashboardAPI.admin();
      setStats(data);
      // Inicializar alertas visíveis
      const alertas = {};
      data.meisAlerta?.forEach(mei => {
        alertas[mei.id] = true;
      });
      setAlertasVisiveis(alertas);
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

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const estatisticas = [
    {
      label: 'Total MEIs',
      value: formatNumber(stats?.totalMeis),
      icon: Building2,
      color: 'cyan',
      change: '+3 este mês',
      positive: true
    },
    {
      label: 'Faturamento Total',
      value: formatCurrency(stats?.faturamentoTotal),
      icon: DollarSign,
      color: 'green',
      change: '+12.5%',
      positive: true
    },
    {
      label: 'Notas Emitidas',
      value: formatNumber(stats?.totalNotas),
      icon: FileText,
      color: 'blue',
      change: `${stats?.notasMes || 0} este mês`,
      positive: true
    },
    {
      label: 'Solicitações Pendentes',
      value: formatNumber(stats?.solicitacoesPendentes),
      icon: Clock,
      color: 'amber',
      change: 'Aguardando',
      positive: null
    }
  ];

  const colorClasses = {
    cyan: 'from-cyan-500 to-cyan-600 text-cyan-400 bg-cyan-500/10',
    green: 'from-green-500 to-green-600 text-green-400 bg-green-500/10',
    blue: 'from-blue-500 to-blue-600 text-blue-400 bg-blue-500/10',
    amber: 'from-amber-500 to-amber-600 text-amber-400 bg-amber-500/10'
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Visão geral do sistema</p>
      </div>

      {/* Alertas de Teto */}
      {stats?.meisAlerta?.length > 0 && (
        <div className="space-y-3">
          {stats.meisAlerta.map((mei) => (
            alertasVisiveis[mei.id] && (
              <AlertaTetoCard
                key={mei.id}
                percentual={mei.percentualTeto}
                faturado={mei.faturamentoAnual}
                nomeFantasia={mei.nomeFantasia}
                onClose={() => setAlertasVisiveis(prev => ({ ...prev, [mei.id]: false }))}
              />
            )
          ))}
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {estatisticas.map((stat, index) => (
          <div key={index} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                {stat.change && (
                  <div className="flex items-center gap-1 mt-2">
                    {stat.positive === true && <ArrowUpRight className="w-4 h-4 text-green-400" />}
                    {stat.positive === false && <ArrowDownRight className="w-4 h-4 text-red-400" />}
                    <span className={`text-xs ${stat.positive === true ? 'text-green-400' : stat.positive === false ? 'text-red-400' : 'text-slate-400'}`}>
                      {stat.change}
                    </span>
                  </div>
                )}
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[stat.color].split(' ').slice(0, 2).join(' ')} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faturamento Mensal */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Faturamento Mensal</h2>
            <span className="text-xs text-slate-400">Últimos 6 meses</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.faturamentoMensal || []}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="mes" 
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => [formatCurrency(value), 'Faturamento']}
                />
                <Area 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  fill="url(#colorFaturamento)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notas por Status */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Notas por Status</h2>
            <span className="text-xs text-slate-400">Este mês</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.notasPorStatus || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="status" 
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar 
                  dataKey="quantidade" 
                  fill="#06b6d4" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MEIs com maior faturamento */}
        <div className="card">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Top MEIs por Faturamento</h2>
              <Link to="/meis" className="text-sm text-cyan-400 hover:text-cyan-300">
                Ver todos
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-700/50">
            {stats?.topMeis?.slice(0, 5).map((mei, index) => (
              <div key={mei.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {mei.nomeFantasia || mei.razaoSocial}
                  </p>
                  <p className="text-xs text-slate-400">{mei.cnpj}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatCurrency(mei.faturamentoAnual)}</p>
                  <TetoStatusBadge percentual={mei.percentualTeto} />
                </div>
              </div>
            ))}
            {(!stats?.topMeis || stats.topMeis.length === 0) && (
              <div className="p-8 text-center text-slate-400">
                Nenhum MEI cadastrado
              </div>
            )}
          </div>
        </div>

        {/* Solicitações Recentes */}
        <div className="card">
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Solicitações Recentes</h2>
              <Link to="/solicitacoes" className="text-sm text-cyan-400 hover:text-cyan-300">
                Ver todas
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-700/50">
            {stats?.solicitacoesRecentes?.slice(0, 5).map((sol) => (
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
                    {sol.mei?.nomeFantasia || 'MEI'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{sol.descricao}</p>
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
            {(!stats?.solicitacoesRecentes || stats.solicitacoesRecentes.length === 0) && (
              <div className="p-8 text-center text-slate-400">
                Nenhuma solicitação
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DAS Próximos */}
      <div className="card">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Guias DAS a Vencer</h2>
            <Link to="/das" className="text-sm text-cyan-400 hover:text-cyan-300">
              Ver todas
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>MEI</th>
                <th>Competência</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.dasProximos?.map((das) => (
                <tr key={das.id}>
                  <td>
                    <p className="font-medium text-white">{das.mei?.nomeFantasia}</p>
                    <p className="text-xs text-slate-400">{das.mei?.cnpj}</p>
                  </td>
                  <td>{das.competencia}</td>
                  <td>{new Date(das.dataVencimento).toLocaleDateString('pt-BR')}</td>
                  <td className="font-medium">{formatCurrency(das.valor)}</td>
                  <td>
                    <span className={`badge ${das.pago ? 'badge-success' : 'badge-warning'}`}>
                      {das.pago ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats?.dasProximos || stats.dasProximos.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Nenhuma guia DAS próxima do vencimento
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

export default DashboardAdmin;
