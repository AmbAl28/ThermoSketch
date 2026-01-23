import React from 'react';
import useStore from '../useStore';
import './SynologyImportModal.css';

const SynologyImportModal = ({ isOpen, onClose }) => {
  const synologyShareUrl = useStore(state => state.viewOptions.synologyShareUrl);

  if (!isOpen) {
    return null;
  }

  const secureUrl = synologyShareUrl ? synologyShareUrl.replace(/^http:\/\//i, 'https://') : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Импорт из Synology</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {/* --- Инструкция (обновлена) --- */}
        <div className="import-instructions">
          <p><strong>Как импортировать файл:</strong></p>
          <ol>
            <li>Найдите нужный файл формата (.json) в окне ниже.</li>
            <li>Используя интерфейс Synology, скачайте этот файл на своё устройство (ПКМ по файлу, Скачать).</li>
            <li>Закройте это окно.</li>
            <li>Нажмите на кнопку "Импорт JSON" в меню "Операции" и выберите скачанный файл на вашем устройстве.</li>
          </ol>
        </div>

        <div className="modal-body">
          {secureUrl ? (
            <iframe 
              src={secureUrl} 
              title="Synology File Station"
              width="100%" 
              height="100%" 
              frameBorder="0"
            ></iframe>
          ) : (
            <p>URL для импорта не указан. Пожалуйста, введите его в меню "Операции".</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SynologyImportModal;
