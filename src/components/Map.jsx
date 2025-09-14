import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useStore from '../useStore';

// Custom icon for highlighting the first selected node for a pipe
const highlightedIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41],
  className: 'highlighted-marker' // To add custom css if needed
});

// MapEvents handles the new pipe creation logic
const MapEvents = ({ drawingMode, setDrawingMode }) => {
  const { addNode, addPipe } = useStore();
  const [firstNode, setFirstNode] = useState(null);

  useMapEvents({
    click(e) {
      // This click is for adding NEW nodes, not for selecting existing ones
      if (drawingMode === 'point') {
        addNode({
          id: crypto.randomUUID(),
          type: 'node',
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
        setDrawingMode('none');
      }
    },
  });

  useEffect(() => {
    // Reset state if drawing mode changes
    if (drawingMode !== 'pipe') {
      setFirstNode(null);
    }
  }, [drawingMode]);

  // This effect will be handled by clicking on markers directly
  // The logic for selecting nodes for a pipe is now in the Marker's event handler

  return null; // No need to render anything here
};

const Map = ({ drawingMode, setDrawingMode }) => {
  const { nodes, pipes, selectedObject, setSelectedObject, addPipe } = useStore();
  const [pipeStartNodeId, setPipeStartNodeId] = useState(null);

  const handleNodeClick = (node) => {
    if (drawingMode === 'pipe') {
      if (!pipeStartNodeId) {
        // This is the first node for the pipe
        setPipeStartNodeId(node.id);
      } else if (pipeStartNodeId !== node.id) {
        // This is the second node, create the pipe
        addPipe({ startNodeId: pipeStartNodeId, endNodeId: node.id });
        setPipeStartNodeId(null); // Reset for the next pipe
        setDrawingMode('none'); // Exit pipe drawing mode
      } 
    } else {
      // Default behavior: select the node to show properties
      setSelectedObject({ type: 'node', id: node.id });
    }
  };

  // Find the coordinates for the pipes
  const getPipeCoords = (pipe) => {
    const startNode = nodes.find(n => n.id === pipe.startNodeId);
    const endNode = nodes.find(n => n.id === pipe.endNodeId);
    if (startNode && endNode) {
      return [[startNode.lat, startNode.lng], [endNode.lat, endNode.lng]];
    } 
    return [];
  }

  return (
    <MapContainer center={[55.75, 37.57]} zoom={10} style={{ height: '100vh', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {nodes.map(node => (
        <Marker 
          key={node.id} 
          position={[node.lat, node.lng]}
          eventHandlers={{
            click: () => handleNodeClick(node),
          }}
          // Highlight if selected for properties OR as pipe start
          icon={pipeStartNodeId === node.id ? highlightedIcon : new L.Icon.Default()}
          opacity={selectedObject?.id === node.id ? 0.7 : 1.0}
        />
      ))}

      {pipes.map(pipe => {
        const coords = getPipeCoords(pipe);
        if (coords.length === 0) return null; // Don't render if a node is missing

        return (
          <Polyline 
            key={pipe.id} 
            positions={coords} 
            eventHandlers={{
              click: (e) => {
                // Stop propagation to avoid map click event
                L.DomEvent.stopPropagation(e);
                setSelectedObject({ type: 'pipe', id: pipe.id });
              },
            }}
            color={selectedObject?.id === pipe.id ? '#ff0000' : '#0000ff'}
            weight={selectedObject?.id === pipe.id ? 5 : 3}
          />
        );
      })}

      <MapEvents 
        drawingMode={drawingMode} 
        setDrawingMode={setDrawingMode} 
      />
    </MapContainer>
  );
};

export default Map;

