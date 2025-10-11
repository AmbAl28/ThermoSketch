import React from 'react';
import './DropdownMenu.css'; // Используем те же стили для консистентности

const PdfExportButton = () => {
  const handleExport = () => {
    // TODO: Реализовать логику экспорта в PDF
    console.log('Экспорт в PDF пока не реализован.');
    alert('Функция экспорта в PDF находится в разработке.');
  };

  return (
    <button className="dropdown-item" onClick={handleExport}>
      Экспорт в PDF
    </button>
  );
};

export default PdfExportButton;
