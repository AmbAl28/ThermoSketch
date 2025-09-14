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

  // --- Helper Function: Find nearest node ---
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

  // --- Drawing Logic ---
  const startDrawing = (node) => {
    setIsDrawing(true);
    setStartNodeId(node.id);
    setCurrentVertices([[node.lat, node.lng]]);
  };

  const finishDrawing = (endNode) => {
    if (!isDrawing || !startNodeId || !endNode || currentVertices.length < 1) {
      resetDrawing();
      return;
    }

    const finalVertices = [...currentVertices, [endNode.lat, endNode.lng]];

    addPipe({
      startNodeId: startNodeId,
      endNodeId: endNode.id,
      vertices: finalVertices,
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

  // --- Event Handlers from useMapEvents ---
  useMapEvents({
    click(e) {
      // 1. Add Point Mode
      if (drawingMode === 'point') {
        addNode({ 
          id: crypto.randomUUID(), type: 'node', 
          lat: e.latlng.lat, lng: e.latlng.lng 
        });
        setDrawingMode('none');
        return;
      }

      // 2. Pipe Drawing Mode
      if (drawingMode === 'pipe') {
        const nearbyNode = findNearbyNode(e.latlng);

        if (!isDrawing) { // First click
          if (nearbyNode) {
            startDrawing(nearbyNode);
          } else {
            alert('Pipe drawing must start from an existing node.');
          }
        } else { // Subsequent clicks
           if (nearbyNode) { // If we click on a node mid-drawing, it finishes it
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
                alert('Pipe drawing must end on an existing node.');
            }
        }
    }
  });

  // --- Keyboard Handler ---
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
          alert('Pipe drawing must end on an existing node.');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, cursorPos]);


  // --- Render visual feedback ---
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
