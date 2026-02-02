import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mei_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        localStorage.removeItem('mei_token');
        localStorage.removeItem('mei_usuario');
        localStorage.removeItem('mei_atual');
        window.location.href = '/login';
        toast.error('Sessão expirada. Faça login novamente.');
      } else if (status === 403) {
        toast.error('Você não tem permissão para esta ação.');
      } else if (status === 429) {
        toast.error('Muitas requisições. Aguarde um momento.');
      } else {
        toast.error(data?.error || 'Erro ao processar requisição.');
      }
    } else if (error.request) {
      toast.error('Servidor não responde. Verifique sua conexão.');
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (cpf, senha) => api.post('/auth/login', { cpf, senha }),
  loginCnpj: (cnpj, senha) => api.post('/auth/login-cnpj', { cnpj, senha }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

// Dashboard
export const dashboardAPI = {
  admin: () => api.get('/dashboard/admin'),
  cliente: (meiId) => api.get('/dashboard/cliente', { params: { meiId } })
};

// MEIs
export const meiAPI = {
  listar: (params) => api.get('/meis', { params }),
  buscar: (id) => api.get(`/meis/${id}`),
  criar: (data) => api.post('/meis', data),
  atualizar: (id, data) => api.put(`/meis/${id}`, data),
  deletar: (id) => api.delete(`/meis/${id}`)
};

// Notas Fiscais
export const notaAPI = {
  listar: (params) => api.get('/notas', { params }),
  buscar: (id) => api.get(`/notas/${id}`),
  emitir: (data) => api.post('/notas', data),
  cancelar: (id, motivo) => api.post(`/notas/${id}/cancelar`, { motivo })
};

// Solicitações
export const solicitacaoAPI = {
  listar: (params) => api.get('/solicitacoes', { params }),
  buscar: (id) => api.get(`/solicitacoes/${id}`),
  criar: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/solicitacoes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  atualizarStatus: (id, data) => api.put(`/solicitacoes/${id}/status`, data),
  gerarLinkWhatsApp: (telefone, mensagem) => api.post('/solicitacoes/whatsapp/link', { telefone, mensagem })
};

// DAS
export const dasAPI = {
  listar: (params) => api.get('/das', { params }),
  buscar: (id) => api.get(`/das/${id}`),
  criar: (data) => api.post('/das', data),
  pagar: (id, data) => api.post(`/das/${id}/pagar`, data),
  gerarMensal: (data) => api.post('/das/gerar-mensal', data)
};

// Clientes
export const clienteAPI = {
  listar: (params) => api.get('/clientes', { params }),
  buscar: (id) => api.get(`/clientes/${id}`),
  criar: (data) => api.post('/clientes', data),
  atualizar: (id, data) => api.put(`/clientes/${id}`, data),
  deletar: (id) => api.delete(`/clientes/${id}`)
};

// Notificações
export const notificacaoAPI = {
  listar: (params) => api.get('/notificacoes', { params }),
  marcarLida: (id) => api.put(`/notificacoes/${id}/lida`),
  marcarTodasLidas: () => api.put('/notificacoes/marcar-todas-lidas'),
  deletar: (id) => api.delete(`/notificacoes/${id}`)
};

export default api;
