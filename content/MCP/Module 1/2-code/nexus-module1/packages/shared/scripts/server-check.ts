// Chạy bằng Node (không có React, không có trình duyệt) để chứng minh:
// cùng schema dùng được ở phía server.
import { createWorkspaceSchema, registerSchema, slugify, toFieldErrors } from '../src/index.ts'

const bad = registerSchema.safeParse({
  name: 'A',
  email: 'khong-phai-email',
  password: 'abc',
  confirmPassword: 'abcd',
  acceptTerms: false,
})
console.log('register (dữ liệu xấu) →', bad.success ? 'OK' : toFieldErrors(bad.error))

const good = registerSchema.safeParse({
  name: '  Ngọc Anh  ',
  email: ' Anh@Nexus.VN ',
  password: 'caphe2026',
  confirmPassword: 'caphe2026',
  acceptTerms: true,
})
console.log('register (dữ liệu tốt) →', good.success ? good.data : good.error)

console.log('slugify →', slugify('Cà Phê Phin Đà Lạt'))
const ws = createWorkspaceSchema.safeParse({ name: 'Acme', slug: 'Acme Coffee', plan: 'vip', description: '' })
console.log('workspace (slug & plan sai) →', ws.success ? 'OK' : toFieldErrors(ws.error))
