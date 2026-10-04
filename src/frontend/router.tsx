import { createBrowserRouter } from 'react-router'
import { lessonIndex } from './lessons.ts'
import { createRoutes } from './routes.tsx'

export const router = createBrowserRouter(createRoutes(lessonIndex))
