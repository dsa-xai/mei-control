import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      meis: [],
      meiAtivo: null,
      token: null,
      isAuthenticated: false,
      loading: true,

      // Inicializar auth
      initialize: async () => {
        const token = localStorage.getItem('mei-control-token')
        if (token) {
          try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
            const response = await api.get('/auth/me')
            set({
              user: response.data.data,
              meis: response.data.data.meis || [],
              meiAtivo: response.data.data.meis?.[0] || null,
              token,
              isAuthenticated: true,
              loading: false
            })
          } catch (error) {
            localStorage.removeItem('mei-control-token')
            set({ loading: false })
          }
        } else {
          set({ loading: false })
        }
      },

      // Login
      login: async (documento, senha) => {
        const response = await api.post('/auth/login', { documento, senha })
        const { usuario, meis, token } = response.data.data
        
        localStorage.setItem('mei-control-token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        set({
          user: usuario,
          meis,
          meiAtivo: meis?.[0] || null,
          token,
          isAuthenticated: true
        })
        
        return response.data
      },

      // Registro
      register: async (dados) => {
        const response = await api.post('/auth/registro', dados)
        const { usuario, token } = response.data.data
        
        localStorage.setItem('mei-control-token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        set({
          user: usuario,
          meis: [],
          meiAtivo: null,
          token,
          isAuthenticated: true
        })
        
        return response.data
      },

      // Logout
      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch (error) {
          // Ignora erros no logout
        }
        
        localStorage.removeItem('mei-control-token')
        delete api.defaults.headers.common['Authorization']
        
        set({
          user: null,
          meis: [],
          meiAtivo: null,
          token: null,
          isAuthenticated: false
        })
      },

      // Selecionar MEI ativo
      setMeiAtivo: (mei) => {
        set({ meiAtivo: mei })
      },

      // Adicionar MEI à lista
      addMei: (mei) => {
        const { meis } = get()
        set({
          meis: [...meis, mei],
          meiAtivo: mei
        })
      },

      // Atualizar usuário
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      }
    }),
    {
      name: 'mei-control-auth',
      partialize: (state) => ({
        token: state.token,
        meiAtivo: state.meiAtivo
      })
    }
  )
)

// Inicializar ao carregar
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize()
}
