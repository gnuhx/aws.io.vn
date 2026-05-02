import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SidePanelProps, TopicSection } from '../FlowChart/flowchart.types';

const bodyStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: 1.8,
  color: '#374151',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  margin: 0,
};

function SectionCard({ s }: { s: TopicSection }) {
  return (
    <div
      style={{
        background: s.bg,
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#374151',
          marginBottom: '8px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
        }}
      >
        {s.label}
      </div>
      <p style={bodyStyle}>{s.content}</p>
    </div>
  );
}

export default function SidePanel({ node, onClose }: SidePanelProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {node && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.25)',
              zIndex: 50,
            }}
          />

          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${node.title}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(440px, 100vw)',
              background: '#ffffff',
              zIndex: 51,
              overflowY: 'auto',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Sticky header */}
            <div
              style={{
                padding: '20px 20px 16px',
                borderBottom: '1px solid #e5e7eb',
                position: 'sticky',
                top: 0,
                background: '#fff',
                zIndex: 1,
              }}
            >
              <button
                onClick={onClose}
                aria-label="Close panel"
                style={{
                  float: 'right',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  color: '#6b7280',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
              <div style={{ fontSize: '44px', lineHeight: 1, marginBottom: '10px' }}>
                {node.icon}
              </div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#111827',
                  margin: '0 0 4px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: 1.3,
                }}
              >
                {node.title}
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  margin: 0,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {node.subtitle}
              </p>
            </div>

            {/* Sections — driven entirely by node.sections */}
            <div style={{ padding: '16px 20px 40px', flex: 1 }}>
              {node.sections.map((s) => (
                <SectionCard key={s.label} s={s} />
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
