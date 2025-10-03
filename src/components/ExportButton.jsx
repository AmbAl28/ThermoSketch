import React from 'react';
import useStore from '../useStore';

const ExportButton = () => {
  const { nodes, pipes } = useStore();

  const handleExport = () => {
    const dataToExport = {
      nodes: nodes.map(node => ({
        id: node.id,
        lat: node.lat,
        lng: node.lng,
        name: node.name,
        type: node.type,
        nodeType: node.nodeType,
        elevation: node.elevation,
        contractNumber: node.contractNumber,
        note: node.note,
        heatLoad: node.heatLoad,
        staticPressure: node.staticPressure,
        supplyTemperature: node.supplyTemperature,
        returnTemperature: node.returnTemperature,
      })),
      pipes: pipes.map(pipe => ({
        id: pipe.id,
        startNodeId: pipe.startNodeId,
        endNodeId: pipe.endNodeId,
        type: pipe.type,
        vertices: pipe.vertices,
        length: pipe.length,
        diameter: pipe.diameter,
        material: pipe.material,
        actualLength: pipe.actualLength,
        insulationMaterial: pipe.insulationMaterial,
        insulationWear: pipe.insulationWear,
      })),
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'thermal-network-project.json';
    link.click();
  };

  return (
    <button className="export-btn" onClick={handleExport}>
      Экспорт в JSON
    </button>
  );
};

export default ExportButton;
