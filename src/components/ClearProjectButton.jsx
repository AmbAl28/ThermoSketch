import React from 'react';
import useStore from '../useStore';

const ClearProjectButton = () => {
  const clearProject = useStore((state) => state.clearProject);

  const handleClear = () => {
    if (window.confirm('Вы уверены, что хотите полностью очистить проект? Это действие нельзя отменить.')) {
      clearProject();
      alert('Проект очищен.');
    }
  };

  return (
    <button className="dropdown-item" onClick={handleClear}>
      Очистить проект
    </button>
  );
};

export default ClearProjectButton;
