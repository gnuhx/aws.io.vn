import { createBrowserRouter } from 'react-router'
import { HomePage } from './pages/Home/HomePage.tsx'
import { LessonPage } from './pages/Lesson/LessonPage.tsx'
import { NotFoundPage } from './pages/NotFound/NotFoundPage.tsx'
import { CourseRoadmapPage } from './pages/Roadmap/CourseRoadmapPage.tsx'
import { TopicPage } from './pages/Topic/TopicPage.tsx'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/:topic', element: <TopicPage /> },
  { path: '/:topic/roadmap', element: <CourseRoadmapPage /> },
  { path: '/:topic/:slug', element: <LessonPage /> },
  { path: '*', element: <NotFoundPage /> },
])
