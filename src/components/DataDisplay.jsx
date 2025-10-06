import React, { useState } from 'react';
import useStore from '../useStore';

const DataDisplay = () => {
  const nodes = useStore((state) => state.nodes);
  const pipes = useStore((state) => state.pipes);
  const areas = useStore((state) => state.areas);
  const { getObjectsInArea, getUnassignedObjects, setSelectedObject, setSelectedAreaId } = useStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const nodeCountsByType = nodes.reduce((acc, node) => {
    const type = node.nodeType || 'Не задан';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeTranslations = {
    source: 'Источники',
    consumer: 'Потребители',
    chamber: 'Камеры',
    node: 'Узлы',
    diameter_change: 'Смена диаметра',
    valve: 'Задвижка',
  };

  const displayOrder = ['source', 'consumer', 'chamber', 'node', 'diameter_change', 'valve'];

  const sortedNodeTypes = Object.keys(nodeCountsByType).sort((a, b) => {
      const indexA = displayOrder.indexOf(a);
      const indexB = displayOrder.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
  });

  const pipesByDiameter = pipes.reduce((acc, pipe) => {
    const diameter = pipe.diameter || 0;
    if (!acc[diameter]) {
      acc[diameter] = { totalLength: 0 };
    }
    acc[diameter].totalLength += pipe.length || 0;
    return acc;
  }, {});

  const renderAreaContent = (areaId) => {
    const objects = areaId ? getObjectsInArea(areaId) : getUnassignedObjects();
    const area = areaId ? areas.find(a => a.id === areaId) : null;

    return (
      <div key={areaId || 'unassigned'}>
        <h6 onClick={() => setSelectedAreaId(areaId)}>
          <span className="color-swatch" style={{ backgroundColor: area ? area.color : '#ccc' }}></span>
          {area ? area.name : 'Другое'}
        </h6>
        {(objects.nodes.length > 0 || objects.pipes.length > 0) ? (
          <ul>
            {objects.nodes.map(node => <li key={node.id} onClick={() => setSelectedObject(node)}>{node.name || `Узел ${node.id.substring(0,4)}`}</li>)}
            {objects.pipes.map(pipe => <li key={pipe.id} onClick={() => setSelectedObject(pipe)}>Труба {pipe.id.substring(0,8)}</li>)}
          </ul>
        ) : <p><i>Нет объектов</i></p>}
      </div>
    )
  }

  return (
    <div className="data-display">
      <div className="data-summary-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h4>Сводка по схеме</h4>
        <span>{isExpanded ? '\u25B2' : '\u25BC'}</span>
      </div>
      
      {isExpanded && (
        <div className="data-summary-content">
          
          <h5>Области</h5>
          {areas.map(area => renderAreaContent(area.id))}
          {renderAreaContent(null)}

          <hr className="summary-divider" />
          
          <h5>Узлы ({nodes.length})</h5>
          <ul>
            {sortedNodeTypes.map(type => (
              <li key={type}>
                {(typeTranslations[type] || type)}: {nodeCountsByType[type]}
              </li>
            ))}
          </ul>

          {pipes.length > 0 && (
            <>
              <hr className="summary-divider" />
              <h5>Трубопроводы ({pipes.length})</h5>
              <ul>
                {Object.entries(pipesByDiameter).map(([diameter, data]) => (
                  <li key={diameter}>
                    Ø {diameter} мм: {data.totalLength.toFixed(2)} м
                  </li>
                ))}
              </ul>
            </>
          )}

        </div>
      )}
    </div>
  );
};

export default DataDisplay;
