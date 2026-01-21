import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- Вспомогательные функции (без изменений) ---
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

function isPointInBounds(point, bounds) {
    const [lat, lng] = point;
    const [[swLat, swLng], [neLat, neLng]] = bounds;
    const latCheck = lat >= Math.min(swLat, neLat) && lat <= Math.max(swLat, neLat);
    const lngCheck = lng >= Math.min(swLng, neLng) && lng <= Math.max(swLng, neLng);
    return latCheck && lngCheck;
}

function getPipeAreaId(vertices, areas) {
    const areaCounts = {};
    vertices.forEach(vertex => {
        for (const area of areas) {
            if (isPointInBounds(vertex, area.bounds)) {
                areaCounts[area.id] = (areaCounts[area.id] || 0) + 1;
                break;
            }
        }
    });

    let assignedAreaId = null;
    let maxCount = 0;
    for (const areaId in areaCounts) {
        if (areaCounts[areaId] > maxCount) {
            maxCount = areaCounts[areaId];
            assignedAreaId = areaId;
        }
    }
    
    const counts = Object.values(areaCounts);
    const sortedCounts = counts.sort((a, b) => b - a);
    if (sortedCounts.length > 1 && sortedCounts[0] === sortedCounts[1]) {
        return null; 
    }
    return assignedAreaId;
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
      // --- Карта ---
      map: null,
      setMap: (map) => set({ map }),
      getMapBounds: () => {
        const map = get().map;
        return map ? map.getBounds() : null;
      },

      // --- Существующее состояние ---
      nodes: [],
      pipes: [],
      areas: [],
      selectedObject: null,
      selectedAreaId: null, 
      areaCreationMode: false,
      isPanelCollapsed: false,
      movingNodeId: null,
      editingPipeId: null,
      editingMode: null,
      selectedVertexIndex: null,
      isDrawing: false,
      drawingStartNodeId: null,
      drawingVertices: [],
      
      // --- НОВОЕ: Настройки вида ---
      viewOptions: {
        showAnnotations: true,
        showNodeAnnotations: true,
        showPipeAnnotations: true,
        showNodeTypes: true,
        showNodeNames: true,
        showPipeLength: true,
        showPipeDiameter: true,
        hiddenAnnotationNodeTypes: [], // e.g. ['valve', 'chamber']
        forceLargeNodes: false,
        fontSize: 12,
        usePipeDiameterForWidth: true,
      },

      // --- Существующие actions ---
      setNodes: (nodes) => set({ nodes }),
      setPipes: (pipes) => set({ pipes }),
      setAreas: (areas) => set({ areas }),
      setMovingNodeId: (nodeId) => set({ movingNodeId: nodeId }),
      setSelectedVertexIndex: (index) => set({ selectedVertexIndex: index }),
      
      // --- НОВОЕ: Action для обновления настроек вида ---
      setViewOptions: (options) => set(state => ({
        viewOptions: { ...state.viewOptions, ...options }
      })),

      addNode: (node) => {
        const { areas } = get();
        let assignedAreaId = null;
        for (const area of areas) {
          if (isPointInBounds([node.lat, node.lng], area.bounds)) {
            assignedAreaId = area.id;
            break;
          }
        }

        if (!assignedAreaId) {
            alert("Предупреждение: Узел создается вне границ определенных областей. Он будет отнесен к категории \'Другое\'.");
        }

        set((state) => ({ 
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
              areaId: assignedAreaId,
              address: '',
              objectPurpose: '',
              volumeM3: '',
              areaM2: '',
              contractedHeatLoadGcalHour: '',
              calculatedHeatLoadGcalHour: '',
              specificHeatingLoadKcalM3C: '',
              legalForm: '',
              accruals: '',
            }
          ]
        }));
      },
      
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
        const { isDrawing, drawingStartNodeId, drawingVertices, areas } = get();
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
        
        const assignedAreaId = getPipeAreaId(finalVertices, areas);

        if (!assignedAreaId) {
            alert("Предупреждение: Труба создается вне границ определенных областей или пересекает несколько областей без явного большинства вершин. Она будет отнесена к категории \'Другое\'.");
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
            areaId: assignedAreaId,
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

      updateNodePosition: (nodeId, newPosition) => {
          const { areas } = get();
          let assignedAreaId = null;
          for (const area of areas) {
              if (isPointInBounds([newPosition.lat, newPosition.lng], area.bounds)) {
                  assignedAreaId = area.id;
                  break;
              }
          }

          set((state) => {
            const newNodes = state.nodes.map(node => 
              node.id === nodeId 
                ? { ...node, lat: newPosition.lat, lng: newPosition.lng, areaId: assignedAreaId } 
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
                const newAreaId = getPipeAreaId(newVertices, state.areas);
                return { ...pipe, vertices: newVertices, length: calculatePipeLength(newVertices), areaId: newAreaId };
              }
              return pipe;
            });
            return { nodes: newNodes, pipes: newPipes };
          });
      },

      updatePipe: (id, data) => set((state) => ({ 
        pipes: state.pipes.map(pipe => pipe.id === id ? { ...pipe, ...data } : pipe)
      })),

      setSelectedObject: (object) => set({ selectedObject: object, selectedAreaId: null }),
      setSelectedAreaId: (id) => set({ selectedAreaId: id, selectedObject: null }),

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
            ? { ...pipe, vertices, length: calculatePipeLength(vertices), areaId: getPipeAreaId(vertices, state.areas) }
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
                const newAreaId = getPipeAreaId(newVertices, state.areas);
                return { ...pipe, vertices: newVertices, startNodeId: newStartNodeId, endNodeId: newEndNodeId, length: calculatePipeLength(newVertices), areaId: newAreaId };
            }
            return pipe;
        });
        return { pipes: newPipes };
      }),

      toggleAreaCreationMode: () => set(state => ({ areaCreationMode: !state.areaCreationMode, selectedObject: null })),
      
      addArea: (bounds, name) => {
        const newArea = {
            id: crypto.randomUUID(),
            name: name || `Область ${get().areas.length + 1}`,
            bounds: bounds,
            color: 'green',
        };

        const updatedAreas = [...get().areas, newArea];

        const updatedNodes = get().nodes.map(node => {
            if (isPointInBounds([node.lat, node.lng], newArea.bounds)) {
                return { ...node, areaId: newArea.id };
            }
            return node;
        });

        const updatedPipes = get().pipes.map(pipe => {
            const newAreaId = getPipeAreaId(pipe.vertices, updatedAreas);
            return { ...pipe, areaId: newAreaId };
        });

        set({
            areas: updatedAreas,
            nodes: updatedNodes,
            pipes: updatedPipes,
            areaCreationMode: false,
            selectedAreaId: null,
        });
      },

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
      // Добавляем viewOptions в сохраняемое состояние
      partialize: (state) => ({ 
          nodes: state.nodes, 
          pipes: state.pipes, 
          areas: state.areas,
          isPanelCollapsed: state.isPanelCollapsed,
          viewOptions: state.viewOptions, // <-- СОХРАНЯЕМ НАСТРОЙКИ
        }),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          // Сбрасываем состояния, которые не должны сохраняться
          state.isDrawing = false;
          state.drawingStartNodeId = null;
          state.drawingVertices = [];
          state.areaCreationMode = false;
          state.editingPipeId = null;
          state.editingMode = null;
          state.map = null; // Не сохраняем объект карты
        }
      }
    }
  )
);

export default useStore;
