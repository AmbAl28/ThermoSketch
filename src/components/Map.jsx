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

// --- ОБНОВЛЕННАЯ Конфигурация иконок для разных типов узлов ---
const nodeIconConfig = {
  source: { emoji: '🏭', color: '#4CAF50' },       // Источник (зеленый)
  consumer: { emoji: '🏠', color: '#F44336' },   // Потребитель (красный)
  chamber: { emoji: '⊡', color: '#607D8B' },    // Камера (серый)
  diameter_change: { emoji: '↕️', color: '#FFC107' }, // Смена диаметра (желтый)
  valve: { emoji: '🚰', color: '#03A9F4' },      // Арматура (голубой)
  default: { emoji: '❓', color: '#9E9E9E' }       // По умолчанию (темно-серый)
};

// --- ОБНОВЛЕННАЯ Функция генерации иконок ---
const getMarkerIcon = (nodeType) => {
  const config = nodeIconConfig[nodeType] || nodeIconConfig.default;

  // Размеры иконок были уменьшены
  const iconSize = 20; // Вместо 32
  const fontSize = 12; // Вместо 20

  const html = `
    <div style="
      background-color: ${config.color};
      width: ${iconSize}px;
      height: ${iconSize}px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: ${fontSize}px;
      border: 1.5px solid #fff;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
    ">
      ${config.emoji}
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-emoji-icon',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2], // Динамический расчет центра
    popupAnchor: [0, -iconSize / 2] // Динамический расчет
  });
};

const Map = ({ drawingMode, setDrawingMode }) => {
  const nodes = useStore((state) => state.nodes);
  const pipes = useStore((state) => state.pipes);
  const setSelectedObject = useStore((state) => state.setSelectedObject);

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
      
      {pipes.map(pipe => (
          <Polyline 
              key={pipe.id}
              positions={pipe.vertices}
              color="#0000ff"
              weight={4}
              eventHandlers={{
                  click: () => setSelectedObject({ id: pipe.id, type: 'pipe' })
              }}
          />
      ))}

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
