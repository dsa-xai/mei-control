import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  usuario: JSON.parse(localStorage.getItem('mei_usuario')) || null,
  meiAtual: JSON.parse(localStorage.getItem('mei_atual')) || null,
  token: localStorage.getItem('mei_token') || null,
  loading: false,
  
  // Login
  login: async (cpf, senha) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.login(cpf, senha);
      
      localStorage.setItem('mei_token', data.token);
      localStorage.setItem('mei_usuario', JSON.stringify(data.usuario));
      
      if (data.usuario.meis?.[0]) {
        localStorage.setItem('mei_atual', JSON.stringify(data.usuario.meis[0]));
      }
      
      set({
        token: data.token,
        usuario: data.usuario,
        meiAtual: data.usuario.meis?.[0] || null,
        loading: false
      });
      
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erro ao fazer login' 
      };
    }
  },
  
  // Login por CNPJ
  loginCnpj: async (cnpj, senha) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.loginCnpj(cnpj, senha);
      
      localStorage.setItem('mei_token', data.token);
      localStorage.setItem('mei_usuario', JSON.stringify(data.usuario));
      
      if (data.meiAtual) {
        localStorage.setItem('mei_atual', JSON.stringify(data.meiAtual));
      }
      
      set({
        token: data.token,
        usuario: data.usuario,
        meiAtual: data.meiAtual || null,
        loading: false
      });
      
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erro ao fazer login' 
      };
    }
  },
  
  // Verificar token
  verificarAuth: async () => {
    const token = localStorage.getItem('mei_token');
    if (!token) {
      set({ usuario: null, meiAtual: null, token: null });
      return false;
    }
    
    try {
      const { data } = await authAPI.me();
      
      localStorage.setItem('mei_usuario', JSON.stringify(data.usuario));
      
      set({
        usuario: data.usuario,
        meiAtual: data.usuario.meis?.[0] || get().meiAtual
      });
      
      return true;
    } catch (error) {
      get().logout();
      return false;
    }
  },
  
  // Trocar MEI ativo
  setMeiAtual: (mei) => {
    localStorage.setItem('mei_atual', JSON.stringify(mei));
    set({ meiAtual: mei });
  },
  
  // Logout
  logout: async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // Ignora erro de logout
    }
    
    localStorage.removeItem('mei_token');
    localStorage.removeItem('mei_usuario');
    localStorage.removeItem('mei_atual');
    
    set({ usuario: null, meiAtual: null, token: null });
  },
  
  // Helpers
  isAdmin: () => get().usuario?.role === 'ADMIN',
  isCliente: () => get().usuario?.role === 'CLIENTE',
  isAuthenticated: () => !!get().token && !!get().usuario
}));

export default useAuthStore;
