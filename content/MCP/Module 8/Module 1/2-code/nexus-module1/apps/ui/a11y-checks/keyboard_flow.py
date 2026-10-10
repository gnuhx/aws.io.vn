"""AC #1: đi hết luồng chính CHỈ bằng bàn phím. Không có một lệnh click nào trong file này."""
from playwright.sync_api import sync_playwright
URL = 'http://localhost:4190/#/'
FOCUS = """()=>{const e=document.activeElement;const t=(e.getAttribute('aria-label')||e.innerText||e.id||e.tagName).trim().split('\\n')[0].slice(0,40);
  return {tag:e.tagName.toLowerCase(), id:e.id, text:t}}"""

def focus(pg): return pg.evaluate(FOCUS)

def tab_to(pg, want, back=False, limit=40):
    """Nhấn Tab (hoặc Shift+Tab) tới khi focus vào phần tử có chữ/id = want. Trả về số lần nhấn."""
    for n in range(1, limit + 1):
        pg.keyboard.press('Shift+Tab' if back else 'Tab')
        f = focus(pg)
        if want in (f['text'], f['id']): return n
    raise AssertionError(f'không Tab tới được {want!r}')

def step(label, detail): print(f'  {label:44} {detail}')

with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    pg = b.new_page(viewport={'width': 1280, 'height': 900})
    pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    print('== Desktop 1280px ==')
    pg.goto(URL + 'login'); pg.wait_for_timeout(300)
    pg.keyboard.press('Tab'); f = focus(pg)
    box = pg.evaluate("()=>{const r=document.activeElement.getBoundingClientRect();return r.width>1&&r.height>1}")
    step('Tab đầu tiên', f"→ {f['text']!r} (hiện ra: {box})")
    pg.keyboard.press('Enter')
    step('Enter trên skip link', f"→ focus #{focus(pg)['id']} · URL vẫn là {pg.evaluate('location.hash')}")
    n = tab_to(pg, 'login-email'); pg.keyboard.type('ngocanh@nexus.vn')
    pg.keyboard.press('Tab'); pg.keyboard.type('caphe2026'); pg.keyboard.press('Enter')
    pg.wait_for_timeout(900)
    step(f'Đăng nhập ({n} Tab tới ô email, gõ, Tab, gõ, Enter)', f"→ {pg.evaluate('location.hash')} · focus: <{focus(pg)['tag']}> {focus(pg)['text']!r} · title: {pg.title()!r}")
    n = tab_to(pg, 'Acme Coffee'); pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    step(f'Chọn workspace ({n} Tab + Enter)', f"→ {pg.evaluate('location.hash')} · focus: <{focus(pg)['tag']}> {focus(pg)['text']!r}")
    n = tab_to(pg, 'chat-input')
    step(f'Tới ô chat ({n} Tab: log → “Xem input” → ô)', f"→ #{focus(pg)['id']}")
    pg.keyboard.type('Có bao nhiêu khách hàng ở Hà Nội?'); pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    step('Enter gửi câu hỏi', f"→ trạng thái: {pg.inner_text('[role=status]')!r} · nút: {pg.inner_text('form button').strip()!r} · focus vẫn #{focus(pg)['id']}")
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    step('Esc khi tool đang chạy', f"→ thẻ tool: {pg.inner_text('[role=log] li:last-child [aria-busy] span')!r} · trạng thái: {pg.inner_text('[role=status]')!r} · focus #{focus(pg)['id']}")
    pg.keyboard.type('Doanh thu 6 tháng thế nào?'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    n = tab_to(pg, 'Dừng'); pg.keyboard.press('Enter'); pg.wait_for_timeout(150)
    step(f'Tab tới nút Dừng ({n} Tab) + Enter', f"→ trạng thái: {pg.inner_text('[role=status]')!r} · focus quay về #{focus(pg)['id']}")
    pg.keyboard.type('Doanh thu 6 tháng thế nào?'); pg.keyboard.press('Enter'); pg.wait_for_timeout(3800)
    step('Gửi lại và đợi trả lời xong', f"→ trạng thái: {pg.inner_text('[role=status]')!r} · nút: {pg.inner_text('form button').strip()!r}")
    n = tab_to(pg, 'Dashboard', back=True); pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    step(f'Shift+Tab về sidebar ({n} lần) → Dashboard', f"→ {pg.evaluate('location.hash')} · focus: <{focus(pg)['tag']}> {focus(pg)['text']!r}")
    n = tab_to(pg, 'Xem số liệu dạng bảng'); pg.keyboard.press('Enter')
    step(f'Mở bảng số liệu ({n} Tab + Enter)', f"→ số dòng bảng: {pg.locator('details[open] tbody tr').count()}")
    n = tab_to(pg, 'Đổi giao diện sáng/tối', back=True); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    pg.keyboard.press('ArrowDown'); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    step(f'Đổi theme ({n} Shift+Tab, Enter, ↓, Enter)', f"→ <html class={pg.evaluate('document.documentElement.className')!r}>")
    n = tab_to(pg, 'Tạo workspace', back=True); pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    step(f'Sidebar → Tạo workspace ({n} Shift+Tab)', f"→ {pg.evaluate('location.hash')} · focus: <{focus(pg)['tag']}> {focus(pg)['text']!r}")
    tab_to(pg, 'ws-name'); pg.keyboard.type('Hội An Roastery')
    tab_to(pg, 'plan-free')
    # nhấn ↓ như người thật (giữ ~60ms). press() nhả phím ngay lập tức → Radix chỉ dời focus, không chọn
    pg.keyboard.down('ArrowDown'); pg.wait_for_timeout(60); pg.keyboard.up('ArrowDown'); pg.wait_for_timeout(100)
    picked = pg.evaluate("document.querySelector('[role=radio][aria-checked=true]').id")
    n = tab_to(pg, 'Tạo workspace'); pg.keyboard.press('Enter'); pg.wait_for_timeout(1100)
    step(f'Điền form, ↓ chọn gói ({picked}), Enter', f"→ {pg.evaluate('location.hash')} · focus: <{focus(pg)['tag']}> {focus(pg)['text']!r}")

    print('== Mobile 375px ==')
    m = b.new_page(viewport={'width': 375, 'height': 800})
    m.goto(URL + 'w/acme/chat'); m.wait_for_timeout(300)
    n = tab_to(m, 'Mở menu điều hướng'); m.keyboard.press('Enter'); m.wait_for_timeout(400)
    inside = lambda: m.evaluate("!!document.activeElement.closest('[role=dialog]')")
    step(f'Mở menu ({n} Tab + Enter)', f'→ dialog mở, focus trong dialog: {inside()}')
    for _ in range(25): m.keyboard.press('Tab')
    step('Nhấn Tab 25 lần liền', f'→ focus vẫn trong dialog: {inside()} (focus trap)')
    m.keyboard.press('Escape'); m.wait_for_timeout(400)
    step('Esc', f"→ dialog đóng: {not m.is_visible('[role=dialog]')} · focus về: {focus(m)['text']!r}")
    m.keyboard.press('Enter'); m.wait_for_timeout(400)
    n = tab_to(m, 'Dashboard'); m.keyboard.press('Enter'); m.wait_for_timeout(700)
    step(f'Mở lại, Tab tới Dashboard ({n}) + Enter', f"→ {m.evaluate('location.hash')} · focus: <{focus(m)['tag']}> {focus(m)['text']!r}")
    print('console errors/warnings:', errs)
    b.close()
