"""(1) Mọi điểm dừng Tab đều có vòng focus nhìn thấy được. (2) Không tràn ngang ở 360/768/1280px. (3) Chụp ảnh."""
from playwright.sync_api import sync_playwright
URL = 'http://localhost:4190/#/'
PAGES = ['login', 'register', 'workspaces', 'workspaces/new', 'w/acme/chat', 'w/acme/dashboard', 'w/acme/customers']
VISIBLE = """()=>{const e=document.activeElement;
 const has=(el)=>{if(!el)return false;const s=getComputedStyle(el);return (s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>0)||s.boxShadow!=='none'};
 // stretched link: vòng focus vẽ trên thẻ Card chứa nó (focus-within)
 return has(e)||has(e.closest('[data-slot=card]'))}"""
DESC = "()=>{const e=document.activeElement;return (e.getAttribute('aria-label')||e.innerText||e.id||e.tagName).trim().split('\\n')[0].slice(0,30)}"
with sync_playwright() as p:
    b = p.chromium.launch()
    print('== (1) Vòng focus ==')
    for scheme in ('light', 'dark'):
        pg = b.new_page(viewport={'width': 1280, 'height': 900}, color_scheme=scheme)
        for path in PAGES:
            pg.goto('about:blank'); pg.goto(URL + path); pg.wait_for_timeout(250)  # tải mới hẳn, Tab từ đầu trang
            seen, stops, bad = set(), 0, []
            for _ in range(60):
                pg.keyboard.press('Tab')
                if pg.evaluate('document.activeElement === document.body'): break  # Tab đã đi hết trang
                key = pg.evaluate("()=>{const e=document.activeElement;return e.id+'|'+e.outerHTML.slice(0,80)}")
                if key in seen: break
                seen.add(key); stops += 1
                if not pg.evaluate(VISIBLE): bad.append(pg.evaluate(DESC))
            print(f'  {scheme:5} #/{path:18} {stops:2} điểm dừng · thiếu vòng focus: {bad or "0"}')
        pg.close()
    print('== (2) Tràn ngang ==')
    for w in (360, 768, 1280):
        pg = b.new_page(viewport={'width': w, 'height': 800})
        over = []
        for path in PAGES + ['w/acme/docs', 'khong-co']:
            pg.goto(URL + path); pg.wait_for_timeout(250)
            sw, iw = pg.evaluate('[document.documentElement.scrollWidth, window.innerWidth]')
            if sw > iw: over.append(f'{path} ({sw}>{iw})')
        print(f'  {w:>4}px: {len(PAGES) + 2} trang · tràn ngang: {over or "không"}')
        pg.close()
    # (3) ảnh chụp để xem bằng mắt
    for scheme in ('light', 'dark'):
        for w, h in ((1280, 800), (375, 780)):
            pg = b.new_page(viewport={'width': w, 'height': h}, color_scheme=scheme)
            for path in ('login', 'workspaces', 'w/acme/chat', 'w/acme/dashboard'):
                pg.goto(URL + path); pg.wait_for_timeout(300)
                if path == 'w/acme/chat':
                    pg.fill('#chat-input', 'Có bao nhiêu khách ở Hà Nội?'); pg.keyboard.press('Enter'); pg.wait_for_timeout(500)
                pg.screenshot(path=f'/home/claude/e2e/shots/{scheme}-{w}-{path.replace("/", "_")}.png')
            pg.close()
    b.close()
