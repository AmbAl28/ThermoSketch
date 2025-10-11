/**
 * Converts a single project node to a GeoJSON Point Feature.
 * @param {Object} node The node object from the application state.
 * @returns {Object} A GeoJSON Point Feature.
 */
const convertNodeToFeature = (node) => {
  // GeoJSON coordinate order is [longitude, latitude]. The node object has `lng` and `lat`.
  const coordinates = [node.lng, node.lat];

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: coordinates,
    },
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
 * @param {Array} nodes The array of all nodes to find start and end points.
 * @returns {Object|null} A GeoJSON LineString Feature, or null if start/end nodes are not found.
 */
const convertPipeToFeature = (pipe, nodes) => {
  const startNode = nodes.find(n => n.id === pipe.startNodeId);
  const endNode = nodes.find(n => n.id === pipe.endNodeId);

  if (!startNode || !endNode) {
    console.warn(`Could not find start or end node for pipe ${pipe.id}. Skipping.`);
    return null;
  }

  // GeoJSON coordinate order is [longitude, latitude].
  const startCoords = [startNode.lng, startNode.lat];
  const endCoords = [endNode.lng, endNode.lat];

  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [startCoords, endCoords],
    },
    properties: {
      diameter: pipe.diameter,
      length: pipe.length,
      material: pipe.material,
      insulation: pipe.insulation,
      startNodeId: pipe.startNodeId,
      endNodeId: pipe.endNodeId,
    },
  };
};

/**
 * Creates a GeoJSON FeatureCollection from the project's nodes and pipes.
 * @param {Array} nodes An array of node objects.
 * @param {Array} pipes An array of pipe objects.
 * @returns {Object} A GeoJSON FeatureCollection.
 */
export const convertToGeoJson = (nodes, pipes) => {
  const nodeFeatures = nodes.map(convertNodeToFeature);
  const pipeFeatures = pipes.map(pipe => convertPipeToFeature(pipe, nodes)).filter(Boolean);

  return {
    type: 'FeatureCollection',
    features: [...nodeFeatures, ...pipeFeatures],
  };
};
