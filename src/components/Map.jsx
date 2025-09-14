import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useStore from '../useStore';
import DrawingHandler from './DrawingHandler';

// --- Исправление для иконок маркеров ---
// Webpack может некорректно обрабатывать пути к изображениям Leaflet.
// Этот код вручную устанавливает пути к иконкам маркеров.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getMarkerIcon = (nodeType) => {
    // Базовый цвет
    let color = '#4a89f3'; // Синий по умолчанию (для камер)

    if (nodeType === 'consumer') {
        color = '#f44336'; // Красный для потребителей
    } else if (nodeType === 'source') {
        color = '#4caf50'; // Зеленый для источников
    }

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
        <circle cx="12" cy="9.5" r="2.5" fill="white"/>
    </svg>`;

    return L.divIcon({
        html: svg,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
}


const Map = ({ drawingMode, setDrawingMode }) => {
  const nodes = useStore((state) => state.nodes);
  const pipes = useStore((state) => state.pipes);
  const setSelectedObject = useStore((state) => state.setSelectedObject);

  // Задаем границы для отображения
  const bounds = [
    [59.77001946144852, 32.040546654692974], // Юго-западный угол
    [60.46696006998797, 33.09151159242312]  // Северо-восточный угол
  ];

  return (
    <MapContainer 
        bounds={bounds} // <-- Устанавливаем границы
        style={{ height: '100%', width: '100%' }} 
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <DrawingHandler drawingMode={drawingMode} setDrawingMode={setDrawingMode} />
      
      {/* Рендеринг труб */}
      {pipes.map(pipe => (
          <Polyline 
              key={pipe.id}
              positions={pipe.vertices}
              color="#0000ff" // Синий цвет для труб
              weight={4}
              eventHandlers={{
                  click: () => setSelectedObject({ id: pipe.id, type: 'pipe' })
              }}
          />
      ))}

      {/* Рендеринг узлов */}
      {nodes.map(node => (
        <Marker 
          key={node.id} 
          position={[node.lat, node.lng]} 
          icon={getMarkerIcon(node.nodeType)}
          eventHandlers={{
            click: () => setSelectedObject({ id: node.id, type: 'node' }),
          }}
        />
      ))}
    </MapContainer>
  );
};

export default Map;
