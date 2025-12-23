import { useState, useEffect } from 'react'
import { useAuthStore } from '../context/authStore'
import { dashboardService } from '../services/api'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, FileText, Users, AlertTriangle, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Dashboard() {
  const { meiAtivo } = useAuthStore()
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const ano = new Date().getFullYear()

  useEffect(() => { if (meiAtivo?.id) carregarDados() }, [meiAtivo])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const response = await dashboardService.obter(meiAtivo.id, ano)
      setDados(response.data.data)
    } catch (error) { toast.error('Erro ao carregar dados') }
    finally { setLoading(false) }
  }

  if (!meiAtivo) return <div className="flex flex-col items-center justify-center min-h-[60vh]"><AlertTriangle className="w-16 h-16 text-amber-500 mb-4" /><h2 className="text-xl font-semibold text-white">Nenhum MEI cadastrado</h2><p className="text-slate-400">Vá em Configurações para cadastrar</p></div>
  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div></div>

  const { resumo, teto, graficos, topClientes, ultimasNotas } = dados || {}
  const dadosGrafico = graficos?.faturamentoPorMes?.map((item, i) => ({ mes: MESES[i], faturamento: item.valor, limite: 81000/12 })) || []
  const dadosAcumulado = graficos?.faturamentoAcumulado?.map((item, i) => ({ mes: MESES[i], acumulado: item.acumulado, teto: item.tetoAcumulado })) || []
  const getCorTeto = () => teto?.percentual >= 100 ? 'text-rose-500' : teto?.percentual >= 80 ? 'text-amber-400' : 'text-emerald-400'
  const getCorBarra = () => teto?.percentual >= 100 ? 'bg-rose-500' : teto?.percentual >= 80 ? 'bg-amber-400' : 'bg-cyan-500'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Dashboard</h1><p className="text-slate-400">{meiAtivo.nomeFantasia || meiAtivo.razaoSocial}</p></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><div className="flex items-center gap-3"><div className="p-3 bg-cyan-500/20 rounded-xl"><DollarSign className="w-6 h-6 text-cyan-400" /></div><div><p className="text-sm text-slate-400">Faturamento Anual</p><p className="text-xl font-bold text-white">R$ {resumo?.faturamentoAnual?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div></div></div>
        <div className="card"><div className="flex items-center gap-3"><div className="p-3 bg-violet-500/20 rounded-xl"><FileText className="w-6 h-6 text-violet-400" /></div><div><p className="text-sm text-slate-400">Notas Emitidas</p><p className="text-xl font-bold text-white">{resumo?.notasEmitidas || 0}</p></div></div></div>
        <div className="card"><div className="flex items-center gap-3"><div className="p-3 bg-emerald-500/20 rounded-xl"><Users className="w-6 h-6 text-emerald-400" /></div><div><p className="text-sm text-slate-400">Clientes</p><p className="text-xl font-bold text-white">{resumo?.totalClientes || 0}</p></div></div></div>
        <div className="card"><div className="flex items-center gap-3"><div className="p-3 bg-amber-500/20 rounded-xl"><TrendingUp className="w-6 h-6 text-amber-400" /></div><div><p className="text-sm text-slate-400">Ticket Médio</p><p className="text-xl font-bold text-white">R$ {resumo?.ticketMedio?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div></div></div>
      </div>
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div><h3 className="font-semibold text-white">Teto Anual MEI</h3><p className="text-sm text-slate-400">Limite: R$ {teto?.valor?.toLocaleString('pt-BR')}</p></div>
          <div className="text-right"><p className={`text-2xl font-bold ${getCorTeto()}`}>{teto?.percentual?.toFixed(1)}%</p><p className="text-sm text-slate-400">R$ {teto?.restante?.toLocaleString('pt-BR', {minimumFractionDigits: 2})} restante</p></div>
        </div>
        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${getCorBarra()} transition-all duration-500`} style={{width: `${Math.min(teto?.percentual || 0, 100)}%`}} /></div>
        {teto?.mesesRestantes > 0 && <p className="text-sm text-slate-400 mt-3">Média mensal disponível: <span className="text-cyan-400 font-semibold">R$ {teto?.mediaMensalRestante?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card"><h3 className="font-semibold text-white mb-4">Faturamento Mensal</h3><ResponsiveContainer width="100%" height={250}><BarChart data={dadosGrafico}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} /><YAxis stroke="#94a3b8" fontSize={12} /><Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:'8px'}} /><Bar dataKey="faturamento" fill="#06b6d4" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div>
        <div className="card"><h3 className="font-semibold text-white mb-4">Evolução vs Teto</h3><ResponsiveContainer width="100%" height={250}><LineChart data={dadosAcumulado}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="mes" stroke="#94a3b8" fontSize={12} /><YAxis stroke="#94a3b8" fontSize={12} /><Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:'8px'}} /><Legend /><Line type="monotone" dataKey="acumulado" name="Faturamento" stroke="#06b6d4" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="teto" name="Teto" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} /></LineChart></ResponsiveContainer></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card"><h3 className="font-semibold text-white mb-4">Últimas Notas</h3><div className="space-y-3">{ultimasNotas?.slice(0,5).map(nota => <div key={nota.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"><div><p className="text-sm font-medium text-white">{nota.cliente?.nome}</p><p className="text-xs text-slate-400">{nota.descricao}</p></div><p className="text-sm font-semibold text-cyan-400">R$ {parseFloat(nota.valor).toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>)}{!ultimasNotas?.length && <p className="text-sm text-slate-500 text-center py-4">Nenhuma nota</p>}</div></div>
        <div className="card"><h3 className="font-semibold text-white mb-4">Top Clientes</h3><div className="space-y-3">{topClientes?.map((c,i) => <div key={c.id} className="flex items-center gap-3"><span className="w-6 h-6 flex items-center justify-center bg-slate-700 rounded-full text-xs text-slate-300">{i+1}</span><div className="flex-1"><p className="text-sm font-medium text-white truncate">{c.nome}</p><div className="w-full h-2 bg-slate-800 rounded-full mt-1"><div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full" style={{width:`${(c.total/(topClientes[0]?.total||1))*100}%`}} /></div></div><p className="text-sm text-slate-300">R$ {c.total?.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p></div>)}{!topClientes?.length && <p className="text-sm text-slate-500 text-center py-4">Nenhum cliente</p>}</div></div>
      </div>
    </div>
  )
}
