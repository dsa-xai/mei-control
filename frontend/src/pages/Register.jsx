import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'
import { FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuthStore()
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', senha: '', confirmarSenha: '' })
  const [loading, setLoading] = useState(false)
  const formatarCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.senha !== form.confirmarSenha) return toast.error('Senhas não conferem')
    if (form.senha.length < 6) return toast.error('Senha deve ter no mínimo 6 caracteres')
    setLoading(true)
    try {
      await register({ nome: form.nome, email: form.email, cpf: form.cpf.replace(/\D/g, ''), senha: form.senha })
      toast.success('Conta criada!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao criar conta')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-2xl mb-4"><FileText className="w-8 h-8 text-white" /></div>
          <h1 className="text-2xl font-bold text-white">MEI Control</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-8 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Criar Conta</h2>
          <input type="text" placeholder="Nome completo" value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" required />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" required />
          <input type="text" placeholder="CPF" value={form.cpf} onChange={(e) => setForm({...form, cpf: formatarCPF(e.target.value)})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" maxLength={14} required />
          <input type="password" placeholder="Senha" value={form.senha} onChange={(e) => setForm({...form, senha: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" required />
          <input type="password" placeholder="Confirmar senha" value={form.confirmarSenha} onChange={(e) => setForm({...form, confirmarSenha: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" required />
          <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Criando...</> : 'Criar Conta'}
          </button>
          <p className="text-center text-sm text-slate-500">Já tem conta? <Link to="/login" className="text-cyan-400">Entrar</Link></p>
        </form>
      </div>
    </div>
  )
}
