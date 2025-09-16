import React from 'react';
import useStore from '../useStore';
import * as XLSX from 'xlsx';

const ExcelExportButton = () => {
  const handleExcelExport = () => {
    const { nodes, pipes } = useStore.getState();

    // Словари для перевода системных названий в человекочитаемые
    const nodeTypeMap = {
      consumer: 'Потребитель',
      source: 'Источник',
      chamber: 'Камера',
      diameter_change: 'Смена диаметра',
      valve: 'Арматура',
    };

    // ИСПРАВЛЕННЫЙ СЛОВАРЬ: Добавлена поддержка старого значения 'steel'
    const materialMap = {
        'steel': 'Сталь', // Добавлено для обратной совместимости
        'Сталь': 'Сталь',
        'Нержавеющая сталь': 'Нержавеющая сталь',
        'Медные': 'Медные',
        'Полипропиленовые (PPR)': 'Полипропиленовые (PPR)',
        'Полиэтиленовые (PE)': 'Полиэтиленовые (PE)',
        'Сшитый полиэтилен (PEX)': 'Сшитый полиэтилен (PEX)',
        'Металлопластиковые трубы': 'Металлопластиковые трубы',
    };

    const insulationMaterialMap = {
        'ППУ': 'Пенополиуретан (ППУ)',
        'Минеральная вата': 'Минеральная вата',
        'Вспененный полиэтилен': 'Вспененный полиэтилен',
        'Вспененный каучук': 'Вспененный каучук',
    };

    // 1. Создание листа "Узлы"
    const nodesData = nodes.map(node => ({
      'ID': node.id,
      'Наименование': node.name,
      'Тип узла': nodeTypeMap[node.nodeType] || node.nodeType,
      'Отметка высоты, м': node.elevation,
      'Тепловая нагрузка, Гкал/ч': node.heatLoad,
      'Статический напор, м': node.staticPressure,
      'Температура подачи, °C': node.supplyTemperature,
      'Температура обратки, °C': node.returnTemperature,
      '№ договора': node.contractNumber,
      'Примечание': node.note,
      'Координата X (Долгота)': node.lng,
      'Координата Y (Широта)': node.lat,
    }));
    const nodesSheet = XLSX.utils.json_to_sheet(nodesData);

    // 2. Создание листа "Трубы"
    const pipesData = pipes.map(pipe => ({
      'ID': pipe.id,
      'ID начального узла': pipe.startNodeId,
      'ID конечного узла': pipe.endNodeId,
      'Расчётная длина, м': pipe.length,
      'Фактическая длина, м': pipe.actualLength,
      'Диаметр, мм': pipe.diameter,
      'Материал труб': materialMap[pipe.material] || pipe.material,
      'Материал изоляции': insulationMaterialMap[pipe.insulationMaterial] || pipe.insulationMaterial,
      'Износ изоляции, %': pipe.insulationWear,
    }));
    const pipesSheet = XLSX.utils.json_to_sheet(pipesData);

    // 3. Создание книги и скачивание
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, nodesSheet, 'Узлы');
    XLSX.utils.book_append_sheet(wb, pipesSheet, 'Трубы');

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Тепловая сеть - ${today}.xlsx`);
  };

  return (
    // ИСПРАВЛЕННЫЙ КЛАСС КНОПКИ
    <button className="export-btn" onClick={handleExcelExport}>
      Экспорт в Excel
    </button>
  );
};

export default ExcelExportButton;
