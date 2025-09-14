import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Кастомный объект для хранения, который перехватывает ошибки парсинга JSON.
const safeJsonStorage = {
  getItem: (name) => {
    const str = localStorage.getItem(name);
    // Если данных нет, возвращаем null.
    if (!str) {
      return null; 
    }
    try {
        // Проверяем, являются ли данные валидным JSON.
        JSON.parse(str);
        return str; // Возвращаем строку, если все в порядке.
    } catch (e) {
        console.error("Обнаружены поврежденные данные в localStorage, они будут очищены:", e);
        alert("Не удалось загрузить сохраненные данные. Они будут очищены.");
        localStorage.removeItem(name); // Удаляем поврежденные данные
        return null; // Возвращаем null, чтобы Zustand начал с чистого листа.
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
    (set, get) => ({
      nodes: [],
      pipes: [],
      selectedObject: null,

      setNodes: (nodes) => set({ nodes }),
      setPipes: (pipes) => set({ pipes }),

      addNode: (node) => set((state) => ({ 
        nodes: [
          ...state.nodes, 
          { 
            ...node, 
            name: `Узел ${state.nodes.length + 1}`, 
            type: 'node', 
            nodeType: 'chamber', // Тип узла по умолчанию
            elevation: 0, // Высота по умолчанию
          }
        ]
      })),
      addPipe: (pipe) => set((state) => {
        const startNode = state.nodes.find(n => n.id === pipe.startNodeId);
        const endNode = state.nodes.find(n => n.id === pipe.endNodeId);
        if (!startNode || !endNode) return state; // Не добавлять, если узлы не найдены

        // Простое вычисление длины по прямой для примера
        const length = L.latLng(startNode.lat, startNode.lng).distanceTo(L.latLng(endNode.lat, endNode.lng));
        
        return { 
            pipes: [
                ...state.pipes, 
                { 
                    ...pipe, 
                    id: crypto.randomUUID(), 
                    type: 'pipe', 
                    length: Math.round(length),
                    diameter: 100, // Значение по умолчанию
                    material: 'steel' // Значение по умолчанию
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
            // Также удаляем все трубы, подключенные к этому узлу
            const connectedPipes = state.pipes.filter(p => p.startNodeId === object.id || p.endNodeId === object.id).map(p => p.id);
            return {
                nodes: state.nodes.filter(n => n.id !== object.id),
                pipes: state.pipes.filter(p => !connectedPipes.includes(p.id)),
                selectedObject: null,
            }
        } else { // type === 'pipe'
            return {
                pipes: state.pipes.filter(p => p.id !== object.id),
                selectedObject: null,
            }
        }
      }),

      // Новый экшен для полной очистки проекта
      clearProject: () => {
        // Просто сбрасываем состояние. Middleware `persist` автоматически очистит localStorage.
        set({ nodes: [], pipes: [], selectedObject: null });
      },
    }),
    {
      name: 'thermal-network-storage', // Имя ключа в localStorage
      storage: createJSONStorage(() => safeJsonStorage), // Используем наш безопасный объект хранения
      // Мы сохраняем только узлы и трубы
      partialize: (state) => ({ nodes: state.nodes, pipes: state.pipes }),
    }
  )
);

export default useStore;
