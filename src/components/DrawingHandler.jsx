import { useState, useEffect, useCallback } from 'react';
import { useMap, useMapEvents, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import useStore from '../useStore';

const SNAPPING_RADIUS = 30;
const MIN_PIPE_LENGTH = 1; // Минимальная длина трубы в метрах

const DrawingHandler = ({ drawingMode, setDrawingMode }) => {
  const { nodes, addNode, addPipe, movingNodeId, setMovingNodeId, updateNodePosition } = useStore();
  const map = useMap();

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentVertices, setCurrentVertices] = useState([]);
  const [cursorPos, setCursorPos] = useState(null);
  const [startNodeId, setStartNodeId] = useState(null);
  const [snappedNode, setSnappedNode] = useState(null);

  useEffect(() => {
    const mapContainer = map.getContainer();
    if (movingNodeId) {
      mapContainer.style.cursor = 'crosshair';
    } else {
      mapContainer.style.cursor = ''; 
    }
    return () => {
      mapContainer.style.cursor = '';
    };
  }, [movingNodeId, map]);

  const findNearbyNode = useCallback((latlng) => {
    let nearestNode = null;
    let minDistance = Infinity;
    const cursorPoint = map.latLngToContainerPoint(latlng);
    nodes.forEach(node => {
      const nodePoint = map.latLngToContainerPoint([node.lat, node.lng]);
      const distance = cursorPoint.distanceTo(nodePoint);
      if (distance < SNAPPING_RADIUS && distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    });
    return nearestNode;
  }, [map, nodes]);

  const startDrawing = (node) => {
    setIsDrawing(true);
    setStartNodeId(node.id);
    setCurrentVertices([[node.lat, node.lng]]);
  };

  const resetDrawing = useCallback(() => {
    setIsDrawing(false);
    setCurrentVertices([]);
    setCursorPos(null);
    setStartNodeId(null);
    setDrawingMode('none');
  }, [setDrawingMode]);

  const finishDrawing = useCallback((endNode) => {
    if (!isDrawing || !startNodeId || !endNode || currentVertices.length < 1) {
      resetDrawing();
      return;
    }

    // ПРОВЕРКА: Нельзя завершить трубу на начальном узле без промежуточных точек
    if (endNode.id === startNodeId && currentVertices.length === 1) {
        return; // Просто игнорируем, позволяя пользователю продолжить рисование
    }

    const finalVertices = [...currentVertices, [endNode.lat, endNode.lng]];

    let totalLength = 0;
    for (let i = 0; i < finalVertices.length - 1; i++) {
      const [lat1, lng1] = finalVertices[i];
      const [lat2, lng2] = finalVertices[i + 1];
      totalLength += L.latLng(lat1, lng1).distanceTo(L.latLng(lat2, lng2));
    }

    // ПРОВЕРКА: Минимальная длина трубы
    if (totalLength < MIN_PIPE_LENGTH) {
        return; // Игнорируем, если длина слишком мала
    }
    
    addPipe({
      startNodeId: startNodeId,
      endNodeId: endNode.id,
      vertices: finalVertices,
      length: Math.round(totalLength),
    });

    resetDrawing();
  }, [isDrawing, startNodeId, currentVertices, addPipe, resetDrawing]);

  useMapEvents({
    click(e) {
        if (movingNodeId) {
            updateNodePosition(movingNodeId, e.latlng);
            setMovingNodeId(null);
            return;
        }

        if (drawingMode === 'point') {
            addNode({ 
                id: crypto.randomUUID(), 
                lat: e.latlng.lat, lng: e.latlng.lng 
            });
            setDrawingMode('none');
            return;
        }

        if (drawingMode === 'pipe') {
            const nearbyNode = findNearbyNode(e.latlng);

            if (!isDrawing) { 
                if (nearbyNode) {
                    startDrawing(nearbyNode);
                } else {
                    alert('Отрисовка трубы должна начинаться с существующего узла.');
                }
            } else { 
                if (nearbyNode) {
                    finishDrawing(nearbyNode);
                } else {
                    setCurrentVertices(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
                }
            }
        }
    },

    mousemove(e) {
      if (drawingMode === 'pipe') {
        const nearbyNode = findNearbyNode(e.latlng);
        setSnappedNode(nearbyNode);
      } else {
        setSnappedNode(null);
      }

      if (isDrawing) {
        setCursorPos(e.latlng);
      }
    },

    dblclick(e) {
        if (isDrawing) {
            const nearbyNode = findNearbyNode(e.latlng);
            if (nearbyNode) {
                finishDrawing(nearbyNode);
            } else {
                alert('Отрисовка трубы должна заканчиваться на существующем узле.');
            }
        }
    }
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            if (isDrawing) {
                resetDrawing();
            }
            if (movingNodeId) {
                setMovingNodeId(null);
            }
        }
        if (e.key === 'Enter' && cursorPos) {
            const nearbyNode = findNearbyNode(cursorPos);
            if (nearbyNode) {
                finishDrawing(nearbyNode);
            } else {
                alert('Отрисовка трубы должна заканчиваться на существующем узle.');
            }
        }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cursorPos, findNearbyNode, finishDrawing, resetDrawing, isDrawing, movingNodeId, setMovingNodeId]);

  let rubberBandLine = null;
  if (isDrawing && cursorPos && currentVertices.length > 0) {
    const lastVertex = currentVertices[currentVertices.length - 1];
    rubberBandLine = <Polyline positions={[lastVertex, [cursorPos.lat, cursorPos.lng]]} color="#ff0000" dashArray="5, 10" />;
  }

  const snappedNodeIcon = L.divIcon({
    className: 'snapped-node-icon',
    iconSize: [SNAPPING_RADIUS * 2, SNAPPING_RADIUS * 2],
  });

  return (
    <>
      {isDrawing && <Polyline positions={currentVertices} color="#ff0000" />}
      {rubberBandLine}
      {snappedNode && drawingMode === 'pipe' && <Marker position={[snappedNode.lat, snappedNode.lng]} icon={snappedNodeIcon} interactive={false} />}
    </>
  );
};

export default DrawingHandler;
