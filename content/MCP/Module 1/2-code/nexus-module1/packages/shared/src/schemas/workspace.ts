import { z } from 'zod'

export const WORKSPACE_PLANS = ['free', 'team'] as const

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Tên workspace cần ít nhất 2 ký tự')
    .max(50, 'Tên workspace tối đa 50 ký tự'),
  slug: z
    .string()
    .trim()
    .min(3, 'Đường dẫn cần ít nhất 3 ký tự')
    .max(32, 'Đường dẫn tối đa 32 ký tự')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Chỉ dùng chữ thường không dấu, số và dấu gạch ngang'),
  plan: z.enum(WORKSPACE_PLANS, 'Chọn một gói'),
  description: z.string().trim().max(200, 'Mô tả tối đa 200 ký tự'),
})

export type CreateWorkspaceFormValues = z.input<typeof createWorkspaceSchema>
export type CreateWorkspaceInput = z.output<typeof createWorkspaceSchema>
