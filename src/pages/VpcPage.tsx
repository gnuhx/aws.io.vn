import { Link } from 'react-router-dom';
import FlowChart from '../components/FlowChart/FlowChart';
import SidePanel from '../components/SidePanel/SidePanel';
import { useSelectedNode } from '../hooks/useSelectedNode';
import vpcNodes from '../data/vpc-nodes.data';
import './VpcPage.css';

const LEGEND = [
  { bg: '#ecfdf5', border: '#6ee7b7', label: 'Subnets / Gateways' },
  { bg: '#fff7ed', border: '#fdba74', label: 'Entry Gateways' },
  { bg: '#eff6ff', border: '#93c5fd', label: 'Core Networking' },
  { bg: '#faf5ff', border: '#c4b5fd', label: 'Routing' },
  { bg: '#fffbeb', border: '#fcd34d', label: 'IPs & Addresses' },
  { bg: '#f9fafb', border: '#d1d5db', label: 'Config & Options' },
];

export default function VpcPage() {
  const { selectedNode, selectNode, clearNode } = useSelectedNode();

  return (
    <main className="vpc-page">
      <div className="vpc-header">
        <div className="vpc-tags">
          {['VPC', 'Networking', 'Interactive', 'SAA-C03'].map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <h1 className="vpc-title">🏭 AWS VPC — Pho24h Factory</h1>
        <p className="vpc-subtitle">
          An interactive visual map of AWS VPC components. Each node is a piece of the factory.{' '}
          <strong>Hover to preview · Click to explore</strong> the concept, a real-world example,
          and the Pho24h factory story.
        </p>
        <div className="vpc-meta">
          <time dateTime="2025-05-01">May 1, 2025</time>
          <span className="vpc-meta-sep">·</span>
          <span>15 min read</span>
          <span className="vpc-meta-sep">·</span>
          <span>15 components</span>
        </div>
      </div>

      <div className="vpc-chart-scroll">
        <FlowChart
          nodes={vpcNodes}
          selectedNodeId={selectedNode?.id ?? null}
          onNodeClick={selectNode}
          chartHeight={1400}
          boundary={{
            label: '🏭 VPC Boundary',
            x: 8, y: 49, width: 84, height: 47,
            fill: 'rgba(239,246,255,0.35)',
            stroke: '#93c5fd',
          }}
        />
      </div>

      <div className="vpc-legend">
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

      <footer className="vpc-footer">
        <Link to="/" className="back-link">← Back to all posts</Link>
      </footer>

      <SidePanel node={selectedNode} onClose={clearNode} />
    </main>
  );
}
