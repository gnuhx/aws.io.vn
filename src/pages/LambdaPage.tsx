import { Link } from 'react-router-dom';
import FlowChart from '../components/FlowChart/FlowChart';
import SidePanel from '../components/SidePanel/SidePanel';
import { useSelectedNode } from '../hooks/useSelectedNode';
import lambdaNodes from '../data/lambda-nodes.data';
import './LambdaPage.css';

const LEGEND = [
  { bg: '#fff7ed', border: '#fdba74', label: 'Triggers' },
  { bg: '#fffbeb', border: '#fcd34d', label: 'Core Function' },
  { bg: '#f9fafb', border: '#d1d5db', label: 'IAM & Config' },
  { bg: '#eff6ff', border: '#93c5fd', label: 'Runtime' },
  { bg: '#ecfdf5', border: '#6ee7b7', label: 'Scaling' },
  { bg: '#fef2f2', border: '#fca5a5', label: 'Error Handling' },
  { bg: '#f0fdf4', border: '#86efac', label: 'Destinations' },
];

export default function LambdaPage() {
  const { selectedNode, selectNode, clearNode } = useSelectedNode();

  return (
    <main className="lambda-page">
      <div className="lambda-header">
        <div className="lambda-tags">
          {['Lambda', 'Serverless', 'Interactive', 'SAA-C03'].map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <h1 className="lambda-title">⚡ AWS Lambda — Pho24h Ghost Kitchen</h1>
        <p className="lambda-subtitle">
          An interactive visual map of how AWS Lambda works — from triggers to execution to
          destinations — told through the lens of ghost chefs who appear only when an order
          arrives. <strong>Hover to preview · Click to explore</strong> each component.
        </p>
        <div className="lambda-meta">
          <time dateTime="2025-05-02">May 2, 2025</time>
          <span className="lambda-meta-sep">·</span>
          <span>15 min read</span>
          <span className="lambda-meta-sep">·</span>
          <span>14 components</span>
        </div>
      </div>

      <div className="lambda-chart-scroll">
        <FlowChart
          nodes={lambdaNodes}
          selectedNodeId={selectedNode?.id ?? null}
          onNodeClick={selectNode}
          chartHeight={1200}
          boundary={{
            label: '⚡ Lambda Execution Context',
            x: 5, y: 41, width: 90, height: 56,
            fill: 'rgba(254,252,232,0.4)',
            stroke: '#fbbf24',
          }}
        />
      </div>

      <div className="lambda-legend">
        <h3 className="legend-title">Color Guide</h3>
        <div className="legend-grid">
          {LEGEND.map(({ bg, border, label }) => (
            <div key={label} className="legend-item">
              <div
                className="legend-swatch"
                style={{ background: bg, borderColor: border }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <footer className="lambda-footer">
        <Link to="/" className="back-link">← Back to all posts</Link>
      </footer>

      <SidePanel node={selectedNode} onClose={clearNode} />
    </main>
  );
}
