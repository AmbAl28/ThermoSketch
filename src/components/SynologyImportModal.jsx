import React from 'react';
import useStore from '../useStore';
import './SynologyImportModal.css';
import ImportButton from './ImportButton';

const useSynologyImportStore = () => ({
  synologyShareUrl: useStore((state) => state.viewOptions.synologyShareUrl),
});

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const SynologyImportModal = ({ isOpen, onClose }) => {
  const { synologyShareUrl } = useSynologyImportStore();

  if (!isOpen) {
    return null;
  }

  const secureUrl = synologyShareUrl ? synologyShareUrl.replace(/^http:\/\//i, 'https://') : '';

  const handleOpenInNewTab = () => {
    if (secureUrl) {
      window.open(secureUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const renderContent = () => {
    if (!secureUrl) {
      return <p className="warning-text">URL для импорта не указан. Пожалуйста, введите его в меню "Операции".</p>;
    }

    if (isMobile) {
      return (
        <div className="mobile-instructions">
          <h4>Шаг 1: Скачайте файл</h4>
          <p>Встроенный просмотр недоступен на мобильных устройствах.</p>
          <button onClick={handleOpenInNewTab} className="action-button">
            Открыть Synology в новой вкладке
          </button>
        </div>
      );
    }

    return (
      <iframe
        src={secureUrl}
        title="Synology File Station"
        width="100%"
        height="100%"
        frameBorder="0"
      ></iframe>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Импорт из Synology</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {renderContent()}
        </div>

        <div className="import-footer">
          <div className="import-instructions-unified">
            <p>
              <strong>{isMobile ? 'Шаг 2:' : 'Шаг 1:'}</strong> 
              {isMobile 
                ? 'После скачивания файла вернитесь на эту вкладку и нажмите кнопку ниже.' 
                : 'Найдите и скачайте нужный JSON-файл (ПКМ по файлу, "Скачать"), затем нажмите кнопку ниже.'}
            </p>
          </div>
          
          {/* Убираем div-обертку и передаем классы и текст напрямую в ImportButton */}
          <ImportButton 
            onClose={onClose} 
            className="action-button import-button"
          >
            Выбрать скачанный файл...
          </ImportButton>

        </div>

      </div>
    </div>
  );
};

export default SynologyImportModal;
