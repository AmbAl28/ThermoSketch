import { useState, useEffect, useCallback } from 'react';
import { useMap, useMapEvents, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import useStore from '../useStore';
import VertexMarker from './VertexMarker';

const SNAPPING_RADIUS = 30;
const MIN_PIPE_LENGTH = 1; // Минимальная длина трубы в метрах

const DrawingHandler = ({ drawingMode, setDrawingMode }) => {
  const { 
    nodes, 
    pipes, 
    addNode, 
    addPipe, 
    movingNodeId, 
    setMovingNodeId, 
    updateNodePosition, 
    editingPipeId, 
    editingMode, 
    updatePipeVertices,
    finishPipeEditing,
    selectedVertexIndex,
    setSelectedVertexIndex, 
  } = useStore();
  const map = useMap();

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentVertices, setCurrentVertices] = useState([]);
  const [cursorPos, setCursorPos] = useState(null);
  const [startNodeId, setStartNodeId] = useState(null);
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

    if (endNode.id === startNodeId && currentVertices.length === 1) {
        return;
    }

    const finalVertices = [...currentVertices, [endNode.lat, endNode.lng]];

    let totalLength = 0;
    for (let i = 0; i < finalVertices.length - 1; i++) {
      const [lat1, lng1] = finalVertices[i];
      const [lat2, lng2] = finalVertices[i + 1];
      totalLength += L.latLng(lat1, lng1).distanceTo(L.latLng(lat2, lng2));
    }

    if (totalLength < MIN_PIPE_LENGTH) {
        return;
    }
    
    addPipe({
      startNodeId: startNodeId,
      endNodeId: endNode.id,
      vertices: finalVertices,
      length: Math.round(totalLength),
    });

    resetDrawing();
  }, [isDrawing, startNodeId, currentVertices, addPipe, resetDrawing]);

  const getClosestPointOnSegment = (point, start, end) => {
    const pointPx = map.latLngToContainerPoint(point);
    const startPx = map.latLngToContainerPoint(start);
    const endPx = map.latLngToContainerPoint(end);
  
    const segmentLengthSq = startPx.distanceTo(endPx) ** 2;
    if (segmentLengthSq === 0) return map.containerPointToLatLng(startPx);
  
    let t = ((pointPx.x - startPx.x) * (endPx.x - startPx.x) + (pointPx.y - startPx.y) * (endPx.y - startPx.y)) / segmentLengthSq;
    t = Math.max(0, Math.min(1, t)); 

    const closestPointPx = L.point(
      startPx.x + t * (endPx.x - startPx.x),
      startPx.y + t * (endPx.y - startPx.y)
    );
  
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

  useMapEvents({
    click(e) {
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

        if(editingPipeId && editingMode === 'add') {
            const pipe = useStore.getState().pipes.find(p => p.id === editingPipeId);
            if (!pipe) return;

            let closestPoint = null;
            let segmentIndex = -1;
            let minDistance = Infinity;

            for (let i = 0; i < pipe.vertices.length - 1; i++) {
              const start = L.latLng(pipe.vertices[i]);
              const end = L.latLng(pipe.vertices[i + 1]);
              const point = getClosestPointOnSegment(e.latlng, start, end);
              const distance = e.latlng.distanceTo(point);

              if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
                segmentIndex = i;
              }
            }
            if (closestPoint && segmentIndex !== -1) {
              const newVertices = [...pipe.vertices];
              newVertices.splice(segmentIndex + 1, 0, [closestPoint.lat, closestPoint.lng]);
              updatePipeVertices(editingPipeId, newVertices);
            }
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
      setCursorPos(e.latlng);
      // Только обновляем snappedNode, если мы в режиме перемещения конечной точки
      if (isMovingEndpoint || drawingMode === 'pipe') {
        const nearbyNode = findNearbyNode(e.latlng);
        setSnappedNode(nearbyNode);
      } else {
        setSnappedNode(null);
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
            if (selectedVertexIndex !== null) {
                setSelectedVertexIndex(null);
                setSnappedNode(null); // Сбрасываем snappedNode
            }
            if (editingPipeId) {
                finishPipeEditing();
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
  }, [cursorPos, findNearbyNode, finishDrawing, resetDrawing, isDrawing, movingNodeId, setMovingNodeId, selectedVertexIndex, editingPipeId, finishPipeEditing, setSelectedVertexIndex]);

  let rubberBandLine = null;
  if (isDrawing && cursorPos && currentVertices.length > 0) {
    const lastVertex = currentVertices[currentVertices.length - 1];
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
                <Polyline positions={[prevVertex, [cursorPos.lat, cursorPos.lng]]} color="#3388ff" dashArray="5, 5" />
                <Polyline positions={[[cursorPos.lat, cursorPos.lng], nextVertex]} color="#3388ff" dashArray="5, 5" />
              </>
          )
      } else if (isMovingEndpoint) {
        const otherEndIndex = selectedVertexIndex === 0 ? 1 : vertices.length - 2;
        const otherEnd = vertices[otherEndIndex];
        movingVertexLine = <Polyline positions={[otherEnd, [cursorPos.lat, cursorPos.lng]]} color="#3388ff" dashArray="5, 5" />
      }
  }


  const snappedNodeIcon = L.divIcon({
    className: 'snapped-node-icon',
    iconSize: [SNAPPING_RADIUS * 2, SNAPPING_RADIUS * 2],
  });

  return (
    <>
      {isDrawing && <Polyline positions={currentVertices} color="#ff0000" />}
      {rubberBandLine}
      {movingVertexLine}
      {snappedNode && (drawingMode === 'pipe' || isMovingEndpoint) && (
          <Marker 
            position={[snappedNode.lat, snappedNode.lng]} 
            icon={snappedNodeIcon} 
            interactive={false} 
          />
      )}
      
      {editingPipe && editingPipe.vertices.map((vertex, index) => (
        <VertexMarker 
          key={index} 
          center={vertex} 
          isVisible={true} 
          isSelected={selectedVertexIndex === index}
          onClick={() => handleVertexClick(index)}
        />
      ))}
    </>
  );
};

export default DrawingHandler;
