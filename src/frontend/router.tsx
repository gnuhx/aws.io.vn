import { createBrowserRouter } from 'react-router'
import { HomePage } from './pages/Home/HomePage.tsx'
import { LessonPage } from './pages/Lesson/LessonPage.tsx'
import { NotFoundPage } from './pages/NotFound/NotFoundPage.tsx'
import { CourseRoadmapPage } from './pages/Roadmap/CourseRoadmapPage.tsx'
import { TopicPage } from './pages/Topic/TopicPage.tsx'
import { TestsPage } from './pages/Tests/TestsPage.tsx'
import { CourseLayout } from './layouts/CourseLayout.tsx'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  {
    path: '/:topic',
    element: <CourseLayout />,
    children: [
      { index: true, element: <TopicPage /> },
      { path: 'roadmap', element: <CourseRoadmapPage /> },
      { path: 'tests', element: <TestsPage /> },
      { path: ':slug', element: <LessonPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
