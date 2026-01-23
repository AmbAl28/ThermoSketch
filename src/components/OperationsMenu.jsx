import React, { useState, useRef, useEffect } from 'react';
import useStore from '../useStore';
import './OperationsMenu.css';
import ImportButton from './ImportButton';
import ExportButton from './ExportButton';
import ExcelExportButton from './ExcelExportButton';
import DxfExportButton from './DxfExportButton';
import GeoJsonExportButton from './GeoJsonExportButton';
import PdfExportButton from './PdfExportButton';

const OperationsMenu = ({ onClearProject, onSynologyImportClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const viewOptions = useStore(state => state.viewOptions);
  const setViewOptions = useStore(state => state.setViewOptions);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleClearProject = () => {
    onClearProject();
    setIsOpen(false);
  };

  const handleSynologyImport = () => {
    if (onSynologyImportClick) {
      onSynologyImportClick();
    }
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

  // Обертка для input, чтобы он выглядел как элемент меню
  const SynologyInput = () => (
    <div className="dropdown-item" onClick={(e) => e.stopPropagation()} style={{ padding: 0 }}>
      <input
        type="text"
        placeholder="Ссылка на Synology"
        value={viewOptions.synologyShareUrl || ''}
        onChange={(e) => setViewOptions({ synologyShareUrl: e.target.value })}
        style={{
          width: '100%',
          padding: '10px 15px',
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          color: 'inherit',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );

  return (
    <div className="operations-menu" ref={menuRef}>
      <button className="menu-toggle-btn" onClick={toggleMenu}>
        <span>&#9776;</span>
        <span>Операции</span>
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {/* --- Synology Import --- */}
          <SynologyInput />
          <button 
            className="dropdown-item" 
            onClick={handleSynologyImport} 
            disabled={!viewOptions.synologyShareUrl}
          >
            Импорт из Synology
          </button>
          <div className="dropdown-divider"></div>
          
          {/* --- Other Operations --- */}
          <ImportButton />
          <ExportButton />
          <ExcelExportButton />
          <DxfExportButton />
          <GeoJsonExportButton />
          <PdfExportButton />
          <div className="dropdown-divider"></div>
          <button className="dropdown-item" onClick={handleClearProject}>
            Очистить проект
          </button>
        </div>
      )}
    </div>
  );
};

export default OperationsMenu;
