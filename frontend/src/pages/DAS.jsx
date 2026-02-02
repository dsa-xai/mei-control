import { useState, useEffect } from 'react';
import { 
  Calendar, Search, CheckCircle2, Clock, AlertTriangle,
  Filter, Download, ExternalLink
} from 'lucide-react';
import { dasAPI, meiAPI } from '../services/api';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

function DAS() {
  const [loading, setLoading] = useState(true);
  const [guias, setGuias] = useState([]);
  const [meis, setMeis] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroMei, setFiltroMei] = useState('');
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());
  const { isAdmin, meiAtual } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, [meiAtual]);

  const fetchData = async () => {
    try {
      const params = {};
      if (meiAtual?.id) params.meiId = meiAtual.id;
      
      const [dasRes, meisRes] = await Promise.all([
        dasAPI.listar(params),
        isAdmin() ? meiAPI.listar() : Promise.resolve({ data: [] })
      ]);
      
      setGuias(dasRes.data.guias || dasRes.data || []);
      setMeis(meisRes.data?.meis || meisRes.data || []);
    } catch (error) {
      toast.error('Erro ao carregar guias DAS');
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const isVencida = (dataVencimento, pago) => {
    if (pago) return false;
    return new Date(dataVencimento) < new Date();
  };

  const isProximoVencer = (dataVencimento, pago) => {
    if (pago) return false;
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffDays = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const guiasFiltradas = guias.filter(das => {
    const matchStatus = !filtroStatus || 
      (filtroStatus === 'PAGO' && das.pago) || 
      (filtroStatus === 'PENDENTE' && !das.pago) ||
      (filtroStatus === 'VENCIDO' && isVencida(das.dataVencimento, das.pago));
    const matchMei = !filtroMei || das.meiId === filtroMei;
    const matchAno = !filtroAno || das.competencia?.startsWith(filtroAno) || das.competencia?.endsWith(filtroAno);
    return matchStatus && matchMei && matchAno;
  });

  const handleMarcarPago = async (dasId) => {
    try {
      await dasAPI.registrarPagamento(dasId, { dataPagamento: new Date().toISOString() });
      toast.success('Pagamento registrado com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao registrar pagamento');
    }
  };

  // Estatísticas
  const totalPendente = guiasFiltradas.filter(d => !d.pago).reduce((acc, d) => acc + (d.valor || 0), 0);
  const totalPago = guiasFiltradas.filter(d => d.pago).reduce((acc, d) => acc + (d.valor || 0), 0);
  const qtdVencidas = guiasFiltradas.filter(d => isVencida(d.dataVencimento, d.pago)).length;

  const anos = [...new Set(guias.map(d => {
    const match = d.competencia?.match(/\d{4}/);
    return match ? match[0] : new Date().getFullYear().toString();
  }))].sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Guias DAS</h1>
        <p className="text-slate-400 mt-1">
          {isAdmin() ? 'Gerencie os pagamentos de DAS' : 'Acompanhe suas guias DAS'}
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Valor Pendente</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(totalPendente)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Valor Pago</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(totalPago)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Guias Vencidas</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{qtdVencidas}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="input w-full sm:w-40"
        >
          <option value="">Todos status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="PAGO">Pago</option>
          <option value="VENCIDO">Vencido</option>
        </select>

        <select
          value={filtroAno}
          onChange={(e) => setFiltroAno(e.target.value)}
          className="input w-full sm:w-32"
        >
          <option value="">Todos anos</option>
          {anos.map(ano => (
            <option key={ano} value={ano}>{ano}</option>
          ))}
        </select>

        {isAdmin() && meis.length > 0 && (
          <select
            value={filtroMei}
            onChange={(e) => setFiltroMei(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="">Todos MEIs</option>
            {meis.map(mei => (
              <option key={mei.id} value={mei.id}>
                {mei.nomeFantasia || mei.razaoSocial}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Lista */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {isAdmin() && <th>MEI</th>}
                <th>Competência</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data Pagamento</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {guiasFiltradas.map((das) => {
                const vencida = isVencida(das.dataVencimento, das.pago);
                const proximoVencer = isProximoVencer(das.dataVencimento, das.pago);
                
                return (
                  <tr key={das.id} className={vencida ? 'bg-red-500/5' : proximoVencer ? 'bg-amber-500/5' : ''}>
                    {isAdmin() && (
                      <td>
                        <p className="font-medium text-white">{das.mei?.nomeFantasia || das.mei?.razaoSocial}</p>
                        <p className="text-xs text-slate-400">{das.mei?.cnpj}</p>
                      </td>
                    )}
                    <td className="font-medium">{das.competencia}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {formatDate(das.dataVencimento)}
                        {vencida && (
                          <AlertTriangle className="w-4 h-4 text-red-400" title="Vencida" />
                        )}
                        {proximoVencer && (
                          <Clock className="w-4 h-4 text-amber-400" title="Próximo do vencimento" />
                        )}
                      </div>
                    </td>
                    <td className="font-medium">{formatCurrency(das.valor)}</td>
                    <td>
                      <span className={`badge ${
                        das.pago ? 'badge-success' : 
                        vencida ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {das.pago ? 'Pago' : vencida ? 'Vencido' : 'Pendente'}
                      </span>
                    </td>
                    <td>
                      {das.dataPagamento ? formatDate(das.dataPagamento) : '-'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {!das.pago && isAdmin() && (
                          <button 
                            onClick={() => handleMarcarPago(das.id)}
                            className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Marcar como pago"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {das.linkBoleto && (
                          <a 
                            href={das.linkBoleto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Abrir boleto"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {guiasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={isAdmin() ? 7 : 6} className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-400">Nenhuma guia DAS encontrada</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Link para Portal do Simples */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-white">Portal do Simples Nacional</p>
            <p className="text-sm text-slate-400">Acesse o portal oficial para emitir guias DAS</p>
          </div>
          <a 
            href="https://www8.receita.fazenda.gov.br/SimplesNacional/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <ExternalLink className="w-4 h-4" />
            Acessar Portal
          </a>
        </div>
      </div>
    </div>
  );
}

export default DAS;
