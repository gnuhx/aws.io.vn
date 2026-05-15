import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { awsLearningTree } from '../data/aws-learning-tree';
import { getPostById } from '../data/posts';
import type { LearningTreeLesson, LearningTreeTopic } from '../types/learningTree';
import './LearningTreePage.css';

const COMPLETED_STORAGE_KEY = 'learning-tree:stupid-dev-learns-aws:completed';
const BRANCH_WIDTHS = [10, 20, 30, 40, 50];

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
  branchWidth: number;
}

export default function LearningTreePage() {
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(
    () =>
      new Set(
        typeof window === 'undefined'
          ? []
          : ((JSON.parse(
              window.localStorage.getItem(COMPLETED_STORAGE_KEY) ?? '[]'
            ) as string[]) ?? [])
      )
  );

  const lessonEntries = useMemo<LessonEntry[]>(
    () =>
      awsLearningTree.topics.flatMap((topic) =>
        topic.lessons.map((lesson, lessonIndex) => ({
          lesson,
          topic,
          branchWidth: BRANCH_WIDTHS[lessonIndex % BRANCH_WIDTHS.length],
        }))
      ),
    []
  );

  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    lessonEntries[0]?.lesson.id ?? ''
  );

  useEffect(() => {
    document.body.classList.add('learning-tree-body');
    return () => document.body.classList.remove('learning-tree-body');
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      COMPLETED_STORAGE_KEY,
      JSON.stringify([...completedLessonIds])
    );
  }, [completedLessonIds]);

  const completedCount = completedLessonIds.size;
  const progressPercent =
    Math.round((completedCount / lessonEntries.length) * 100) || 0;

  const selectedEntry =
    lessonEntries.find((entry) => entry.lesson.id === selectedLessonId) ??
    lessonEntries[0];
  const selectedPost = selectedEntry
    ? getPostById(selectedEntry.lesson.postId)
    : undefined;

  return (
    <main className="learning-tree-page">
      <motion.section
        className="learning-tree-intro"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="learning-tree-intro__eyebrow">Learning Roadmap</div>
        <h1>{awsLearningTree.title}</h1>
        <p>{awsLearningTree.description}</p>
        <div className="learning-tree-intro__meta">
          <span>{progressPercent}% complete</span>
          <span>{completedCount} of {lessonEntries.length} lessons</span>
          <span>{awsLearningTree.estimatedHours}</span>
          <span>{awsLearningTree.level}</span>
        </div>
      </motion.section>

      <section className="learning-tree-layout">
        <aside className="learning-tree-roadmap" aria-label="Roadmap">
          {awsLearningTree.topics.map((topic) => (
            <section key={topic.id} className="learning-tree-topic">
              <header className="learning-tree-topic__header">
                <p className="learning-tree-topic__kicker">{topic.title}</p>
                <h2>{topic.description}</h2>
              </header>

              <div className="learning-tree-topic__list">
                {topic.lessons.map((lesson, lessonIndex) => {
                  const isActive = selectedEntry?.lesson.id === lesson.id;
                  const isCompleted = completedLessonIds.has(lesson.id);
                  const branchWidth =
                    BRANCH_WIDTHS[lessonIndex % BRANCH_WIDTHS.length];

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      className={`learning-tree-item ${
                        isActive ? 'is-active' : ''
                      } ${isCompleted ? 'is-completed' : ''}`}
                      onClick={() => setSelectedLessonId(lesson.id)}
                    >
                      <span
                        className="learning-tree-item__branch"
                        style={{ width: `${branchWidth}%`, color: topic.accent }}
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
            </section>
          ))}
        </aside>

        <article className="learning-tree-article">
          {selectedEntry && selectedPost ? (
            <>
              <header className="learning-tree-article__header">
                <div className="learning-tree-article__eyebrow">
                  <span>{selectedEntry.topic.title}</span>
                  <span>{selectedEntry.lesson.duration}</span>
                  <span>{selectedEntry.lesson.difficulty}</span>
                </div>
                <h2>{selectedPost.title}</h2>
                <p>{selectedEntry.lesson.summary}</p>
                <div className="learning-tree-article__meta">
                  <time dateTime={selectedPost.date}>
                    {formatDate(selectedPost.date)}
                  </time>
                  <span>{selectedPost.readTime} min read</span>
                </div>
                <div className="learning-tree-article__actions">
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
                  <Link
                    to={selectedPost.path ?? `/post/${selectedPost.id}`}
                    className="learning-tree-article__link"
                  >
                    Open standalone post
                  </Link>
                </div>
              </header>

              <div
                className="learning-tree-article__body"
                dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              />
            </>
          ) : (
            <div className="learning-tree-article__empty">
              Select a roadmap item to read the lesson.
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
