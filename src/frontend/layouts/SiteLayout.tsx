import { Link, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/authContext.ts'
import { useLogout } from '../auth/useLogout.ts'
import { Avatar } from '../components/Avatar/Avatar.tsx'
import { Spinner } from '../components/Spinner/Spinner.tsx'
import styles from './SiteLayout.module.css'

function AccountActions() {
  const { status, user } = useAuth()
  const { signOut, signingOut } = useLogout()
  const location = useLocation()

  if (status === 'loading') {
    return <span className={styles.checking} role="status"><Spinner /> Checking sign-in…</span>
  }
  if (status === 'signed-out' || !user) {
    const onAuthPage = location.pathname === '/login' || location.pathname === '/register'
    const redirect = onAuthPage ? '' : `?redirect=${encodeURIComponent(location.pathname + location.search)}`
    return <Link className={styles.signIn} to={`/login${redirect}`}>Sign in</Link>
  }

  return (
    <div className={styles.accountActions}>
      <Link className={styles.account} to="/settings" aria-label={`Settings for ${user.name ?? user.email}`}>
        <Avatar src={user.avatarUrl} name={user.name} email={user.email} size={28} />
        <span>{user.name ?? user.email}</span>
      </Link>
      <button type="button" className={styles.signOut} disabled={signingOut} aria-busy={signingOut} onClick={() => { void signOut() }}>
        {signingOut && <Spinner />}{signingOut ? 'Signing out…' : 'Sign out'}
      </button>
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
