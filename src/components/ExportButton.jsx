import React from 'react';
import useStore from '../useStore';

const ExportButton = () => {
  const { nodes, pipes } = useStore.getState(); // Получаем актуальное состояние напрямую

  const handleExport = () => {
    // 1. Трансформируем данные в требуемую структуру
    const exportData = {
      schema_version: '1.0',
      project_name: 'Thermal Network Project',
      nodes: nodes.map(node => ({
        id: node.id,
        name: node.name,
        type: node.nodeType, // Используем nodeType из нашего хранилища
        elevation: node.elevation,
        x: node.lng, // Долгота
        y: node.lat, // Широта
        // Добавляем пустой объект, как в примере, для будущих параметров
        parameters: {},
      })),
      pipes: pipes.map(pipe => ({
        id: pipe.id,
        start_node_id: pipe.startNodeId,
        end_node_id: pipe.endNodeId,
        length: pipe.length,
        diameter: pipe.diameter,
        // Добавим значение по умолчанию, как в примере
        roughness: 0.1, 
        material: pipe.material,
      })),
    };

    // 2. Преобразуем в красивую JSON-строку
    const jsonString = JSON.stringify(exportData, null, 2);

    // 3. Создаем Blob и ссылку для скачивания
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'thermal-network-config.json';
    document.body.appendChild(a);
    a.click();

    // 4. Очистка
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
