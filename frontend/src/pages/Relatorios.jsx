import { useState, useEffect } from 'react'
import { useAuthStore } from '../context/authStore'
import { relatorioService } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FileText, Users, DollarSign, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Relatorios() {
  const { meiAtivo } = useAuthStore()
  const [tipo, setTipo] = useState('faturamento')
  const [ano, setAno] = useState(new Date().getFullYear())
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (meiAtivo?.id) carregar() }, [meiAtivo, tipo, ano])

  const carregar = async () => {
    try {
      setLoading(true)
      const r = tipo === 'faturamento' ? await relatorioService.faturamento(meiAtivo.id, ano) :
                tipo === 'clientes' ? await relatorioService.clientes(meiAtivo.id, ano) :
                await relatorioService.das(meiAtivo.id, ano)
      setDados(r.data.data)
    } catch (e) { toast.error('Erro ao carregar') }
    finally { setLoading(false) }
  }

  if (!meiAtivo) return <div className="text-center py-10 text-slate-400">Nenhum MEI selecionado</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
        <div className="flex gap-3">
          <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
            {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg"><Download className="w-4 h-4" />Exportar</button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {[{id: 'faturamento', icon: DollarSign, label: 'Faturamento'}, {id: 'clientes', icon: Users, label: 'Clientes'}, {id: 'das', icon: FileText, label: 'DAS'}].map(t => (
          <button key={t.id} onClick={() => setTipo(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${tipo === t.id ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div></div> : (
        <div className="card">
          {tipo === 'faturamento' && dados && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-800 rounded-lg"><p className="text-sm text-slate-400">Total Emitido</p><p className="text-xl font-bold text-cyan-400">R$ {dados.resumo?.totalEmitidas?.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
                <div className="p-4 bg-slate-800 rounded-lg"><p className="text-sm text-slate-400">Notas Emitidas</p><p className="text-xl font-bold text-white">{dados.resumo?.quantidadeEmitidas}</p></div>
                <div className="p-4 bg-slate-800 rounded-lg"><p className="text-sm text-slate-400">Ticket Médio</p><p className="text-xl font-bold text-white">R$ {dados.resumo?.ticketMedio?.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
              </div>
              <h3 className="font-semibold text-white mb-4">Faturamento por Cliente</h3>
              <div className="space-y-3">{dados.porCliente?.map((c, i) => (
                <div key={i} className="flex items-center gap-3"><div className="flex-1"><p className="text-sm text-white">{c.cliente?.nome}</p><div className="w-full h-2 bg-slate-800 rounded-full mt-1"><div className="h-full bg-cyan-500 rounded-full" style={{width: `${(c.total / (dados.porCliente[0]?.total || 1)) * 100}%`}} /></div></div><p className="text-sm text-slate-300">R$ {c.total?.toLocaleString('pt-BR')}</p></div>
              ))}</div>
            </>
          )}
          {tipo === 'clientes' && dados && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-800 rounded-lg"><p className="text-sm text-slate-400">Total de Clientes</p><p className="text-xl font-bold text-white">{dados.totalClientes}</p></div>
                <div className="p-4 bg-slate-800 rounded-lg"><p className="text-sm text-slate-400">Faturamento Total</p><p className="text-xl font-bold text-cyan-400">R$ {dados.totalFaturado?.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
              </div>
              <div className="space-y-3">{dados.clientes?.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"><div><p className="text-white">{c.nome}</p><p className="text-sm text-slate-400">{c.quantidadeNotas} notas</p></div><div className="text-right"><p className="text-cyan-400">R$ {c.totalFaturado?.toLocaleString('pt-BR')}</p><p className="text-sm text-slate-500">{c.participacao?.toFixed(1)}%</p></div></div>
              ))}</div>
            </>
          )}
          {tipo === 'das' && dados && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-800 rounded-lg"><p className="text-sm text-slate-400">Total Pago</p><p className="text-xl font-bold text-emerald-400">R$ {dados.resumo?.totalPago?.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
                <div className="p-4 bg-slate-800 rounded-lg"><p className="text-sm text-slate-400">Pendente</p><p className="text-xl font-bold text-amber-400">R$ {dados.resumo?.totalPendente?.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
                <div className="p-4 bg-slate-800 rounded-lg"><p className="text-sm text-slate-400">Vencido</p><p className="text-xl font-bold text-rose-400">R$ {dados.resumo?.totalVencido?.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
