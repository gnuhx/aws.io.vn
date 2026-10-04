// Runs before every frontend test file (see vite.config.ts).
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// RTL only cleans up on its own when `afterEach` is a global; we import it explicitly instead.
afterEach(cleanup)
