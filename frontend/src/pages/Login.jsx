import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'
import { FileText, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuthStore()
  const [documento, setDocumento] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)

  const formatarDocumento = (value) => {
    const nums = value.replace(/\D/g, '')
    if (nums.length <= 11) return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(documento.replace(/\D/g, ''), senha)
      toast.success('Login realizado!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-2xl mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MEI Control</h1>
          <p className="text-slate-500">Sistema de Gestão Fiscal para MEI</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Entrar</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">CPF ou CNPJ</label>
              <input type="text" value={documento} onChange={(e) => setDocumento(formatarDocumento(e.target.value))} placeholder="000.000.000-00" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white" maxLength={18} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Senha</label>
              <div className="relative">
                <input type={showSenha ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white pr-12" required />
                <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">{showSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full mt-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Entrando...</> : 'Entrar'}
          </button>
          <p className="mt-6 text-center text-sm text-slate-500">Não tem uma conta? <Link to="/registro" className="text-cyan-400">Criar conta</Link></p>
        </form>
        <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-500 text-center"><strong className="text-slate-400">Demo:</strong> CPF 123.456.789-00 | Senha: 123456</p>
        </div>
      </div>
    </div>
  )
}
