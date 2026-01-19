import React, { useRef } from 'react';
import useStore from '../useStore';

const hydrateNode = (node) => {
  const defaultNode = { 
    name: 'Узел', 
    type: 'node', 
    nodeType: 'chamber', 
    elevation: 0, 
    contractNumber: '', 
    note: '', 
    heatLoad: '', 
    staticPressure: '', 
    supplyTemperature: '', 
    returnTemperature: '',
    address: '',
    objectPurpose: '',
    legalForm: '',
    accruals: '',
    volumeM3: '',
    areaM2: '',
    contractedHeatLoadGcalHour: '',
    calculatedHeatLoadGcalHour: '',
    specificHeatingLoadKcalM3C: ''
  };
  return { ...defaultNode, ...node };
};

const hydratePipe = (pipe) => {
  const defaultPipe = { type: 'pipe', diameter: 100, material: 'Сталь', actualLength: '', insulationMaterial: 'ППУ', insulationWear: 0 };
  return { ...defaultPipe, ...pipe };
};

const ImportButton = () => {
  const { setNodes, setPipes, clearProject, setAreas } = useStore();
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        let nodes = [], pipes = [], areas = [];

        if (data.schemaVersion === "2.0") {
          // New format
          areas = data.areas || [];
          const areaIds = new Set(areas.map(a => a.id));

          Object.values(data.objects).forEach(areaObjects => {
            nodes.push(...areaObjects.nodes);
            pipes.push(...areaObjects.pipes);
          });
          nodes.push(...data.unassigned.nodes);
          pipes.push(...data.unassigned.pipes);

          // Validate areaId
          nodes.forEach(node => {
            if (node.areaId && !areaIds.has(node.areaId)) {
              node.areaId = null; // or handle as an error
            }
          });
          pipes.forEach(pipe => {
            if (pipe.areaId && !areaIds.has(pipe.areaId)) {
              pipe.areaId = null; // or handle as an error
            }
          });

        } else {
          // Old format
          if (!Array.isArray(data.nodes) || !Array.isArray(data.pipes)) throw new Error("Неверный формат данных");
          nodes = data.nodes;
          pipes = data.pipes;
        }

        const hydratedNodes = nodes.map(hydrateNode);
        const hydratedPipes = pipes.map(hydratePipe);

        const nodeIds = new Set(hydratedNodes.map(n => n.id));
        for (const pipe of hydratedPipes) {
          if (!nodeIds.has(pipe.startNodeId) || !nodeIds.has(pipe.endNodeId)) {
            throw new Error(`Ошибка целостности: труба ${pipe.id} ссылается на несуществующий узел.`);
          }
        }

        clearProject();
        setAreas(areas);
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
    fileInputRef.current.click();
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
