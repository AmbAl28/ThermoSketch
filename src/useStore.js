import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Кастомный объект для хранения, который перехватывает ошибки парсинга JSON.
const safeJsonStorage = {
  getItem: (name) => {
    const str = localStorage.getItem(name);
    if (!str) {
      return null; 
    }
    try {
        JSON.parse(str);
        return str;
    } catch (e) {
        console.error("Обнаружены поврежденные данные в localStorage, они будут очищены:", e);
        alert("Не удалось загрузить сохраненные данные. Они будут очищены.");
        localStorage.removeItem(name);
        return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      console.error("Ошибка записи в localStorage:", e);
      alert("Не удалось сохранить состояние проекта. Возможно, хранилище переполнено.");
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
};

const useStore = create(
  persist(
    (set) => ({
      nodes: [],
      pipes: [],
      selectedObject: null,
      isPanelCollapsed: false,

      setNodes: (nodes) => set({ nodes }),
      setPipes: (pipes) => set({ pipes }),

      addNode: (node) => set((state) => ({ 
        nodes: [
          ...state.nodes, 
          { 
            ...node, 
            name: `Узел ${state.nodes.length + 1}`, 
            type: 'node', 
            nodeType: 'chamber',
            elevation: 0,
            contractNumber: '',
            note: '',
            // Новые параметры
            heatLoad: '', // Тепловая нагрузка (Гкал/ч)
            staticPressure: '', // Статический напор (м)
            supplyTemperature: '', // Температура подачи (°C)
            returnTemperature: '', // Температура обратки (°C)
          }
        ]
      })),
      addPipe: (pipe) => set((state) => {
        const startNode = state.nodes.find(n => n.id === pipe.startNodeId);
        const endNode = state.nodes.find(n => n.id === pipe.endNodeId);
        if (!startNode || !endNode) return state;
        
        return { 
            pipes: [
                ...state.pipes, 
                { 
                    ...pipe, 
                    id: crypto.randomUUID(), 
                    type: 'pipe', 
                    diameter: 100, 
                    material: 'Сталь',
                    actualLength: '', 
                    insulationMaterial: 'ППУ',
                    insulationWear: 0, 
                }
            ]
        };
      }),

      updateNode: (id, data) => set((state) => ({ 
        nodes: state.nodes.map(node => node.id === id ? { ...node, ...data } : node)
      })),

      updatePipe: (id, data) => set((state) => ({ 
        pipes: state.pipes.map(pipe => pipe.id === id ? { ...pipe, ...data } : pipe)
      })),

      setSelectedObject: (object) => set({ selectedObject: object }),

      deleteObject: (object) => set((state) => {
        if (object.type === 'node') {
            const connectedPipes = state.pipes.filter(p => p.startNodeId === object.id || p.endNodeId === object.id).map(p => p.id);
            return {
                nodes: state.nodes.filter(n => n.id !== object.id),
                pipes: state.pipes.filter(p => !connectedPipes.includes(p.id)),
                selectedObject: null,
            }
        } else { 
            return {
                pipes: state.pipes.filter(p => p.id !== object.id),
                selectedObject: null,
            }
        }
      }),

      clearProject: () => {
        set({ nodes: [], pipes: [], selectedObject: null });
      },
        
      togglePanel: () => set(state => ({ isPanelCollapsed: !state.isPanelCollapsed })), 
    }),
    {
      name: 'thermal-network-storage',
      storage: createJSONStorage(() => safeJsonStorage),
      partialize: (state) => ({ nodes: state.nodes, pipes: state.pipes, isPanelCollapsed: state.isPanelCollapsed }),
    }
  )
);

export default useStore;
