import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { initialWorkspaces, initialsOf, navItems, type Workspace } from '@/data/nav'
import { LoginPage } from '@/features/auth/login-page'
import { RegisterPage } from '@/features/auth/register-page'
import { ChatPage } from '@/features/chat/chat-page'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { NotFoundPage } from '@/features/misc/not-found-page'
import { PlaceholderPage } from '@/features/misc/placeholder-page'
import { NewWorkspacePage } from '@/features/workspace/new-workspace-page'
import { WorkspaceListPage } from '@/features/workspace/workspace-list-page'
import { useRouteFocus } from '@/hooks/use-route-focus'
import { href, navigate, parseRoute, useHash, type Route } from '@/lib/router'

const LATER = { customers: 'M10', docs: 'M12', settings: 'M9' } as const

function titleOf(route: Route, workspaces: Workspace[]): string {
  switch (route.name) {
    case 'login':
      return 'Đăng nhập'
    case 'register':
      return 'Tạo tài khoản'
    case 'workspaces':
      return 'Chọn workspace'
    case 'new-workspace':
      return 'Tạo workspace'
    case 'app': {
      const ws = workspaces.find((w) => w.id === route.ws)
      const page = navItems.find((n) => n.id === route.page)
      return ws && page ? `${page.label} — ${ws.name}` : 'Không tìm thấy trang'
    }
    case 'not-found':
      return 'Không tìm thấy trang'
  }
}

export default function App() {
  const hash = useHash()
  const route = parseRoute(hash)
  // Chưa có auth thật (M9): giao diện tĩnh giả định đã đăng nhập, trang login chỉ để dựng UI
  const [userName, setUserName] = useState('Ngọc Anh')
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces)

  useRouteFocus(hash, titleOf(route, workspaces))

  function handleSignedIn(name: string) {
    setUserName(name)
    navigate(href.workspaces)
  }

  function handleCreated(ws: { id: string; name: string }) {
    setWorkspaces((prev) => [...prev, { ...ws, initials: initialsOf(ws.name) }])
    navigate(href.page(ws.id, 'chat'))
  }

  switch (route.name) {
    case 'login':
      return <LoginPage onLoggedIn={handleSignedIn} />
    case 'register':
      return <RegisterPage onRegistered={handleSignedIn} />
    case 'workspaces':
      return <WorkspaceListPage workspaces={workspaces} userInitials={initialsOf(userName)} />
    case 'new-workspace':
      return <NewWorkspacePage onCreated={handleCreated} />
    case 'not-found':
      return <NotFoundPage />
    case 'app': {
      const workspace = workspaces.find((w) => w.id === route.ws)
      if (!workspace) return <NotFoundPage />
      const page =
        route.page === 'chat' ? (
          // key: đổi workspace → cuộc trò chuyện mới (S1.2 bài 2)
          <ChatPage key={workspace.id} workspace={workspace} />
        ) : route.page === 'dashboard' ? (
          <DashboardPage workspace={workspace} />
        ) : (
          <PlaceholderPage
            title={navItems.find((n) => n.id === route.page)!.label}
            when={LATER[route.page]}
            workspaceId={workspace.id}
          />
        )
      return (
        <AppShell workspaces={workspaces} workspace={workspace} page={route.page} userInitials={initialsOf(userName)}>
          {page}
        </AppShell>
      )
    }
  }
}
