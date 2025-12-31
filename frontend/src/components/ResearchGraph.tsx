import React from 'react';
// @ts-ignore
import ForceGraph2D from 'react-force-graph-2d';

const data = {
  nodes: [
    { id: 'AI Research', group: 1 },
    { id: 'Federated Learning', group: 2 },
    { id: 'Biomarker Discovery', group: 2 },
    { id: 'AI Security', group: 2 },
    { id: 'Collaborators', group: 3 },
    { id: 'Healthcare', group: 4 },
    { id: 'Smart Vehicles', group: 4 },
    { id: 'Explainable AI', group: 2 },
    { id: 'Graph Neural Networks', group: 2 },
    { id: 'Privacy', group: 5 },
  ],
  links: [
    { source: 'AI Research', target: 'Federated Learning' },
    { source: 'AI Research', target: 'Biomarker Discovery' },
    { source: 'AI Research', target: 'AI Security' },
    { source: 'Federated Learning', target: 'Privacy' },
    { source: 'Federated Learning', target: 'Healthcare' },
    { source: 'Biomarker Discovery', target: 'Explainable AI' },
    { source: 'Biomarker Discovery', target: 'Graph Neural Networks' },
    { source: 'AI Security', target: 'Smart Vehicles' },
    { source: 'Collaborators', target: 'AI Research' },
  ]
};

type NodeObject = {
  id: string;
  group: number;
  x?: number;
  y?: number;
};

const ResearchGraph = () => (
  <ForceGraph2D
    graphData={data}
    width={window.innerWidth > 900 ? 540 : window.innerWidth - 64}
    height={340}
    nodeAutoColorBy="group"
    nodeLabel="id"
    linkDirectionalParticles={2}
    linkDirectionalParticleSpeed={0.01}
    backgroundColor="rgba(255,255,255,0)"
    nodeCanvasObjectMode={() => 'after'}
    nodeCanvasObject={(node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.id;
      const fontSize = 16/globalScale;
      ctx.font = `${fontSize}px Inter, Arial`;
      ctx.fillStyle = '#222';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (typeof node.x === 'number' && typeof node.y === 'number') {
        ctx.fillText(label, node.x, node.y + 18);
      }
    }}
    linkColor={() => '#90caf9'}
    linkWidth={2}
    nodeRelSize={8}
  enableNodeDrag={false}
  enableZoomInteraction={false}
    cooldownTicks={100}
    onEngineStop={() => {
      // @ts-ignore
      if (typeof window !== 'undefined' && typeof (window as any).fgRef?.zoomToFit === 'function') {
        (window as any).fgRef.zoomToFit(400);
      }
    }}
  />
);

export default ResearchGraph;
