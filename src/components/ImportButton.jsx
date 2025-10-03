import React, { useRef } from 'react';
import useStore from '../useStore';

// Функции гидратации остаются без изменений
const hydrateNode = (node) => {
  const defaultNode = { name: 'Узел', type: 'node', nodeType: 'chamber', elevation: 0, contractNumber: '', note: '', heatLoad: '', staticPressure: '', supplyTemperature: '', returnTemperature: '' };
  return { ...defaultNode, ...node };
};

const hydratePipe = (pipe) => {
  const defaultPipe = { type: 'pipe', diameter: 100, material: 'Сталь', actualLength: '', insulationMaterial: 'ППУ', insulationWear: 0 };
  return { ...defaultPipe, ...pipe };
};

const ImportButton = () => {
  const { setNodes, setPipes, clearProject } = useStore();
  const fileInputRef = useRef(null); // Создаем ссылку на input

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { nodes, pipes } = JSON.parse(e.target.result);
        if (!Array.isArray(nodes) || !Array.isArray(pipes)) throw new Error("Неверный формат данных");

        const hydratedNodes = nodes.map(hydrateNode);
        const hydratedPipes = pipes.map(hydratePipe);

        const nodeIds = new Set(hydratedNodes.map(n => n.id));
        for (const pipe of hydratedPipes) {
          if (!nodeIds.has(pipe.startNodeId) || !nodeIds.has(pipe.endNodeId)) {
            throw new Error(`Ошибка целостности: труба ${pipe.id} ссылается на несуществующий узел.`);
          }
        }

        clearProject();
        setNodes(hydratedNodes);
        setPipes(hydratedPipes);
        alert('Проект успешно импортирован!');

      } catch (error) {
        console.error("Ошибка импорта:", error);
        alert(`Ошибка импорта: ${error.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleClick = () => {
    fileInputRef.current.click(); // Симулируем клик по скрытому input
  };

  return (
    <>
      <button className="import-btn" onClick={handleClick}>
        Импорт JSON
      </button>
      <input 
        type="file" 
        accept=".json" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
      />
    </>
  );
};

export default ImportButton;
