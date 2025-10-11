import React, { useState, useRef, useEffect } from 'react';
import './OperationsMenu.css';
import ImportButton from './ImportButton';
import ExportButton from './ExportButton';
import ExcelExportButton from './ExcelExportButton';
import DxfExportButton from './DxfExportButton';
import GeoJsonExportButton from './GeoJsonExportButton'; // Импортируем новую кнопку

const OperationsMenu = ({ onClearProject }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleClearProject = () => {
    onClearProject();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="operations-menu" ref={menuRef}>
      <button className="menu-toggle-btn" onClick={toggleMenu}>
        <span>&#9776;</span> {/* Unicode for hamburger menu icon */}
        <span>Операции</span>
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          <ImportButton />
          <ExportButton />
          <ExcelExportButton />
          <DxfExportButton />
          <GeoJsonExportButton /> {/* Добавляем новую кнопку */}
          <button className="dropdown-item" onClick={handleClearProject}>
            Очистить проект
          </button>
        </div>
      )}
    </div>
  );
};

export default OperationsMenu;
