import { useState, useEffect } from 'react'
import { useAuthStore } from '../context/authStore'
import { clienteService } from '../services/api'
import { Plus, Search, User, Building2, X, Loader2, Trash2, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Clientes() {
  const { meiAtivo } = useAuthStore()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ tipo: 'PJ', nome: '', cpfCnpj: '', email: '', telefone: '' })
  const [salvando, setSalvando] = useState(false)
  const [editando, setEditando] = useState(null)

  useEffect(() => { if (meiAtivo?.id) carregarClientes() }, [meiAtivo])

  const carregarClientes = async () => {
    try { setLoading(true); const r = await clienteService.listar(meiAtivo.id); setClientes(r.data.data.clientes || []) }
    catch (e) { toast.error('Erro ao carregar') } finally { setLoading(false) }
  }

  const formatarDoc = (v, tipo) => {
    const nums = v.replace(/\D/g, '')
    if (tipo === 'PF') return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const salvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    try {
      if (editando) { await clienteService.atualizar(editando, form); toast.success('Atualizado!') }
      else { await clienteService.criar({ meiId: meiAtivo.id, ...form }); toast.success('Cadastrado!') }
      fecharModal(); carregarClientes()
    } catch (e) { toast.error(e.response?.data?.error || 'Erro') }
    finally { setSalvando(false) }
  }

  const excluir = async (id) => {
    if (!confirm('Deseja excluir este cliente?')) return
    try { await clienteService.excluir(id); toast.success('Excluído!'); carregarClientes() }
    catch (e) { toast.error('Erro ao excluir') }
  }

  const editar = (cliente) => { setEditando(cliente.id); setForm({ tipo: cliente.tipo, nome: cliente.nome, cpfCnpj: formatarDoc(cliente.cpfCnpj, cliente.tipo), email: cliente.email || '', telefone: cliente.telefone || '' }); setModalAberto(true) }
  const fecharModal = () => { setModalAberto(false); setEditando(null); setForm({ tipo: 'PJ', nome: '', cpfCnpj: '', email: '', telefone: '' }) }

  const clientesFiltrados = clientes.filter(c => c.nome?.toLowerCase().includes(busca.toLowerCase()) || c.cpfCnpj?.includes(busca.replace(/\D/g, '')))

  if (!meiAtivo) return <div className="text-center py-10 text-slate-400">Nenhum MEI selecionado</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg"><Plus className="w-5 h-5" />Novo Cliente</button>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" /><input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white" /></div>
      {loading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientesFiltrados.map(c => (
            <div key={c.id} className="card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${c.tipo === 'PJ' ? 'bg-violet-500/20' : 'bg-cyan-500/20'}`}>{c.tipo === 'PJ' ? <Building2 className="w-5 h-5 text-violet-400" /> : <User className="w-5 h-5 text-cyan-400" />}</div>
                  <div><p className="font-semibold text-white">{c.nome}</p><p className="text-sm text-slate-400">{formatarDoc(c.cpfCnpj, c.tipo)}</p></div>
                </div>
                <span className={`badge ${c.tipo === 'PJ' ? 'badge-info' : 'badge-success'}`}>{c.tipo}</span>
              </div>
              {c.email && <p className="text-sm text-slate-400 mb-1">{c.email}</p>}
              {c.telefone && <p className="text-sm text-slate-400 mb-3">{c.telefone}</p>}
              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button onClick={() => editar(c)} className="flex-1 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 rounded-lg flex items-center justify-center gap-1"><Edit className="w-4 h-4" />Editar</button>
                <button onClick={() => excluir(c.id)} className="flex-1 py-2 text-sm text-rose-400 hover:text-rose-300 bg-slate-800 rounded-lg flex items-center justify-center gap-1"><Trash2 className="w-4 h-4" />Excluir</button>
              </div>
            </div>
          ))}
          {clientesFiltrados.length === 0 && <div className="col-span-full text-center py-10 text-slate-500">Nenhum cliente encontrado</div>}
        </div>
      )}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-semibold text-white">{editando ? 'Editar' : 'Novo'} Cliente</h2><button onClick={fecharModal} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button></div>
            <form onSubmit={salvar} className="space-y-4">
              <div className="flex gap-4">{['PJ', 'PF'].map(t => <label key={t} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="tipo" value={t} checked={form.tipo === t} onChange={(e) => setForm({...form, tipo: e.target.value, cpfCnpj: ''})} className="text-cyan-500" /><span className="text-slate-300">{t === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</span></label>)}</div>
              <input type="text" placeholder={form.tipo === 'PJ' ? 'Razão Social' : 'Nome Completo'} value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" required />
              <input type="text" placeholder={form.tipo === 'PJ' ? 'CNPJ' : 'CPF'} value={form.cpfCnpj} onChange={(e) => setForm({...form, cpfCnpj: formatarDoc(e.target.value, form.tipo)})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" maxLength={form.tipo === 'PJ' ? 18 : 14} required />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" />
              <input type="tel" placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({...form, telefone: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" />
              <div className="flex gap-3 pt-4"><button type="button" onClick={fecharModal} className="flex-1 py-3 bg-slate-700 text-white rounded-lg">Cancelar</button><button type="submit" disabled={salvando} className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">{salvando && <Loader2 className="w-5 h-5 animate-spin" />}Salvar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
