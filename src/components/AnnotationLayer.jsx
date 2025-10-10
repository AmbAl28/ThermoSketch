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

const getFontSize = (zoom) => {
  if (zoom < 13) return 0;
  const baseFontSize = 10;
  const fontSize = baseFontSize + (zoom - 14);
  return Math.max(8, Math.min(18, fontSize));
};

const createAnnotationIcon = (content, fontSize, positionClass) => {
  if (fontSize === 0) {
    return L.divIcon({ className: 'leaflet-annotation-icon-hidden' });
  }

  const html = `<div class="annotation-content ${positionClass}" style="font-size: ${fontSize}px;">${content}</div>`;
  
  return L.divIcon({
    html: html,
    className: 'leaflet-annotation-icon',
    iconAnchor: [0, 0],
  });
};

// Функция для проверки пересечения двух прямоугольников
const doRectsOverlap = (rect1, rect2) => {
  return !(rect1.right < rect2.left || 
           rect1.left > rect2.right || 
           rect1.bottom < rect2.top || 
           rect1.top > rect2.bottom);
};

// Определяем возможные позиции для сносок
const ANCHOR_POSITIONS = {
  'top-right': { x: 15, y: -10 },
  'bottom-right': { x: 15, y: 10 },
  'top-left': { x: -15, y: -10 },
  'bottom-left': { x: -15, y: 10 },
};
const POSITION_CLASSES = Object.keys(ANCHOR_POSITIONS);

const AnnotationLayer = () => {
  const { nodes, pipes } = useStore();
  const map = useMap();

  const [mapState, setMapState] = useState({ zoom: map.getZoom(), center: map.getCenter() });

  useMapEvents({
    zoom: () => setMapState({ zoom: map.getZoom(), center: map.getCenter() }),
    move: () => setMapState({ zoom: map.getZoom(), center: map.getCenter() }),
  });

  const annotations = useMemo(() => {
    const currentFontSize = getFontSize(mapState.zoom);
    if (currentFontSize === 0) return [];

    const occupiedRects = [];
    const annotationData = [];

    // 1. Добавляем узлы в занятые зоны
    nodes.forEach(node => {
        const point = map.latLngToContainerPoint([node.lat, node.lng]);
        occupiedRects.push({
            left: point.x - 15, right: point.x + 15,
            top: point.y - 15, bottom: point.y + 15,
        });
    });
    
    // 2. Собираем все сноски (для узлов и труб)
    const allAnnotationPoints = [
      ...nodes.map(node => ({
        id: `node-${node.id}`,
        latlng: [node.lat, node.lng],
        content: `<b>${node.name || 'Без имени'}</b><br>${NODE_TYPE_TRANSLATIONS[node.nodeType] || 'Неизвестный'}`,
        size: { width: 120, height: 35 } // Примерный размер
      })),
      ...pipes.map(pipe => {
        if (pipe.vertices.length < 2) return null;
        const midIndex = Math.floor((pipe.vertices.length - 1) / 2);
        const p1 = map.latLngToContainerPoint(pipe.vertices[midIndex]);
        const p2 = map.latLngToContainerPoint(pipe.vertices[midIndex + 1]);
        const midPointLatLng = map.containerPointToLatLng(p1.add(p2).divideBy(2));

        return {
          id: `pipe-${pipe.id}`,
          latlng: midPointLatLng,
          content: `${pipe.length ? pipe.length + ' м' : 'N/A'}<br>${pipe.diameter ? 'Ø' + pipe.diameter + ' мм' : 'N/A'}`,
          size: { width: 100, height: 35 } // Примерный размер
        }
      }).filter(Boolean)
    ];

    // 3. Расставляем сноски, избегая коллизий
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
        // Нормализация, если ширина/высота отрицательные
        if (rect.left > rect.right) [rect.left, rect.right] = [rect.right, rect.left];
        if (rect.top > rect.bottom) [rect.top, rect.bottom] = [rect.bottom, rect.top];

        const hasOverlap = occupiedRects.some(occupied => doRectsOverlap(rect, occupied));

        if (!hasOverlap) {
          bestPositionClass = posClass;
          occupiedRects.push(rect);
          break;
        }
      }

      // Если все позиции заняты, используем первую
      if (!bestPositionClass) {
        bestPositionClass = POSITION_CLASSES[0];
      }
      
      annotationData.push({ ...anno, positionClass: bestPositionClass });
    });

    return annotationData;

  }, [mapState, nodes, pipes, map]);

  return (
    <>
      {annotations.map(anno => (
        <Marker
          key={anno.id}
          position={anno.latlng}
          icon={createAnnotationIcon(anno.content, getFontSize(mapState.zoom), anno.positionClass)}
          interactive={false}
        />
      ))}
    </>
  );
};

export default AnnotationLayer;
