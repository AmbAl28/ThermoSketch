import { useState } from 'react';
import './App.css';
import Map from './components/Map';
import DataDisplay from './components/DataDisplay';
import PropertiesPanel from './components/PropertiesPanel';
import ExportButton from './components/ExportButton';
import ImportButton from './components/ImportButton'; // Импорт

function App() {
  const [drawingMode, setDrawingMode] = useState('none');

  return (
    <div className="App">
      <div className="sidebar">
        <h2>Панель управления</h2>
        <div className="controls">
          <button 
            onClick={() => setDrawingMode('point')}
            className={drawingMode === 'point' ? 'active' : ''}
          >
            Добавить точку
          </button>
          <button 
            onClick={() => setDrawingMode('pipe')}
            className={drawingMode === 'pipe' ? 'active' : ''}
          >
            Нарисовать трубу
          </button>
          <button 
            onClick={() => setDrawingMode('none')}
            className={drawingMode === 'none' ? 'active' : ''}
          >
            Выбрать
          </button>
        </div>
        <div className="import-export-controls">
          <ImportButton /> {/* Добавляем кнопку импорта */}
          <ExportButton /> {/* Оборачиваем кнопки в контейнер */}
        </div>
        <PropertiesPanel />
        <DataDisplay />
      </div>
      <div className="map-container">
        <Map drawingMode={drawingMode} setDrawingMode={setDrawingMode} />
      </div>
    </div>
  );
}

export default App;
