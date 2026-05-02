import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import PostDetailPage from './pages/PostDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import VpcPage from './pages/VpcPage';
import LambdaPage from './pages/LambdaPage';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/post/aws-vpc-pho24h" element={<VpcPage />} />
        <Route path="/post/aws-lambda-ghost-kitchen" element={<LambdaPage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
