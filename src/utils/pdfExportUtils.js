
// src/utils/pdfExportUtils.js

function isPointInBounds(point, bounds) {
    const [lat, lng] = point;
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const latCheck = lat >= sw.lat && lat <= ne.lat;
    const lngCheck = lng >= sw.lng && lng <= ne.lng;
    return latCheck && lngCheck;
}

function isObjectVisible(obj, bounds, viewOptions, hiddenNodeTypes) {
    if (obj.type === 'node') {
        // Убедимся, что hiddenNodeTypes является массивом перед вызовом .includes()
        if (Array.isArray(hiddenNodeTypes) && hiddenNodeTypes.includes(obj.nodeType)) {
            return false;
        }
        return isPointInBounds([obj.lat, obj.lng], bounds);
    }
    if (obj.type === 'pipe') {
        return obj.vertices.some(v => isPointInBounds(v, bounds));
    }
    if (obj.type === 'area') {
        return false;
    }
    return false;
}


export function preparePdfExportData(get) {
    console.log("Starting PDF export preparation...");

    // Исправлено: получаем hiddenAnnotationNodeTypes из viewOptions
    const { getMapBounds, viewOptions, nodes, pipes } = get();
    const { hiddenAnnotationNodeTypes } = viewOptions || {}; // Деструктурируем из viewOptions и предоставляем fallback
    const mapBounds = getMapBounds();

    if (!mapBounds) {
        console.error("Map bounds are not available.");
        alert("Не удалось получить границы карты. Пожалуйста, попробуйте еще раз.");
        return null;
    }

    const currentViewSettings = { ...viewOptions };

    const visibleObjects = {
        nodes: nodes.filter(n => isObjectVisible(n, mapBounds, currentViewSettings, hiddenAnnotationNodeTypes)),
        pipes: pipes.filter(p => isObjectVisible(p, mapBounds, currentViewSettings, hiddenAnnotationNodeTypes)),
    };

    const dpi = 600;
    const a0_width_inches = 33.1;
    const a0_height_inches = 46.8;
    const pdfDimensions = {
        width: a0_width_inches * dpi,
        height: a0_height_inches * dpi,
    };

    const exportData = {
        mapBounds: {
            southWest: [mapBounds.getSouthWest().lat, mapBounds.getSouthWest().lng],
            northEast: [mapBounds.getNorthEast().lat, mapBounds.getNorthEast().lng],
        },
        viewSettings: currentViewSettings,
        objects: visibleObjects,
        pdfDimensions: pdfDimensions,
    };

    console.log("PDF Export Data Prepared:", exportData);
    alert('Данные для экспорта в PDF подготовлены и выведены в консоль. Следующим шагом будет создание самого PDF.');

    return exportData;
}
