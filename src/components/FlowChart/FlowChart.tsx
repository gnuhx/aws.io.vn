import { useLayoutEffect, useRef, useState } from 'react';
import type { TopicNode, BoundaryConfig } from './flowchart.types';
import FlowNode from './FlowNode';

const NODE_W2 = 70;
const NODE_H2 = 45;

interface Props {
  nodes: TopicNode[];
  selectedNodeId: string | null;
  onNodeClick: (node: TopicNode) => void;
  boundary?: BoundaryConfig;
  chartHeight?: number;
}

interface Connection {
  from: string;
  to: string;
}

function getDirection(from: TopicNode, to: TopicNode): 'top' | 'bottom' | 'left' | 'right' {
  const dx = to.position.x - from.position.x;
  const dy = to.position.y - from.position.y;
  if (Math.abs(dy) >= Math.abs(dx)) return dy > 0 ? 'bottom' : 'top';
  return dx > 0 ? 'right' : 'left';
}

function buildConnections(nodes: TopicNode[]): Connection[] {
  const seen = new Set<string>();
  const result: Connection[] = [];
  for (const node of nodes) {
    for (const targetId of node.connections) {
      if (targetId.startsWith('__')) continue; // skip sentinel values like __boundary
      const key = [node.id, targetId].sort().join('|');
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ from: node.id, to: targetId });
      }
    }
  }
  return result;
}

function getArrowPoints(
  fromNode: TopicNode,
  toNode: TopicNode,
  containerW: number,
  chartH: number,
  offsets: { startOffset: number; endOffset: number },
) {
  const fromCX = containerW * fromNode.position.x / 100;
  const fromCY = chartH * fromNode.position.y / 100 + NODE_H2;
  const toCX = containerW * toNode.position.x / 100;
  const toCY = chartH * toNode.position.y / 100 + NODE_H2;

  const dir = getDirection(fromNode, toNode);
  let x1: number, y1: number, x2: number, y2: number;

  if (dir === 'bottom') {
    x1 = fromCX + offsets.startOffset; y1 = fromCY + NODE_H2;
    x2 = toCX + offsets.endOffset;    y2 = toCY - NODE_H2;
  } else if (dir === 'top') {
    x1 = fromCX + offsets.startOffset; y1 = fromCY - NODE_H2;
    x2 = toCX + offsets.endOffset;    y2 = toCY + NODE_H2;
  } else if (dir === 'right') {
    x1 = fromCX + NODE_W2; y1 = fromCY + offsets.startOffset;
    x2 = toCX - NODE_W2;  y2 = toCY + offsets.endOffset;
  } else {
    x1 = fromCX - NODE_W2; y1 = fromCY + offsets.startOffset;
    x2 = toCX + NODE_W2;  y2 = toCY + offsets.endOffset;
  }

  return { x1, y1, x2, y2, dir };
}

export default function FlowChart({
  nodes,
  selectedNodeId,
  onNodeClick,
  boundary,
  chartHeight = 1400,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(900);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    setContainerW(containerRef.current.offsetWidth);
    const ro = new ResizeObserver(() => {
      if (containerRef.current) setContainerW(containerRef.current.offsetWidth);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const connections = buildConnections(nodes);

  const dirGroups: Record<string, Connection[]> = {};
  for (const conn of connections) {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    if (!fromNode || !toNode) continue;
    const dir = getDirection(fromNode, toNode);
    const key = `${conn.from}-${dir}`;
    if (!dirGroups[key]) dirGroups[key] = [];
    dirGroups[key].push(conn);
  }

  const connOffsets: Record<string, number> = {};
  for (const group of Object.values(dirGroups)) {
    const mid = (group.length - 1) / 2;
    group.forEach((c, i) => {
      connOffsets[`${c.from}|${c.to}`] = (i - mid) * 14;
    });
  }

  const bnd = boundary
    ? {
        x: containerW * boundary.x / 100,
        y: chartHeight * boundary.y / 100,
        w: containerW * boundary.width / 100,
        h: chartHeight * boundary.height / 100,
        fill: boundary.fill ?? 'rgba(239,246,255,0.35)',
        stroke: boundary.stroke ?? '#93c5fd',
      }
    : null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: `${chartHeight}px`,
        width: '100%',
        minWidth: '800px',
      }}
    >
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'visible',
        }}
      >
        <defs>
          <marker id="arrow-gray" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
          <marker id="arrow-dashed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
          </marker>
        </defs>

        {/* Optional boundary box */}
        {bnd && (
          <>
            <rect
              x={bnd.x} y={bnd.y} width={bnd.w} height={bnd.h}
              fill={bnd.fill}
              stroke={bnd.stroke}
              strokeWidth={2}
              strokeDasharray="8 5"
              rx={14}
            />
            <text
              x={bnd.x + 14}
              y={bnd.y - 7}
              fill={bnd.stroke}
              fontSize="12"
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
            >
              {boundary!.label}
            </text>
          </>
        )}

        {/* Connection arrows */}
        {connections.map(({ from, to }) => {
          const fromNode = nodes.find(n => n.id === from);
          const toNode = nodes.find(n => n.id === to);
          if (!fromNode || !toNode) return null;

          const off = connOffsets[`${from}|${to}`] ?? 0;
          const { x1, y1, x2, y2, dir } = getArrowPoints(
            fromNode, toNode, containerW, chartHeight,
            { startOffset: off, endOffset: off },
          );

          const isDiagonal = Math.abs(x2 - x1) > 30 && Math.abs(y2 - y1) > 60;

          if (isDiagonal) {
            const ctrlX = dir === 'bottom' || dir === 'top' ? x1 : (x1 + x2) / 2;
            const ctrlY = dir === 'bottom' || dir === 'top' ? y2 : y1;
            return (
              <path
                key={`${from}-${to}`}
                d={`M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={1.5}
                markerEnd="url(#arrow-gray)"
              />
            );
          }

          return (
            <line
              key={`${from}-${to}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#94a3b8"
              strokeWidth={1.5}
              markerEnd="url(#arrow-gray)"
            />
          );
        })}
      </svg>

      {nodes.map(node => (
        <FlowNode
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          onClick={onNodeClick}
        />
      ))}
    </div>
  );
}
