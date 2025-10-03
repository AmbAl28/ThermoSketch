import { useState } from 'react';
import useStore from '../useStore';
import ImportButton from './ImportButton';
import ExportButton from './ExportButton';
import ExportExcelButton from './ExportExcelButton';
import ExportDxfButton from './ExportDxfButton';
import ClearProjectButton from './ClearProjectButton';

const Toolbar = ({ drawingMode, setDrawingMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { selectedObject, deleteObject, duplicateObject, startMovingNode, movingNodeId } = useStore();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleDelete = () => {
    if (selectedObject) {
      deleteObject(selectedObject.id, selectedObject.type);
    }
  };

  const handleDuplicate = () => {
    if (selectedObject) {
      duplicateObject(selectedObject.id, selectedObject.type);
    }
  };

  const handleMoveNode = () => {
    if (selectedObject && selectedObject.type === 'node' && !movingNodeId) {
      startMovingNode(selectedObject.id);
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button 
            className={`toolbar-button ${drawingMode === 'node' ? 'active' : ''}`}
            onClick={() => setDrawingMode(drawingMode === 'node' ? null : 'node')}
        >
            Узел
        </button>
        <button 
            className={`toolbar-button ${drawingMode === 'pipe' ? 'active' : ''}`}
            onClick={() => setDrawingMode(drawingMode === 'pipe' ? null : 'pipe')}
        >
            Труба
        </button>
      </div>

      <div className="toolbar-group">
        <button className="toolbar-button" onClick={handleDelete} disabled={!selectedObject}>Удалить</button>
        <button className="toolbar-button" onClick={handleDuplicate} disabled={!selectedObject}>Дублировать</button>
        <button 
          className="toolbar-button"
          onClick={handleMoveNode}
          disabled={!selectedObject || selectedObject.type !== 'node' || movingNodeId}
        >
          Переместить
        </button>
      </div>

      <div className="toolbar-group">
        <div className="dropdown">
          <button className="toolbar-button" onClick={toggleMenu}>Операции</button>
          {isMenuOpen && (
            <div className="dropdown-menu">
                <ImportButton />
                <ExportButton />
                <ExportExcelButton />
                <ExportDxfButton />
                <ClearProjectButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
