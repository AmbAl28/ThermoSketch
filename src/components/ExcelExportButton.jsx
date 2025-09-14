
import React from 'react';
import useStore from '../useStore';
import * as XLSX from 'xlsx';

const ExcelExportButton = () => {
  const { nodes, pipes } = useStore.getState();

  const getRoughness = (material) => {
    switch (material) {
      case 'steel': return 0.1;
      case 'polyethylene': return 0.007;
      case 'polyurethane': return 0.01;
      default: return 0.1; // Default to steel
    }
  };

  const handleExcelExport = () => {
    // 1. Create "Узлы" (Nodes) worksheet
    const nodesData = nodes.map(node => ({
      'ID': node.id,
      'Наименование': node.name,
      'Тип': node.nodeType,
      'Отметка высоты (м)': node.elevation,
      'Тепловая нагрузка (Гкал/ч)': node.nodeType === 'consumer' ? node.load : '',
      'Статический напор (м)': node.nodeType === 'consumer' ? node.pressure : '',
      'Температура подачи (°C)': node.nodeType === 'source' ? node.temp_supply : '',
      'Температура обратки (°C)': node.nodeType === 'source' ? node.temp_return : '',
      'X (долгота)': node.lng,
      'Y (широта)': node.lat,
    }));
    const nodesSheet = XLSX.utils.json_to_sheet(nodesData);

    // 2. Create "Трубы" (Pipes) worksheet
    const pipesData = pipes.map(pipe => ({
      'ID': pipe.id,
      'Начальный узел ID': pipe.startNodeId,
      'Конечный узел ID': pipe.endNodeId,
      'Длина (м)': pipe.length,
      'Диаметр (мм)': pipe.diameter,
      'Материал': pipe.material,
      'Шероховатость (мм)': getRoughness(pipe.material),
      'Потери напора (м)': '', // Placeholder
    }));
    const pipesSheet = XLSX.utils.json_to_sheet(pipesData);

    // 3. Create "Связи" (Connections) worksheet
    const connectionsData = pipes.map(pipe => ({
      'ID': pipe.id,
      'Тип': 'Труба',
      'Узел 1 ID': pipe.startNodeId,
      'Узел 2 ID': pipe.endNodeId,
    }));
    const connectionsSheet = XLSX.utils.json_to_sheet(connectionsData);


    // 4. Create Workbook and download
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, nodesSheet, 'Узлы');
    XLSX.utils.book_append_sheet(wb, pipesSheet, 'Трубы');
    XLSX.utils.book_append_sheet(wb, connectionsSheet, 'Связи');

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Тепловая сеть - ${today}.xlsx`);
  };


  return (
    <button className="export-btn" onClick={handleExcelExport}>
      Экспорт в Excel
    </button>
  );
};

export default ExcelExportButton;
