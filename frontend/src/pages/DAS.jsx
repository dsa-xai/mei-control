import { useState, useEffect } from 'react'
import { useAuthStore } from '../context/authStore'
import { dasService } from '../services/api'
import { Receipt, Check, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function DAS() {
  const { meiAtivo } = useAuthStore()
  const [guias, setGuias] = useState([])
  const [loading, setLoading] = useState(true)
  const [ano, setAno] = useState(new Date().getFullYear())

  useEffect(() => { if (meiAtivo?.id) carregar() }, [meiAtivo, ano])

  const carregar = async () => {
    try { setLoading(true); const r = await dasService.listar(meiAtivo.id, ano); setGuias(r.data.data || []) }
    catch (e) { toast.error('Erro ao carregar') } finally { setLoading(false) }
  }

  const gerarGuias = async () => {
    try { await dasService.gerar(meiAtivo.id, ano); toast.success('Guias geradas!'); carregar() }
    catch (e) { toast.error('Erro ao gerar') }
  }

  const registrarPagamento = async (id) => {
    try { await dasService.registrarPagamento(id, new Date().toISOString()); toast.success('Pagamento registrado!'); carregar() }
    catch (e) { toast.error('Erro') }
  }

  const getStatus = (status) => {
    if (status === 'PAGO') return { icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Pago' }
    if (status === 'VENCIDO') return { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/20', label: 'Vencido' }
    return { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Pendente' }
  }

  if (!meiAtivo) return <div className="text-center py-10 text-slate-400">Nenhum MEI selecionado</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">DAS Mensal</h1>
        <div className="flex gap-3">
          <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
            {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={gerarGuias} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg"><RefreshCw className="w-4 h-4" />Gerar Guias</button>
        </div>
      </div>
      <div className="card p-4 bg-slate-800/50">
        <p className="text-sm text-slate-400">O DAS (Documento de Arrecadação do Simples Nacional) é a guia mensal que o MEI deve pagar para manter suas obrigações em dia. O vencimento é sempre no dia 20 de cada mês.</p>
      </div>
      {loading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guias.map(guia => {
            const status = getStatus(guia.status)
            const mes = new Date(guia.competencia).getMonth()
            return (
              <div key={guia.id} className="card card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${status.bg}`}><Receipt className={`w-5 h-5 ${status.color}`} /></div>
                    <div><p className="font-semibold text-white">{MESES[mes]}</p><p className="text-sm text-slate-400">{ano}</p></div>
                  </div>
                  <span className={`badge ${status.bg} ${status.color}`}>{status.label}</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Valor:</span><span className="text-white font-semibold">R$ {parseFloat(guia.valor).toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">Vencimento:</span><span className="text-white">{new Date(guia.vencimento).toLocaleDateString('pt-BR')}</span></div>
                  {guia.dataPagamento && <div className="flex justify-between text-sm"><span className="text-slate-400">Pago em:</span><span className="text-emerald-400">{new Date(guia.dataPagamento).toLocaleDateString('pt-BR')}</span></div>}
                </div>
                {guia.status !== 'PAGO' && <button onClick={() => registrarPagamento(guia.id)} className="w-full py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors">Registrar Pagamento</button>}
              </div>
            )
          })}
          {guias.length === 0 && <div className="col-span-full text-center py-10 text-slate-500">Nenhuma guia. Clique em "Gerar Guias" para criar.</div>}
        </div>
      )}
    </div>
  )
}
