import { useState, useEffect } from 'react'
import { useAuthStore } from '../context/authStore'
import { notaFiscalService, clienteService } from '../services/api'
import { Plus, Search, FileText, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotasFiscais() {
  const { meiAtivo } = useAuthStore()
  const [notas, setNotas] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({ clienteId: '', valor: '', descricao: '', dataEmissao: new Date().toISOString().split('T')[0] })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { if (meiAtivo?.id) { carregarNotas(); carregarClientes() }}, [meiAtivo])

  const carregarNotas = async () => {
    try { setLoading(true); const r = await notaFiscalService.listar(meiAtivo.id); setNotas(r.data.data.notas || []) }
    catch (e) { toast.error('Erro ao carregar notas') } finally { setLoading(false) }
  }

  const carregarClientes = async () => {
    try { const r = await clienteService.listar(meiAtivo.id); setClientes(r.data.data.clientes || []) } catch (e) { console.error(e) }
  }

  const emitirNota = async (e) => {
    e.preventDefault()
    if (!form.clienteId) return toast.error('Selecione um cliente')
    setSalvando(true)
    try {
      await notaFiscalService.emitir({ meiId: meiAtivo.id, ...form, valor: parseFloat(form.valor) })
      toast.success('Nota emitida!')
      setModalAberto(false)
      setForm({ clienteId: '', valor: '', descricao: '', dataEmissao: new Date().toISOString().split('T')[0] })
      carregarNotas()
    } catch (e) { toast.error(e.response?.data?.error || 'Erro ao emitir nota') }
    finally { setSalvando(false) }
  }

  const notasFiltradas = notas.filter(n => n.cliente?.nome?.toLowerCase().includes(busca.toLowerCase()) || n.descricao?.toLowerCase().includes(busca.toLowerCase()) || n.numero?.includes(busca))

  if (!meiAtivo) return <div className="text-center py-10 text-slate-400">Nenhum MEI selecionado</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Notas Fiscais</h1>
        <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg"><Plus className="w-5 h-5" />Nova Nota</button>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" /><input type="text" placeholder="Buscar por cliente, descrição ou número..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white" /></div>
      {loading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div></div> : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead><tr><th>Número</th><th>Cliente</th><th>Descrição</th><th>Valor</th><th>Data</th><th>Status</th></tr></thead>
            <tbody>
              {notasFiltradas.map(nota => (
                <tr key={nota.id}>
                  <td className="font-mono text-cyan-400">{nota.numero}</td>
                  <td>{nota.cliente?.nome}</td>
                  <td className="max-w-xs truncate">{nota.descricao}</td>
                  <td className="font-semibold">R$ {parseFloat(nota.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                  <td>{new Date(nota.dataEmissao).toLocaleDateString('pt-BR')}</td>
                  <td><span className={`badge ${nota.status === 'EMITIDA' ? 'badge-success' : 'badge-danger'}`}>{nota.status}</span></td>
                </tr>
              ))}
              {notasFiltradas.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-500">Nenhuma nota encontrada</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-semibold text-white">Emitir Nota Fiscal</h2><button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button></div>
            <form onSubmit={emitirNota} className="space-y-4">
              <div><label className="block text-sm text-slate-400 mb-2">Cliente</label><select value={form.clienteId} onChange={(e) => setForm({...form, clienteId: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" required><option value="">Selecione...</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
              <div><label className="block text-sm text-slate-400 mb-2">Valor (R$)</label><input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({...form, valor: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" required /></div>
              <div><label className="block text-sm text-slate-400 mb-2">Descrição do Serviço</label><textarea value={form.descricao} onChange={(e) => setForm({...form, descricao: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" rows={3} required /></div>
              <div><label className="block text-sm text-slate-400 mb-2">Data de Emissão</label><input type="date" value={form.dataEmissao} onChange={(e) => setForm({...form, dataEmissao: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" required /></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setModalAberto(false)} className="flex-1 py-3 bg-slate-700 text-white rounded-lg">Cancelar</button><button type="submit" disabled={salvando} className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">{salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}Emitir</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
