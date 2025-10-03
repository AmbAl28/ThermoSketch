import { CircleMarker } from 'react-leaflet';

const VertexMarker = ({ center, isVisible, isSelected, onClick }) => {
  if (!isVisible) {
    return null;
  }

  const style = {
    color: isSelected ? '#FFC107' : '#fff',
    weight: 2,
    fillColor: isSelected ? '#FF9800' : '#03a9f4',
    fillOpacity: 1,
  };

  return (
    <CircleMarker
      center={center}
      radius={6} // Сделаем маркер чуть больше
      pathOptions={style}
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
