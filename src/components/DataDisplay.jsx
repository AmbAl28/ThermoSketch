import React from 'react';
import useStore from '../useStore';

const DataDisplay = () => {
  const nodes = useStore((state) => state.nodes);
  const pipes = useStore((state) => state.pipes);

  return (
    <div className="data-display">
      <h4>Объекты на карте</h4>
      <h5>Точки (Nodes)</h5>
      <ul>
        {nodes.map(node => (
          <li key={node.id}>ID: {node.id.substring(0, 8)}...</li>
        ))}
      </ul>
      <h5>Трубы (Pipes)</h5>
      <ul>
        {pipes.map(pipe => (
          <li key={pipe.id}>ID: {pipe.id.substring(0, 8)}...</li>
        ))}
      </ul>
    </div>
  );
};

export default DataDisplay;
