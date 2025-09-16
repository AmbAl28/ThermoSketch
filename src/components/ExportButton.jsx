import React from 'react';
import useStore from '../useStore';

const ExportButton = () => {
  const handleExport = () => {
    const { nodes, pipes } = useStore.getState();

    const exportData = {
      schema_version: '1.2', // Версия схемы обновлена для отражения новых полей
      project_name: 'Проект тепловой сети',
      nodes: nodes.map(node => ({
        id: node.id,
        name: node.name,
        type: node.nodeType, 
        elevation: node.elevation,
        x: node.lng, 
        y: node.lat,
        // Добавляем все параметры в соответствующий объект
        parameters: {
          contractNumber: node.contractNumber,
          note: node.note,
          heatLoad: node.heatLoad,
          staticPressure: node.staticPressure,
          supplyTemperature: node.supplyTemperature,
          returnTemperature: node.returnTemperature,
        },
      })),
      pipes: pipes.map(pipe => ({
        id: pipe.id,
        start_node_id: pipe.startNodeId,
        end_node_id: pipe.endNodeId,
        length: pipe.length,
        diameter: pipe.diameter,
        // Также добавляем ранее созданные поля для труб для полноты данных
        actual_length: pipe.actualLength,
        material: pipe.material,
        insulation_material: pipe.insulationMaterial,
        insulation_wear: pipe.insulationWear,
        vertices: pipe.vertices,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'config-teploseti-v1.2.json'; // Имя файла обновлено
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
