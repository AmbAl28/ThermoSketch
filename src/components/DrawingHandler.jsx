import React, { useState, useEffect, useCallback } from 'react';
import { useMap, useMapEvents, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import useStore from '../useStore';
import VertexMarker from './VertexMarker';

const SNAPPING_RADIUS = 30;
const VERTEX_PANE = 'vertex-pane';

// --- НОВЫЙ, УПРОЩЕННЫЙ КОМПОНЕНТ ---
const DrawingHandler = ({ drawingMode, setDrawingMode }) => {
  const {
    nodes,
    pipes,
    addNode,
    movingNodeId,
    setMovingNodeId,
    updateNodePosition,
    editingPipeId,
    editingMode,
    updatePipeVertices,
    finishPipeEditing,
    selectedVertexIndex,
    setSelectedVertexIndex,
    updatePipeEndpoint, 
    // --- Получаем состояние и actions рисования из store ---
    isDrawing,
    drawingVertices,
    addDrawingVertex,
    resetDrawing,
  } = useStore();
  
  const map = useMap();

  useEffect(() => {
    const pane = map.getPane(VERTEX_PANE);
    if (!pane) {
      map.createPane(VERTEX_PANE);
      map.getPane(VERTEX_PANE).style.zIndex = 650;
    }
  }, [map]);

  const [cursorPos, setCursorPos] = useState(null);
  const [snappedNode, setSnappedNode] = useState(null);
  
  const editingPipe = pipes.find(p => p.id === editingPipeId);
  const isMovingEndpoint = editingPipe && (selectedVertexIndex === 0 || selectedVertexIndex === editingPipe.vertices.length - 1);

  useEffect(() => {
    if (editingMode !== 'move') {
      setSelectedVertexIndex(null);
    }
  }, [editingMode, setSelectedVertexIndex]);

  useEffect(() => {
    const mapContainer = map.getContainer();
    if (movingNodeId || (editingPipeId && selectedVertexIndex === null)) {
      mapContainer.style.cursor = 'crosshair';
    } else if (editingPipeId && selectedVertexIndex !== null) {
      mapContainer.style.cursor = 'pointer';
    } else {
      mapContainer.style.cursor = ''; 
    }
    return () => {
      mapContainer.style.cursor = '';
    };
  }, [movingNodeId, editingPipeId, map, selectedVertexIndex]);

  const findNearbyNode = useCallback((latlng) => {
    let nearestNode = null;
    let minDistance = Infinity;
    const cursorPoint = map.latLngToContainerPoint(latlng);
    
    const disallowedNodeId = editingPipe ? 
      (selectedVertexIndex === 0 ? editingPipe.endNodeId : editingPipe.startNodeId) 
      : null;

    nodes.forEach(node => {
        if(node.id === disallowedNodeId) return;

      const nodePoint = map.latLngToContainerPoint([node.lat, node.lng]);
      const distance = cursorPoint.distanceTo(nodePoint);
      if (distance < SNAPPING_RADIUS && distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    });
    return nearestNode;
  }, [map, nodes, editingPipe, selectedVertexIndex]);

  const getClosestPointOnSegment = (point, start, end) => {
    const pointPx = map.latLngToContainerPoint(point);
    const startPx = map.latLngToContainerPoint(start);
    const endPx = map.latLngToContainerPoint(end);
    const segmentLengthSq = startPx.distanceTo(endPx) ** 2;
    if (segmentLengthSq === 0) return map.containerPointToLatLng(startPx);
    let t = ((pointPx.x - startPx.x) * (endPx.x - startPx.x) + (pointPx.y - startPx.y) * (endPx.y - startPx.y)) / segmentLengthSq;
    t = Math.max(0, Math.min(1, t)); 
    const closestPointPx = L.point(startPx.x + t * (endPx.x - startPx.x), startPx.y + t * (endPx.y - startPx.y));
    return map.containerPointToLatLng(closestPointPx);
  };

  const handleVertexClick = (index) => {
    if (!editingPipe) return;
    if (editingMode === 'move') {
      setSelectedVertexIndex(index);
    } else if (editingMode === 'delete') {
        if(index === 0 || index === editingPipe.vertices.length - 1) {
            alert('Нельзя удалить вершины, привязанные к узлам');
            return;
        }
      const newVertices = editingPipe.vertices.filter((_, i) => i !== index);
      updatePipeVertices(editingPipeId, newVertices);
    }
  };

  const handlePolylineClick = (e) => {
    if (!editingPipe || editingMode !== 'add') return;
    L.DomEvent.stopPropagation(e);
    let closestPoint = null;
    let segmentIndex = -1;
    let minDistance = Infinity;
    for (let i = 0; i < editingPipe.vertices.length - 1; i++) {
      const start = L.latLng(editingPipe.vertices[i]);
      const end = L.latLng(editingPipe.vertices[i + 1]);
      const point = getClosestPointOnSegment(e.latlng, start, end);
      const distance = e.latlng.distanceTo(point);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
        segmentIndex = i;
      }
    }
    if (closestPoint && segmentIndex !== -1) {
      const newVertices = [...editingPipe.vertices];
      newVertices.splice(segmentIndex + 1, 0, [closestPoint.lat, closestPoint.lng]);
      updatePipeVertices(editingPipeId, newVertices);
    }
  }

  useMapEvents({
    click(e) {
        // --- ОБНОВЛЕННАЯ ЛОГИКА КЛИКА ПО КАРТЕ ---
        // Клик по узлу теперь обрабатывается в Map.jsx и здесь не учитывается

        if (isDrawing) {
            // Если рисуем трубу - добавляем промежуточную точку
            addDrawingVertex(e.latlng);
            return;
        }

        if (movingNodeId) {
            updateNodePosition(movingNodeId, e.latlng);
            setMovingNodeId(null);
            return;
        }

        if (editingPipeId && editingMode === 'move' && selectedVertexIndex !== null && !isMovingEndpoint) {
            const newVertices = [...editingPipe.vertices];
            newVertices[selectedVertexIndex] = [e.latlng.lat, e.latlng.lng];
            updatePipeVertices(editingPipeId, newVertices);
            setSelectedVertexIndex(null);
            return;
        }

        if (isMovingEndpoint) {
            const nearbyNode = findNearbyNode(e.latlng);
            if (nearbyNode) return; // Клик по узлу обработается в Map.jsx
            
            // Создаем новый узел при клике в пустом месте
            const newNode = { id: crypto.randomUUID(), lat: e.latlng.lat, lng: e.latlng.lng };
            addNode(newNode);
            updatePipeEndpoint(editingPipeId, selectedVertexIndex, newNode.id, [newNode.lat, newNode.lng]);
            setSelectedVertexIndex(null);
            return;
        }

        if (drawingMode === 'point') {
            addNode({ id: crypto.randomUUID(), lat: e.latlng.lat, lng: e.latlng.lng });
            setDrawingMode('none');
            return;
        }
    },

    mousemove(e) {
      setCursorPos(e.latlng);
      // Подсветка работает как для нового рисования, так и для перемещения конца трубы
      if (isDrawing || isMovingEndpoint) {
        const nearbyNode = findNearbyNode(e.latlng);
        setSnappedNode(nearbyNode);
      } else {
        setSnappedNode(null);
      }
    },

    // Двойной клик больше не нужен, т.к. завершение происходит по клику на узел
  });

  // --- Обработка Escape ---
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            if (isDrawing) {
                resetDrawing();
                setDrawingMode('none'); // Также сбрасываем режим в UI
            }
            if (movingNodeId) {
                setMovingNodeId(null);
            }
            if (selectedVertexIndex !== null) {
                setSelectedVertexIndex(null);
            }
            if (editingPipeId) {
                finishPipeEditing();
            }
            setSnappedNode(null);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, resetDrawing, setDrawingMode, movingNodeId, setMovingNodeId, selectedVertexIndex, editingPipeId, finishPipeEditing, setSelectedVertexIndex]);

  // --- Отрисовка вспомогательных элементов ---
  let rubberBandLine = null;
  if (isDrawing && cursorPos && drawingVertices.length > 0) {
    const lastVertex = drawingVertices[drawingVertices.length - 1];
    rubberBandLine = <Polyline positions={[lastVertex, [cursorPos.lat, cursorPos.lng]]} color="#ff0000" dashArray="5, 10" />;
  }
  
  let movingVertexLine = null;
  if (editingPipe && selectedVertexIndex !== null && cursorPos) {
      const vertices = editingPipe.vertices;
      if(selectedVertexIndex > 0 && selectedVertexIndex < vertices.length - 1) {
          const prevVertex = vertices[selectedVertexIndex - 1];
          const nextVertex = vertices[selectedVertexIndex + 1];
          movingVertexLine = (
              <>
                <Polyline positions={[prevVertex, [cursorPos.lat, cursorPos.lng]]} color="#FFC107" dashArray="5, 5" pane={VERTEX_PANE} />
                <Polyline positions={[[cursorPos.lat, cursorPos.lng], nextVertex]} color="#FFC107" dashArray="5, 5" pane={VERTEX_PANE} />
              </>
          )
      } else if (isMovingEndpoint) {
        const otherEndIndex = selectedVertexIndex === 0 ? 1 : vertices.length - 2;
        const otherEnd = vertices[otherEndIndex];
        movingVertexLine = <Polyline positions={[otherEnd, [cursorPos.lat, cursorPos.lng]]} color="#FFC107" dashArray="5, 5" pane={VERTEX_PANE} />
      }
  }

  const snappedNodeIcon = L.divIcon({
    className: 'snapped-node-icon',
    iconSize: [SNAPPING_RADIUS * 2, SNAPPING_RADIUS * 2],
  });

  return (
    <>
      {/* Линия, которая рисуется в данный момент */}
      {isDrawing && <Polyline positions={drawingVertices} color="#ff0000" />}
      {rubberBandLine}

      {/* Линии для перемещения вершины существующей трубы */}
      {movingVertexLine}
      
      {/* Подсветка редактируемой трубы */}
      {editingPipe && (
        <Polyline 
            positions={editingPipe.vertices}
            pathOptions={{ color: '#FFC107', weight: 6, pane: VERTEX_PANE }}
            eventHandlers={{ click: handlePolylineClick }}
        />
      )}

      {/* Зеленая, не-кликабельная подсветка узла для привязки */}
      {snappedNode && (isDrawing || isMovingEndpoint) && (
          <Marker 
            position={[snappedNode.lat, snappedNode.lng]} 
            icon={snappedNodeIcon} 
            interactive={false} // Ключевое свойство!
            pane={VERTEX_PANE}
          />
      )}
      
      {/* Маркеры вершин редактируемой трубы */}
      {editingPipe && editingPipe.vertices.map((vertex, index) => (
        <VertexMarker 
          key={index} 
          center={vertex} 
          isVisible={true} 
          isSelected={selectedVertexIndex === index}
          onClick={() => handleVertexClick(index)}
          pane={VERTEX_PANE}
        />
      ))}
    </>
  );
};

export default DrawingHandler;
