import { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Eye, Download, XCircle,
  Calendar, Filter, Building2
} from 'lucide-react';
import { notaAPI, meiAPI, clienteAPI } from '../services/api';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

function Notas() {
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState([]);
  const [meis, setMeis] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroMei, setFiltroMei] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [notaView, setNotaView] = useState(null);
  const { isAdmin, meiAtual } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, [meiAtual]);

  const fetchData = async () => {
    try {
      const params = {};
      if (meiAtual?.id) params.meiId = meiAtual.id;
      
      const [notasRes, meisRes] = await Promise.all([
        notaAPI.listar(params),
        isAdmin() ? meiAPI.listar() : Promise.resolve({ data: [] })
      ]);
      
      setNotas(notasRes.data.notas || notasRes.data || []);
      setMeis(meisRes.data?.meis || meisRes.data || []);
    } catch (error) {
      toast.error('Erro ao carregar notas');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async (meiId) => {
    try {
      const { data } = await clienteAPI.listar({ meiId });
      setClientes(data.clientes || data || []);
    } catch (error) {
      setClientes([]);
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

  const notasFiltradas = notas.filter(nota => {
    const matchBusca = 
      nota.numero?.toString().includes(busca) ||
      nota.cliente?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      nota.descricao?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = !filtroStatus || nota.status === filtroStatus;
    const matchMei = !filtroMei || nota.meiId === filtroMei;
    return matchBusca && matchStatus && matchMei;
  });

  const handleEmitir = async (formData) => {
    try {
      await notaAPI.emitir(formData);
      toast.success('Nota fiscal emitida com sucesso');
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao emitir nota');
    }
  };

  const handleCancelar = async (notaId) => {
    if (!confirm('Tem certeza que deseja cancelar esta nota?')) return;
    try {
      await notaAPI.cancelar(notaId);
      toast.success('Nota cancelada com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao cancelar nota');
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notas Fiscais</h1>
          <p className="text-slate-400 mt-1">
            {isAdmin() ? 'Gerencie todas as notas fiscais' : 'Suas notas fiscais emitidas'}
          </p>
        </div>
        {isAdmin() && (
          <button 
            onClick={() => setModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Emitir Nota
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número, cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="input w-full sm:w-40"
        >
          <option value="">Todos status</option>
          <option value="EMITIDA">Emitida</option>
          <option value="CANCELADA">Cancelada</option>
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
                <th>Número</th>
                <th>Data</th>
                <th>Cliente</th>
                {isAdmin() && <th>MEI</th>}
                <th>Descrição</th>
                <th>Valor</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {notasFiltradas.map((nota) => (
                <tr key={nota.id}>
                  <td className="font-mono font-medium">{nota.numero}</td>
                  <td>{formatDate(nota.dataEmissao)}</td>
                  <td>
                    <p className="font-medium text-white">{nota.cliente?.nome || '-'}</p>
                    <p className="text-xs text-slate-400">{nota.cliente?.cpfCnpj}</p>
                  </td>
                  {isAdmin() && (
                    <td>
                      <p className="text-sm">{nota.mei?.nomeFantasia || nota.mei?.razaoSocial}</p>
                    </td>
                  )}
                  <td>
                    <p className="truncate max-w-[200px]" title={nota.descricao}>
                      {nota.descricao}
                    </p>
                  </td>
                  <td className="font-medium">{formatCurrency(nota.valor)}</td>
                  <td>
                    <span className={`badge ${nota.status === 'EMITIDA' ? 'badge-success' : 'badge-danger'}`}>
                      {nota.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setNotaView(nota)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {nota.status === 'EMITIDA' && isAdmin() && (
                        <button 
                          onClick={() => handleCancelar(nota.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {notasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={isAdmin() ? 8 : 7} className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-400">Nenhuma nota fiscal encontrada</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Emissão */}
      {modalOpen && (
        <NotaModal
          meis={meis}
          onClose={() => setModalOpen(false)}
          onSave={handleEmitir}
          onMeiChange={fetchClientes}
          clientes={clientes}
        />
      )}

      {/* Modal de Visualização */}
      {notaView && (
        <NotaViewModal
          nota={notaView}
          onClose={() => setNotaView(null)}
        />
      )}
    </div>
  );
}

// Modal de Emissão de Nota
function NotaModal({ meis, clientes, onClose, onSave, onMeiChange }) {
  const [formData, setFormData] = useState({
    meiId: '',
    clienteId: '',
    valor: '',
    descricao: '',
    dataEmissao: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);

  const handleMeiChange = (meiId) => {
    setFormData({ ...formData, meiId, clienteId: '' });
    onMeiChange(meiId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...formData,
      valor: parseFloat(formData.valor.replace(/\D/g, '')) / 100
    });
    setSaving(false);
  };

  const formatCurrency = (value) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseInt(numbers || '0', 10) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg animate-fadeIn my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Emitir Nota Fiscal</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">MEI *</label>
            <select
              value={formData.meiId}
              onChange={(e) => handleMeiChange(e.target.value)}
              className="input w-full"
              required
            >
              <option value="">Selecione o MEI</option>
              {meis.map(mei => (
                <option key={mei.id} value={mei.id}>
                  {mei.nomeFantasia || mei.razaoSocial}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Cliente/Tomador *</label>
            <select
              value={formData.clienteId}
              onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
              className="input w-full"
              required
              disabled={!formData.meiId}
            >
              <option value="">Selecione o cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome} - {cliente.cpfCnpj}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                <input
                  type="text"
                  value={formatCurrency(formData.valor)}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="input w-full pl-10"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Data Emissão *</label>
              <input
                type="date"
                value={formData.dataEmissao}
                onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })}
                className="input w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Descrição do Serviço *</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="input w-full h-24 resize-none"
              placeholder="Descreva o serviço prestado..."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Emitindo...
                </span>
              ) : 'Emitir Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de Visualização
function NotaViewModal({ nota, onClose }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-lg animate-fadeIn">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Nota Fiscal #{nota.numero}</h2>
            <span className={`badge mt-1 ${nota.status === 'EMITIDA' ? 'badge-success' : 'badge-danger'}`}>
              {nota.status}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">Data de Emissão</p>
              <p className="font-medium text-white">
                {new Date(nota.dataEmissao).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Valor</p>
              <p className="font-medium text-white text-lg">{formatCurrency(nota.valor)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-400">MEI Emissor</p>
            <p className="font-medium text-white">{nota.mei?.nomeFantasia || nota.mei?.razaoSocial}</p>
            <p className="text-sm text-slate-400">{nota.mei?.cnpj}</p>
          </div>

          <div>
            <p className="text-sm text-slate-400">Cliente/Tomador</p>
            <p className="font-medium text-white">{nota.cliente?.nome}</p>
            <p className="text-sm text-slate-400">{nota.cliente?.cpfCnpj}</p>
          </div>

          <div>
            <p className="text-sm text-slate-400">Descrição do Serviço</p>
            <p className="text-white bg-slate-700/50 rounded-lg p-3 mt-1">
              {nota.descricao}
            </p>
          </div>

          {nota.status === 'CANCELADA' && nota.motivoCancelamento && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">Motivo do Cancelamento</p>
              <p className="text-white">{nota.motivoCancelamento}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700">
          <button onClick={onClose} className="btn btn-secondary w-full">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Notas;
