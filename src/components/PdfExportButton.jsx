import React, { useState, useCallback } from 'react';
import useStore from '../useStore';
import { preparePdfExportData } from '../utils/pdfExportUtils';
import './DropdownMenu.css';
import './PdfExportButton.css'; // Добавим стили для прогресс-бара

const PdfExportButton = () => {
  const { getState } = useStore;
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    setProgress(0);

    try {
      // Теперь мы ожидаем выполнения асинхронной функции
      await preparePdfExportData(getState, setProgress);
    } catch (error) {
      console.error("Ошибка в процессе экспорта в PDF:", error);
      alert("Произошла непредвиденная ошибка во время экспорта.");
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [getState, isExporting]);

  return (
    <div>
      <button 
        className="dropdown-item" 
        onClick={handleExport} 
        disabled={isExporting}
      >
        {isExporting ? `Экспорт... (${Math.round(progress)}%)` : 'Экспорт в PDF'}
      </button>
      {isExporting && (
        <div className="progress-bar-container">
          <div 
            className="progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default PdfExportButton;
