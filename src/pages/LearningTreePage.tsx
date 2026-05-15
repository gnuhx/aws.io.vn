import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import LearningTreeView from '../components/LearningTree/LearningTreeView';
import { getLearningTreeById } from '../data/learningTrees';
import './LearningTreePage.css';

export default function LearningTreePage() {
  const { id } = useParams<{ id: string }>();
  const tree = id ? getLearningTreeById(id) : undefined;

  useEffect(() => {
    document.body.classList.add('learning-tree-body');
    return () => document.body.classList.remove('learning-tree-body');
  }, []);

  if (!tree) {
    return <Navigate to="/404" replace />;
  }

  return <LearningTreeView tree={tree} />;
}
