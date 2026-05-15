import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getPostById } from '../../data/posts';
import type { LearningTreeLesson } from '../../types/learningTree';

interface Props {
  lesson: LearningTreeLesson | null;
  completedLessonIds: Set<string>;
  onClose: () => void;
  onToggleCompleted: (lessonId: string) => void;
}

export default function LearningTreeSidebar({
  lesson,
  completedLessonIds,
  onClose,
  onToggleCompleted,
}: Props) {
  const post = lesson ? getPostById(lesson.postId) : undefined;
  const isCompleted = lesson
    ? completedLessonIds.has(lesson.id)
    : false;

  return (
    <AnimatePresence>
      {lesson ? (
        <>
          <motion.button
            type="button"
            className="learning-tree-sidebar__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-label="Close lesson sidebar"
          />
          <motion.aside
            className="learning-tree-sidebar"
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          >
            <button
              type="button"
              className="learning-tree-sidebar__close"
              onClick={onClose}
            >
              Close
            </button>
            <div className="learning-tree-sidebar__eyebrow">
              {lesson.duration} • {lesson.difficulty}
            </div>
            <h2 className="learning-tree-sidebar__title">{lesson.title}</h2>
            <p className="learning-tree-sidebar__summary">{lesson.summary}</p>
            <div className="learning-tree-sidebar__actions">
              <button
                type="button"
                className={`learning-tree-sidebar__complete ${
                  isCompleted ? 'is-completed' : ''
                }`}
                onClick={() => onToggleCompleted(lesson.id)}
              >
                {isCompleted ? 'Mark as not done' : 'Mark as complete'}
              </button>
              {post ? (
                <Link
                  to={post.path ?? `/post/${post.id}`}
                  className="learning-tree-sidebar__link"
                >
                  Open full article
                </Link>
              ) : null}
            </div>
            {post ? (
              <div
                className="learning-tree-sidebar__body"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            ) : (
              <p className="learning-tree-sidebar__missing">
                No lesson content is connected to this node yet.
              </p>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
