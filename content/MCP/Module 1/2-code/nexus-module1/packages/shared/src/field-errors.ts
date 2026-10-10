import { z } from 'zod'

/** Lỗi theo field mà server trả về: { email: 'Email này đã có tài khoản' } */
export type FieldErrorMap<T> = Partial<Record<keyof T & string, string>>

/** ZodError → mỗi field một câu (câu đầu tiên), để client gắn vào đúng ô */
export function toFieldErrors<T>(error: z.ZodError<T>): FieldErrorMap<T> {
  const out: Record<string, string> = {}
  for (const [field, messages] of Object.entries(z.flattenError(error).fieldErrors)) {
    const first = (messages as string[] | undefined)?.[0]
    if (first) out[field] = first
  }
  return out as FieldErrorMap<T>
}
