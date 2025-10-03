import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- Вспомогательные функции ---

// Функция для расчета расстояния по формуле гаверсинуса (в метрах)
function haversineDistance(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371e3; // Радиус Земли в метрах

  const dLat = toRad(coords2[0] - coords1[0]);
  const dLon = toRad(coords2[1] - coords1[1]);
  const lat1 = toRad(coords1[0]);
  const lat2 = toRad(coords2[0]);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ИСПРАВЛЕНИЕ: Функция для расчета полной длины трубы с округлением до целого
function calculatePipeLength(vertices) {
  let totalLength = 0;
  for (let i = 0; i < vertices.length - 1; i++) {
    totalLength += haversineDistance(vertices[i], vertices[i + 1]);
  }
  return Math.round(totalLength); // Округляем до ближайшего целого
}

// Кастомный объект для хранения
const safeJsonStorage = {
  getItem: (name) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    try {
        JSON.parse(str);
        return str;
    } catch (e) {
        console.error("Обнаружены поврежденные данные, localStorage будет очищен:", e);
        localStorage.removeItem(name);
        return null;
    }
  },
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};


const useStore = create(
  persist(
    (set) => ({
      nodes: [],
      pipes: [],
      selectedObject: null,
      isPanelCollapsed: false,
      movingNodeId: null,
      editingPipeId: null,
      editingMode: null,
      selectedVertexIndex: null, // <<< НОВОЕ СОСТОЯНИЕ

      setNodes: (nodes) => set({ nodes }),
      setPipes: (pipes) => set({ pipes }),
      setMovingNodeId: (nodeId) => set({ movingNodeId: nodeId }),
      setSelectedVertexIndex: (index) => set({ selectedVertexIndex: index }), // <<< НОВЫЙ ACTION

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
                    length: calculatePipeLength(pipe.vertices), // Длина будет округлена
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
          let updated = false;
          const newVertices = [...pipe.vertices];

          if (pipe.startNodeId === nodeId) {
            newVertices[0] = [newPosition.lat, newPosition.lng];
            updated = true;
          }
          if (pipe.endNodeId === nodeId) {
            newVertices[newVertices.length - 1] = [newPosition.lat, newPosition.lng];
            updated = true;
          }

          if (updated) {
            return {
              ...pipe,
              vertices: newVertices,
              length: calculatePipeLength(newVertices), // Длина будет округлена
            };
          }

          return pipe;
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

      startPipeEditing: (pipeId) => set({ editingPipeId: pipeId, editingMode: null }),
      setEditingMode: (mode) => set({ editingMode: mode }),
      finishPipeEditing: () => set({ editingPipeId: null, editingMode: null, selectedVertexIndex: null }), // <<< ОБНОВЛЕНО

      updatePipeVertices: (pipeId, vertices) => set((state) => ({
        pipes: state.pipes.map(pipe =>
          pipe.id === pipeId
            ? {
                ...pipe,
                vertices,
                length: calculatePipeLength(vertices),
              }
            : pipe
        ),
      })),
      updatePipeEndpoint: (pipeId, vertexIndex, newNodeId, newPosition) => set((state) => {
        const newPipes = state.pipes.map(pipe => {
            if (pipe.id === pipeId) {
                const newVertices = [...pipe.vertices];
                let newStartNodeId = pipe.startNodeId;
                let newEndNodeId = pipe.endNodeId;

                if (vertexIndex === 0) {
                    newVertices[0] = newPosition;
                    newStartNodeId = newNodeId;
                } else if (vertexIndex === pipe.vertices.length - 1) {
                    newVertices[newVertices.length - 1] = newPosition;
                    newEndNodeId = newNodeId;
                } else {
                    return pipe;
                }

                return {
                    ...pipe,
                    vertices: newVertices,
                    startNodeId: newStartNodeId,
                    endNodeId: newEndNodeId,
                    length: calculatePipeLength(newVertices),
                };
            }
            return pipe;
        });
        return { pipes: newPipes };
      }),
    }),
    {
      name: 'thermal-network-storage',
      storage: createJSONStorage(() => safeJsonStorage),
      partialize: (state) => ({ 
          nodes: state.nodes, 
          pipes: state.pipes, 
          isPanelCollapsed: state.isPanelCollapsed,
        }),
    }
  )
);

export default useStore;
