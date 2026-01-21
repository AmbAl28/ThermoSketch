import React, { useState, useRef, useEffect } from 'react';
import useStore from '../useStore';
import './DropdownMenu.css'; 

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

  const handleSliderChange = (option, value) => {
    setViewOptions({ [option]: parseInt(value, 10) });
  };

  const handleNodeTypeToggle = (nodeType) => {
    const { hiddenAnnotationNodeTypes } = viewOptions;
    const newHiddenTypes = hiddenAnnotationNodeTypes.includes(nodeType)
      ? hiddenAnnotationNodeTypes.filter(t => t !== nodeType)
      : [...hiddenAnnotationNodeTypes, nodeType];
    setViewOptions({ hiddenAnnotationNodeTypes: newHiddenTypes });
  };

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
          <div className="dropdown-item-slider">
            <label htmlFor="font-size-slider">Размер шрифта: {viewOptions.fontSize}px</label>
            <input
              id="font-size-slider"
              type="range"
              min="5"
              max="24"
              value={viewOptions.fontSize}
              onChange={(e) => handleSliderChange('fontSize', e.target.value)}
            />
          </div>

          <div className="dropdown-item-slider">
            <label htmlFor="node-size-slider">Размер узлов: {viewOptions.nodeSize}px</label>
            <input
              id="node-size-slider"
              type="range"
              min="2"
              max="26"
              value={viewOptions.nodeSize}
              onChange={(e) => handleSliderChange('nodeSize', e.target.value)}
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
