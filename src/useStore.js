import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- Вспомогательные функции ---
function haversineDistance(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371e3;
  const dLat = toRad(coords2[0] - coords1[0]);
  const dLon = toRad(coords2[1] - coords1[1]);
  const lat1 = toRad(coords1[0]);
  const lat2 = toRad(coords2[0]);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculatePipeLength(vertices) {
  let totalLength = 0;
  for (let i = 0; i < vertices.length - 1; i++) {
    totalLength += haversineDistance(vertices[i], vertices[i + 1]);
  }
  return Math.round(totalLength);
}

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
    (set, get) => ({
      nodes: [],
      pipes: [],
      areas: [], // Массив для хранения областей
      selectedObject: null,
      selectedAreaId: null, // ID выбранной области
      areaCreationMode: false, // Режим создания области
      isPanelCollapsed: false,
      movingNodeId: null,
      editingPipeId: null,
      editingMode: null,
      selectedVertexIndex: null,
      isDrawing: false,
      drawingStartNodeId: null,
      drawingVertices: [],

      setNodes: (nodes) => set({ nodes }),
      setPipes: (pipes) => set({ pipes }),
      setMovingNodeId: (nodeId) => set({ movingNodeId: nodeId }),
      setSelectedVertexIndex: (index) => set({ selectedVertexIndex: index }),

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
            areaId: null, // Привязка к области
          }
        ]
      })),
      
      startDrawing: (node) => {
        set({ 
          isDrawing: true, 
          drawingStartNodeId: node.id, 
          drawingVertices: [[node.lat, node.lng]] 
        });
      },

      addDrawingVertex: (latlng) => {
        if (!get().isDrawing) return;
        set(state => ({ drawingVertices: [...state.drawingVertices, [latlng.lat, latlng.lng]] }));
      },

      finishDrawing: (endNode) => {
        const { isDrawing, drawingStartNodeId, drawingVertices } = get();
        if (!isDrawing || !drawingStartNodeId || !endNode) {
          get().resetDrawing();
          return;
        }
        if (endNode.id === drawingStartNodeId && drawingVertices.length === 1) {
          get().resetDrawing();
          return;
        }

        const finalVertices = [...drawingVertices, [endNode.lat, endNode.lng]];
        const totalLength = calculatePipeLength(finalVertices);

        if (totalLength < 1) {
          get().resetDrawing();
          return;
        }

        const newPipe = {
            startNodeId: drawingStartNodeId,
            endNodeId: endNode.id,
            vertices: finalVertices,
            id: crypto.randomUUID(), 
            type: 'pipe', 
            length: totalLength,
            diameter: 100, 
            material: 'Сталь',
            actualLength: '', 
            insulationMaterial: 'ППУ',
            insulationWear: 0,
            areaId: null, // Привязка к области
        };

        set(state => ({ pipes: [...state.pipes, newPipe] }));
        get().resetDrawing();
      },

      resetDrawing: () => {
        set({ isDrawing: false, drawingStartNodeId: null, drawingVertices: [] });
      },

      addPipe: (pipe) => set((state) => {
        const startNode = state.nodes.find(n => n.id === pipe.startNodeId);
        const endNode = state.nodes.find(n => n.id === pipe.endNodeId);
        if (!startNode || !endNode) return state;
        return { 
            pipes: [
                ...state.pipes, 
                { ...pipe, areaId: null, length: calculatePipeLength(pipe.vertices) }
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
            return { ...pipe, vertices: newVertices, length: calculatePipeLength(newVertices) };
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

      clearProject: () => set({ nodes: [], pipes: [], areas: [], selectedObject: null, selectedAreaId: null }),
      togglePanel: () => set(state => ({ isPanelCollapsed: !state.isPanelCollapsed })), 
      startPipeEditing: (pipeId) => set({ editingPipeId: pipeId, editingMode: null }),
      setEditingMode: (mode) => set({ editingMode: mode }),
      finishPipeEditing: () => set({ editingPipeId: null, editingMode: null, selectedVertexIndex: null }),

      updatePipeVertices: (pipeId, vertices) => set((state) => ({
        pipes: state.pipes.map(pipe =>
          pipe.id === pipeId
            ? { ...pipe, vertices, length: calculatePipeLength(vertices) }
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
                }
                return { ...pipe, vertices: newVertices, startNodeId: newStartNodeId, endNodeId: newEndNodeId, length: calculatePipeLength(newVertices) };
            }
            return pipe;
        });
        return { pipes: newPipes };
      }),

      // --- УПРАВЛЕНИЕ ОБЛАСТЯМИ ---
      toggleAreaCreationMode: () => set(state => ({ areaCreationMode: !state.areaCreationMode, selectedObject: null })),
      setSelectedAreaId: (id) => set({ selectedAreaId: id, selectedObject: null }),

      addArea: (bounds, name) => set(state => ({
        areas: [
          ...state.areas,
          {
            id: crypto.randomUUID(),
            name: name || `Область ${state.areas.length + 1}`,
            bounds: bounds,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
          }
        ],
        areaCreationMode: false,
      })),

      updateArea: (id, data) => set(state => ({
        areas: state.areas.map(area => area.id === id ? { ...area, ...data } : area)
      })),

      deleteArea: (id) => set(state => ({
        areas: state.areas.filter(area => area.id !== id),
        nodes: state.nodes.map(node => node.areaId === id ? { ...node, areaId: null } : node),
        pipes: state.pipes.map(pipe => pipe.areaId === id ? { ...pipe, areaId: null } : pipe),
        selectedAreaId: state.selectedAreaId === id ? null : state.selectedAreaId,
      })),

      assignObjectToArea: (objectId, objectType, areaId) => set(state => {
        if (objectType === 'node') {
          return {
            nodes: state.nodes.map(node => node.id === objectId ? { ...node, areaId } : node)
          };
        }
        if (objectType === 'pipe') {
          return {
            pipes: state.pipes.map(pipe => pipe.id === objectId ? { ...pipe, areaId } : pipe)
          };
        }
        return state;
      }),

      // --- СЕЛЕКТОРЫ ОБЛАСТЕЙ ---
      getAreaById: (id) => get().areas.find(area => area.id === id),

      getObjectsInArea: (areaId) => {
        const { nodes, pipes } = get();
        return {
          nodes: nodes.filter(node => node.areaId === areaId),
          pipes: pipes.filter(pipe => pipe.areaId === areaId),
        };
      },

      getUnassignedObjects: () => {
        const { nodes, pipes } = get();
        return {
          nodes: nodes.filter(node => !node.areaId),
          pipes: pipes.filter(pipe => !pipe.areaId),
        };
      },

    }),
    {
      name: 'thermal-network-storage',
      storage: createJSONStorage(() => safeJsonStorage),
      partialize: (state) => ({ 
          nodes: state.nodes, 
          pipes: state.pipes, 
          areas: state.areas,
          isPanelCollapsed: state.isPanelCollapsed,
        }),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          state.isDrawing = false;
          state.drawingStartNodeId = null;
          state.drawingVertices = [];
          state.areaCreationMode = false;
          state.editingPipeId = null;
          state.editingMode = null;
        }
      }
    }
  )
);

export default useStore;
