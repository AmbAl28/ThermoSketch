import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useStore from '../useStore';

// Импортируем компонент для нового режима рисования
import DrawingHandler from './DrawingHandler';

// Стандартная иконка для узлов
const defaultIcon = new L.Icon.Default();

const Map = ({ drawingMode, setDrawingMode }) => {
  const { nodes, pipes, selectedObject, setSelectedObject } = useStore();

  const handleNodeClick = (e, node) => {
    // Предотвращаем клик по карте, когда кликаем по маркеру
    L.DomEvent.stopPropagation(e);
    
    // Если мы не в режиме рисования трубы, просто выбираем узел
    if (drawingMode !== 'pipe') {
        setSelectedObject({ type: 'node', id: node.id });
    }
    // Логика для режима рисования будет в DrawingHandler
  };

  const handlePipeClick = (e, pipe) => {
    L.DomEvent.stopPropagation(e);
    setSelectedObject({ type: 'pipe', id: pipe.id });
  };

  return (
    <MapContainer center={[55.75, 37.57]} zoom={10} style={{ height: '100vh', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Компонент, который будет управлять всей логикой рисования */}
      <DrawingHandler drawingMode={drawingMode} setDrawingMode={setDrawingMode} />

      {/* Отрисовка всех узлов */}
      {nodes.map(node => (
        <Marker 
          key={node.id} 
          position={[node.lat, node.lng]}
          icon={defaultIcon}
          eventHandlers={{
            click: (e) => handleNodeClick(e, node),
          }}
          // Простое выделение выбранного узла
          opacity={selectedObject?.id === node.id ? 0.7 : 1.0}
        />
      ))}

      {/* Отрисовка всех труб по их вершинам */}
      {pipes.map(pipe => {
        // Проверяем, что вершины существуют и их как минимум две
        if (!pipe.vertices || pipe.vertices.length < 2) {
            return null; 
        }

        return (
          <Polyline 
            key={pipe.id} 
            positions={pipe.vertices} 
            eventHandlers={{
              click: (e) => handlePipeClick(e, pipe),
            }}
            // Выделяем выбранную трубу цветом
            color={selectedObject?.id === pipe.id ? '#ff4500' : '#007bff'} 
            weight={selectedObject?.id === pipe.id ? 7 : 5}
          />
        );
      })}

    </MapContainer>
  );
};

export default Map;
