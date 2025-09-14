import useStore from '../useStore';

const PropertiesPanel = () => {
  const { selectedObject, setSelectedObject, updateNode, updatePipe, deleteObject } = useStore();

  if (!selectedObject) {
    return (
      <div className="properties-panel">
        <h4>Свойства объекта</h4>
        <p>Объект не выбран. Кликните на узел или трубу на карте, чтобы просмотреть и отредактировать их свойства.</p>
      </div>
    );
  }

  const isNode = selectedObject.type === 'node';
  const data = isNode 
    ? useStore.getState().nodes.find(n => n.id === selectedObject.id)
    : useStore.getState().pipes.find(p => p.id === selectedObject.id);

  if (!data) {
    return (
        <div className="properties-panel">
          <h4>Ошибка</h4>
          <p>Не удалось найти данные для выбранного объекта. Возможно, он был удален.</p>
        </div>
      );
  }

  const handleClose = () => setSelectedObject(null);

  const handleDelete = () => {
    if (window.confirm(`Вы уверены, что хотите удалить этот ${isNode ? 'узел' : 'участок'}? Это действие нельзя отменить.`)) {
      deleteObject(selectedObject);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === 'elevation' || name === 'diameter' || name === 'length' ? parseFloat(value) : value;
    
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
      <select id="nodeType" name="nodeType" value={data.nodeType || 'consumer'} onChange={handleChange}>
        <option value="consumer">Потребитель</option>
        <option value="source">Источник</option>
        <option value="chamber">Камера</option>
      </select>

      <label htmlFor="elevation">Отметка высоты, м</label>
      <input type="number" id="elevation" name="elevation" value={data.elevation || 0} onChange={handleChange} step="0.1" />
      
      {/* TODO: Add specific fields for consumer and source types */}
    </>
  );

  const renderPipeForm = () => (
    <>
        <label htmlFor="length">Длина, м</label>
        <input type="number" id="length" name="length" value={data.length || 0} onChange={handleChange} readOnly />

        <label htmlFor="diameter">Диаметр, мм</label>
        <input type="number" id="diameter" name="diameter" value={data.diameter || 100} onChange={handleChange} />

        <label htmlFor="material">Материал</label>
        <select id="material" name="material" value={data.material || 'steel'} onChange={handleChange}>
            <option value="steel">Сталь</option>
            <option value="ppu">ППУ</option>
            <option value="pe">ПЭ</option>
        </select>
    </>
  );

  return (
    <div className="properties-panel">
      <h4>{isNode ? 'Редактирование узла' : 'Редактирование трубы'}</h4>
      <p>ID: {data.id}</p>
      <form>
        {isNode ? renderNodeForm() : renderPipeForm()}
        
        <div className="form-buttons">
          <button type="button" className="close-btn" onClick={handleClose}>Закрыть</button>
          <button type="button" className="delete-btn" onClick={handleDelete}>Удалить</button>
        </div>
      </form>
    </div>
  );
};

export default PropertiesPanel;
