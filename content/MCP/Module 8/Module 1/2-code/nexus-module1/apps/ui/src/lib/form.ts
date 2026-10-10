import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

type ServerErrors = { fieldErrors?: Partial<Record<string, string>>; formError?: string }

/** Lỗi từ server → gắn vào đúng field (hoặc root nếu là lỗi chung) */
export function applyServerErrors<T extends FieldValues>(
  result: ServerErrors,
  setError: UseFormSetError<T>,
) {
  let first = true
  for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
    if (!message) continue
    setError(field as Path<T>, { type: 'server', message }, { shouldFocus: first })
    first = false
  }
  if (result.formError) {
    setError('root.server', { type: 'server', message: result.formError })
  }
}
