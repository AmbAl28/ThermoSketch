/**
 * Converts a single project node to a GeoJSON Point Feature.
 * @param {Object} node The node object from the application state.
 * @returns {Object} A GeoJSON Point Feature.
 */
const convertNodeToFeature = (node) => {
  const coordinates = [node.lng, node.lat];
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties: {
      type: node.type,
      name: node.name,
      elevation: node.elevation,
      heatLoad: node.heatLoad,
      contractNumber: node.contractNumber,
    },
  };
};

/**
 * Converts a single project pipe to a GeoJSON LineString Feature.
 * @param {Object} pipe The pipe object from the application state.
 * @returns {Object|null} A GeoJSON LineString Feature.
 */
const convertPipeToFeature = (pipe) => {
  if (!pipe.vertices || pipe.vertices.length < 2) return null;
  const coordinates = pipe.vertices.map(vertex => [vertex[1], vertex[0]]);
  return {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates },
    properties: {
      diameter: pipe.diameter,
      length: pipe.length,
      material: pipe.material,
      insulation: pipe.insulationMaterial,
      startNodeId: pipe.startNodeId,
      endNodeId: pipe.endNodeId,
    },
  };
};

/**
 * Converts a single project area to a GeoJSON Polygon Feature.
 * @param {Object} area The area object from the application state.
 * @returns {Object} A GeoJSON Polygon Feature.
 */
const convertAreaToFeature = (area) => {
  const [[swLat, swLng], [neLat, neLng]] = area.bounds;
  const coordinates = [
    [
      [swLng, swLat], // South-West
      [swLng, neLat], // North-West
      [neLng, neLat], // North-East
      [neLng, swLat], // South-East
      [swLng, swLat], // Close the loop
    ]
  ];
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates },
    properties: {
      id: area.id,
      name: area.name,
      color: area.color,
    },
  };
};

/**
 * Creates a GeoJSON FeatureCollection from the project's data.
 * @param {Array} nodes An array of node objects.
 * @param {Array} pipes An array of pipe objects.
 * @param {Array} areas An array of area objects.
 * @returns {Object} A GeoJSON FeatureCollection.
 */
export const convertToGeoJson = (nodes, pipes, areas) => {
  const nodeFeatures = nodes.map(convertNodeToFeature);
  const pipeFeatures = pipes.map(convertPipeToFeature).filter(Boolean);
  const areaFeatures = areas.map(convertAreaToFeature);

  return {
    type: 'FeatureCollection',
    features: [...nodeFeatures, ...pipeFeatures, ...areaFeatures],
  };
};
