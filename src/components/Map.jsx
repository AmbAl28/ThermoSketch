import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useStore from '../useStore';
import DrawingHandler from './DrawingHandler';
import { useEffect, useState } from 'react';

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
  diameter_change: { emoji: '↕️', color: '#9C27B0' }, // Изменено на фиолетовый
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

// --- Компонент для маркеров вершин ---
const VertexMarker = ({ position, onClick, isSelected }) => {
    const markerStyle = {
        backgroundColor: isSelected ? '#ff4500' : '#ffffff',
        border: '2px solid #000',
        borderRadius: '50%',
        width: '12px',
        height: '12px',
        cursor: 'pointer'
    };
    return (
        <Marker
            position={position}
            icon={L.divIcon({
                html: `<div style="background-color: ${markerStyle.backgroundColor}; width: ${markerStyle.width}; height: ${markerStyle.height}; border-radius: ${markerStyle.borderRadius}; border: ${markerStyle.border}; cursor: ${markerStyle.cursor};"></div>`,
                className: '',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })}
            eventHandlers={{ click: onClick }}
        />
    );
};


// --- Компонент для управления редактированием трубы ---
const PipeEditor = () => {
    const { 
        editingPipeId, 
        editingMode, 
        pipes, 
        updatePipeVertices, 
        finishPipeEditing, 
        setEditingMode
    } = useStore(state => state);
    const map = useMap();
    const [selectedVertexIndex, setSelectedVertexIndex] = useState(null);

    useEffect(() => {
        if (editingPipeId) {
            map.getContainer().style.cursor = 'crosshair';
        } else {
            map.getContainer().style.cursor = '';
        }

        return () => {
            map.getContainer().style.cursor = '';
        };
    }, [editingPipeId, map]);

    useMapEvents({
        click(e) {
            if (!editingPipeId || editingMode !== 'move') return;
            if (selectedVertexIndex !== null) {
                const pipe = pipes.find(p => p.id === editingPipeId);
                const newVertices = [...pipe.vertices];
                newVertices[selectedVertexIndex] = [e.latlng.lat, e.latlng.lng];
                updatePipeVertices(editingPipeId, newVertices);
                setSelectedVertexIndex(null);
            }
        },
    });

    if (!editingPipeId) return null;

    const pipe = pipes.find(p => p.id === editingPipeId);
    if (!pipe) return null;

    const handleVertexClick = (index) => {
        if (editingMode === 'delete') {
            if (index === 0 || index === pipe.vertices.length - 1) {
                alert('Нельзя удалить начальную или конечную вершину.');
                return;
            }
            const newVertices = pipe.vertices.filter((_, i) => i !== index);
            updatePipeVertices(editingPipeId, newVertices);
        } else if (editingMode === 'move') {
            setSelectedVertexIndex(index);
        }
    };

    const handlePolylineClick = (e) => {
        if (editingMode !== 'add') return;
        L.DomEvent.stopPropagation(e);
        const latlng = e.latlng;
        const newVertices = [...pipe.vertices];
        const closestSegmentIndex = findClosestSegment(latlng, pipe.vertices);
        newVertices.splice(closestSegmentIndex + 1, 0, [latlng.lat, latlng.lng]);
        updatePipeVertices(editingPipeId, newVertices);
    };

    function findClosestSegment(latlng, vertices) {
        let minDistance = Infinity;
        let closestIndex = -1;

        for (let i = 0; i < vertices.length - 1; i++) {
            const p1 = map.latLngToLayerPoint(L.latLng(vertices[i]));
            const p2 = map.latLngToLayerPoint(L.latLng(vertices[i + 1]));
            const p = map.latLngToLayerPoint(latlng);
            const distance = L.LineUtil.pointToSegmentDistance(p, p1, p2);

            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        }
        return closestIndex;
    }

    return (
        <>
            <Polyline 
                positions={pipe.vertices}
                color="#FFC107"
                weight={6}
                eventHandlers={{ click: handlePolylineClick }}
            />
            {pipe.vertices.map((vertex, index) => (
                <VertexMarker 
                    key={index}
                    position={vertex}
                    isSelected={selectedVertexIndex === index}
                    onClick={() => handleVertexClick(index)}
                />
            ))}
        </>
    );
};


const Map = ({ drawingMode, setDrawingMode }) => {
  const { 
    nodes, 
    pipes, 
    setSelectedObject, 
    movingNodeId,
    editingPipeId
  } = useStore(state => state);

  const bounds = [
    [59.77001946144852, 32.040546654692974],
    [60.46696006998797, 33.09151159242312]
  ];

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
          if (pipe.id === editingPipeId) return null;
          return (
            <Polyline 
                key={pipe.id}
                positions={pipe.vertices}
                color={'#0000ff'}
                weight={4}
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

      <PipeEditor />

      {nodes.map(node => (
        <Marker 
          key={node.id} 
          position={[node.lat, node.lng]} 
          icon={getMarkerIcon(node.nodeType, node.id === movingNodeId)}
          eventHandlers={{
            click: (e) => {
              if (movingNodeId) {
                L.DomEvent.stopPropagation(e);
                return;
              }

              if (drawingMode === 'pipe') {
                return;
              }

              L.DomEvent.stopPropagation(e);
              setSelectedObject({ id: node.id, type: 'node' });
            },
          }}
        />
      ))}
    </MapContainer>
  );
};

export default Map;
