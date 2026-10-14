import { createBrowserRouter, Navigate } from 'react-router'
import { HomePage } from './pages/Home/HomePage.tsx'
import { LessonPage } from './pages/Lesson/LessonPage.tsx'
import { NotFoundPage } from './pages/NotFound/NotFoundPage.tsx'
import { CourseRoadmapPage } from './pages/Roadmap/CourseRoadmapPage.tsx'
import { TopicPage } from './pages/Topic/TopicPage.tsx'
import { TestsPage } from './pages/Tests/TestsPage.tsx'
import { CourseLayout } from './layouts/CourseLayout.tsx'
import { SiteLayout } from './layouts/SiteLayout.tsx'
import { AuthPage } from './pages/Auth/AuthPage.tsx'
import { SettingsPage } from './pages/Settings/SettingsPage.tsx'
import { ProtectedRoute } from './auth/ProtectedRoute.tsx'

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <AuthPage mode="login" /> },
      { path: 'register', element: <AuthPage mode="register" /> },
      { path: 'settings', element: <ProtectedRoute><SettingsPage /></ProtectedRoute> },
      { path: 'account', element: <Navigate to="/settings" replace /> },
      // Earlier sign-in paths, kept so existing links still work.
      { path: 'sign-in/*', element: <Navigate to="/login" replace /> },
      { path: 'sign-up/*', element: <Navigate to="/register" replace /> },
      {
        path: ':topic',
        element: <CourseLayout />,
        children: [
          { index: true, element: <TopicPage /> },
          { path: 'roadmap', element: <CourseRoadmapPage /> },
          { path: 'tests', element: <TestsPage /> },
          { path: ':slug', element: <LessonPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
