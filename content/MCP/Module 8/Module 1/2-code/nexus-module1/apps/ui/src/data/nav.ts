import { FileText, LayoutDashboard, MessageSquare, Settings, Users, type LucideIcon } from 'lucide-react'
import type { PageId } from '@/lib/router'

export type Workspace = { id: string; name: string; initials: string }
export type NavItem = { id: PageId; label: string; icon: LucideIcon }

export const initialWorkspaces: Workspace[] = [
  { id: 'acme', name: 'Acme Coffee', initials: 'AC' },
  { id: 'phin', name: 'Phin Roasters', initials: 'PR' },
  { id: 'lotus', name: 'Lotus Tea House', initials: 'LT' },
]

export const navItems: NavItem[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Khách hàng', icon: Users },
  { id: 'docs', label: 'Tài liệu', icon: FileText },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
]

/** "Phin Roasters Đà Lạt" → "PR" */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?'
}
