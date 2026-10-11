import { SignedIn, SignedOut, UserButton } from '@clerk/react'
import { Link, Outlet } from 'react-router'
import styles from './SiteLayout.module.css'

const clerkConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

function AccountActions() {
  if (!clerkConfigured) {
    return <Link className={styles.signIn} to="/sign-in">Sign in</Link>
  }

  return (
    <div className={styles.accountActions}>
      <SignedOut><Link className={styles.signIn} to="/sign-in">Sign in</Link></SignedOut>
      <SignedIn><UserButton /></SignedIn>
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
