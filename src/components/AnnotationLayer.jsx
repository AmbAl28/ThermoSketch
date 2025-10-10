import React, { useState } from 'react';
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

// Скорректированная функция для размера шрифта
const getFontSize = (zoom) => {
  if (zoom < 13) return 0;
  const baseFontSize = 10; // Уменьшаем базовый размер
  const fontSize = baseFontSize + (zoom - 14); // Более плавная прогрессия
  return Math.max(8, Math.min(18, fontSize));
};

// Переработанная функция создания иконки
const createAnnotationIcon = (content, fontSize) => {
  if (fontSize === 0) {
    return L.divIcon({ className: 'leaflet-annotation-icon-hidden' });
  }

  // HTML структура стала проще: один div, остальное в CSS
  const html = `<div class="annotation-content" style="font-size: ${fontSize}px;">${content}</div>`;

  return L.divIcon({
    html: html,
    className: 'leaflet-annotation-icon', // Класс-обертка для сброса стилей
    // Якорь теперь точно в точке (0,0) нашей иконки,
    // а сама линия будет отрисована из этой точки.
    iconAnchor: [0, 0],
  });
};

const AnnotationLayer = () => {
  const { nodes, pipes } = useStore();
  const map = useMap();

  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoom: () => setZoom(map.getZoom()),
  });

  const currentFontSize = getFontSize(zoom);

  const nodeAnnotations = nodes.map(node => {
    const content = `<b>${node.name || 'Без имени'}</b><br>${NODE_TYPE_TRANSLATIONS[node.nodeType] || 'Неизвестный'}`;
    const icon = createAnnotationIcon(content, currentFontSize);
    return <Marker key={`node-anno-${node.id}`} position={[node.lat, node.lng]} icon={icon} interactive={false} />;
  });

  const pipeAnnotations = pipes.map(pipe => {
    if (pipe.vertices.length < 2) return null;

    const midIndex = Math.floor((pipe.vertices.length - 1) / 2);
    const p1 = map.latLngToLayerPoint(pipe.vertices[midIndex]);
    const p2 = map.latLngToLayerPoint(pipe.vertices[midIndex + 1]);
    const midPointLatLng = map.layerPointToLatLng(p1.add(p2).divideBy(2));

    const length = pipe.length ? `${pipe.length} м` : 'N/A';
    const diameter = pipe.diameter ? `Ø${pipe.diameter} мм` : 'N/A';
    const content = `${length}<br>${diameter}`;
    const icon = createAnnotationIcon(content, currentFontSize);
    
    return <Marker key={`pipe-anno-${pipe.id}`} position={midPointLatLng} icon={icon} interactive={false} />;
  });

  return <>{nodeAnnotations}{pipeAnnotations}</>;
};

export default AnnotationLayer;
