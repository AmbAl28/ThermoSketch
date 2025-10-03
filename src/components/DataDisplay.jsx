import React, { useState } from 'react';
import useStore from '../useStore';

const DataDisplay = () => {
  const nodes = useStore((state) => state.nodes);
  const pipes = useStore((state) => state.pipes);
  const [isExpanded, setIsExpanded] = useState(false);

  // --- Расчеты по УЗЛАМ (Правильная логика) ---
  const nodeCountsByType = nodes.reduce((acc, node) => {
    // Группируем по конкретному типу узла - nodeType
    const type = node.nodeType || 'Не задан';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Словарь для красивого отображения и порядок сортировки
  const typeTranslations = {
    source: 'Источники',
    consumer: 'Потребители',
    chamber: 'Камеры',
    node: 'Узлы',
    diameter_change: 'Смена диаметра',
    valve: 'Задвижка',
  };

  const displayOrder = ['source', 'consumer', 'chamber', 'node', 'diameter_change', 'valve'];

  // Сортируем ключи для консистентного отображения
  const sortedNodeTypes = Object.keys(nodeCountsByType).sort((a, b) => {
      const indexA = displayOrder.indexOf(a);
      const indexB = displayOrder.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
  });

  // --- Расчеты по ТРУБОПРОВОДАМ ---
  const pipesByDiameter = pipes.reduce((acc, pipe) => {
    const diameter = pipe.diameter || 0;
    if (!acc[diameter]) {
      acc[diameter] = { totalLength: 0 };
    }
    acc[diameter].totalLength += pipe.length || 0;
    return acc;
  }, {});

  return (
    <div className="data-display">
      <div className="data-summary-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h4>Сводка по схеме</h4>
        <span>{isExpanded ? '\u25B2' : '\u25BC'}</span>
      </div>
      
      {isExpanded && (
        <div className="data-summary-content">
          
          {/* --- Секция Узлов --- */}
          <h5>Узлы ({nodes.length})</h5>
          <ul>
            {sortedNodeTypes.map(type => (
              <li key={type}>
                {(typeTranslations[type] || type)}: {nodeCountsByType[type]}
              </li>
            ))}
          </ul>

          {/* --- Секция Трубопроводов --- */}
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
