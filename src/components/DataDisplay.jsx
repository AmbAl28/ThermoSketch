import useStore from '../useStore';

const DataDisplay = () => {
  const nodes = useStore((state) => state.nodes);
  const pipes = useStore((state) => state.pipes);

  return (
    <div className="data-display">
      <h4>Данные схемы</h4>
      <div>
        <h5>Узлы ({nodes.length})</h5>
        {/* <ul>
          {nodes.map(node => <li key={node.id}>{node.id}</li>)}
        </ul> */}
      </div>
      <div>
        <h5>Трубы ({pipes.length})</h5>
        {/* <ul>
          {pipes.map(pipe => <li key={pipe.id}>{pipe.id}</li>)}
        </ul> */}
      </div>
    </div>
  );
};

export default DataDisplay;
