import React from 'react';
import useStore from '../useStore';
import Drawing from 'dxf-writer';

const DxfExportButton = () => {
  const { nodes, pipes } = useStore.getState();

  const handleDxfExport = () => {
    alert('Экспорт в DXF использует координаты в системе WGS84 (широта/долгота). Для корректного отображения в САПР может потребоваться трансформация координат или ручная привязка карты.');

    const d = new Drawing();

    // Define layers
    d.addLayer('Nodes', Drawing.ACI.BLUE, 'CONTINUOUS');
    d.addLayer('Pipes', Drawing.ACI.RED, 'CONTINUOUS');
    d.addLayer('Node_Text', Drawing.ACI.GREEN, 'CONTINUOUS');

    // Add Nodes (Points)
    d.setActiveLayer('Nodes');
    nodes.forEach(node => {
      d.drawPoint(node.lng, node.lat);
    });
    
    // Add Node Text
    d.setActiveLayer('Node_Text');
    nodes.forEach(node => {
        // Using a small, fixed height for the text. This might need adjustment.
        // The offset is also small to place the text near the node.
        const textHeight = 0.00002;
        d.drawText(node.lng + 0.00001, node.lat + 0.00001, textHeight, 0, node.name || node.id);
    });

    // Add Pipes (Polylines)
    d.setActiveLayer('Pipes');
    pipes.forEach(pipe => {
        const startNode = nodes.find(n => n.id === pipe.startNodeId);
        const endNode = nodes.find(n => n.id === pipe.endNodeId);

        if (startNode && endNode) {
            let vertices = [];
            // Start with the start node
            vertices.push([startNode.lng, startNode.lat]);

            // Add intermediate vertices if they exist
            if (pipe.vertices && pipe.vertices.length > 0) {
                pipe.vertices.forEach(v => vertices.push([v.lng, v.lat]));
            }

            // End with the end node
            vertices.push([endNode.lng, endNode.lat]);

            // If there are at least 2 points, draw the polyline
            if (vertices.length >= 2) {
                // The library expects an array of arrays: [[x1, y1], [x2, y2], ...]
                d.drawPolyline(vertices);
            }
        }
    });

    const dxfString = d.toDxfString();
    const blob = new Blob([dxfString], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'thermal-network.dxf';
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button className="export-btn" onClick={handleDxfExport}>
      Экспорт в DXF
    </button>
  );
};

export default DxfExportButton;
