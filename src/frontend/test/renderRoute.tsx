import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { buildLessonIndex } from '@shared/lessons/parse.ts'
import { createRoutes } from '../routes.tsx'

export function lessonFile(topic: string, title: string, order: number, body = '') {
  return `---\ntitle: ${title}\ntopic: ${topic}\norder: ${order}\ndate: 2026-10-02\ntags: []\n---\n${body}`
}

/** Renders the app's real routes at `url`, backed by fixture lesson files. */
export function renderRoute(url: string, files: Record<string, string> = {}) {
  const router = createMemoryRouter(createRoutes(buildLessonIndex(files)), {
    initialEntries: [url],
  })
  return render(<RouterProvider router={router} />)
}
