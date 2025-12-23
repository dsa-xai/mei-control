import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor de requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mei-control-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Erro de conexão com o servidor'
    
    if (error.response?.status === 401) {
      localStorage.removeItem('mei-control-token')
      window.location.href = '/login'
      return Promise.reject(error)
    }
    
    if (error.response?.status === 429) {
      toast.error('Muitas requisições. Aguarde um momento.')
    }
    
    return Promise.reject(error)
  }
)

export default api

export const authService = {
  login: (documento, senha) => api.post('/auth/login', { documento, senha }),
  registro: (dados) => api.post('/auth/registro', dados),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me')
}

export const meiService = {
  listar: () => api.get('/meis'),
  obter: (id) => api.get(`/meis/${id}`),
  criar: (dados) => api.post('/meis', dados),
  faturamento: (id, ano) => api.get(`/meis/${id}/faturamento`, { params: { ano } })
}

export const clienteService = {
  listar: (meiId, params = {}) => api.get('/clientes', { params: { meiId, ...params } }),
  obter: (id) => api.get(`/clientes/${id}`),
  criar: (dados) => api.post('/clientes', dados),
  atualizar: (id, dados) => api.put(`/clientes/${id}`, dados),
  excluir: (id) => api.delete(`/clientes/${id}`)
}

export const notaFiscalService = {
  listar: (meiId, params = {}) => api.get('/notas-fiscais', { params: { meiId, ...params } }),
  emitir: (dados) => api.post('/notas-fiscais', dados),
  cancelar: (id, motivo) => api.post(`/notas-fiscais/${id}/cancelar`, { motivo })
}

export const dasService = {
  listar: (meiId, ano) => api.get('/das', { params: { meiId, ano } }),
  gerar: (meiId, ano) => api.post('/das/gerar', { meiId, ano }),
  registrarPagamento: (id, dataPagamento) => api.put(`/das/${id}/pagamento`, { dataPagamento })
}

export const dashboardService = {
  obter: (meiId, ano) => api.get(`/dashboard/${meiId}`, { params: { ano } }),
  notificacoes: () => api.get('/dashboard/notificacoes')
}

export const relatorioService = {
  faturamento: (meiId, ano, mes) => api.get('/relatorios/faturamento', { params: { meiId, ano, mes } }),
  clientes: (meiId, ano) => api.get('/relatorios/clientes', { params: { meiId, ano } }),
  das: (meiId, ano) => api.get('/relatorios/das', { params: { meiId, ano } })
}

export const notificacaoService = {
  listar: () => api.get('/notificacoes'),
  marcarLida: (id) => api.put(`/notificacoes/${id}/lida`),
  marcarTodasLidas: () => api.put('/notificacoes/marcar-todas-lidas')
}
