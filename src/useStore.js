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
      movingNodeId: null, // Заменено draggedNodeId на movingNodeId

      setNodes: (nodes) => set({ nodes }),
      setPipes: (pipes) => set({ pipes }),
      setMovingNodeId: (nodeId) => set({ movingNodeId: nodeId }), // Обновлено для перемещаемого узла

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
            heatLoad: '', 
            staticPressure: '',
            supplyTemperature: '',
            returnTemperature: '',
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

      updateNodePosition: (nodeId, newPosition) => set((state) => {
        const newNodes = state.nodes.map(node => 
          node.id === nodeId 
            ? { ...node, lat: newPosition.lat, lng: newPosition.lng } 
            : node
        );

        const newPipes = state.pipes.map(pipe => {
          const newPipe = { ...pipe, vertices: [...pipe.vertices] };
          let updated = false;

          if (pipe.startNodeId === nodeId) {
            newPipe.vertices[0] = [newPosition.lat, newPosition.lng];
            updated = true;
          }
          if (pipe.endNodeId === nodeId) {
            newPipe.vertices[newPipe.vertices.length - 1] = [newPosition.lat, newPosition.lng];
            updated = true;
          }

          return updated ? newPipe : pipe;
        });
        
        return { nodes: newNodes, pipes: newPipes };
      }),

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