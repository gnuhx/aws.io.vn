import type { ComponentProps } from 'react'
import type { FieldError as RHFFieldError } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type Props = ComponentProps<typeof Input> & {
  id: string
  label: string
  error?: RHFFieldError
  description?: string
}

/** Nhãn + ô nhập + mô tả + lỗi — lỗi luôn nằm NGAY DƯỚI ô của nó */
export function TextField({ id, label, error, description, ...inputProps }: Props) {
  const errorId = `${id}-error`
  const descId = `${id}-desc`
  const describedBy = [description ? descId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      {description && <FieldDescription id={descId}>{description}</FieldDescription>}
      <FieldError id={errorId} errors={[error]} />
    </Field>
  )
}
