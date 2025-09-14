import { useState, useEffect } from 'react';
import { useMap, useMapEvents, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import useStore from '../useStore';

const SNAPPING_RADIUS = 30; // Snapping radius in pixels

const DrawingHandler = ({ drawingMode, setDrawingMode }) => {
  const { nodes, addNode, addPipe } = useStore();
  const map = useMap();

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentVertices, setCurrentVertices] = useState([]);
  const [cursorPos, setCursorPos] = useState(null);
  const [startNodeId, setStartNodeId] = useState(null);
  const [snappedNode, setSnappedNode] = useState(null);

  const findNearbyNode = (latlng) => {
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
  };

  const startDrawing = (node) => {
    setIsDrawing(true);
    setStartNodeId(node.id);
    setCurrentVertices([[node.lat, node.lng]]);
  };

  // This function now calculates the length before adding the pipe
  const finishDrawing = (endNode) => {
    if (!isDrawing || !startNodeId || !endNode || currentVertices.length < 1) {
      resetDrawing();
      return;
    }

    const finalVertices = [...currentVertices, [endNode.lat, endNode.lng]];

    // --- Length Calculation Logic is now here ---
    let totalLength = 0;
    for (let i = 0; i < finalVertices.length - 1; i++) {
      const [lat1, lng1] = finalVertices[i];
      const [lat2, lng2] = finalVertices[i + 1];
      totalLength += L.latLng(lat1, lng1).distanceTo(L.latLng(lat2, lng2));
    }
    
    // Add the pre-calculated length to the store
    addPipe({
      startNodeId: startNodeId,
      endNodeId: endNode.id,
      vertices: finalVertices,
      length: Math.round(totalLength), // Pass the calculated length
    });

    resetDrawing();
  };

  const resetDrawing = () => {
    setIsDrawing(false);
    setCurrentVertices([]);
    setCursorPos(null);
    setStartNodeId(null);
    setDrawingMode('none');
  };

  useMapEvents({
    click(e) {
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
      const nearbyNode = findNearbyNode(e.latlng);
      setSnappedNode(nearbyNode);
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
      if (e.key === 'Escape' && isDrawing) {
        resetDrawing();
      }
      if (e.key === 'Enter' && isDrawing && cursorPos) {
        const nearbyNode = findNearbyNode(cursorPos);
        if (nearbyNode) {
          finishDrawing(nearbyNode);
        } else {
          alert('Отрисовка трубы должна заканчиваться на существующем узле.');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, cursorPos]);

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
      {snappedNode && <Marker position={[snappedNode.lat, snappedNode.lng]} icon={snappedNodeIcon} interactive={false} />}
    </>
  );
};

export default DrawingHandler;
