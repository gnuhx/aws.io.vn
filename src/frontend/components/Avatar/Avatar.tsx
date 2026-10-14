import { useState } from 'react'
import styles from './Avatar.module.css'

const initialsOf = (name: string | null, email: string) => {
  const words = (name ?? email.split('@')[0]).split(/[\s._-]+/).filter(Boolean)
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase()
}

/** Google profile photo, or initials when there is none (or it fails to load). */
export function Avatar({ src, name, email, size = 32 }: { src: string | null; name: string | null; email: string; size?: number }) {
  const [failed, setFailed] = useState<string | null>(null)
  const style = { width: size, height: size, fontSize: size * 0.4 }

  if (src && failed !== src) {
    return (
      <img
        className={styles.avatar}
        style={style}
        src={src}
        alt=""
        // Google photo URLs can refuse requests that carry a Referer.
        referrerPolicy="no-referrer"
        onError={() => setFailed(src)}
      />
    )
  }
  return <span className={`${styles.avatar} ${styles.initials}`} style={style} aria-hidden="true">{initialsOf(name, email)}</span>
}
