import React, { useState, useMemo } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import useStore from '../useStore';
import './AnnotationLayer.css';

const NODE_TYPE_TRANSLATIONS = {
  source: 'Источник',
  consumer: 'Потребитель',
  chamber: 'Камера',
  valve: 'Арматура',
  diameter_change: 'Смена диаметра'
};

const getFontSize = (zoom, baseFontSize) => {
  if (zoom < 13) return 0;
  return baseFontSize;
};

const createAnnotationIcon = (content, fontSize, positionClass) => {
  if (fontSize === 0 || !content) {
    return L.divIcon({ className: 'leaflet-annotation-icon-hidden' });
  }

  const html = `<div class="annotation-content ${positionClass}" style="font-size: ${fontSize}px;">${content}</div>`;
  
  return L.divIcon({
    html: html,
    className: 'leaflet-annotation-icon',
    iconAnchor: [0, 0],
  });
};

const doRectsOverlap = (rect1, rect2) => {
  return !(rect1.right < rect2.left || 
           rect1.left > rect2.right || 
           rect1.bottom < rect2.top || 
           rect1.top > rect2.bottom);
};

const ANCHOR_POSITIONS = {
  'top-right': { x: 15, y: -10 },
  'bottom-right': { x: 15, y: 10 },
  'top-left': { x: -15, y: -10 },
  'bottom-left': { x: -15, y: 10 },
};
const POSITION_CLASSES = Object.keys(ANCHOR_POSITIONS);

const AnnotationLayer = () => {
  const { nodes, pipes, viewOptions } = useStore();
  const map = useMap();

  const [mapState, setMapState] = useState({ zoom: map.getZoom(), center: map.getCenter() });

  useMapEvents({
    zoom: () => setMapState({ zoom: map.getZoom(), center: map.getCenter() }),
    move: () => setMapState({ zoom: map.getZoom(), center: map.getCenter() }),
  });

  const annotations = useMemo(() => {
    if (!viewOptions.showAnnotations) return [];

    const currentFontSize = getFontSize(mapState.zoom, viewOptions.fontSize);
    if (currentFontSize === 0) return [];

    const occupiedRects = [];
    const annotationData = [];
    
    const calculateHeight = (lineCount, fontSize) => {
        if (lineCount === 0) return 0;
        // Оценка высоты: ~1.2 * размер шрифта для высоты строки + небольшой отступ
        const lineHeight = fontSize * 1.2;
        const padding = 8;
        return (lineCount * lineHeight) + padding;
    }

    nodes.forEach(node => {
        const point = map.latLngToContainerPoint([node.lat, node.lng]);
        occupiedRects.push({
            left: point.x - 15, right: point.x + 15,
            top: point.y - 15, bottom: point.y + 15,
        });
    });
    
    const nodeAnnotations = viewOptions.showNodeAnnotations
      ? nodes
          .filter(node => !viewOptions.hiddenAnnotationNodeTypes.includes(node.nodeType))
          .map(node => {
            const namePart = viewOptions.showNodeNames ? `<b>${node.name || 'Без имени'}</b>` : '';
            const nodeTypeText = NODE_TYPE_TRANSLATIONS[node.nodeType] || 'Неизвестный';
            const typePart = viewOptions.showNodeTypes ? nodeTypeText : '';

            const contentParts = [];
            if (namePart) contentParts.push(namePart);
            if (typePart) contentParts.push(typePart);
            const content = contentParts.join('<br>');

            if (!content) return null;
            
            const height = calculateHeight(contentParts.length, currentFontSize);

            return {
              id: `node-${node.id}`,
              latlng: [node.lat, node.lng],
              content: content,
              size: { width: 120, height: height }
            };
          })
          .filter(Boolean) // Remove nulls
      : [];

    const pipeAnnotations = viewOptions.showPipeAnnotations
      ? pipes.map(pipe => {
          if (pipe.vertices.length < 2) return null;
          
          const lengthPart = viewOptions.showPipeLength ? `${pipe.length ? pipe.length + ' м' : 'N/A'}` : '';
          const diameterPart = viewOptions.showPipeDiameter ? `${pipe.diameter ? 'Ø' + pipe.diameter + ' мм' : 'N/A'}` : '';

          const contentParts = [];
          if (lengthPart) contentParts.push(lengthPart);
          if (diameterPart) contentParts.push(diameterPart);
          const content = contentParts.join('<br>');
          
          if (!content) return null;

          const midIndex = Math.floor((pipe.vertices.length - 1) / 2);
          const p1 = map.latLngToContainerPoint(pipe.vertices[midIndex]);
          const p2 = map.latLngToContainerPoint(pipe.vertices[midIndex + 1]);
          const midPointLatLng = map.containerPointToLatLng(p1.add(p2).divideBy(2));
          
          const height = calculateHeight(contentParts.length, currentFontSize);

          return {
            id: `pipe-${pipe.id}`,
            latlng: midPointLatLng,
            content: content,
            size: { width: 100, height: height }
          }
        }).filter(Boolean)
      : [];

    const allAnnotationPoints = [...nodeAnnotations, ...pipeAnnotations];

    allAnnotationPoints.forEach(anno => {
      const point = map.latLngToContainerPoint(anno.latlng);
      let bestPositionClass = '';

      for (const posClass of POSITION_CLASSES) {
        const anchor = ANCHOR_POSITIONS[posClass];
        const rect = {
          left: point.x + anchor.x,
          top: point.y + anchor.y,
          right: point.x + anchor.x + anno.size.width * (posClass.includes('left') ? -1 : 1),
          bottom: point.y + anchor.y + anno.size.height * (posClass.includes('top') ? -1 : 1),
        };
        if (rect.left > rect.right) [rect.left, rect.right] = [rect.right, rect.left];
        if (rect.top > rect.bottom) [rect.top, rect.bottom] = [rect.bottom, rect.top];

        const hasOverlap = occupiedRects.some(occupied => doRectsOverlap(rect, occupied));

        if (!hasOverlap) {
          bestPositionClass = posClass;
          occupiedRects.push(rect);
          break;
        }
      }

      if (!bestPositionClass) {
        bestPositionClass = POSITION_CLASSES[0];
      }
      
      annotationData.push({ ...anno, positionClass: bestPositionClass });
    });

    return annotationData;

  }, [mapState, nodes, pipes, map, viewOptions]);

  return (
    <>
      {annotations.map(anno => (
        <Marker
          key={anno.id}
          position={anno.latlng}
          icon={createAnnotationIcon(anno.content, getFontSize(mapState.zoom, viewOptions.fontSize), anno.positionClass)}
          interactive={false}
        />
      ))}
    </>
  );
};

export default AnnotationLayer;
