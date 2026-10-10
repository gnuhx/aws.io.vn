"""axe-core (bộ luật Lighthouse dùng) trên các TRẠNG THÁI mà Lighthouse không thấy: dark mode, lỗi form, tool đang chạy, menu mở."""
from playwright.sync_api import sync_playwright
AXE = open('/home/claude/tools/node_modules/axe-core/axe.min.js').read()
URL = 'http://localhost:4190/#/'
RUN = """async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
 return r.violations.map(v=>v.id+' ×'+v.nodes.length+' ('+v.nodes[0].target.join(' ')+')')}"""

def check(pg, label):
    pg.add_script_tag(content=AXE)
    v = pg.evaluate(RUN)
    print(f'{label:52}', '✓ 0 vi phạm' if not v else '✗ ' + '; '.join(v))

with sync_playwright() as p:
    b = p.chromium.launch()
    for scheme in ('light', 'dark'):
        for w in (1280, 375):
            ctx = b.new_context(viewport={'width': w, 'height': 800}, color_scheme=scheme)
            pg = ctx.new_page(); tag = f'{scheme:5} {w:>4}px'
            pg.goto(URL + 'login'); pg.wait_for_timeout(300)
            pg.click('button[type=submit]'); pg.wait_for_timeout(200); check(pg, f'{tag} login · đang hiện lỗi form')
            pg.goto(URL + 'workspaces/new'); pg.wait_for_timeout(200)
            pg.click('button[type=submit]'); pg.wait_for_timeout(200); check(pg, f'{tag} tạo workspace · đang hiện lỗi form')
            pg.goto(URL + 'w/acme/chat'); pg.wait_for_timeout(300)
            pg.fill('#chat-input', 'Có bao nhiêu khách ở Hà Nội?'); pg.keyboard.press('Enter'); pg.wait_for_timeout(400)
            check(pg, f'{tag} chat · tool đang chạy')
            pg.click('details summary'); pg.wait_for_timeout(1800); check(pg, f'{tag} chat · đang stream + mở chi tiết tool')
            pg.goto(URL + 'w/acme/dashboard'); pg.wait_for_timeout(300)
            pg.click('summary:has-text("Xem số liệu dạng bảng")'); check(pg, f'{tag} dashboard · mở bảng số liệu')
            pg.click("button[aria-label='Đổi giao diện sáng/tối']"); pg.wait_for_timeout(300); check(pg, f'{tag} dashboard · dropdown theme đang mở')
            pg.keyboard.press('Escape')
            if w < 768:
                pg.click("button[aria-label='Mở menu điều hướng']"); pg.wait_for_timeout(500); check(pg, f'{tag} dashboard · menu mobile đang mở')
            ctx.close()
    b.close()
