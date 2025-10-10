import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useStore from '../useStore';
import DrawingHandler from './DrawingHandler';
import AnnotationLayer from './AnnotationLayer';

const nodeIconConfig = {
  source: { emoji: '🏭', color: '#4CAF50' },
  consumer: { emoji: '🏠', color: '#F44336' },
  chamber: { emoji: '⊡', color: '#607D8B' },
  valve: { emoji: '🚰', color: '#03A9F4' },
  diameter_change: { emoji: '↕️', color: '#9C27B0' },
  default: { emoji: '❓', color: '#9E9E9E' }
};

const NODE_TYPE_TRANSLATIONS = {
    source: 'Источник',
    consumer: 'Потребитель',
    chamber: 'Камера',
    valve: 'Арматура',
    diameter_change: 'Смена диаметра'
};

// --- Функция getMarkerIcon изменена ---
const getMarkerIcon = (nodeType, isMoving, isSelected, isHovered, isEditing, forceLarge) => {
  const config = nodeIconConfig[nodeType] || nodeIconConfig.default;
  // Теперь isEnlarged зависит и от forceLarge
  const isEnlarged = forceLarge || isMoving || isSelected || isHovered || isEditing;
  const size = isEnlarged ? 26 : 10;
  
  const emojiStyle = `
    font-size: 14px;
    color: white;
    opacity: ${isEnlarged ? 1 : 0};
    transform: scale(${isEnlarged ? 1 : 0.4});
    transition: opacity 0.1s ease-out, transform 0.15s ease-out;
  `;

  const containerStyle = `
    background-color: ${isMoving ? '#FFC107' : config.color};
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1.5px solid #fff;
    box-shadow: 0 0 5px rgba(0,0,0,0.6);
    transition: width 0.15s ease-in-out, height 0.15s ease-in-out;
  `;

  const html = `<div style="${containerStyle}"><span style="${emojiStyle}">${config.emoji}</span></div>`;

  return L.divIcon({
    html: html,
    className: 'custom-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const MouseProximityHandler = ({ setHoveredNodeId }) => {
  const { nodes } = useStore();
  const map = useMap();
  const hoverPixelRadius = 50;

  useMapEvents({
    mousemove: (e) => {
      const cursorPoint = e.containerPoint;
      let foundNodeId = null;
      for (const node of nodes) {
        const nodePoint = map.latLngToContainerPoint([node.lat, node.lng]);
        const distance = Math.sqrt(Math.pow(nodePoint.x - cursorPoint.x, 2) + Math.pow(nodePoint.y - cursorPoint.y, 2));
        if (distance < hoverPixelRadius) {
          foundNodeId = node.id;
          break;
        }
      }
      setHoveredNodeId(foundNodeId);
    },
    mouseout: () => setHoveredNodeId(null),
  });

  return null;
};

const Map = ({ drawingMode, setDrawingMode, children }) => {
  const { 
    nodes, pipes, selectedObject, setSelectedObject, movingNodeId,
    editingPipeId, selectedVertexIndex, setSelectedVertexIndex,
    updatePipeEndpoint, isDrawing, startDrawing, finishDrawing,
    viewOptions // <-- Получаем viewOptions из стора
  } = useStore(state => state);

  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const bounds = [[59.77001946144852, 32.040546654692974], [60.46696006998797, 33.09151159242312]];
  const editingPipe = pipes.find(p => p.id === editingPipeId);
  const isMovingEndpoint = editingPipe && (selectedVertexIndex === 0 || selectedVertexIndex === editingPipe.vertices.length - 1);

  return (
    <MapContainer bounds={bounds} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
      <DrawingHandler drawingMode={drawingMode} setDrawingMode={setDrawingMode} />
      <MouseProximityHandler setHoveredNodeId={setHoveredNodeId} />
      
      {pipes.map(pipe => (
          pipe.id !== editingPipeId && <Polyline key={pipe.id} positions={pipe.vertices} pathOptions={{ color: '#3388ff', weight: 5 }} eventHandlers={{ click: (e) => { if (!movingNodeId && !editingPipeId && !isDrawing) { L.DomEvent.stopPropagation(e); setSelectedObject({ id: pipe.id, type: 'pipe' }); }}}} />
      ))}

      {nodes.map(node => {
        const isSelected = selectedObject?.id === node.id;
        const isHovered = hoveredNodeId === node.id;
        const isEditing = !!editingPipeId;

        return (
          <Marker 
            key={node.id} 
            position={[node.lat, node.lng]} 
            // Передаем forceLargeNodes в функцию
            icon={getMarkerIcon(node.nodeType, node.id === movingNodeId, isSelected, isHovered, isEditing, viewOptions.forceLargeNodes)}
            eventHandlers={{ click: (e) => {
              L.DomEvent.stopPropagation(e);
              if (drawingMode === 'pipe') {
                isDrawing ? finishDrawing(node) : startDrawing(node);
                if(isDrawing) setDrawingMode('none');
                return;
              }
              if (isMovingEndpoint) {
                const disallowedNodeId = selectedVertexIndex === 0 ? editingPipe.endNodeId : editingPipe.startNodeId;
                if (node.id === disallowedNodeId) return;
                updatePipeEndpoint(editingPipeId, selectedVertexIndex, node.id, [node.lat, node.lng]);
                setSelectedVertexIndex(null); 
                return; 
              }
              if (!movingNodeId && !editingPipeId) {
                setSelectedObject({ id: node.id, type: 'node' });
              }
            }}}
          >
            <Tooltip direction="top" offset={[0, -13]}>
                <b>{node.name || 'Без имени'}</b>
                <br />
                Тип: {NODE_TYPE_TRANSLATIONS[node.nodeType] || 'Неизвестный'}
            </Tooltip>
          </Marker>
        )
      })}
      
      <AnnotationLayer />

      {children} 
    </MapContainer>
  );
};

export default Map;
