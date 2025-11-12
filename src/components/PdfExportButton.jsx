import React from 'react';
import useStore from '../useStore';
import { preparePdfExportData } from '../utils/pdfExportUtils';
import './DropdownMenu.css';

const PdfExportButton = () => {
  // We need a way to get the current state without subscribing to changes,
  // because we only need it at the moment the button is clicked.
  // useStore.getState() gives us exactly that.
  const { getState } = useStore;

  const handleExport = () => {
    // Call the data preparation function, passing it the `get` function
    // so it can access the latest state from the store.
    preparePdfExportData(getState);
  };

  return (
    <button className="dropdown-item" onClick={handleExport}>
      Экспорт в PDF
    </button>
  );
};

export default PdfExportButton;
