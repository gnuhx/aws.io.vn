import { Link, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/authContext.ts'
import styles from './SiteLayout.module.css'

function AccountActions() {
  const { status, user, logout } = useAuth()
  const location = useLocation()

  if (status === 'loading') return null
  if (status === 'signed-out' || !user) {
    const onAuthPage = location.pathname === '/login' || location.pathname === '/register'
    const redirect = onAuthPage ? '' : `?redirect=${encodeURIComponent(location.pathname + location.search)}`
    return <Link className={styles.signIn} to={`/login${redirect}`}>Sign in</Link>
  }

  return (
    <div className={styles.accountActions}>
      <Link className={styles.account} to="/account">{user.email}</Link>
      <button type="button" className={styles.signOut} onClick={() => { void logout() }}>Sign out</button>
    </div>
  )
}

export function SiteLayout() {
  return (
    <>
      <header className={styles.header}>
        <Link className={styles.brand} to="/">aws.io.vn</Link>
        <AccountActions />
      </header>
      <Outlet />
    </>
  )
}
