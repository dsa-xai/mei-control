import { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, Edit2, Trash2, 
  Eye, AlertTriangle, CheckCircle2, X
} from 'lucide-react';
import { meiAPI } from '../services/api';
import { TetoStatusBadge } from '../components/AlertaTeto';
import toast from 'react-hot-toast';

function Meis() {
  const [loading, setLoading] = useState(true);
  const [meis, setMeis] = useState([]);
  const [busca, setBusca] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [meiEdit, setMeiEdit] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchMeis();
  }, []);

  const fetchMeis = async () => {
    try {
      const { data } = await meiAPI.listar();
      setMeis(data.meis || data);
    } catch (error) {
      toast.error('Erro ao carregar MEIs');
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

  const formatCNPJ = (value) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const meisFiltrados = meis.filter(mei => 
    mei.razaoSocial?.toLowerCase().includes(busca.toLowerCase()) ||
    mei.nomeFantasia?.toLowerCase().includes(busca.toLowerCase()) ||
    mei.cnpj?.includes(busca.replace(/\D/g, ''))
  );

  const handleSave = async (formData) => {
    try {
      if (meiEdit?.id) {
        await meiAPI.atualizar(meiEdit.id, formData);
        toast.success('MEI atualizado com sucesso');
      } else {
        await meiAPI.criar(formData);
        toast.success('MEI criado com sucesso');
      }
      setModalOpen(false);
      setMeiEdit(null);
      fetchMeis();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao salvar MEI');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await meiAPI.deletar(confirmDelete.id);
      toast.success('MEI removido com sucesso');
      setConfirmDelete(null);
      fetchMeis();
    } catch (error) {
      toast.error('Erro ao remover MEI');
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
          <h1 className="text-2xl font-bold text-white">MEIs</h1>
          <p className="text-slate-400 mt-1">Gerencie os Microempreendedores Individuais</p>
        </div>
        <button 
          onClick={() => { setMeiEdit(null); setModalOpen(true); }}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Novo MEI
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome, CNPJ..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="input pl-10 w-full sm:w-80"
        />
      </div>

      {/* Lista */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>MEI</th>
                <th>CNPJ</th>
                <th>Faturamento Anual</th>
                <th>Status Teto</th>
                <th>Situação</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {meisFiltrados.map((mei) => {
                const percentual = ((mei.faturamentoAnual || 0) / 81000) * 100;
                return (
                  <tr key={mei.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{mei.nomeFantasia || mei.razaoSocial}</p>
                          <p className="text-xs text-slate-400">{mei.razaoSocial}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{formatCNPJ(mei.cnpj)}</td>
                    <td>
                      <p className="font-medium">{formatCurrency(mei.faturamentoAnual)}</p>
                      <p className="text-xs text-slate-400">{percentual.toFixed(1)}% do teto</p>
                    </td>
                    <td>
                      <TetoStatusBadge percentual={percentual} />
                    </td>
                    <td>
                      <span className={`badge ${mei.ativo ? 'badge-success' : 'badge-danger'}`}>
                        {mei.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setMeiEdit(mei); setModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(mei)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {meisFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-400">Nenhum MEI encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição */}
      {modalOpen && (
        <MeiModal
          mei={meiEdit}
          onClose={() => { setModalOpen(false); setMeiEdit(null); }}
          onSave={handleSave}
        />
      )}

      {/* Modal de Confirmação de Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md p-6 animate-fadeIn">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Remover MEI</h3>
                <p className="text-sm text-slate-400">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-slate-300 mb-6">
              Tem certeza que deseja remover o MEI <strong>{confirmDelete.nomeFantasia || confirmDelete.razaoSocial}</strong>?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className="btn btn-danger flex-1"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente Modal de MEI
function MeiModal({ mei, onClose, onSave }) {
  const [formData, setFormData] = useState({
    cnpj: mei?.cnpj || '',
    razaoSocial: mei?.razaoSocial || '',
    nomeFantasia: mei?.nomeFantasia || '',
    email: mei?.email || '',
    telefone: mei?.telefone || '',
    endereco: mei?.endereco || '',
    cidade: mei?.cidade || '',
    estado: mei?.estado || '',
    cep: mei?.cep || '',
    ativo: mei?.ativo ?? true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const formatCNPJ = (value) => {
    const numbers = value.replace(/\D/g, '').slice(0, 14);
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatCEP = (value) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    return numbers.replace(/(\d{5})(\d)/, '$1-$2');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl w-full max-w-2xl animate-fadeIn my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {mei ? 'Editar MEI' : 'Novo MEI'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">CNPJ *</label>
              <input
                type="text"
                value={formatCNPJ(formData.cnpj)}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value.replace(/\D/g, '') })}
                className="input w-full"
                placeholder="00.000.000/0000-00"
                required
                disabled={!!mei}
              />
            </div>
            <div>
              <label className="label">Razão Social *</label>
              <input
                type="text"
                value={formData.razaoSocial}
                onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="label">Nome Fantasia</label>
              <input
                type="text"
                value={formData.nomeFantasia}
                onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input
                type="text"
                value={formatPhone(formData.telefone)}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value.replace(/\D/g, '') })}
                className="input w-full"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="label">CEP</label>
              <input
                type="text"
                value={formatCEP(formData.cep)}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value.replace(/\D/g, '') })}
                className="input w-full"
                placeholder="00000-000"
              />
            </div>
          </div>

          <div>
            <label className="label">Endereço</label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              className="input w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Cidade</label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="input w-full"
              >
                <option value="">Selecione</option>
                {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="ativo" className="text-sm text-slate-300">MEI ativo</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Salvando...
                </span>
              ) : mei ? 'Atualizar' : 'Criar MEI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Meis;
