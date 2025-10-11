import React from 'react';
import useStore from '../useStore';
import { convertToGeoJson } from '../utils/geoJsonConverter';

const GeoJsonExportButton = () => {
  const handleClick = () => {
    try {
      // 1. Получаем актуальные данные из хранилища
      const { nodes, pipes } = useStore.getState();
      
      // 2. Вызываем функцию-конвертер
      const geoJsonData = convertToGeoJson(nodes, pipes);
      
      // 3. Преобразуем объект GeoJSON в строку
      const geoJsonString = JSON.stringify(geoJsonData, null, 2);
      
      // 4. Создаём Blob объект
      const blob = new Blob([geoJsonString], { type: 'application/geo+json' });
      
      // 5. Генерируем временную ссылку и имя файла
      const url = URL.createObjectURL(blob);
      const projectName = 'thermal-network-project';
      const filename = `${projectName}.geojson`;

      // Создаем ссылку для скачивания
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Очищаем после скачивания
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
