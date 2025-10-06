import React, { useState, useEffect } from 'react';
import './App.css';
import useStore from './useStore';
import Map from './components/Map';
import DataDisplay from './components/DataDisplay';
import PropertiesPanel from './components/PropertiesPanel';
import OperationsMenu from './components/OperationsMenu';
import AreaLayer from './components/AreaLayer';
import MapEvents from './components/MapEvents';

function App() {
  const [drawingMode, setDrawingMode] = useState('none');
  const { 
    clearProject, 
    isPanelCollapsed, 
    togglePanel, 
    toggleAreaCreationMode, 
    areaCreationMode,
    selectedAreaId,
    deleteArea,
    updateArea,
    getAreaById
  } = useStore();

  const selectedArea = selectedAreaId ? getAreaById(selectedAreaId) : null;

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
    return () => clearTimeout(timer);
  }, [isPanelCollapsed]);

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
          case '4': toggleAreaCreationMode(); break; 
          default: break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleAreaCreationMode]);

  const handleClearProject = () => {
    if (window.confirm('Вы уверены, что хотите полностью очистить проект? Все данные будут удалены.')) {
      clearProject();
      alert('Проект был успешно очищен.');
    }
  };

  const handleAreaNameChange = (e) => {
    if (selectedArea) {
      updateArea(selectedArea.id, { name: e.target.value });
    }
  };

  const handleAreaDelete = () => {
    if (selectedArea && window.confirm(`Удалить область "${selectedArea.name}"?`)) {
      deleteArea(selectedArea.id);
    }
  };

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
            onClick={toggleAreaCreationMode}
            className={areaCreationMode ? 'active' : ''}
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
            <OperationsMenu onClearProject={handleClearProject} />
            {selectedArea ? (
              <div className="properties-section">
                <h3>Свойства области</h3>
                <label>Название:</label>
                <input 
                  type="text" 
                  value={selectedArea.name} 
                  onChange={handleAreaNameChange} 
                />
                <button onClick={handleAreaDelete} className="delete-button">Удалить область</button>
              </div>
            ) : (
              <PropertiesPanel />
            )}
            <DataDisplay />
          </>
        )}
      </div>
      <div className="map-container">
        <Map drawingMode={drawingMode} setDrawingMode={setDrawingMode}>
            <AreaLayer />
            <MapEvents />
        </Map>
      </div>
    </div>
  );
}

export default App;
