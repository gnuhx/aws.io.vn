import { useState, type KeyboardEvent } from 'react'
import styles from './TagInput.module.css'

/**
 * Chips + text box. Enter or comma adds the typed tag; Backspace in an empty box removes the last one.
 * Duplicates (case-insensitive) are ignored; the server normalizes again anyway.
 */
export function TagInput({
  id,
  label,
  tags,
  onChange,
  max,
  maxLength,
  placeholder,
  suggestions = [],
  describedBy,
  invalid,
}: {
  id: string
  label: string
  tags: string[]
  onChange: (tags: string[]) => void
  max: number
  maxLength: number
  placeholder?: string
  suggestions?: readonly string[]
  describedBy?: string
  invalid?: boolean
}) {
  const [draft, setDraft] = useState('')
  const full = tags.length >= max
  const has = (tag: string) => tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())

  const add = (raw: string) => {
    const tag = raw.trim().slice(0, maxLength)
    if (tag && !full && !has(tag)) onChange([...tags, tag])
    setDraft('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add(draft)
    } else if (event.key === 'Backspace' && !draft && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  const unused = suggestions.filter((tag) => !has(tag)).slice(0, 8)

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.box} ${invalid ? styles.invalid : ''}`}>
        <ul className={styles.tags} aria-label={`${label} added`}>
          {tags.map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
              <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(tags.filter((existing) => existing !== tag))}>×</button>
            </li>
          ))}
        </ul>
        <input
          id={id}
          value={draft}
          maxLength={maxLength}
          disabled={full}
          placeholder={full ? `Limit of ${max} reached` : placeholder}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          onChange={(event) => setDraft(event.currentTarget.value.replace(',', ''))}
          onKeyDown={onKeyDown}
          onBlur={() => { if (draft.trim()) add(draft) }}
        />
      </div>
      {unused.length > 0 && !full && (
        <div className={styles.suggestions} aria-label={`Suggested ${label.toLowerCase()}`} role="group">
          {unused.map((tag) => (
            <button key={tag} type="button" onClick={() => add(tag)}>+ {tag}</button>
          ))}
        </div>
      )}
    </div>
  )
}
