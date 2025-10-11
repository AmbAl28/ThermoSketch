import React from 'react';
import useStore from '../useStore';
import { convertToGeoJson } from '../utils/geoJsonConverter';

const GeoJsonExportButton = () => {
  const handleClick = () => {
    try {
      // Получаем все необходимые данные, включая области
      const { nodes, pipes, areas } = useStore.getState();
      
      // Передаем все данные в конвертер
      const geoJsonData = convertToGeoJson(nodes, pipes, areas);
      
      const geoJsonString = JSON.stringify(geoJsonData, null, 2);
      const blob = new Blob([geoJsonString], { type: 'application/geo+json' });
      
      const url = URL.createObjectURL(blob);
      const projectName = 'thermal-network-project';
      const filename = `${projectName}.geojson`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Ошибка при экспорте в GeoJSON:', error);
      alert('Произошла ошибка при создании GeoJSON файла. Проверьте консоль для получения дополнительной информации.');
    }
  };

  return (
    <button className="dropdown-item" onClick={handleClick}>
      Экспорт в geoJSON
    </button>
  );
};

export default GeoJsonExportButton;
