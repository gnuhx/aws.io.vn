import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { LearningTree } from '../../types/learningTree';

interface Props {
  tree: LearningTree;
  selectedLessonId: string;
  completedLessonIds: Set<string>;
  onSelect: (lessonId: string) => void;
  onClose: () => void;
}

export default function LessonPickerModal({
  tree,
  selectedLessonId,
  completedLessonIds,
  onSelect,
  onClose,
}: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <motion.div
      className="lesson-picker-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.div
        className="lesson-picker-modal"
        initial={{ opacity: 0, y: -14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lesson-picker-modal__header">
          <span className="lesson-picker-modal__title">All Lessons</span>
          <button
            className="lesson-picker-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M1 1l11 11M12 1L1 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="lesson-picker-modal__body">
          {tree.topics.map((topic) => (
            <div key={topic.id} className="lesson-picker-topic">
              <div
                className="lesson-picker-topic__kicker"
                style={{ borderBottomColor: topic.accent, color: topic.accent }}
              >
                {topic.title}
              </div>
              {topic.lessons.map((lesson) => {
                const isActive = selectedLessonId === lesson.id;
                const isDone = completedLessonIds.has(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    className={`lesson-picker-lesson${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
                    onClick={() => onSelect(lesson.id)}
                  >
                    <span className="lesson-picker-lesson__title">
                      {lesson.title}
                    </span>
                    <span className="lesson-picker-lesson__meta">
                      {lesson.duration} · {lesson.difficulty}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
