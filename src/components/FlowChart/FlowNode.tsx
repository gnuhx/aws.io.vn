import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TopicNode } from './flowchart.types';

const COLOR_MAP: Record<string, { bg: string; border: string; glow: string }> = {
  blue:   { bg: '#eff6ff', border: '#93c5fd', glow: '#2563eb' },
  teal:   { bg: '#ecfdf5', border: '#6ee7b7', glow: '#059669' },
  coral:  { bg: '#fff7ed', border: '#fdba74', glow: '#ea580c' },
  purple: { bg: '#faf5ff', border: '#c4b5fd', glow: '#9333ea' },
  amber:  { bg: '#fffbeb', border: '#fcd34d', glow: '#d97706' },
  gray:   { bg: '#f9fafb', border: '#d1d5db', glow: '#6b7280' },
  green:  { bg: '#f0fdf4', border: '#86efac', glow: '#16a34a' },
  red:    { bg: '#fef2f2', border: '#fca5a5', glow: '#dc2626' },
};

interface Props {
  node: TopicNode;
  isSelected: boolean;
  onClick: (node: TopicNode) => void;
}

export default function FlowNode({ node, isSelected, onClick }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colors = COLOR_MAP[node.color] ?? COLOR_MAP.gray;
  const tooltipBelow = node.position.y < 12;

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setShowTooltip(true), 400);
  };
  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowTooltip(false);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(${node.position.x}% - 70px)`,
        top: `${node.position.y}%`,
        width: '140px',
        zIndex: 2,
      }}
    >
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: tooltipBelow ? -4 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              ...(tooltipBelow
                ? { top: 'calc(100% + 8px)' }
                : { bottom: 'calc(100% + 8px)' }),
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1a1a2e',
              color: '#f0f0f0',
              borderRadius: '8px',
              padding: '10px 13px',
              fontSize: '11px',
              lineHeight: 1.55,
              width: '230px',
              zIndex: 200,
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              pointerEvents: 'none',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '5px', fontSize: '12px' }}>
              {node.icon} {node.title}
            </div>
            <div style={{ color: '#c9c9c9' }}>
              {(node.preview ?? node.sections[0]?.content ?? '').slice(0, 90)}...
            </div>
            <div style={{ color: '#7c8aab', marginTop: '6px', fontSize: '10px' }}>
              Click to learn more →
            </div>
            <div
              style={{
                position: 'absolute',
                ...(tooltipBelow
                  ? { top: -6, borderBottom: '6px solid #1a1a2e', borderTop: 'none' }
                  : { bottom: -6, borderTop: '6px solid #1a1a2e', borderBottom: 'none' }),
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        onClick={() => onClick(node)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={0}
        role="button"
        aria-label={`${node.title}: ${node.subtitle}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(node);
          }
        }}
        style={{
          background: colors.bg,
          border: `2px solid ${isSelected ? colors.glow : colors.border}`,
          borderRadius: '10px',
          padding: '10px 8px',
          cursor: 'pointer',
          boxShadow: isSelected
            ? `0 0 0 3px ${colors.glow}33, 0 4px 16px rgba(0,0,0,0.12)`
            : '0 2px 8px rgba(0,0,0,0.07)',
          textAlign: 'center',
          userSelect: 'none',
          outline: 'none',
        }}
      >
        <div style={{ fontSize: '24px', lineHeight: 1 }}>{node.icon}</div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#1a1a1a',
            marginTop: '5px',
            lineHeight: 1.25,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {node.title}
        </div>
        <div
          style={{
            fontSize: '10px',
            color: '#6b7280',
            marginTop: '3px',
            lineHeight: 1.3,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {node.subtitle}
        </div>
      </motion.div>
    </div>
  );
}
