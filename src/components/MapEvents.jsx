import { useMapEvents } from 'react-leaflet';
import useStore from '../useStore';
import { useEffect, useState } from 'react';

const MapEvents = ({ setDrawingMode }) => {
  // Select state and actions separately to prevent re-renders from new object creation
  const areaCreationMode = useStore(state => state.areaCreationMode);
  const addArea = useStore(state => state.addArea);
  const setMap = useStore(state => state.setMap);

  const [firstCorner, setFirstCorner] = useState(null);

  const map = useMapEvents({
    click(e) {
      if (areaCreationMode) {
        if (!firstCorner) {
          setFirstCorner(e.latlng);
        } else {
          const secondCorner = e.latlng;
          const bounds = [[firstCorner.lat, firstCorner.lng], [secondCorner.lat, secondCorner.lng]];
          addArea(bounds); // This action also sets areaCreationMode to false
          setFirstCorner(null);
          if (setDrawingMode) {
              setDrawingMode('none');
          }
        }
      }
    },
  });
  
  // Share map instance with the store.
  // This useEffect will only run when the map instance or setMap function changes.
  // Both are stable across re-renders of this component itself.
  useEffect(() => {
    setMap(map);
    // On component unmount, clear the map instance from the store
    return () => setMap(null);
  }, [map, setMap]);

  // Handle cursor style for area creation
  useEffect(() => {
    const container = map.getContainer();
    if (areaCreationMode) {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
    
    // Cleanup cursor style
    return () => {
        try {
            if(container) {
                container.style.cursor = '';
            }
        } catch(e) {
            // The container may already be unmounted if the component unmounts.
        }
    }
  }, [areaCreationMode, map]);

  return null;
};

export default MapEvents;
