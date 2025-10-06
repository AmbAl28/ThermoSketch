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
            color: area.color || 'green',
            dashArray: '10, 10',
            fill: false,
            weight: 5,
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
