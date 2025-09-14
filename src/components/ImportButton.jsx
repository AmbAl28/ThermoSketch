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
      alert('Invalid file format: Must contain "nodes" and "pipes" arrays.');
      return;
    }

    const newNodes = data.nodes.map(node => {
      if (!node.id || !node.type || (node.x === undefined && node.lng === undefined) || (node.y === undefined && node.lat === undefined)) {
        throw new Error(`Invalid node: Missing required fields (id, type, x/lng, y/lat).`);
      }
      return {
        id: node.id,
        name: node.name || 'Unnamed Node',
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
        throw new Error(`Invalid pipe: Missing required fields (id, start_node_id, end_node_id).`);
      }

      const startNode = nodesMap.get(pipe.start_node_id);
      const endNode = nodesMap.get(pipe.end_node_id);

      if (!startNode) console.warn(`Pipe "${pipe.id}" refers to a non-existent start node "${pipe.start_node_id}".`);
      if (!endNode) console.warn(`Pipe "${pipe.id}" refers to a non-existent end node "${pipe.end_node_id}".`);

      let vertices = pipe.vertices;
      // Если вершин нет (старый формат), создаем их из узлов
      if (!vertices && startNode && endNode) {
        console.log(`Pipe "${pipe.id}" has no vertices. Generating from nodes.`);
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
        vertices: vertices || [], // Гарантируем, что vertices всегда массив
      };
    });

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
