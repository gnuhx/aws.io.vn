import { z } from 'zod'

/** Đăng ký tài khoản — MỘT nguồn sự thật cho form (client) và API (server) */
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Tên cần ít nhất 2 ký tự')
      .max(60, 'Tên tối đa 60 ký tự'),
    // trim/lowercase TRƯỚC, kiểm tra định dạng SAU (thứ tự trong chuỗi quan trọng!)
    email: z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ')),
    password: z
      .string()
      .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
      .regex(/[A-Za-z]/, 'Mật khẩu cần ít nhất 1 chữ cái')
      .regex(/\d/, 'Mật khẩu cần ít nhất 1 chữ số'),
    confirmPassword: z.string().min(1, 'Nhập lại mật khẩu'),
    acceptTerms: z.boolean().refine((v) => v, 'Bạn cần đồng ý điều khoản sử dụng'),
  })
  // Luật liên quan 2 field → refine ở cấp object, gắn lỗi vào đúng field bằng path
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  })

/** Kiểu của dữ liệu NGƯỜI DÙNG GÕ (trước trim/lowercase) */
export type RegisterFormValues = z.input<typeof registerSchema>
/** Kiểu của dữ liệu ĐÃ KIỂM TRA (sau trim/lowercase) — thứ server nhận */
export type RegisterInput = z.output<typeof registerSchema>

/** Đăng nhập — chỉ kiểm tra hình thức; đúng/sai mật khẩu là việc của server */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ')),
  password: z.string().min(1, 'Nhập mật khẩu'),
})

export type LoginFormValues = z.input<typeof loginSchema>
export type LoginInput = z.output<typeof loginSchema>
