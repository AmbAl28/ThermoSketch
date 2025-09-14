import React, { useState, useEffect } from 'react';
import useStore from '../useStore';

const PropertiesPanel = () => {
  const selectedObject = useStore((state) => state.selectedObject);
  const { nodes, pipes, updateNode, updatePipe, setSelectedObject, deleteObject } = useStore();

  const [formData, setFormData] = useState({});

  const object = selectedObject 
    ? (selectedObject.type === 'node' 
        ? nodes.find(n => n.id === selectedObject.id) 
        : pipes.find(p => p.id === selectedObject.id))
    : null;

  useEffect(() => {
    if (object) {
      setFormData(object);
    } else {
      setFormData({});
    }
  }, [object]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    if (selectedObject.type === 'node') {
      updateNode(selectedObject.id, { [name]: value });
    }
    if (selectedObject.type === 'pipe') {
      updatePipe(selectedObject.id, { [name]: value });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this ${selectedObject.type}?`)) {
      deleteObject(selectedObject);
    }
  }

  if (!object) {
    return null;
  }

  return (
    <div className="properties-panel">
      <h4>Properties</h4>
      <p>ID: {object.id.substring(0, 8)}...</p>
      <form onSubmit={(e) => e.preventDefault()}>
        {selectedObject.type === 'node' && (
          <>
            <label>Name</label>
            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} />
            <label>Type</label>
            <select name="nodeType" value={formData.nodeType || 'consumer'} onChange={handleChange}>
              <option value="consumer">Consumer</option>
              <option value="source">Source</option>
              <option value="chamber">Chamber</option>
            </select>
            <label>Elevation</label>
            <input type="number" name="elevation" value={formData.elevation || 0} onChange={handleChange} />
          </>
        )}

        {selectedObject.type === 'pipe' && (
          <>
            <label>Start Node ID</label>
            <input type="text" value={object.startNodeId.substring(0, 8) + '...'} readOnly />
            <label>End Node ID</label>
            <input type="text" value={object.endNodeId.substring(0, 8) + '...'} readOnly />
            <label>Length (m)</label>
            <input type="number" name="length" value={formData.length || 0} onChange={handleChange} />
            <label>Diameter (mm)</label>
            <input type="number" name="diameter" value={formData.diameter || 0} onChange={handleChange} />
            <label>Material</label>
            <select name="material" value={formData.material || 'steel'} onChange={handleChange}>
              <option value="steel">Steel</option>
              <option value="ppu">PPU</option>
              <option value="pe">PE</option>
            </select>
          </>
        )}
        <button type="button" className="close-btn" onClick={() => setSelectedObject(null)}>Close</button>
        <button type="button" className="delete-btn" onClick={handleDelete}>Delete</button>
      </form>
    </div>
  );
};

export default PropertiesPanel;
