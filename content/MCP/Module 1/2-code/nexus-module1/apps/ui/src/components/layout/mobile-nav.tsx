import { Menu } from 'lucide-react'
import { useRef, useState, type ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SidebarContent } from './sidebar-content'

type Props = Omit<ComponentProps<typeof SidebarContent>, 'onNavigate'>

/** Chỉ hiện dưới 768px (md:hidden). Chọn mục xong thì tự đóng. */
export function MobileNav(props: Props) {
  const [open, setOpen] = useState(false)
  const navigatedRef = useRef(false) // đóng vì đã chuyển trang? (không cần vẽ → ref)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Mở menu điều hướng">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 bg-sidebar p-0"
        aria-describedby={undefined}
        // Mặc định Radix trả focus về nút ☰ khi đóng. Nếu đóng VÌ chuyển trang,
        // focus phải ở h1 của trang mới (useRouteFocus lo) → chặn Radix.
        onCloseAutoFocus={(e) => {
          if (navigatedRef.current) e.preventDefault()
          navigatedRef.current = false
        }}
      >
        <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
        <SidebarContent
          {...props}
          onNavigate={() => {
            navigatedRef.current = true
            setOpen(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
