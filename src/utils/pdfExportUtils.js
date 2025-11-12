
import { jsPDF } from "jspdf";

// --- Утилиты для проверки видимости (остаются без изменений) ---
function isPointInBounds(point, bounds) {
    const [lat, lng] = point;
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    return lat >= sw.lat && lat <= ne.lat && lng >= sw.lng && lng <= ne.lng;
}

function isObjectVisible(obj, bounds, viewOptions, hiddenNodeTypes, L) {
    if (obj.type === 'node') {
        if (Array.isArray(hiddenNodeTypes) && hiddenNodeTypes.includes(obj.nodeType)) return false;
        return isPointInBounds([obj.lat, obj.lng], bounds);
    }
    if (obj.type === 'pipe') {
        return obj.vertices.some(v => isPointInBounds(v, bounds)) || L.polyline(obj.vertices).getBounds().intersects(bounds);
    }
    return false;
}

// --- Рендеринг элементов карты (узлы и трубы, без аннотаций) ---
function renderMapElements(tempMap, objects, viewOptions, styleSettings, L) {
    objects.pipes.forEach(pipe => {
        const pipeColor = styleSettings?.pipes?.color || '#003366';
        const pipeWeight = styleSettings?.pipes?.weight || 3;
        L.polyline(pipe.vertices, { color: pipeColor, weight: pipeWeight }).addTo(tempMap);
    });

    objects.nodes.forEach(node => {
        const radius = viewOptions.forceLargeNodes ? (styleSettings?.nodes?.radius?.large || 8) : (styleSettings?.nodes?.radius?.default || 4);
        const fillColor = (styleSettings?.nodes?.colors && styleSettings.nodes.colors[node.nodeType]) || '#ff7800';
        L.circleMarker([node.lat, node.lng], { radius, fillColor, color: "#000", weight: 1, opacity: 1, fillOpacity: 0.9 }).addTo(tempMap);
    });
}

// --- ШАГ 2: Рендеринг ЕДИНОГО холста на основе вида пользователя ---
async function renderHighResolutionImage(map, exportData, onProgress) {
    const L = (await import('leaflet')).default;
    const html2canvas = (await import('html2canvas')).default;

    const { pdfDimensions, objects, viewSettings, styleSettings, center, zoom } = exportData;

    onProgress(15, "Создание холста для рендеринга...");

    const renderContainer = document.createElement('div');
    Object.assign(renderContainer.style, {
        position: 'absolute', top: '-99999px', left: '-99999px',
        width: `${pdfDimensions.width}px`, height: `${pdfDimensions.height}px`
    });
    document.body.appendChild(renderContainer);

    const tempMap = L.map(renderContainer, {
        preferCanvas: true, attributionControl: false, zoomControl: false, fadeAnimation: false
    });

    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer && layer._url) {
            L.tileLayer(layer._url, { ...layer.options, crossOrigin: 'anonymous' }).addTo(tempMap);
        }
    });

    // *** КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Устанавливаем вид по центру и зуму пользователя ***
    tempMap.setView(center, zoom);
    
    renderMapElements(tempMap, objects, viewSettings, styleSettings, L);

    onProgress(35, "Ожидание полной прорисовки карты...");
    await new Promise(r => setTimeout(r, 4000));

    onProgress(60, "Создание скриншота карты...");
    const fullCanvas = await html2canvas(renderContainer, { useCORS: true, scale: 1, logging: false });
    
    // Получаем реальные границы после установки вида
    const finalBounds = tempMap.getBounds();

    tempMap.remove();
    renderContainer.remove();

    onProgress(85, "Конвертация изображения...");
    return { 
        imageData: fullCanvas.toDataURL('image/jpeg', 0.95), 
        finalBounds: finalBounds
    };
}

// --- ШАГ 3: Генерация PDF с векторным текстом ---
async function generatePdfDocument(exportData) {
    const { finalImage, objects, viewSettings, finalBounds, styleSettings } = exportData;
    const L = (await import('leaflet')).default;

    const A0_HEIGHT_MM = 1189;
    const A0_WIDTH_MM = 841;

    const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: [A0_HEIGHT_MM, A0_WIDTH_MM] });

    pdf.addImage(finalImage, 'JPEG', 0, 0, A0_HEIGHT_MM, A0_WIDTH_MM, undefined, 'FAST');
    
    const southWest = finalBounds.getSouthWest();
    const northEast = finalBounds.getNorthEast();
    const latSpan = northEast.lat - southWest.lat;
    const lngSpan = northEast.lng - southWest.lng;

    const project = (lat, lng) => {
        const latRatio = (lat - southWest.lat) / latSpan;
        const lngRatio = (lng - southWest.lng) / lngSpan;
        return { x: lngRatio * A0_HEIGHT_MM, y: (1 - latRatio) * A0_WIDTH_MM };
    };
    
    const ptToMm = (pt) => pt * 0.352778;

    if (viewSettings.showPipeAnnotations) {
        const pipeFontSize = ptToMm(8);
        pdf.setFontSize(pipeFontSize * 2);
        objects.pipes.forEach(pipe => {
            if (pipe.annotation) {
                const center = L.polyline(pipe.vertices).getCenter();
                const { x, y } = project(center.lat, center.lng);
                pdf.setTextColor(styleSettings?.pipes?.color || '#003366');
                pdf.text(pipe.annotation, x, y, { align: 'center' });
            }
        });
    }
    
    if (viewSettings.showNodeAnnotations) {
        const nodeFontSize = ptToMm(9);
        pdf.setFontSize(nodeFontSize * 2);
        pdf.setTextColor('#000000');
        objects.nodes.forEach(node => {
            if (node.annotation) {
                const { x, y } = project(node.lat, node.lng);
                const yOffset = ptToMm(4);
                pdf.text(node.annotation, x, y + yOffset, { align: 'center' });
            }
        });
    }
    
    pdf.save('ThermoSketch-Export-A0.pdf');
}


// --- Основная функция экспорта ---
export async function preparePdfExportData(get, onProgress) {
    const L = (await import('leaflet')).default;
    try {
        onProgress(0, "Шаг 1: Подготовка данных...");
        const { viewOptions, nodes, pipes, map, styleSettings } = get();

        if (!map) throw new Error("Карта недоступна.");

        // *** ИСПРАВЛЕНИЕ: Захватываем ЦЕНТР и ЗУМ пользователя ***
        const center = map.getCenter();
        const zoom = map.getZoom();

        const dpi = 300;
        // *** ИСПРАВЛЕНИЕ: Используем альбомные пропорции A0 ***
        const pdfDimensions = { 
            width: Math.round(46.8 * dpi),
            height: Math.round(33.1 * dpi) 
        };

        const exportData = {
            center, zoom, // Передаем вид пользователя
            pdfDimensions,
            objects: { nodes, pipes }, // Передаем все объекты, видимость проверим позже
            viewSettings: { ...viewOptions }, 
            styleSettings, 
            dpi
        };
        
        onProgress(10, "Шаг 2: Рендеринг карты высокого разрешения...");
        const { imageData, finalBounds } = await renderHighResolutionImage(map, exportData, onProgress);

        // Передаем финальные данные в генератор PDF
        exportData.finalImage = imageData;
        exportData.finalBounds = finalBounds;

        // Фильтруем объекты, которые попали в итоговые границы
        exportData.objects = {
            nodes: nodes.filter(n => isObjectVisible(n, finalBounds, viewOptions, viewOptions.hiddenAnnotationNodeTypes, L)),
            pipes: pipes.filter(p => isObjectVisible(p, finalBounds, viewOptions, viewOptions.hiddenAnnotationNodeTypes, L)),
        }
        
        onProgress(90, "Шаг 3: Генерация PDF документа...");
        await generatePdfDocument(exportData);

        onProgress(100, "Экспорт завершен!");
        alert('PDF-документ был успешно сгенерирован и сохранен.');

    } catch (error) {
        console.error("Ошибка экспорта в PDF:", error);
        alert(`Произошла критическая ошибка: ${error.message}`);
        onProgress(100, "Ошибка экспорта.");
    }
    return null;
}
