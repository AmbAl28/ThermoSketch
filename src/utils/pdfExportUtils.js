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
        return obj.vertices.some(v => isPointInBounds(v, bounds, L)) || L.polyline(obj.vertices).getBounds().intersects(bounds);
    }
    return false;
}

// --- ОБНОВЛЕННАЯ ФУНКЦИЯ: РЕНДЕРИНГ ЭЛЕМЕНТОВ КАРТЫ ---
function renderMapElements(tempMap, objects, viewOptions, styleSettings, dpi, L) {
    // --- ВЫЧИСЛЕНИЕ РАЗМЕРОВ ШРИФТОВ НА ОСНОВЕ DPI ---
    const ptToPx = (pt) => pt * (dpi / 72);
    const nodeFontSize = Math.round(ptToPx(8)); // Базовый размер 8pt для узлов
    const pipeFontSize = Math.round(ptToPx(7)); // Базовый размер 7pt для труб

    // Рендеринг труб и их аннотаций
    objects.pipes.forEach(pipe => {
        const pipeColor = styleSettings?.pipes?.color || '#003366';
        const pipeWeight = styleSettings?.pipes?.weight || 3;

        const pipePolyline = L.polyline(pipe.vertices, {
            color: pipeColor, 
            weight: pipeWeight 
        });
        pipePolyline.addTo(tempMap);

        if (viewOptions.showPipeAnnotations && pipe.annotation) {
            const center = pipePolyline.getCenter();
            const labelText = pipe.annotation;
            const annotationHtml = `
                <div style="
                    font-size: ${pipeFontSize}px; 
                    font-weight: bold; 
                    color: ${pipeColor};
                    background-color: rgba(255, 255, 255, 0.8);
                    padding: 1px 4px;
                    border-radius: 3px;
                    white-space: nowrap;
                    transform: translate(-50%, -50%);
                ">
                    ${labelText}
                </div>`;

            const annotationIcon = L.divIcon({ html: annotationHtml, className: '', iconSize: [0, 0], iconAnchor: [0, 0] });
            L.marker(center, { icon: annotationIcon }).addTo(tempMap);
        }
    });

    // Рендеринг узлов и их аннотаций
    objects.nodes.forEach(node => {
        const radius = viewOptions.forceLargeNodes
            ? (styleSettings?.nodes?.radius?.large || 8)
            : (styleSettings?.nodes?.radius?.default || 4);
        
        const fillColor = (styleSettings?.nodes?.colors && styleSettings.nodes.colors[node.nodeType])
            ? styleSettings.nodes.colors[node.nodeType]
            : '#ff7800';

        L.circleMarker([node.lat, node.lng], { 
            radius: radius,
            fillColor: fillColor, 
            color: "#000", 
            weight: 1, 
            opacity: 1, 
            fillOpacity: 0.9 
        }).addTo(tempMap);

        if (viewOptions.showNodeAnnotations && node.annotation) {
            const labelText = node.annotation;
            const annotationHtml = `
                <div style="
                    font-size: ${nodeFontSize}px; 
                    font-weight: bold; 
                    color: #000000; 
                    background-color: rgba(255, 255, 255, 0.75);
                    padding: 2px 5px;
                    border-radius: 3px;
                    border: 1px solid #ccc;
                    white-space: nowrap;
                    transform: translate(-50%, 15px);
                ">
                    ${labelText}
                </div>`;

            const annotationIcon = L.divIcon({ html: annotationHtml, className: '', iconSize: [0, 0], iconAnchor: [0, 0] });
            L.marker([node.lat, node.lng], { icon: annotationIcon }).addTo(tempMap);
        }
    });
}


async function renderHighResolutionTiles(map, exportData, onProgress) {
    const L = (await import('leaflet')).default;
    const html2canvas = (await import('html2canvas')).default;

    const { mapBounds, pdfDimensions, objects, viewSettings, styleSettings, dpi } = exportData;
    const fullBounds = L.latLngBounds(mapBounds.southWest, mapBounds.northEast);

    const GRID_DIVISIONS = 2;
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
            console.log(`Рендеринг тайла ${tileIndex + 1}/${totalTiles}...`);
            onProgress(tileIndex / totalTiles * 100);

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
            
            renderMapElements(tempMap, objects, viewSettings, styleSettings, dpi, L);

            tempMap.fitBounds(tileBounds, { padding: [0, 0] });

            await new Promise(resolve => setTimeout(resolve, 1000)); 

            try {
                const canvas = await html2canvas(renderContainer, {
                    useCORS: true, scale: 1, width: tilePixelWidth, height: tilePixelHeight, logging: false });
                const dataUrl = canvas.toDataURL('image/png');
                renderedTiles.push({ dataUrl, x, y });
            } catch (err) {
                console.error(`Ошибка при рендеринге тайла ${x},${y}:`, err);
            } finally {
                tempMap.remove();
                renderContainer.remove();
            }
        }
    }
    onProgress(100);
    return renderedTiles;
}


export async function preparePdfExportData(get, onProgress) {
    const L = (await import('leaflet')).default;
    onProgress(0);
    console.log("Шаг 1: Подготовка данных...");

    const { getMapBounds, viewOptions, nodes, pipes, map, styleSettings } = get();
    const { hiddenAnnotationNodeTypes } = viewOptions || {};
    const mapBounds = getMapBounds();

    if (!map || !mapBounds) {
        console.error("Экземпляр карты или ее границы недоступны.");
        alert("Не удалось получить доступ к карте.");
        onProgress(100); 
        return null;
    }
    
    onProgress(5);

    const dpi = 150;
    const a0_width_inches = 33.1;
    const a0_height_inches = 46.8;
    const pdfDimensions = {
        width: Math.round(a0_width_inches * dpi),
        height: Math.round(a0_height_inches * dpi),
    };
    
    const visibleBounds = mapBounds;
    const visibleObjects = {
        nodes: nodes.filter(n => isObjectVisible(n, visibleBounds, viewOptions, hiddenAnnotationNodeTypes, L)),
        pipes: pipes.filter(p => isObjectVisible(p, visibleBounds, viewOptions, hiddenAnnotationNodeTypes, L)),
    }

    const exportData = {
        mapBounds: {
            southWest: [mapBounds.getSouthWest().lat, mapBounds.getSouthWest().lng],
            northEast: [mapBounds.getNorthEast().lat, mapBounds.getNorthEast().lng],
        },
        viewSettings: { ...viewOptions },
        styleSettings: styleSettings,
        objects: visibleObjects,
        pdfDimensions: pdfDimensions,
        dpi: dpi, // <--- ДОБАВЛЕНО DPI
    };
    
    console.log("Шаг 2: Рендеринг тайлов карты...");
    onProgress(10);

    const tiles = await renderHighResolutionTiles(map, exportData, (p) => onProgress(10 + p * 0.8));
    
    exportData.renderedTiles = tiles;

    console.log("Шаг 3: Данные и тайлы карты готовы!");
    console.log("PDF Export Data Prepared:", exportData);
    alert('Снимки тайлов с масштабируемыми шрифтами созданы.');
    onProgress(100);

    return exportData;
}
