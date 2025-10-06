import React from 'react';
import { Rectangle } from 'react-leaflet';
import useStore from '../useStore';

const AreaLayer = () => {
  const { areas, selectedAreaId, setSelectedAreaId } = useStore();

  return (
    <>
      {areas.map(area => (
        <Rectangle
          key={area.id}
          bounds={area.bounds}
          pathOptions={{
            color: selectedAreaId === area.id ? 'yellow' : 'green',
            dashArray: '5, 5',
            fill: false,
            weight: 2,
          }}
          eventHandlers={{
            click: () => {
              setSelectedAreaId(area.id);
            },
          }}
        />
      ))}
    </>
  );
};

export default AreaLayer;
