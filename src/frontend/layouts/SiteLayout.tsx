import { Show, UserButton } from '@clerk/react'
import { Link, Outlet } from 'react-router'
import styles from './SiteLayout.module.css'

const clerkConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

function AccountActions() {
  if (!clerkConfigured) {
    return <Link className={styles.signIn} to="/sign-in">Sign in</Link>
  }

  return (
    <div className={styles.accountActions}>
      <Show when="signed-out"><Link className={styles.signIn} to="/sign-in">Sign in</Link></Show>
      <Show when="signed-in"><UserButton /></Show>
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
