import styles from './Spinner.module.css'

/** Decorative spinner; pair it with visible or `role="status"` text that says what is happening. */
export function Spinner({ size = '1em' }: { size?: string }) {
  return <span className={styles.spinner} style={{ width: size, height: size }} aria-hidden="true" />
}
