import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import type { TreeFlowNode } from './learningTree.types';

export default function LearningTreeNode({
  data,
  selected,
}: NodeProps<TreeFlowNode>) {
  const isTopic = data.kind === 'topic';
  const isLesson = data.kind === 'lesson';
  const isRoot = data.kind === 'root';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={`learning-tree-node learning-tree-node--${data.kind} ${
        selected ? 'is-selected' : ''
      } ${data.isCompleted ? 'is-completed' : ''}`}
      style={
        {
          '--node-accent': data.accent,
        } as CSSProperties
      }
      onClick={() => {
        if (isLesson && data.lesson) {
          data.onOpenLesson?.(data.lesson);
        }
      }}
      role={isLesson ? 'button' : undefined}
      tabIndex={isLesson ? 0 : undefined}
      onKeyDown={(event) => {
        if (
          isLesson &&
          data.lesson &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          data.onOpenLesson?.(data.lesson);
        }
      }}
    >
      <Handle type="target" position={Position.Left} className="learning-tree-handle" />
      <div className="learning-tree-node__badge">
        {isRoot ? 'ROOT' : isTopic ? 'TOPIC' : data.isCompleted ? 'DONE' : 'LESSON'}
      </div>
      <div className="learning-tree-node__title">{data.title}</div>
      <div className="learning-tree-node__subtitle">{data.subtitle}</div>
      {data.progressText ? (
        <div className="learning-tree-node__progress">{data.progressText}</div>
      ) : null}
      {isTopic ? (
        <button
          type="button"
          className="learning-tree-node__toggle"
          onClick={(event) => {
            event.stopPropagation();
            data.onToggleTopic?.(data.topic?.id ?? '');
          }}
        >
          {data.isCollapsed ? 'Expand' : 'Collapse'}
        </button>
      ) : null}
      <Handle type="source" position={Position.Right} className="learning-tree-handle" />
    </motion.div>
  );
}
