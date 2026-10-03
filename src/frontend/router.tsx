import { createBrowserRouter } from 'react-router'
import { HomePage } from './pages/Home/HomePage.tsx'

export const router = createBrowserRouter([{ path: '/', element: <HomePage /> }])
