import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useStore from '../useStore';
import DrawingHandler from './DrawingHandler';

// --- Исправление для иконок маркеров ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const nodeIconConfig = {
  source: { emoji: '🏭', color: '#4CAF50' },
  consumer: { emoji: '🏠', color: '#F44336' },
  chamber: { emoji: '⊡', color: '#607D8B' },
  diameter_change: { emoji: '↕️', color: '#9C27B0' },
  valve: { emoji: '🚰', color: '#03A9F4' },
  default: { emoji: '❓', color: '#9E9E9E' }
};

const getMarkerIcon = (nodeType, isMoving) => {
  const config = nodeIconConfig[nodeType] || nodeIconConfig.default;
  const iconSize = 20;
  const fontSize = 12;
  const html = `
    <div style=\"
      background-color: ${isMoving ? '#FFC107' : config.color};
      width: ${iconSize}px;
      height: ${iconSize}px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: ${fontSize}px;
      border: 1.5px solid #fff;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
    \">
      ${config.emoji}
    </div>
  `;
  return L.divIcon({
    html: html,
    className: 'custom-emoji-icon',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2]
  });
};

const Map = ({ drawingMode, setDrawingMode }) => {
  const { 
    nodes, 
    pipes, 
    setSelectedObject, 
    movingNodeId,
    editingPipeId,
    selectedVertexIndex,
    setSelectedVertexIndex,
    updatePipeEndpoint
  } = useStore(state => state);

  const bounds = [
    [59.77001946144852, 32.040546654692974],
    [60.46696006998797, 33.09151159242312]
  ];

  const editingPipe = pipes.find(p => p.id === editingPipeId);
  const isMovingEndpoint = editingPipe && (selectedVertexIndex === 0 || selectedVertexIndex === editingPipe.vertices.length - 1);

  return (
    <MapContainer 
        bounds={bounds}
        style={{ height: '100%', width: '100%' }} 
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <DrawingHandler drawingMode={drawingMode} setDrawingMode={setDrawingMode} />
      
      {pipes.map(pipe => {
          const isEditing = pipe.id === editingPipeId;
          return (
            <Polyline 
                key={pipe.id}
                positions={pipe.vertices}
                color={isEditing ? '#FFC107' : '#0000ff'} // Желтый, если редактируется
                weight={isEditing ? 6 : 4}
                eventHandlers={{
                    click: (e) => {
                        if (movingNodeId || editingPipeId) {
                            L.DomEvent.stopPropagation(e);
                            return;
                        }
                        L.DomEvent.stopPropagation(e);
                        setSelectedObject({ id: pipe.id, type: 'pipe' });
                    }
                }}
            />
          )
      })}

      {nodes.map(node => (
        <Marker 
          key={node.id} 
          position={[node.lat, node.lng]} 
          icon={getMarkerIcon(node.nodeType, node.id === movingNodeId)}
          eventHandlers={{
            click: (e) => {
                L.DomEvent.stopPropagation(e);

                // Логика привязки конечной точки трубы
                if (isMovingEndpoint) {
                    const disallowedNodeId = selectedVertexIndex === 0 ? editingPipe.endNodeId : editingPipe.startNodeId;
                    if (node.id === disallowedNodeId) {
                        // Нельзя привязать трубу саму к себе
                        return; 
                    }
                    updatePipeEndpoint(editingPipeId, selectedVertexIndex, node.id, [node.lat, node.lng]);
                    setSelectedVertexIndex(null); // Завершаем перемещение
                    return; // Прерываем дальнейшее выполнение
                }

              // Остальная логика клика по узлу
              if (movingNodeId || drawingMode === 'pipe' || editingPipeId) {
                return;
              }

              setSelectedObject({ id: node.id, type: 'node' });
            },
          }}
        />
      ))}
    </MapContainer>
  );
};

export default Map;
