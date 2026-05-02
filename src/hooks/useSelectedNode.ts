import { useState } from 'react';
import type { TopicNode } from '../components/FlowChart/flowchart.types';

export function useSelectedNode() {
  const [selectedNode, setSelectedNode] = useState<TopicNode | null>(null);

  const selectNode = (node: TopicNode) => setSelectedNode(node);
  const clearNode = () => setSelectedNode(null);

  return { selectedNode, selectNode, clearNode };
}
