import React, { useState, useEffect } from 'react';
import './App.css';
import useStore from './useStore';
import Map from './components/Map';
import DataDisplay from './components/DataDisplay';
import PropertiesPanel from './components/PropertiesPanel';
import OperationsMenu from './components/OperationsMenu';
import ViewOptionsPanel from './components/ViewOptionsPanel';
import AreaLayer from './components/AreaLayer';
import MapEvents from './components/MapEvents';
import SynologyImportModal from './components/SynologyImportModal'; // Импорт модального окна

function App() {
  const [drawingMode, setDrawingMode] = useState('none');
  const [isSynologyModalOpen, setIsSynologyModalOpen] = useState(false); // Состояние для модального окна

  const { 
    clearProject, 
    isPanelCollapsed, 
    togglePanel, 
    areaCreationMode,
    toggleAreaCreationMode,
  } = useStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
    return () => clearTimeout(timer);
  }, [isPanelCollapsed]);

  const handleToggleAreaCreation = () => {
    if (!areaCreationMode) {
        setDrawingMode('area');
        toggleAreaCreationMode(); 
    } else {
        setDrawingMode('none');
        toggleAreaCreationMode();
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }
      if (e.altKey) {
        switch (e.key) {
          case '1': setDrawingMode('point'); break;
          case '2': setDrawingMode('pipe'); break;
          case '3': setDrawingMode('none'); break;
          case '4': handleToggleAreaCreation(); break; 
          default: break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaCreationMode]);

  const handleClearProject = () => {
    if (window.confirm('Вы уверены, что хотите полностью очистить проект? Все данные будут удалены.')) {
      clearProject();
      alert('Проект был успешно очищен.');
    }
  };

  // Функции для управления модальным окном
  const handleOpenSynologyModal = () => setIsSynologyModalOpen(true);
  const handleCloseSynologyModal = () => setIsSynologyModalOpen(false);

  return (
    <div className="App">
      <div className={`sidebar ${isPanelCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!isPanelCollapsed && (
            <h1 className="logo-title">
              Thermo<span className="logo-sketch">Sketch</span>
            </h1>
          )}
          <button onClick={togglePanel} className="toggle-panel-btn">
            {isPanelCollapsed ? '\u00BB' : '\u00AB'}
          </button>
        </div>

        <div className="controls">
          <button 
            onClick={() => setDrawingMode('point')}
            className={drawingMode === 'point' ? 'active' : ''}
            title="Добавить узел (Alt+1)"
          >
            📍<span className="control-text">{!isPanelCollapsed && ' Добавить узел'}</span>
          </button>
          <button 
            onClick={() => setDrawingMode('pipe')}
            className={drawingMode === 'pipe' ? 'active' : ''}
            title="Добавить трубу (Alt+2)"
          >
            〰️<span className="control-text">{!isPanelCollapsed && ' Добавить трубу'}</span>
          </button>
          <button 
            onClick={handleToggleAreaCreation}
            className={drawingMode === 'area' ? 'active' : ''}
            title="Добавить область (Alt+4)"
          >
            🔲<span className="control-text">{!isPanelCollapsed && ' Добавить область'}</span>
          </button>
          <button 
            onClick={() => setDrawingMode('none')}
            className={drawingMode === 'none' ? 'active' : ''}
            title="Выбрать объект (Alt+3)"
          >
            🖱️<span className="control-text">{!isPanelCollapsed && ' Выбрать'}</span>
          </button>
        </div>
        
        {!isPanelCollapsed && (
          <>
            <hr className="sidebar-divider" />
            <PropertiesPanel />
            <DataDisplay />
          </>
        )}
      </div>
      <div className="map-container">
        <div className="map-overlay-controls">
          <OperationsMenu 
            onClearProject={handleClearProject} 
            onSynologyImportClick={handleOpenSynologyModal} // Передаем функцию открытия
          />
          <ViewOptionsPanel />
        </div>
        <Map drawingMode={drawingMode} setDrawingMode={setDrawingMode}>
            <AreaLayer />
            <MapEvents setDrawingMode={setDrawingMode} />
        </Map>
      </div>

      {/* Отображение модального окна */}
      <SynologyImportModal 
        isOpen={isSynologyModalOpen} 
        onClose={handleCloseSynologyModal} 
      />
    </div>
  );
}

export default App;
