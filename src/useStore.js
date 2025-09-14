import { create } from 'zustand';
import L from 'leaflet';

const calculateLength = (node1, node2) => {
  if (!node1 || !node2) return 0;
  const point1 = L.latLng(node1.lat, node1.lng);
  const point2 = L.latLng(node2.lat, node2.lng);
  return Math.round(point1.distanceTo(point2));
};

const useStore = create((set, get) => ({
  nodes: [],
  pipes: [],
  selectedObject: null,

  // Actions to add single items
  addNode: (nodeData) => {
    const newNode = { ...nodeData, name: 'New Node', nodeType: 'consumer', elevation: 0 };
    set((state) => ({ nodes: [...state.nodes, newNode] }));
  },
  
  addPipe: ({ startNodeId, endNodeId }) => {
    const { nodes } = get();
    const startNode = nodes.find(n => n.id === startNodeId);
    const endNode = nodes.find(n => n.id === endNodeId);
    if (!startNode || !endNode) return;

    const newPipe = {
      id: crypto.randomUUID(),
      type: 'pipe',
      startNodeId,
      endNodeId,
      length: calculateLength(startNode, endNode),
      diameter: 100,
      material: 'steel',
    };
    set((state) => ({ pipes: [...state.pipes, newPipe] }));
  },

  // Actions to replace the entire dataset
  setNodes: (nodes) => set({ nodes, selectedObject: null }), // Сбрасываем выбор при импорте
  setPipes: (pipes) => set({ pipes }),

  // Actions to manage selection and updates
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
