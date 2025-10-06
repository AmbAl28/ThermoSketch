import React from 'react';
import useStore from '../useStore';

const ExportButton = () => {
  const { nodes, pipes, areas } = useStore();

  const handleExport = () => {
    const dataToExport = {
      schemaVersion: "2.0",
      areas: areas.map(area => ({
        id: area.id,
        name: area.name,
        bounds: area.bounds,
        color: area.color,
      })),
      objects: {},
      unassigned: {
        nodes: [],
        pipes: [],
      },
    };

    // Initialize area objects
    areas.forEach(area => {
      dataToExport.objects[area.id] = {
        nodes: [],
        pipes: [],
      };
    });

    nodes.forEach(node => {
      const nodeData = {
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
        areaId: node.areaId,
      };
      if (node.areaId && dataToExport.objects[node.areaId]) {
        dataToExport.objects[node.areaId].nodes.push(nodeData);
      } else {
        dataToExport.unassigned.nodes.push(nodeData);
      }
    });

    pipes.forEach(pipe => {
      const pipeData = {
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
        areaId: pipe.areaId,
      };
      if (pipe.areaId && dataToExport.objects[pipe.areaId]) {
        dataToExport.objects[pipe.areaId].pipes.push(pipeData);
      } else {
        dataToExport.unassigned.pipes.push(pipeData);
      }
    });

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'thermal-network-project-v2.json';
    link.click();
  };

  return (
    <button className="export-btn" onClick={handleExport}>
      Экспорт в JSON
    </button>
  );
};

export default ExportButton;
