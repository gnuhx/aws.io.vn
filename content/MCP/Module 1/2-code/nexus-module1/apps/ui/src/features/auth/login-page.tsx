import { PageTitle } from '@/components/a11y/page-title'
import { SkipLink } from '@/components/a11y/skip-link'
import { PublicHeader } from '@/components/layout/public-header'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { href } from '@/lib/router'
import { LoginForm } from './login-form'

export function LoginPage({ onLoggedIn }: { onLoggedIn: (name: string) => void }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <SkipLink />
      <PublicHeader />
      <main id="main" tabIndex={-1} className="grid flex-1 place-items-center p-4 outline-none">
        <Card className="w-full max-w-md">
          <CardHeader>
            <PageTitle className="text-xl">Đăng nhập Nexus</PageTitle>
            <CardDescription>Trò chuyện với dữ liệu công ty bạn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <LoginForm onLoggedIn={onLoggedIn} />
            <p className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{' '}
              <a href={href.register} className="font-medium text-foreground underline underline-offset-4">
                Tạo tài khoản
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
