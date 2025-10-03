import React from 'react';
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
  const html = `
    <div style=\"
      background-color: ${isMoving ? '#FFC107' : config.color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 12px;
      border: 1.5px solid #fff;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
    \">
      ${config.emoji}
    </div>
  `;
  return L.divIcon({
    html: html,
    className: 'custom-marker-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
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
    updatePipeEndpoint, 
    // --- Получаем новые actions из store ---
    isDrawing,
    startDrawing,
    finishDrawing
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

      {/* Передаем setDrawingMode для сброса режима после завершения */}
      <DrawingHandler drawingMode={drawingMode} setDrawingMode={setDrawingMode} />
      
      {pipes.map(pipe => {
          if (pipe.id === editingPipeId) return null;

          return (
            <Polyline 
                key={pipe.id}
                positions={pipe.vertices}
                pathOptions={{ color: '#3388ff', weight: 5 }}
                eventHandlers={{
                    click: (e) => {
                        if (movingNodeId || editingPipeId || isDrawing) {
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
              L.DomEvent.stopPropagation(e); // Всегда останавливаем всплытие

              // --- НОВАЯ ЛОГИКА РИСОВАНИЯ ---
              if (drawingMode === 'pipe') {
                if (!isDrawing) {
                  startDrawing(node); // Начинаем рисовать с этого узла
                } else {
                  finishDrawing(node); // Заканчиваем рисовать на этом узле
                  setDrawingMode('none'); // Сбрасываем режим в UI
                }
                return;
              }
              // --------------------------------

              // Логика привязки конечной точки трубы к узлу
              if (isMovingEndpoint) {
                const disallowedNodeId = selectedVertexIndex === 0 ? editingPipe.endNodeId : editingPipe.startNodeId;
                if (node.id === disallowedNodeId) return;
                
                updatePipeEndpoint(editingPipeId, selectedVertexIndex, node.id, [node.lat, node.lng]);
                setSelectedVertexIndex(null); 
                return; 
              }

              // Блокируем выбор узла, если активен другой режим
              if (movingNodeId || editingPipeId) {
                return;
              }

              // Действие по умолчанию: выбрать узел
              setSelectedObject({ id: node.id, type: 'node' });
            },
          }}
        />
      ))}
    </MapContainer>
  );
};

export default Map;
