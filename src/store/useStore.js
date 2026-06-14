import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(persist(
  (set, get) => ({
    screen: 'home',
    setScreen: (s) => set({ screen: s }),

    params: {
      pressure: 5.5,
      waterVol: 0.4,
      tankVol: 1.5,
      dryMass: 350,
      diameter: 92,
      nozzle: 10,
      cd: 0.5,
    },
    setParam: (key, value) => set(state => ({
      params: { ...state.params, [key]: value }
    })),
    setParams: (p) => set({ params: { ...p } }),
    resetParams: () => set({
      params: { pressure: 5.5, waterVol: 0.4, tankVol: 1.5, dryMass: 350, diameter: 92, nozzle: 10, cd: 0.5 }
    }),

    lastResult: null,
    setResult: (result) => set({ lastResult: result }),

    history: [],
    saveToHistory: () => {
      const { params, lastResult } = get();
      if (!lastResult) return;
      set(state => ({
        history: [
          {
            id: Date.now(),
            date: new Date().toLocaleString('ru'),
            params: { ...params },
            result: {
              maxHeight: lastResult.maxHeight,
              vmax: lastResult.vmax,
              burnTime: lastResult.burnTime,
              totalTime: lastResult.totalTime,
              points: lastResult.points.filter((_, i) => i % 20 === 0),
            }
          },
          ...state.history
        ].slice(0, 50)
      }));
    },
    deleteFromHistory: (id) => set(state => ({
      history: state.history.filter(h => h.id !== id)
    })),
    clearHistory: () => set({ history: [] }),
  }),
  {
    name: 'rocketsim-storage',
    partialize: (state) => ({ params: state.params, history: state.history }),
  }
));
