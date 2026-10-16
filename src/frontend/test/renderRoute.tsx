import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createRoutes } from '../routes.tsx'

/** Renders the app's route elements at `url` using the current course catalog. */
export function renderRoute(url: string) {
  const router = createMemoryRouter(createRoutes(), {
    initialEntries: [url],
  })
  return render(<RouterProvider router={router} />)
}
