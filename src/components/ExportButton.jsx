import React from 'react';
import useStore from '../useStore';

const ExportButton = () => {
  const { nodes, pipes } = useStore.getState();

  const handleExport = () => {
    const exportData = {
      schema_version: '1.1',
      project_name: 'Проект тепловой сети',
      nodes: nodes.map(node => ({
        id: node.id,
        name: node.name,
        type: node.nodeType, 
        elevation: node.elevation,
        x: node.lng, 
        y: node.lat, 
        parameters: {},
      })),
      pipes: pipes.map(pipe => ({
        id: pipe.id,
        start_node_id: pipe.startNodeId,
        end_node_id: pipe.endNodeId,
        length: pipe.length,
        diameter: pipe.diameter,
        roughness: 0.1, 
        material: pipe.material,
        vertices: pipe.vertices,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'config-teploseti-v1.1.json';
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button className="export-btn" onClick={handleExport}>
      Экспорт в JSON
    </button>
  );
};

export default ExportButton;
