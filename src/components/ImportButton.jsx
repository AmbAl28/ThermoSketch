import React, { useRef } from 'react';
import useStore from '../useStore';

const ImportButton = () => {
  const fileInputRef = useRef(null);
  const { setNodes, setPipes } = useStore();

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const validateAndProcessFile = (data) => {
    if (typeof data !== 'object' || data === null || !Array.isArray(data.nodes) || !Array.isArray(data.pipes)) {
      alert('Ошибка: Неверный формат файла. Убедитесь, что он содержит массивы "nodes" и "pipes".');
      return;
    }

    const newNodes = data.nodes.map(node => {
      if (!node.id || !node.type || (node.x === undefined && node.lng === undefined) || (node.y === undefined && node.lat === undefined)) {
        throw new Error(`Неверный узел: Отсутствуют обязательные поля (id, type, x/lng, y/lat).`);
      }
      return {
        id: node.id,
        name: node.name || 'Безымянный узел',
        nodeType: node.type,
        elevation: node.elevation || 0,
        lat: node.y ?? node.lat,
        lng: node.x ?? node.lng,
        type: 'node',
      };
    });

    const nodesMap = new Map(newNodes.map(n => [n.id, n]));
    const newPipes = data.pipes.map(pipe => {
      if (!pipe.id || !pipe.start_node_id || !pipe.end_node_id) {
        throw new Error(`Неверная труба: Отсутствуют обязательные поля (id, start_node_id, end_node_id).`);
      }

      const startNode = nodesMap.get(pipe.start_node_id);
      const endNode = nodesMap.get(pipe.end_node_id);

      if (!startNode) console.warn(`Труба "${pipe.id}" ссылается на несуществующий начальный узел "${pipe.start_node_id}".`);
      if (!endNode) console.warn(`Труба "${pipe.id}" ссылается на несуществующий конечный узел "${pipe.end_node_id}".`);

      let vertices = pipe.vertices;
      if (!vertices && startNode && endNode) {
        console.log(`Труба "${pipe.id}" не содержит вершин. Генерация из узлов.`);
        vertices = [[startNode.lat, startNode.lng], [endNode.lat, endNode.lng]];
      }
      
      return {
        id: pipe.id,
        startNodeId: pipe.start_node_id,
        endNodeId: pipe.end_node_id,
        length: pipe.length || 0,
        diameter: pipe.diameter || 100,
        material: pipe.material || 'steel',
        type: 'pipe',
        vertices: vertices || [],
      };
    });

    setNodes(newNodes);
    setPipes(newPipes);
    alert('Данные успешно импортированы!');
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
        console.error("Ошибка импорта:", error);
        alert(`Не удалось импортировать файл: ${error.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  return (
    <>
      <button className="import-btn" onClick={handleImportClick}>
        Импорт JSON
      </button>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
    </>
  );
};

export default ImportButton;
