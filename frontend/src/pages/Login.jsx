import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, User, Lock, Building2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';

function Login() {
  const navigate = useNavigate();
  const { login, loginCnpj, loading } = useAuthStore();
  
  const [loginType, setLoginType] = useState('cpf'); // 'cpf' ou 'cnpj'
  const [documento, setDocumento] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Formatar CPF
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  // Formatar CNPJ
  const formatCNPJ = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleDocumentoChange = (e) => {
    const value = e.target.value;
    if (loginType === 'cpf') {
      setDocumento(formatCPF(value));
    } else {
      setDocumento(formatCNPJ(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!documento || !senha) {
      toast.error('Preencha todos os campos');
      return;
    }

    const result = loginType === 'cpf' 
      ? await login(documento, senha)
      : await loginCnpj(documento, senha);

    if (result.success) {
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  const switchLoginType = () => {
    setLoginType(loginType === 'cpf' ? 'cnpj' : 'cpf');
    setDocumento('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background Gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-4 shadow-lg shadow-cyan-500/25">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">MEI Control</h1>
          <p className="text-slate-400 mt-2">Sistema de Gestão de Notas Fiscais</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => switchLoginType()}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                loginType === 'cpf'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <User className="w-4 h-4" />
              CPF
            </button>
            <button
              type="button"
              onClick={() => switchLoginType()}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                loginType === 'cnpj'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              CNPJ
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Documento */}
            <div>
              <label className="label">
                {loginType === 'cpf' ? 'CPF' : 'CNPJ'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {loginType === 'cpf' ? (
                    <User className="w-5 h-5 text-slate-500" />
                  ) : (
                    <Building2 className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <input
                  type="text"
                  value={documento}
                  onChange={handleDocumentoChange}
                  placeholder={loginType === 'cpf' ? '000.000.000-00' : '00.000.000/0001-00'}
                  className="input pl-12"
                  maxLength={loginType === 'cpf' ? 14 : 18}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3.5 text-base"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Help */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-center text-sm text-slate-500">
              Esqueceu sua senha?{' '}
              <a href="#" className="text-cyan-400 hover:text-cyan-300">
                Recuperar acesso
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          © 2025 MEI Control. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

export default Login;
