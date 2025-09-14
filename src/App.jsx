import { useState } from 'react';
import './App.css';
import useStore from './useStore'; // Импортируем useStore
import Map from './components/Map';
import DataDisplay from './components/DataDisplay';
import PropertiesPanel from './components/PropertiesPanel';
import ExportButton from './components/ExportButton';
import ExcelExportButton from './components/ExcelExportButton';
import ImportButton from './components/ImportButton';

function App() {
  const [drawingMode, setDrawingMode] = useState('none');
  const clearProject = useStore((state) => state.clearProject); // Получаем экшен из хранилища

  const handleClearProject = () => {
    if (window.confirm('Вы уверены, что хотите полностью очистить проект? Все данные будут удалены.')) {
      clearProject();
      // Сообщение пользователю
      alert('Проект был успешно очищен.');
    }
  };

  return (
    <div className="App">
      <div className="sidebar">
        <h2>Панель управления</h2>
        <div className="controls">
          <button 
            onClick={() => setDrawingMode('point')}
            className={drawingMode === 'point' ? 'active' : ''}
          >
            Добавить узел
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
          <ImportButton />
          <ExportButton />
          <ExcelExportButton />
        </div>
        {/* Новая кнопка для очистки */}
        <div className="project-controls">
            <button className="clear-btn" onClick={handleClearProject}>
                Очистить проект
            </button>
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
