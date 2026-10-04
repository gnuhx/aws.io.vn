import type { RouteObject } from 'react-router'
import type { LessonIndex } from '@shared/lessons/parse.ts'
import { HomePage } from './pages/Home/HomePage.tsx'
import { LessonPage } from './pages/Lesson/LessonPage.tsx'
import { NotFoundPage } from './pages/NotFound/NotFoundPage.tsx'
import { TopicPage } from './pages/Topic/TopicPage.tsx'

// Takes the index as an argument so tests can render the real routes with fixture lessons.
export function createRoutes(index: LessonIndex): RouteObject[] {
  return [
    {
      path: '/',
      errorElement: <NotFoundPage />,
      children: [
        { index: true, element: <HomePage /> },
        { path: ':topic', element: <TopicPage index={index} /> },
        { path: ':topic/:slug', element: <LessonPage index={index} /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ]
}
