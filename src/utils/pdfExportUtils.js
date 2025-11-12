function isPointInBounds(point, bounds, L) {
    const [lat, lng] = point;
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const latCheck = lat >= sw.lat && lat <= ne.lat;
    const lngCheck = lng >= sw.lng && lng <= ne.lng;
    return latCheck && lngCheck;
}

function isObjectVisible(obj, bounds, viewOptions, hiddenNodeTypes, L) {
    if (obj.type === 'node') {
        if (Array.isArray(hiddenNodeTypes) && hiddenNodeTypes.includes(obj.nodeType)) {
            return false;
        }
        return isPointInBounds([obj.lat, obj.lng], bounds, L);
    }
    if (obj.type === 'pipe') {
        return obj.vertices.some(v => isPointInBounds(v, bounds, L));
    }
    return false;
}

async function renderHighResolutionTiles(map, exportData, onProgress) {
    const L = (await import('leaflet')).default;
    const html2canvas = (await import('html2canvas')).default;

    const { mapBounds, pdfDimensions } = exportData;
    const fullBounds = L.latLngBounds(mapBounds.southWest, mapBounds.northEast);

    const GRID_DIVISIONS = 2; // Разделим на сетку 2x2 = 4 тайла
    const renderedTiles = [];

    const totalLat = fullBounds.getSouth() - fullBounds.getNorth();
    const totalLng = fullBounds.getEast() - fullBounds.getWest();
    const tileLat = totalLat / GRID_DIVISIONS;
    const tileLng = totalLng / GRID_DIVISIONS;

    const tilePixelWidth = Math.round(pdfDimensions.width / GRID_DIVISIONS);
    const tilePixelHeight = Math.round(pdfDimensions.height / GRID_DIVISIONS);
    
    const totalTiles = GRID_DIVISIONS * GRID_DIVISIONS;

    for (let y = 0; y < GRID_DIVISIONS; y++) {
        for (let x = 0; x < GRID_DIVISIONS; x++) {
            const tileIndex = y * GRID_DIVISIONS + x;
            const tileProgressStart = (tileIndex / totalTiles) * 100;
            const tileProgressEnd = ((tileIndex + 1) / totalTiles) * 100;
            
            console.log(`Рендеринг тайла ${tileIndex + 1}/${totalTiles}...`);
            onProgress(tileProgressStart);

            const north = fullBounds.getNorth() + (tileLat * y);
            const west = fullBounds.getWest() + (tileLng * x);
            const south = north + tileLat;
            const east = west + tileLng;

            const tileBounds = L.latLngBounds([south, west], [north, east]);

            const renderContainer = document.createElement('div');
            renderContainer.style.position = 'absolute';
            renderContainer.style.top = '-9999px';
            renderContainer.style.left = '-9999px';
            renderContainer.style.width = `${tilePixelWidth}px`;
            renderContainer.style.height = `${tilePixelHeight}px`;
            document.body.appendChild(renderContainer);

            const tempMap = L.map(renderContainer, { preferCanvas: true, attributionControl: false, zoomControl: false });
            
            map.eachLayer(layer => {
                if (layer instanceof L.TileLayer) {
                    L.tileLayer(layer._url, { ...layer.options, crossOrigin: true }).addTo(tempMap);
                }
            });

            tempMap.fitBounds(tileBounds, { padding: [0, 0] });

            // Даем карте время на загрузку тайлов
            await new Promise(resolve => setTimeout(resolve, 1000)); 

            try {
                const canvas = await html2canvas(renderContainer, {
                    useCORS: true,
                    scale: 1,
                    width: tilePixelWidth,
                    height: tilePixelHeight,
                    logging: false,
                });
                const dataUrl = canvas.toDataURL('image/png');
                renderedTiles.push({ dataUrl, x, y });
            } catch (err) {
                console.error(`Ошибка при рендеринге тайла ${x},${y}:`, err);
            } finally {
                tempMap.remove();
                renderContainer.remove();
            }
            onProgress(tileProgressEnd);
        }
    }
    return renderedTiles;
}

export async function preparePdfExportData(get, onProgress) {
    const L = (await import('leaflet')).default;
    onProgress(0);
    console.log("Шаг 1: Подготовка данных...");

    const { getMapBounds, viewOptions, nodes, pipes, map } = get();
    const { hiddenAnnotationNodeTypes } = viewOptions || {};
    const mapBounds = getMapBounds();

    if (!map || !mapBounds) {
        console.error("Экземпляр карты или ее границы недоступны.");
        alert("Не удалось получить доступ к карте.");
        onProgress(100); 
        return null;
    }
    
    onProgress(5);

    const dpi = 150; // Уменьшим DPI для теста, чтобы ускорить процесс
    const a0_width_inches = 33.1;
    const a0_height_inches = 46.8;
    const pdfDimensions = {
        width: Math.round(a0_width_inches * dpi),
        height: Math.round(a0_height_inches * dpi),
    };

    const exportData = {
        mapBounds: {
            southWest: [mapBounds.getSouthWest().lat, mapBounds.getSouthWest().lng],
            northEast: [mapBounds.getNorthEast().lat, mapBounds.getNorthEast().lng],
        },
        viewSettings: { ...viewOptions },
        objects: {
            nodes: nodes.filter(n => isObjectVisible(n, mapBounds, viewOptions, hiddenAnnotationNodeTypes, L)),
            pipes: pipes.filter(p => isObjectVisible(p, mapBounds, viewOptions, hiddenAnnotationNodeTypes, L)),
        },
        pdfDimensions: pdfDimensions,
    };
    
    console.log("Шаг 2: Рендеринг тайлов карты...");
    onProgress(10);

    const tiles = await renderHighResolutionTiles(map, exportData, (p) => onProgress(10 + p * 0.8)); // Прогресс от 10 до 90
    
    exportData.renderedTiles = tiles;

    console.log("Шаг 3: Данные и тайлы карты готовы!");
    console.log("PDF Export Data Prepared:", exportData);
    alert('Снимки тайлов карты созданы и выведены в консоль.');
    onProgress(100);

    return exportData;
}
