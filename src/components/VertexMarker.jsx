import { CircleMarker } from 'react-leaflet';
import L from 'leaflet';

const VertexMarker = ({ center, isVisible, isSelected, onClick, pane }) => {
  if (!isVisible) {
    return null;
  }

  // Стиль с более темным желтым цветом
  const style = {
    color: '#FFA000',      // Рамка (оранжевая)
    weight: 2,
    fillColor: '#FFC107', // Заливка (темно-желтая)
    fillOpacity: 1,
  };

  // Стиль для выделенной (активной) вершины, если потребуется в будущем
  const selectedStyle = {
    ...style,
    fillColor: '#FF9800', // Более яркий оранжевый для выделения
  };

  return (
    <CircleMarker
      center={center}
      radius={7} 
      pathOptions={isSelected ? selectedStyle : style} // Используем разные стили
      pane={pane} 
      eventHandlers={{
        click: (e) => {
            L.DomEvent.stopPropagation(e);
            if (onClick) {
                onClick();
            }
        },
        mouseover: (e) => {
          e.target.setStyle({ cursor: 'pointer' });
        },
        mouseout: (e) => {
          e.target.setStyle({ cursor: '' });
        },
      }}
    />
  );
};

export default VertexMarker;
