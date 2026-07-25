import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPostById } from '../../data/posts';
import { getQuizByPostId } from '../../data/quizzes';
import type { LearningTree, LearningTreeLesson, LearningTreeTopic } from '../../types/learningTree';
import LessonPickerModal from './LessonPickerModal';
import LessonQuizComponent from '../LessonQuiz/LessonQuiz';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface LessonEntry {
  lesson: LearningTreeLesson;
  topic: LearningTreeTopic;
}

interface Props {
  tree: LearningTree;
}

export default function LearningTreeView({ tree }: Props) {
  const completedStorageKey = `learning-tree:${tree.id}:completed`;
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(
    () =>
      new Set(
        typeof window === 'undefined'
          ? []
          : ((JSON.parse(
              window.localStorage.getItem(completedStorageKey) ?? '[]'
            ) as string[]) ?? [])
      )
  );

  const lessonEntries = useMemo<LessonEntry[]>(
    () =>
      tree.topics.flatMap((topic) =>
        topic.lessons.map((lesson) => ({
          lesson,
          topic,
        }))
      ),
    [tree]
  );

  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    lessonEntries[0]?.lesson.id ?? ''
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collapsedTopics, setCollapsedTopics] = useState<Set<string>>(new Set());
  const [isViewingExternal, setIsViewingExternal] = useState(false);

  useEffect(() => {
    setSelectedLessonId(lessonEntries[0]?.lesson.id ?? '');
  }, [lessonEntries]);

  useEffect(() => {
    const entry = lessonEntries.find((e) => e.lesson.id === selectedLessonId);
    setIsViewingExternal(Boolean(entry?.lesson.externalUrl));
  }, [selectedLessonId, lessonEntries]);

  useEffect(() => {
    if (!isViewingExternal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsViewingExternal(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isViewingExternal]);

  useEffect(() => {
    if (!isViewingExternal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isViewingExternal]);

  useEffect(() => {
    window.localStorage.setItem(
      completedStorageKey,
      JSON.stringify([...completedLessonIds])
    );
  }, [completedLessonIds, completedStorageKey]);

  function toggleTopic(topicId: string) {
    setCollapsedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  function handlePickerSelect(lessonId: string) {
    setSelectedLessonId(lessonId);
    setIsModalOpen(false);
  }

  const selectedEntry =
    lessonEntries.find((entry) => entry.lesson.id === selectedLessonId) ??
    lessonEntries[0];
  const selectedExternalUrl = selectedEntry?.lesson.externalUrl;
  const selectedPost =
    selectedEntry && selectedEntry.lesson.postId
      ? getPostById(selectedEntry.lesson.postId)
      : undefined;
  const selectedQuiz =
    selectedEntry && selectedEntry.lesson.postId
      ? getQuizByPostId(selectedEntry.lesson.postId)
      : undefined;
  const selectedPostLinkLabel = selectedPost?.path?.startsWith('/learning/')
    ? 'Open track'
    : 'Open standalone post';

  const selectedIndex = selectedEntry
    ? lessonEntries.findIndex((entry) => entry.lesson.id === selectedEntry.lesson.id)
    : -1;
  const previousEntry = selectedIndex > 0 ? lessonEntries[selectedIndex - 1] : undefined;
  const nextEntry =
    selectedIndex >= 0 && selectedIndex < lessonEntries.length - 1
      ? lessonEntries[selectedIndex + 1]
      : undefined;

  return (
    <main className="learning-tree-page">
      <motion.section
        className="learning-tree-intro"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1>{tree.title}</h1>
      </motion.section>

      <section className="learning-tree-layout">
        <aside className="learning-tree-roadmap" aria-label="Roadmap">
          <button
            className="learning-tree-browse-btn"
            onClick={() => setIsModalOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Browse all lessons
          </button>

          {tree.topics.map((topic) => {
            const isCollapsed = collapsedTopics.has(topic.id);
            return (
              <section key={topic.id} className="learning-tree-topic">
                <header className="learning-tree-topic__header">
                  <div className="learning-tree-topic__title-row">
                    <p className="learning-tree-topic__kicker">{topic.title}</p>
                    <button
                      className="learning-tree-topic__collapse-btn"
                      onClick={() => toggleTopic(topic.id)}
                      aria-label={isCollapsed ? 'Expand topic' : 'Collapse topic'}
                    >
                      <motion.svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        animate={{ rotate: isCollapsed ? -90 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <path
                          d="M2 4l4 4 4-4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    </button>
                  </div>
                  <h2>{topic.description}</h2>
                </header>

                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.24, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="learning-tree-topic__list">
                        {topic.lessons.map((lesson) => {
                          const isActive = selectedEntry?.lesson.id === lesson.id;
                          const isCompleted = completedLessonIds.has(lesson.id);
                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              className={`learning-tree-item ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`}
                              onClick={() => setSelectedLessonId(lesson.id)}
                            >
                              <span
                                className="learning-tree-item__branch"
                                style={{ color: topic.accent }}
                                aria-hidden="true"
                              />
                              <span className="learning-tree-item__content">
                                <span className="learning-tree-item__title">
                                  {lesson.title}
                                </span>
                                <span className="learning-tree-item__meta">
                                  {lesson.duration} · {lesson.difficulty}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            );
          })}
        </aside>

        <article className="learning-tree-article">
          {selectedEntry && (selectedPost || selectedExternalUrl) ? (
            <>
              <header className="learning-tree-article__header">
                <div className="learning-tree-article__eyebrow">
                  <span>{selectedEntry.topic.title}</span>
                  <span>{selectedEntry.lesson.duration}</span>
                  <span>{selectedEntry.lesson.difficulty}</span>
                </div>
                <h2>{selectedPost?.title ?? selectedEntry.lesson.title}</h2>
                <p>{selectedEntry.lesson.summary}</p>
                {selectedPost && (
                  <div className="learning-tree-article__meta">
                    <time dateTime={selectedPost.date}>
                      {formatDate(selectedPost.date)}
                    </time>
                    <span>{selectedPost.readTime} min read</span>
                  </div>
                )}
                <div className="learning-tree-article__actions">
                  <button
                    type="button"
                    className="learning-tree-article__nav"
                    disabled={!previousEntry}
                    onClick={() =>
                      previousEntry && setSelectedLessonId(previousEntry.lesson.id)
                    }
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    className="learning-tree-article__nav"
                    disabled={!nextEntry}
                    onClick={() => nextEntry && setSelectedLessonId(nextEntry.lesson.id)}
                  >
                    Next →
                  </button>
                  <button
                    type="button"
                    className={`learning-tree-article__complete ${
                      completedLessonIds.has(selectedEntry.lesson.id)
                        ? 'is-completed'
                        : ''
                    }`}
                    onClick={() => {
                      setCompletedLessonIds((current) => {
                        const next = new Set(current);
                        if (next.has(selectedEntry.lesson.id)) {
                          next.delete(selectedEntry.lesson.id);
                        } else {
                          next.add(selectedEntry.lesson.id);
                        }
                        return next;
                      });
                    }}
                  >
                    {completedLessonIds.has(selectedEntry.lesson.id)
                      ? 'Completed'
                      : 'Mark complete'}
                  </button>
                  {selectedPost && (
                    <Link
                      to={selectedPost.path ?? `/post/${selectedPost.id}`}
                      className="learning-tree-article__link"
                    >
                      {selectedPostLinkLabel}
                    </Link>
                  )}
                  {selectedExternalUrl && (
                    <>
                      <button
                        type="button"
                        className="learning-tree-article__complete"
                        onClick={() => setIsViewingExternal(true)}
                      >
                        View fullscreen ⛶
                      </button>
                      <a
                        href={selectedExternalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="learning-tree-article__link"
                      >
                        Open in new tab
                      </a>
                    </>
                  )}
                </div>
              </header>

              {selectedPost && (
                <div
                  className="learning-tree-article__body"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                />
              )}

              {selectedExternalUrl && (
                <div className="learning-tree-article__frame-hint">
                  This lesson opens in fullscreen for its full design. Closed it?
                  Use "View fullscreen" above to reopen.
                </div>
              )}

              {selectedQuiz && <LessonQuizComponent quiz={selectedQuiz} />}
            </>
          ) : (
            <div className="learning-tree-article__empty">
              Select a roadmap item to read the lesson.
            </div>
          )}
        </article>
      </section>

      <AnimatePresence>
        {isModalOpen && (
          <LessonPickerModal
            tree={tree}
            selectedLessonId={selectedLessonId}
            completedLessonIds={completedLessonIds}
            onSelect={handlePickerSelect}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isViewingExternal && selectedExternalUrl && selectedEntry && (
          <motion.div
            className="lesson-fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="lesson-fullscreen__bar">
              <button
                type="button"
                className="lesson-fullscreen__back"
                onClick={() => setIsViewingExternal(false)}
              >
                ← Back to roadmap
              </button>
              <button
                type="button"
                className="lesson-fullscreen__nav"
                disabled={!previousEntry}
                onClick={() =>
                  previousEntry && setSelectedLessonId(previousEntry.lesson.id)
                }
              >
                ← Previous
              </button>
              <button
                type="button"
                className="lesson-fullscreen__nav"
                disabled={!nextEntry}
                onClick={() => nextEntry && setSelectedLessonId(nextEntry.lesson.id)}
              >
                Next →
              </button>
              <span className="lesson-fullscreen__title">
                {selectedEntry.lesson.title}
              </span>
              <a
                href={selectedExternalUrl}
                target="_blank"
                rel="noreferrer"
                className="lesson-fullscreen__open"
              >
                Open in new tab ↗
              </a>
            </div>
            <iframe
              key={selectedExternalUrl}
              src={selectedExternalUrl}
              title={selectedEntry.lesson.title}
              className="lesson-fullscreen__frame"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
