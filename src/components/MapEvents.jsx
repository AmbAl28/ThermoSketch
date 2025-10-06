import { useMapEvents } from 'react-leaflet';
import useStore from '../useStore';
import { useEffect, useState } from 'react';

const MapEvents = ({ setDrawingMode }) => {
  const { areaCreationMode, addArea, toggleAreaCreationMode } = useStore();
  const [firstCorner, setFirstCorner] = useState(null);

  const map = useMapEvents({
    click(e) {
      if (areaCreationMode) {
        if (!firstCorner) {
          setFirstCorner(e.latlng);
        } else {
          const secondCorner = e.latlng;
          const bounds = [[firstCorner.lat, firstCorner.lng], [secondCorner.lat, secondCorner.lng]];
          addArea(bounds);
          setFirstCorner(null);
          setDrawingMode('none');
        }
      }
    },
  });

  useEffect(() => {
    if (areaCreationMode) {
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
    }
    
    return () => {
        map.getContainer().style.cursor = '';
    }
  }, [areaCreationMode, map]);

  return null;
};

export default MapEvents;
