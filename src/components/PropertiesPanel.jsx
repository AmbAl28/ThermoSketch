import React from 'react';
import useStore from '../useStore';

const PropertiesPanel = () => {
  const {
    selectedObject,
    setSelectedObject,
    updateNode,
    updatePipe,
    deleteObject,
    movingNodeId,
    setMovingNodeId,
    editingPipeId,
    editingMode,
    startPipeEditing,
    setEditingMode,
    finishPipeEditing,
    getAreaById,
    selectedAreaId,
    setSelectedAreaId,
    updateArea,
    deleteArea,
  } = useStore();

  const areaColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
    '#FF5722', '#795548', '#9E9E9E', '#607D8B', '#2c3e50',
    '#C62828', '#AD1457', '#6A1B9A', '#4527A0', '#283593',
    '#1565C0', '#0277BD', '#00838F', '#2E7D32', '#558B2F'
  ];

  const handleMoveClick = () => {
    if (selectedObject && selectedObject.type === 'node') {
      setMovingNodeId(selectedObject.id);
    }
  };

  const handleStartEditing = () => {
    if (selectedObject && selectedObject.type === 'pipe') {
      startPipeEditing(selectedObject.id);
    }
  };

  const handleAreaChange = (e) => {
    const { name, value } = e.target;
    updateArea(selectedAreaId, { [name]: value });
  };

  const handleDeleteArea = () => {
    if (window.confirm(`Вы уверены, что хотите удалить эту область? Все объекты в ней станут непривязанными.`)) {
      deleteArea(selectedAreaId);
    }
  }

  if (selectedAreaId && !selectedObject) {
    const area = getAreaById(selectedAreaId);
    if (!area) return (
        <div className="properties-panel">
            <h4>Свойства</h4>
            <p>Объект или область не выбраны.</p>
        </div>
    );

    return (
      <div className="properties-panel">
        <h4>Редактирование области</h4>
        <div className="controls">
          <button className="delete-btn" onClick={handleDeleteArea}>Удалить область</button>
          <button className="close-btn" onClick={() => setSelectedAreaId(null)}>Закрыть</button>
        </div>
        <form>
          <label htmlFor="name">Название</label>
          <input type="text" id="name" name="name" value={area.name} onChange={handleAreaChange} />
          <label htmlFor="color">Цвет</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: area.color,
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            ></div>
            <select id="color" name="color" value={area.color} onChange={handleAreaChange} style={{ flex: 1 }}>
              {areaColors.map(color => (
                <option key={color} value={color} style={{ backgroundColor: color, color: '#fff', textShadow: '0 0 2px black' }}>
                  {color}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>
    );
  }

  if (selectedObject) {
    const isNode = selectedObject.type === 'node';
    const data = isNode
      ? useStore.getState().nodes.find(n => n.id === selectedObject.id)
      : useStore.getState().pipes.find(p => p.id === selectedObject.id);

    if (!data) {
        return (
            <div className="properties-panel">
              <h4>Ошибка</h4>
              <p>Не удалось найти данные для выбранного объекта. Возможно, он был удален.</p>
              <div className="controls">
                <button className="close-btn" onClick={() => setSelectedObject(null)}>Закрыть</button>
              </div>
            </div>
          );
    }

    const area = data.areaId ? getAreaById(data.areaId) : null;
    const isEditingPipe = editingPipeId === data.id;

    const handleClose = () => {
      finishPipeEditing();
      setMovingNodeId(null);
      setSelectedObject(null);
    };

    const handleDelete = () => {
      if (window.confirm(`Вы уверены, что хотите удалить этот ${isNode ? 'узел' : 'участок'}? Это действие нельзя отменить.`)) {
        deleteObject(selectedObject);
      }
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      const isNumericField = [
        'elevation', 'diameter', 'length', 'actualLength', 'insulationWear',
        'heatLoad', 'staticPressure', 'supplyTemperature', 'returnTemperature'
      ].includes(name);

      const updatedValue = isNumericField && value !== '' ? parseFloat(value) : value;

      if (isNode) {
        updateNode(selectedObject.id, { [name]: updatedValue });
      } else {
        updatePipe(selectedObject.id, { [name]: updatedValue });
      }
    };

    const renderNodeForm = () => (
      <>
        <label htmlFor="name">Наименование</label>
        <input type="text" id="name" name="name" value={data.name || ''} onChange={handleChange} placeholder="Введите наименование" />
        <label htmlFor="nodeType">Тип узла</label>
        <select id="nodeType" name="nodeType" value={data.nodeType || 'chamber'} onChange={handleChange}>
          <option value="consumer">Потребитель</option>
          <option value="source">Источник</option>
          <option value="chamber">Камера</option>
          <option value="diameter_change">Смена диаметра</option>
          <option value="valve">Арматура</option>
        </select>
        <label htmlFor="elevation">Отметка высоты, м</label>
        <input type="number" id="elevation" name="elevation" value={data.elevation || ''} onChange={handleChange} step="0.1" placeholder="Не задана" />
        <label htmlFor="heatLoad">Тепловая нагрузка, Гкал/ч</label>
        <input type="number" id="heatLoad" name="heatLoad" value={data.heatLoad || ''} onChange={handleChange} placeholder="Не задана" step="0.01" />
        <label htmlFor="staticPressure">Статический напор, м</label>
        <input type="number" id="staticPressure" name="staticPressure" value={data.staticPressure || ''} onChange={handleChange} placeholder="Не задан" step="0.1" />
        <label htmlFor="supplyTemperature">Температура подачи, °C</label>
        <input type="number" id="supplyTemperature" name="supplyTemperature" value={data.supplyTemperature || ''} onChange={handleChange} placeholder="Не задана" step="1" />
        <label htmlFor="returnTemperature">Температура обратки, °C</label>
        <input type="number" id="returnTemperature" name="returnTemperature" value={data.returnTemperature || ''} onChange={handleChange} placeholder="Не задана" step="1" />
        <label htmlFor="contractNumber">№ договора</label>
        <input type="text" id="contractNumber" name="contractNumber" value={data.contractNumber || ''} onChange={handleChange} placeholder="Не указан" />
        <label htmlFor="note">Примечание</label>
        <textarea id="note" name="note" value={data.note || ''} onChange={handleChange} placeholder="Введите примечание" rows="3"></textarea>
      </>
    );

    const renderPipeForm = () => (
      <>
        <label htmlFor="length">Расчётная длина, м</label>
        <input type="number" id="length" name="length" value={data.length ? data.length.toFixed(2) : '0'} onChange={handleChange} readOnly />
        <label htmlFor="actualLength">Фактическая длина, м</label>
        <input type="number" id="actualLength" name="actualLength" value={data.actualLength || ''} onChange={handleChange} placeholder="Не задана" />
        <label htmlFor="diameter">Диаметр, мм</label>
        <input type="number" id="diameter" name="diameter" value={data.diameter || 100} onChange={handleChange} />
        <label htmlFor="material">Материал труб</label>
        <select id="material" name="material" value={data.material || 'Сталь'} onChange={handleChange}>
          <option value="Сталь">Сталь</option>
          <option value="Нержавеющая сталь">Нержавеющая сталь</option>
          <option value="Медные">Медные</option>
          <option value="Полипропиленовые (PPR)">Полипропиленовые (PPR)</option>
          <option value="Полиэтиленовые (PE)">Полиэтиленовые (PE)</option>
          <option value="Сшитый полиэтилен (PEX)">Сшитый полиэтилен (PEX)</option>
          <option value="Металлопластиковые трубы">Металлопластиковые трубы</option>
        </select>
        <label htmlFor="insulationMaterial">Материал изоляции</label>
        <select id="insulationMaterial" name="insulationMaterial" value={data.insulationMaterial || 'ППУ'} onChange={handleChange}>
          <option value="ППУ">Пенополиуретан (ППУ)</option>
          <option value="Минеральная вата">Минеральная вата</option>
          <option value="Вспененный полиэтилен">Вспененный полиэтилен</option>
          <option value="Вспененный каучук">Вспененный каучук</option>
        </select>
        <label htmlFor="insulationWear">Износ изоляции, %</label>
        <input type="number" id="insulationWear" name="insulationWear" value={data.insulationWear || 0} onChange={handleChange} min="0" max="100" step="1" />
      </>
    );

    return (
      <div className="properties-panel">
        <h4>{isNode ? 'Редактирование узла' : (isEditingPipe ? 'Редактирование конфигурации' : 'Редактирование трубы')}</h4>
        {isEditingPipe ? null : <p>ID: {data.id.substring(0, 8)}</p>}
        {!isEditingPipe && <p>Область: {area ? area.name : 'Другое'}</p>}

        {isEditingPipe ? (
          <div className="controls">
            <button onClick={() => setEditingMode('add')} className={editingMode === 'add' ? 'active' : ''}>Добавить вершину</button>
            <button onClick={() => setEditingMode('move')} className={editingMode === 'move' ? 'active' : ''}>Переместить вершину</button>
            <button onClick={() => setEditingMode('delete')} className={editingMode === 'delete' ? 'active' : ''}>Удалить вершину</button>
            <button className="finish-btn" onClick={finishPipeEditing}>Завершить</button>
          </div>
        ) : (
          <div className="controls">
            {isNode ? (
              <>
                <button className="move-btn" onClick={handleMoveClick} disabled={!!movingNodeId}>
                  {movingNodeId === data.id ? 'Выберите новое место' : 'Переместить узел'}
                </button>
                <button className="delete-btn" onClick={handleDelete}>Удалить узел</button>
              </>
            ) : (
              <>
                <button className="edit-btn" onClick={handleStartEditing}>
                  Редактировать конфигурацию
                </button>
                <button className="delete-btn" onClick={handleDelete}>Удалить трубу</button>
              </>
            )}
            <button className="close-btn" onClick={handleClose}>Закрыть</button>
          </div>
        )}

        <form>
          {!isEditingPipe && (isNode ? renderNodeForm() : renderPipeForm())}
          {movingNodeId === data.id && <p className="move-tooltip">Нажмите Escape для отмены</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <h4>Свойства</h4>
      <p>Объект или область не выбраны. Кликните на объект на карте или на название области в сводке, чтобы просмотреть и отредактировать их свойства.</p>
    </div>
  );
};

export default PropertiesPanel;
