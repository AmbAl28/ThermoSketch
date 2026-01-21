import React, { useState, useRef, useEffect } from 'react';
import useStore from '../useStore';
import './DropdownMenu.css'; // Используем тот же стиль, что и у Operations

const NODE_TYPE_TRANSLATIONS = {
  source: 'Источники',
  consumer: 'Потребители',
  chamber: 'Камеры',
  valve: 'Арматура',
  diameter_change: 'Смены диаметра'
};

const allNodeTypes = Object.keys(NODE_TYPE_TRANSLATIONS);

const ViewOptionsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { viewOptions, setViewOptions } = useStore();
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleCheckboxChange = (option) => {
    setViewOptions({ [option]: !viewOptions[option] });
  };

  const handleNodeTypeToggle = (nodeType) => {
    const { hiddenAnnotationNodeTypes } = viewOptions;
    const newHiddenTypes = hiddenAnnotationNodeTypes.includes(nodeType)
      ? hiddenAnnotationNodeTypes.filter(t => t !== nodeType)
      : [...hiddenAnnotationNodeTypes, nodeType];
    setViewOptions({ hiddenAnnotationNodeTypes: newHiddenTypes });
  };

  const handleFontSizeChange = (e) => {
    const value = e.target.value;
    if (value === '') {
        setViewOptions({ fontSize: '' });
        return;
    }
    const newSize = parseInt(value, 10);
    if (!isNaN(newSize)) {
      const clampedSize = Math.max(5, Math.min(24, newSize));
      setViewOptions({ fontSize: clampedSize });
    }
  };

  // Закрытие меню по клику вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="dropdown-container view-options-panel" ref={dropdownRef}>
      <button onClick={toggleDropdown} className="dropdown-button">
        Вид
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-item-input" style={{ padding: '8px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="font-size-input">Размер шрифта:</label>
            <input
              id="font-size-input"
              type="number"
              min="5"
              max="24"
              value={viewOptions.fontSize}
              onChange={handleFontSizeChange}
              style={{ width: '60px', textAlign: 'center' }}
            />
          </div>
          <div className="dropdown-separator"></div>

          <div className="dropdown-item-checkbox">
            <label>
              <input
                type="checkbox"
                checked={viewOptions.showAnnotations}
                onChange={() => handleCheckboxChange('showAnnotations')}
              />
              Показывать все сноски
            </label>
          </div>
          
          {viewOptions.showAnnotations && (
            <>
              <div className="dropdown-item-checkbox sub-item">
                <label>
                  <input
                    type="checkbox"
                    checked={viewOptions.showNodeAnnotations}
                    onChange={() => handleCheckboxChange('showNodeAnnotations')}
                  />
                  Сноски узлов
                </label>
              </div>

              {viewOptions.showNodeAnnotations && (
                <>
                  <div className="dropdown-item-checkbox sub-item" style={{ paddingLeft: '30px' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={viewOptions.showNodeNames}
                        onChange={() => handleCheckboxChange('showNodeNames')}
                      />
                      Названия
                    </label>
                  </div>

                  <div className="dropdown-item-checkbox sub-item" style={{ paddingLeft: '30px' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={viewOptions.showNodeTypes}
                        onChange={() => handleCheckboxChange('showNodeTypes')}
                      />
                      Типы узлов
                    </label>
                  </div>

                  <div className="sub-item-group">
                    {allNodeTypes.map(type => (
                      <div key={type} className="dropdown-item-checkbox sub-sub-item">
                        <label>
                          <input
                            type="checkbox"
                            checked={!viewOptions.hiddenAnnotationNodeTypes.includes(type)}
                            onChange={() => handleNodeTypeToggle(type)}
                          />
                          {NODE_TYPE_TRANSLATIONS[type]}
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="dropdown-item-checkbox sub-item">
                <label>
                  <input
                    type="checkbox"
                    checked={viewOptions.showPipeAnnotations}
                    onChange={() => handleCheckboxChange('showPipeAnnotations')}
                  />
                  Сноски труб
                </label>
              </div>

              {viewOptions.showPipeAnnotations && (
                <>
                  <div className="dropdown-item-checkbox sub-item" style={{ paddingLeft: '30px' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={viewOptions.showPipeLength}
                        onChange={() => handleCheckboxChange('showPipeLength')}
                      />
                      Протяженность
                    </label>
                  </div>

                  <div className="dropdown-item-checkbox sub-item" style={{ paddingLeft: '30px' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={viewOptions.showPipeDiameter}
                        onChange={() => handleCheckboxChange('showPipeDiameter')}
                      />
                      Диаметры
                    </label>
                  </div>
                </>
              )}
            </>
          )}
          
          <div className="dropdown-separator"></div>

          <div className="dropdown-item-checkbox">
            <label>
              <input
                type="checkbox"
                checked={viewOptions.forceLargeNodes}
                onChange={() => handleCheckboxChange('forceLargeNodes')}
              />
              Увеличенные значки узлов
            </label>
          </div>

          <div className="dropdown-item-checkbox">
            <label>
              <input
                type="checkbox"
                checked={viewOptions.usePipeDiameterForWidth}
                onChange={() => handleCheckboxChange('usePipeDiameterForWidth')}
              />
              Трубы по диаметру
            </label>
          </div>

        </div>
      )}
    </div>
  );
};

export default ViewOptionsPanel;
