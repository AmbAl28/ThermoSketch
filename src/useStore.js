import { create } from 'zustand';
import L from 'leaflet';

// Helper to calculate length of a polyline
const calculatePolylineLength = (vertices) => {
  if (!vertices || vertices.length < 2) return 0;
  let totalLength = 0;
  for (let i = 0; i < vertices.length - 1; i++) {
    const point1 = L.latLng(vertices[i]);
    const point2 = L.latLng(vertices[i + 1]);
    totalLength += point1.distanceTo(point2);
  }
  return Math.round(totalLength); // distance in meters
};

const useStore = create((set, get) => ({
  nodes: [],
  pipes: [],
  selectedObject: null,

  addNode: (nodeData) => {
    const newNode = { ...nodeData, name: 'New Node', nodeType: 'consumer', elevation: 0 };
    set((state) => ({ nodes: [...state.nodes, newNode] }));
  },
  
  // addPipe теперь принимает полный объект трубы, включая вершины
  addPipe: (pipeData) => {
    const { nodes } = get();
    const startNode = nodes.find(n => n.id === pipeData.startNodeId);
    const endNode = nodes.find(n => n.id === pipeData.endNodeId);

    if (!startNode || !endNode) {
      console.error("Pipe creation failed: Start or end node not found.");
      return;
    }

    const newPipe = {
      id: crypto.randomUUID(),
      type: 'pipe',
      ...pipeData, // { startNodeId, endNodeId, vertices }
      length: calculatePolylineLength(pipeData.vertices),
      diameter: 100, // Default values
      material: 'steel',
    };
    set((state) => ({ pipes: [...state.pipes, newPipe] }));
    // Сразу выбираем новую трубу для редактирования свойств
    set({ selectedObject: { type: 'pipe', id: newPipe.id } });
  },

  setNodes: (nodes) => set({ nodes, selectedObject: null }),
  setPipes: (pipes) => set({ pipes }),

  setSelectedObject: (object) => set({ selectedObject: object }),

  updateNode: (nodeId, updatedProperties) => {
    set((state) => ({
      nodes: state.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updatedProperties } : node
      ),
    }));
  },

  updatePipe: (pipeId, updatedProperties) => {
    set((state) => ({
      pipes: state.pipes.map(pipe => 
        pipe.id === pipeId ? { ...pipe, ...updatedProperties } : pipe
      ),
    }));
  },

  deleteObject: ({ type, id }) => {
    set({ selectedObject: null });
    if (type === 'node') {
      set(state => ({
        nodes: state.nodes.filter(node => node.id !== id),
        pipes: state.pipes.filter(pipe => pipe.startNodeId !== id && pipe.endNodeId !== id)
      }));
    } else if (type === 'pipe') {
      set(state => ({
        pipes: state.pipes.filter(pipe => pipe.id !== id)
      }));
    }
  },
}));

export default useStore;
