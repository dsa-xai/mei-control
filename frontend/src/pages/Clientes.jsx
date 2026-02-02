import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, User, Building2, Phone, Mail, MapPin, X, Save, Loader2 } from 'lucide-react';
import { clienteAPI } from '../services/api';
import { useAuthStore } from '../context/authStore';
import toast from 'react-hot-toast';

export default function Clientes() {
  const { meiAtual } = useAuthStore();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    tipo: 'PF',
    nome: '',
    cpfCnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: ''
  });

  useEffect(() => {
    if (meiAtual?.id) {
      carregarClientes();
    }
  }, [meiAtual]);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const response = await clienteAPI.listar({ meiId: meiAtual.id });
      setClientes(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const formatarDocumento = (valor, tipo) => {
    const numeros = valor.replace(/\D/g, '');
    
    if (tipo === 'PF') {
      // CPF: 000.000.000-00
      return numeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
    } else {
      // CNPJ: 00.000.000/0001-00
      return numeros
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
        .slice(0, 18);
    }
  };

  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 14);
    } else {
      return numeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
    }
  };

  const formatarCep = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cpfCnpj') {
      setFormData(prev => ({ ...prev, [name]: formatarDocumento(value, prev.tipo) }));
    } else if (name === 'telefone') {
      setFormData(prev => ({ ...prev, [name]: formatarTelefone(value) }));
    } else if (name === 'cep') {
      setFormData(prev => ({ ...prev, [name]: formatarCep(value) }));
    } else if (name === 'tipo') {
      setFormData(prev => ({ ...prev, [name]: value, cpfCnpj: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const abrirModal = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        tipo: cliente.tipo || 'PF',
        nome: cliente.nome || '',
        cpfCnpj: cliente.cpfCnpj || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        endereco: cliente.endereco || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        cep: cliente.cep || ''
      });
    } else {
      setEditingCliente(null);
      setFormData({
        tipo: 'PF',
        nome: '',
        cpfCnpj: '',
        email: '',
        telefone: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: ''
      });
    }
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingCliente(null);
  };

  const salvarCliente = async (e) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    
    if (!formData.cpfCnpj.trim()) {
      toast.error('CPF/CNPJ é obrigatório');
      return;
    }

    try {
      setSaving(true);
      
      const dadosEnvio = {
        ...formData,
        meiId: meiAtual.id
      };

      if (editingCliente) {
        await clienteAPI.atualizar(editingCliente.id, dadosEnvio);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await clienteAPI.criar(dadosEnvio);
        toast.success('Cliente cadastrado com sucesso!');
      }

      fecharModal();
      carregarClientes();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar cliente');
    } finally {
      setSaving(false);
    }
  };

  const excluirCliente = async (cliente) => {
    if (!confirm(`Deseja realmente excluir o cliente "${cliente.nome}"?`)) {
      return;
    }

    try {
      await clienteAPI.deletar(cliente.id);
      toast.success('Cliente excluído com sucesso!');
      carregarClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error(error.response?.data?.error || 'Erro ao excluir cliente');
    }
  };

  const clientesFiltrados = clientes.filter(cliente => {
    const termo = searchTerm.toLowerCase();
    return (
      cliente.nome?.toLowerCase().includes(termo) ||
      cliente.cpfCnpj?.toLowerCase().includes(termo) ||
      cliente.email?.toLowerCase().includes(termo) ||
      cliente.cidade?.toLowerCase().includes(termo)
    );
  });

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO'
  ];

  if (!meiAtual) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Selecione um MEI para gerenciar os clientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes / Tomadores</h1>
          <p className="text-gray-600">Gerencie os clientes do MEI {meiAtual.nomeFantasia}</p>
        </div>
        <button onClick={() => abrirModal()} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, documento, email ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <User className="w-12 h-12 mb-2 opacity-50" />
            <p>{searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</p>
            {!searchTerm && (
              <button onClick={() => abrirModal()} className="mt-4 btn btn-primary">
                <Plus className="w-4 h-4" />
                Cadastrar Primeiro Cliente
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Contato</th>
                  <th>Localização</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          cliente.tipo === 'PJ' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {cliente.tipo === 'PJ' ? (
                            <Building2 className="w-5 h-5" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{cliente.nome}</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            cliente.tipo === 'PJ' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {cliente.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-sm text-gray-600">
                        {cliente.cpfCnpj}
                      </span>
                    </td>
                    <td>
                      <div className="space-y-1">
                        {cliente.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5" />
                            {cliente.email}
                          </div>
                        )}
                        {cliente.telefone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="w-3.5 h-3.5" />
                            {cliente.telefone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {(cliente.cidade || cliente.estado) && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3.5 h-3.5" />
                          {[cliente.cidade, cliente.estado].filter(Boolean).join(' - ')}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirModal(cliente)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => excluirCliente(cliente)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumo */}
      {clientes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{clientes.length}</p>
            <p className="text-sm text-gray-600">Total de Clientes</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {clientes.filter(c => c.tipo === 'PF').length}
            </p>
            <p className="text-sm text-gray-600">Pessoa Física</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {clientes.filter(c => c.tipo === 'PJ').length}
            </p>
            <p className="text-sm text-gray-600">Pessoa Jurídica</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={fecharModal} />
            
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-auto z-10 animate-slideIn">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
                <button onClick={fecharModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={salvarCliente} className="p-6 space-y-4">
                {/* Tipo */}
                <div>
                  <label className="label">Tipo de Cliente</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        value="PF"
                        checked={formData.tipo === 'PF'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary-600"
                      />
                      <User className="w-4 h-4 text-green-600" />
                      <span>Pessoa Física</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        value="PJ"
                        checked={formData.tipo === 'PJ'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary-600"
                      />
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>Pessoa Jurídica</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="md:col-span-2">
                    <label className="label">
                      {formData.tipo === 'PJ' ? 'Razão Social' : 'Nome Completo'} *
                    </label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder={formData.tipo === 'PJ' ? 'Razão social da empresa' : 'Nome completo'}
                      required
                    />
                  </div>

                  {/* Documento */}
                  <div>
                    <label className="label">{formData.tipo === 'PJ' ? 'CNPJ' : 'CPF'} *</label>
                    <input
                      type="text"
                      name="cpfCnpj"
                      value={formData.cpfCnpj}
                      onChange={handleInputChange}
                      className="input w-full font-mono"
                      placeholder={formData.tipo === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                      required
                    />
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="label">Telefone</label>
                    <input
                      type="text"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2">
                    <label className="label">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  {/* Endereço */}
                  <div className="md:col-span-2">
                    <label className="label">Endereço</label>
                    <input
                      type="text"
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  {/* Cidade */}
                  <div>
                    <label className="label">Cidade</label>
                    <input
                      type="text"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="Cidade"
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="label">Estado</label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      className="input w-full"
                    >
                      <option value="">Selecione...</option>
                      {estados.map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>

                  {/* CEP */}
                  <div>
                    <label className="label">CEP</label>
                    <input
                      type="text"
                      name="cep"
                      value={formData.cep}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={fecharModal} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingCliente ? 'Atualizar' : 'Cadastrar'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
