import { useState } from 'react'
import { Calendar, Receipt, FileText, AlertTriangle, Check, Clock } from 'lucide-react'

const obrigacoes = [
  { tipo: 'DAS', dia: 20, descricao: 'Pagamento do DAS mensal', recorrente: true },
  { tipo: 'DECLARACAO', mes: 5, dia: 31, descricao: 'Entrega da DASN-SIMEI (Declaração Anual)', recorrente: false },
]

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Calendario() {
  const hoje = new Date()
  const [ano] = useState(hoje.getFullYear())

  const eventos = []
  MESES.forEach((mes, i) => {
    obrigacoes.forEach(ob => {
      if (ob.recorrente || ob.mes === i + 1) {
        const data = new Date(ano, ob.mes ? ob.mes - 1 : i, ob.dia)
        const status = data < hoje ? 'passado' : data.toDateString() === hoje.toDateString() ? 'hoje' : 'futuro'
        eventos.push({ ...ob, mes: MESES[data.getMonth()], data, status })
      }
    })
  })

  const proximosEventos = eventos.filter(e => e.status !== 'passado').slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Calendário de Obrigações</h1>
      <div className="card p-4 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border-cyan-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div><p className="text-white font-medium">Fique atento aos prazos!</p><p className="text-sm text-slate-400">O não pagamento do DAS ou a não entrega da declaração anual pode gerar multas e problemas com o CNPJ.</p></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Próximas Obrigações</h3>
            <div className="space-y-3">
              {proximosEventos.map((ev, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg">
                  <div className={`p-3 rounded-xl ${ev.tipo === 'DAS' ? 'bg-cyan-500/20' : 'bg-violet-500/20'}`}>
                    {ev.tipo === 'DAS' ? <Receipt className="w-6 h-6 text-cyan-400" /> : <FileText className="w-6 h-6 text-violet-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{ev.descricao}</p>
                    <p className="text-sm text-slate-400">{ev.data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs ${ev.status === 'hoje' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                    {ev.status === 'hoje' ? 'Hoje!' : `${Math.ceil((ev.data - hoje) / (1000*60*60*24))} dias`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Dicas Importantes</h3>
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-slate-800 rounded-lg"><p className="text-cyan-400 font-medium">DAS Mensal</p><p className="text-slate-400 mt-1">Vence todo dia 20. Pague em dia para evitar juros e multas.</p></div>
            <div className="p-3 bg-slate-800 rounded-lg"><p className="text-violet-400 font-medium">DASN-SIMEI</p><p className="text-slate-400 mt-1">Declaração anual obrigatória. Prazo: 31 de maio.</p></div>
            <div className="p-3 bg-slate-800 rounded-lg"><p className="text-amber-400 font-medium">Teto MEI 2025</p><p className="text-slate-400 mt-1">R$ 81.000/ano. Monitore para evitar desenquadramento.</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}
