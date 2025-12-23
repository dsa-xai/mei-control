import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      meiAtual: null,
      meis: [],
      isAuthenticated: false,

      login: (usuario, token, meis) => {
        set({
          usuario,
          token,
          meis,
          meiAtual: meis[0] || null,
          isAuthenticated: true
        });
      },

      logout: () => {
        set({
          usuario: null,
          token: null,
          meiAtual: null,
          meis: [],
          isAuthenticated: false
        });
      },

      setMeiAtual: (mei) => set({ meiAtual: mei }),

      setMeis: (meis) => set({ meis }),

      updateUsuario: (dados) => set((state) => ({
        usuario: { ...state.usuario, ...dados }
      }))
    }),
    {
      name: 'mei-auth-storage',
      partialize: (state) => ({
        usuario: state.usuario,
        token: state.token,
        meiAtual: state.meiAtual,
        meis: state.meis,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  loading: false,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setLoading: (loading) => set({ loading })
}));
