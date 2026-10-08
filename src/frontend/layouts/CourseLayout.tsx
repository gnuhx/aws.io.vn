import { Outlet, useLocation, useParams } from 'react-router'
import { TestNowBubble } from '../components/TestNowBubble/TestNowBubble.tsx'

export function CourseLayout() {
  const { topic = '' } = useParams()
  const { pathname } = useLocation()
  const isTestPage = pathname.replace(/\/$/, '').endsWith('/tests')
  return <><Outlet />{topic === 'aws-saa-c03' && !isTestPage && <TestNowBubble />}</>
}
