import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PostDetailPage from './pages/PostDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import VpcPage from './pages/VpcPage';
import LambdaPage from './pages/LambdaPage';
import LazierPage from './pages/LazierPage';
import LazierPrivacyPage from './pages/LazierPrivacyPage';
import LazierDeleteAccountPage from './pages/LazierDeleteAccountPage';

const LearningTreePage = lazy(() => import('./pages/LearningTreePage'));

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<LearningTreePage defaultId="stupid-dev-learns-aws" />} />
          <Route path="/post/aws-vpc-pho24h" element={<VpcPage />} />
          <Route
            path="/post/aws-lambda-ghost-kitchen"
            element={<LambdaPage />}
          />
          <Route
            path="/learning/:id"
            element={<LearningTreePage />}
          />
          <Route path="/projects/lazier" element={<LazierPage />} />
          <Route
            path="/projects/lazier/privacy"
            element={<LazierPrivacyPage />}
          />
          <Route
            path="/projects/lazier/delete-account"
            element={<LazierDeleteAccountPage />}
          />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
