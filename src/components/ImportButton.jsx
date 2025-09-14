import React, { useRef } from 'react';
import useStore from '../useStore';

const ImportButton = () => {
  const fileInputRef = useRef(null);
  const { setNodes, setPipes } = useStore();

  const handleImportClick = () => {
    // Активируем скрытый input
    fileInputRef.current.click();
  };

  const validateAndProcessFile = (data) => {
    // 1. Базовая валидация структуры
    if (typeof data !== 'object' || data === null || !Array.isArray(data.nodes) || !Array.isArray(data.pipes)) {
      alert('Invalid file format: The file must contain "nodes" and "pipes" arrays.');
      return;
    }

    // 2. Валидация узлов и трансформация данных
    const newNodes = data.nodes.map(node => {
      if (!node.id || !node.type || (node.x === undefined && node.lng === undefined) || (node.y === undefined && node.lat === undefined)) {
        throw new Error(`Invalid node object: A node is missing required fields (id, type, x/lng, y/lat). Problem object: ${JSON.stringify(node)}`);
      }
      return {
        id: node.id,
        name: node.name || 'Unnamed Node',
        nodeType: node.type, // Сопоставляем `type` из файла с нашим `nodeType`
        elevation: node.elevation || 0,
        lat: node.y ?? node.lat, // Поддерживаем оба варианта: y/lat
        lng: node.x ?? node.lng, // и x/lng
        type: 'node', // Добавляем наше внутреннее поле type
      };
    });

    // 3. Валидация труб
    const nodeIds = new Set(newNodes.map(n => n.id));
    const newPipes = data.pipes.map(pipe => {
      if (!pipe.id || !pipe.start_node_id || !pipe.end_node_id) {
        throw new Error(`Invalid pipe object: A pipe is missing required fields (id, start_node_id, end_node_id). Problem object: ${JSON.stringify(pipe)}`);
      }
      // Проверка на существование узлов
      if (!nodeIds.has(pipe.start_node_id)) {
        console.warn(`Warning: Pipe "${pipe.id}" refers to a non-existent start node "${pipe.start_node_id}". It will not be rendered.`);
      }
      if (!nodeIds.has(pipe.end_node_id)) {
        console.warn(`Warning: Pipe "${pipe.id}" refers to a non-existent end node "${pipe.end_node_id}". It will not be rendered.`);
      }
      return {
        id: pipe.id,
        startNodeId: pipe.start_node_id,
        endNodeId: pipe.end_node_id,
        length: pipe.length || 0,
        diameter: pipe.diameter || 100,
        material: pipe.material || 'steel',
        type: 'pipe', // Добавляем наше внутреннее поле type
      };
    });

    // 4. Обновление хранилища
    setNodes(newNodes);
    setPipes(newPipes);
    alert('Data imported successfully!');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        validateAndProcessFile(data);
      } catch (error) {
        console.error("Import Error:", error);
        alert(`Failed to import file: ${error.message}`);
      }
    };
    reader.onerror = () => {
      alert('Error reading file.');
    }
    reader.readAsText(file);

    // Очищаем value инпута, чтобы можно было загрузить тот же файл еще раз
    event.target.value = null;
  };

  return (
    <>
      <button className="import-btn" onClick={handleImportClick}>
        Импорт JSON
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: 'none' }}
      />
    </>
  );
};

export default ImportButton;
