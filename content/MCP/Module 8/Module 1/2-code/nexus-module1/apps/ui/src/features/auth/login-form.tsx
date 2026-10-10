import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { loginSchema, type LoginFormValues, type LoginInput } from '@nexus/shared'
import { TextField } from '@/components/form/text-field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { loginUser } from '@/lib/fake-api'
import { applyServerErrors } from '@/lib/form'

export function LoginForm({ onLoggedIn }: { onLoggedIn: (name: string) => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues, unknown, LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginInput) {
    const result = await loginUser(values)
    if (result.ok) return onLoggedIn(result.data.name)
    applyServerErrors(result, setError)
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup className="gap-5">
        <TextField id="login-email" label="Email" type="email" autoComplete="email" error={errors.email} {...register('email')} />
        <TextField
          id="login-password"
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          error={errors.password}
          {...register('password')}
        />
      </FieldGroup>

      {errors.root?.server && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.server.message}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Spinner aria-hidden="true" /> Đang đăng nhập…
          </>
        ) : (
          'Đăng nhập'
        )}
      </Button>
    </form>
  )
}
