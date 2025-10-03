import useStore from '../useStore';
import * as XLSX from 'xlsx';

const ExportExcelButton = () => {
  const { nodes, pipes } = useStore();

  const handleExport = () => {
    const nodesData = nodes.map(node => ({
      'ID': node.id,
      'Наименование': node.name,
      'Тип узла': node.nodeType,
      'Высотная отметка': node.elevation,
      'Номер договора': node.contractNumber,
      'Тепловая нагрузка': node.heatLoad,
      'Статическое давление': node.staticPressure,
      'Температура (подача)': node.supplyTemperature,
      'Температура (обратка)': node.returnTemperature,
      'Примечание': node.note,
      'Широта': node.lat,
      'Долгота': node.lng,
    }));
    const nodesSheet = XLSX.utils.json_to_sheet(nodesData);
    const nodesCols = Object.keys(nodesData[0] || {}).map(key => ({ wch: Math.max(20, key.length) }));
    nodesSheet['!cols'] = nodesCols;

    const pipesData = pipes.map(pipe => ({
      'ID': pipe.id,
      'ID начального узла': pipe.startNodeId,
      'ID конечного узла': pipe.endNodeId,
      'Расчетная длина, м': pipe.length?.toFixed(2),
      'Фактическая длина, м': pipe.actualLength,
      'Диаметр, мм': pipe.diameter,
      'Материал': pipe.material,
      'Материал изоляции': pipe.insulationMaterial,
      'Износ изоляции, %': pipe.insulationWear,
    }));
    const pipesSheet = XLSX.utils.json_to_sheet(pipesData);
    const pipesCols = Object.keys(pipesData[0] || {}).map(key => ({ wch: Math.max(25, key.length) }));
    pipesSheet['!cols'] = pipesCols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, nodesSheet, 'Узлы');
    XLSX.utils.book_append_sheet(workbook, pipesSheet, 'Трубы');

    XLSX.writeFile(workbook, 'thermal-network-data.xlsx');
  };

  return (
    <button className="export-btn" onClick={handleExport}>
      Экспорт в Excel
    </button>
  );
};

export default ExportExcelButton;
