const ExportDxfButton = () => {
  const handleExport = () => {
    alert('Экспорт в DXF пока не реализован.');
  };

  return (
    <button className="export-btn" onClick={handleExport}>
      Экспорт в DXF
    </button>
  );
};

export default ExportDxfButton;
