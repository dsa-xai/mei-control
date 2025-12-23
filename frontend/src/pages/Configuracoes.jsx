import { useState } from 'react'
import { useAuthStore } from '../context/authStore'
import { meiService, authService } from '../services/api'
import { Building2, User, Lock, Plus, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Configuracoes() {
  const { user, meis, addMei } = useAuthStore()
  const [tab, setTab] = useState('mei')
  const [modalMEI, setModalMEI] = useState(false)
  const [formMEI, setFormMEI] = useState({ cnpj: '', razaoSocial: '', nomeFantasia: '', dataAbertura: '', cnaePrincipal: '', cnaeDescricao: '' })
  const [salvando, setSalvando] = useState(false)

  const formatarCNPJ = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')

  const salvarMEI = async (e) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const r = await meiService.criar(formMEI)
      addMei(r.data.data)
      toast.success('MEI cadastrado!')
      setModalMEI(false)
      setFormMEI({ cnpj: '', razaoSocial: '', nomeFantasia: '', dataAbertura: '', cnaePrincipal: '', cnaeDescricao: '' })
    } catch (e) { toast.error(e.response?.data?.error || 'Erro') }
    finally { setSalvando(false) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Configurações</h1>
      <div className="flex gap-2 flex-wrap">
        {[{id: 'mei', icon: Building2, label: 'MEI'}, {id: 'perfil', icon: User, label: 'Perfil'}, {id: 'senha', icon: Lock, label: 'Senha'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${tab === t.id ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>
      {tab === 'mei' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Meus MEIs</h2>
            <button onClick={() => setModalMEI(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg"><Plus className="w-4 h-4" />Cadastrar MEI</button>
          </div>
          {meis.length === 0 ? <p className="text-slate-400 text-center py-8">Nenhum MEI cadastrado. Clique em "Cadastrar MEI" para começar.</p> : (
            <div className="space-y-4">
              {meis.map(mei => (
                <div key={mei.id} className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3 mb-2"><Building2 className="w-5 h-5 text-cyan-400" /><p className="font-semibold text-white">{mei.nomeFantasia || mei.razaoSocial}</p></div>
                  <p className="text-sm text-slate-400">CNPJ: {formatarCNPJ(mei.cnpj)}</p>
                  <p className="text-sm text-slate-400">Abertura: {new Date(mei.dataAbertura).toLocaleDateString('pt-BR')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {tab === 'perfil' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">Dados do Perfil</h2>
          <div className="space-y-4">
            <div><label className="block text-sm text-slate-400 mb-2">Nome</label><input type="text" value={user?.nome || ''} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" readOnly /></div>
            <div><label className="block text-sm text-slate-400 mb-2">Email</label><input type="email" value={user?.email || ''} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" readOnly /></div>
            <div><label className="block text-sm text-slate-400 mb-2">CPF</label><input type="text" value={user?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || ''} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" readOnly /></div>
          </div>
        </div>
      )}
      {tab === 'senha' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-6">Alterar Senha</h2>
          <form className="space-y-4">
            <div><label className="block text-sm text-slate-400 mb-2">Senha Atual</label><input type="password" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div>
            <div><label className="block text-sm text-slate-400 mb-2">Nova Senha</label><input type="password" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div>
            <div><label className="block text-sm text-slate-400 mb-2">Confirmar Nova Senha</label><input type="password" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" /></div>
            <button type="submit" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg">Salvar</button>
          </form>
        </div>
      )}
      {modalMEI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-semibold text-white">Cadastrar MEI</h2><button onClick={() => setModalMEI(false)} className="text-slate-400"><X className="w-6 h-6" /></button></div>
            <form onSubmit={salvarMEI} className="space-y-4">
              <input type="text" placeholder="CNPJ" value={formMEI.cnpj} onChange={(e) => setFormMEI({...formMEI, cnpj: formatarCNPJ(e.target.value)})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" maxLength={18} required />
              <input type="text" placeholder="Razão Social" value={formMEI.razaoSocial} onChange={(e) => setFormMEI({...formMEI, razaoSocial: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" required />
              <input type="text" placeholder="Nome Fantasia" value={formMEI.nomeFantasia} onChange={(e) => setFormMEI({...formMEI, nomeFantasia: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" />
              <input type="date" placeholder="Data de Abertura" value={formMEI.dataAbertura} onChange={(e) => setFormMEI({...formMEI, dataAbertura: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" required />
              <input type="text" placeholder="CNAE Principal (ex: 6201500)" value={formMEI.cnaePrincipal} onChange={(e) => setFormMEI({...formMEI, cnaePrincipal: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" required />
              <input type="text" placeholder="Descrição do CNAE" value={formMEI.cnaeDescricao} onChange={(e) => setFormMEI({...formMEI, cnaeDescricao: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" />
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setModalMEI(false)} className="flex-1 py-3 bg-slate-700 text-white rounded-lg">Cancelar</button><button type="submit" disabled={salvando} className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">{salvando && <Loader2 className="w-5 h-5 animate-spin" />}Salvar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
