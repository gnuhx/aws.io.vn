import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';

export default function AnimatedTreeEdge(props: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 24,
    offset: 28,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke: '#7dd3fc',
          strokeOpacity: 0.28,
          strokeWidth: 4,
        }}
      />
      <BaseEdge
        path={edgePath}
        style={{
          stroke: '#f8fafc',
          strokeWidth: 1.5,
          strokeDasharray: '10 8',
          animation: 'dash-flow 18s linear infinite',
        }}
      />
    </>
  );
}
