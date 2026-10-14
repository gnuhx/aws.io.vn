import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { registerSchema, type RegisterFormValues, type RegisterInput } from '@nexus/shared'
import { TextField } from '@/components/form/text-field'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { registerUser } from '@/lib/fake-api'
import { applyServerErrors } from '@/lib/form'

type Props = { onRegistered: (name: string) => void }

export function RegisterForm({ onRegistered }: Props) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues, unknown, RegisterInput>({
    resolver: zodResolver(registerSchema), // schema từ packages/shared, KHÔNG định nghĩa lại
    mode: 'onTouched', // báo lỗi khi rời ô; sau lần submit đầu thì báo theo từng phím
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', acceptTerms: false },
  })

  // Chỉ chạy khi schema đã PASS ở client. values đã được trim/lowercase.
  async function onSubmit(values: RegisterInput) {
    const result = await registerUser(values)
    if (result.ok) {
      onRegistered(result.data.name)
      return
    }
    applyServerErrors(result, setError)
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup className="gap-5">
        <TextField id="reg-name" label="Họ tên" autoComplete="name" error={errors.name} {...register('name')} />
        <TextField id="reg-email" label="Email" type="email" autoComplete="email" error={errors.email} {...register('email')} />
        <TextField
          id="reg-password"
          label="Mật khẩu"
          type="password"
          autoComplete="new-password"
          description="Ít nhất 8 ký tự, có cả chữ và số."
          error={errors.password}
          {...register('password')}
        />
        <TextField
          id="reg-confirm"
          label="Nhập lại mật khẩu"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword}
          {...register('confirmPassword')}
        />

        {/* Checkbox của Radix không phải <input> gốc → dùng Controller */}
        <Controller
          name="acceptTerms"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                <Checkbox
                  id="reg-terms"
                  ref={field.ref}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? 'reg-terms-error' : undefined}
                />
                <FieldLabel htmlFor="reg-terms" className="font-normal">
                  Tôi đồng ý với điều khoản sử dụng
                </FieldLabel>
              </Field>
              <FieldError id="reg-terms-error" errors={[fieldState.error]} />
            </div>
          )}
        />
      </FieldGroup>

      {errors.root?.server && (
        <Alert variant="destructive">
          <AlertTitle>Chưa tạo được tài khoản</AlertTitle>
          <AlertDescription>{errors.root.server.message}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Spinner aria-hidden="true" /> Đang tạo tài khoản…
          </>
        ) : (
          'Tạo tài khoản'
        )}
      </Button>
    </form>
  )
}
