import { CircleMarker } from 'react-leaflet';
import L from 'leaflet';

const VertexMarker = ({ center, isVisible, isSelected, onClick, pane }) => {
  if (!isVisible) {
    return null;
  }

  const style = {
    color: isSelected ? '#FFA000' : '#FFC107', 
    weight: 2,
    fillColor: '#FFD54F', 
    fillOpacity: 1,
  };

  return (
    <CircleMarker
      center={center}
      radius={7} 
      pathOptions={style}
      pane={pane} // <<< ИСПОЛЬЗУЕМ ПЕРЕДАННУЮ ПАНЕЛЬ
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
