export interface TopicSection {
  label: string;
  content: string;
  bg: string;
}

export interface TopicNode {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: NodeColor;
  position: { x: number; y: number };
  connections: string[];
  preview?: string; // tooltip text; falls back to sections[0].content
  sections: TopicSection[];
}

export type NodeColor = 'blue' | 'teal' | 'coral' | 'purple' | 'amber' | 'gray' | 'green' | 'red';

export interface SidePanelProps {
  node: TopicNode | null;
  onClose: () => void;
}

export interface BoundaryConfig {
  label: string;
  /** 0–100 percentage of container width */
  x: number;
  /** 0–100 percentage of chart height */
  y: number;
  /** 0–100 percentage of container width */
  width: number;
  /** 0–100 percentage of chart height */
  height: number;
  fill?: string;
  stroke?: string;
}
