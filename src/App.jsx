
import { useState, useEffect } from 'react';
import './App.css';
import useStore from './useStore';
import Map from './components/Map';
import DataDisplay from './components/DataDisplay';
import PropertiesPanel from './components/PropertiesPanel';
import OperationsMenu from './components/OperationsMenu';

function App() {
  const [drawingMode, setDrawingMode] = useState('none');
  const clearProject = useStore((state) => state.clearProject);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Игнорируем, если фокус на элементах ввода
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      if (e.altKey) {
        switch (e.key) {
          case '1':
            setDrawingMode('point');
            break;
          case '2':
            setDrawingMode('pipe');
            break;
          case '3':
            setDrawingMode('none');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClearProject = () => {
    if (window.confirm('Вы уверены, что хотите полностью очистить проект? Все данные будут удалены.')) {
      clearProject();
      alert('Проект был успешно очищен.');
    }
  };

  return (
    <div className="App">
      <div className="sidebar">
        <h2>Леноблтеплоснаб</h2>
        <div className="controls">
          <button 
            onClick={() => setDrawingMode('point')}
            className={drawingMode === 'point' ? 'active' : ''}
            title="Добавить узел (Alt+1)"
          >
            📍 Добавить узел
          </button>
          <button 
            onClick={() => setDrawingMode('pipe')}
            className={drawingMode === 'pipe' ? 'active' : ''}
            title="Добавить трубу (Alt+2)"
          >
            〰️ Добавить трубу
          </button>
          <button 
            onClick={() => setDrawingMode('none')}
            className={drawingMode === 'none' ? 'active' : ''}
            title="Выбрать объект (Alt+3)"
          >
            🖱️ Выбрать
          </button>
        </div>

        <hr className="sidebar-divider" />

        <OperationsMenu onClearProject={handleClearProject} />

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
