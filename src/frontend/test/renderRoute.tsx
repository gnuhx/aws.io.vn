import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AuthProvider } from '../auth/AuthProvider.tsx'
import { createRoutes } from '../routes.tsx'

/** Renders the app's route elements at `url` using the current course catalog. */
export function renderRoute(url: string) {
  const router = createMemoryRouter(createRoutes(), {
    initialEntries: [url],
  })
  return render(<AuthProvider><RouterProvider router={router} /></AuthProvider>)
}
