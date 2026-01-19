import React from 'react';
import useStore from '../useStore';
import * as XLSX from 'xlsx';

const ExcelExportButton = () => {
  const handleExcelExport = () => {
    try {
      const { nodes, pipes, areas } = useStore.getState();

      const nodeTypeMap = {
        consumer: 'Потребитель',
        source: 'Источник',
        chamber: 'Камера',
        diameter_change: 'Смена диаметра',
        valve: 'Арматура',
      };

      const materialMap = {
        'steel': 'Сталь',
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

      const wb = XLSX.utils.book_new();

      // Create a summary sheet for areas
      const areasData = areas.map(area => ({
        'ID': area.id,
        'Название': area.name,
        'Цвет': area.color,
      }));
      const areasSheet = XLSX.utils.json_to_sheet(areasData);
      XLSX.utils.book_append_sheet(wb, areasSheet, 'Области');

      // Create sheets for each area
      areas.forEach(area => {
        const areaNodes = nodes.filter(node => node.areaId === area.id);
        const areaPipes = pipes.filter(pipe => pipe.areaId === area.id);

        if (areaNodes.length > 0) {
          const nodesData = areaNodes.map(node => ({
            'ID': node.id,
            'Наименование': node.name,
            'Адрес': node.address,
            'Назначение объекта': node.objectPurpose,
            'Юр. форма лица': node.legalForm,
            'Начисления': node.accruals,
            'Объём, м3': node.volumeM3,
            'Площадь, м2': node.areaM2,
            'Тепловая нагрузка из договора (макс), Гкал/час': node.contractedHeatLoadGcalHour,
            'Тепловая нагрузка расчётная (макс), Гкал/час': node.calculatedHeatLoadGcalHour,
            'Удельная отопительная нагрузка, ккал/м3*С': node.specificHeatingLoadKcalM3C,
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
          XLSX.utils.book_append_sheet(wb, nodesSheet, `${area.name}_Узлы`);
        }

        if (areaPipes.length > 0) {
          const pipesData = areaPipes.map(pipe => ({
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
          XLSX.utils.book_append_sheet(wb, pipesSheet, `${area.name}_Трубы`);
        }
      });

      // Create sheets for unassigned objects
      const unassignedNodes = nodes.filter(node => !node.areaId);
      if (unassignedNodes.length > 0) {
        const nodesData = unassignedNodes.map(node => ({
          'ID': node.id,
          'Наименование': node.name,
          'Адрес': node.address,
          'Назначение объекта': node.objectPurpose,
          'Юр. форма лица': node.legalForm,
          'Начисления': node.accruals,
          'Объём, м3': node.volumeM3,
          'Площадь, м2': node.areaM2,
          'Тепловая нагрузка из договора (макс), Гкал/час': node.contractedHeatLoadGcalHour,
          'Тепловая нагрузка расчётная (макс), Гкал/час': node.calculatedHeatLoadGcalHour,
          'Удельная отопительная нагрузка, ккал/м3*С': node.specificHeatingLoadKcalM3C,
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
        XLSX.utils.book_append_sheet(wb, nodesSheet, 'Другое_Узлы');
      }

      const unassignedPipes = pipes.filter(pipe => !pipe.areaId);
      if (unassignedPipes.length > 0) {
        const pipesData = unassignedPipes.map(pipe => ({
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
        XLSX.utils.book_append_sheet(wb, pipesSheet, 'Другое_Трубы');
      }

      const today = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Тепловая сеть - ${today}.xlsx`);

    } catch (error) {
      console.error("Ошибка при экспорте в Excel:", error);
      let userMessage = "Произошла неизвестная ошибка при экспорте в Excel.";
      if (error.message.includes("already exists")) {
        userMessage = "Ошибка: Не удалось экспортировать в Excel, так как обнаружены области с одинаковыми именами. Пожалуйста, переименуйте дублирующиеся области и попробуйте снова.";
      } 
      alert(userMessage);
    }
  };

  return (
    <button className="export-btn" onClick={handleExcelExport}>
      Экспорт в Excel
    </button>
  );
};

export default ExcelExportButton;
