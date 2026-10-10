"""Ghi lại mọi lần vùng role=status đổi chữ (= thứ trình đọc màn hình sẽ đọc) và lúc log bật/tắt aria-busy."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.goto('http://localhost:4190/#/w/acme/chat'); pg.wait_for_timeout(300)
    pg.evaluate("""()=>{window.__t0=performance.now();window.__ev=[];
      const st=document.querySelector('[role=status]'), log=document.querySelector('[role=log]');
      new MutationObserver(()=>__ev.push([Math.round(performance.now()-__t0),'status', st.textContent])).observe(st,{childList:true,characterData:true,subtree:true});
      new MutationObserver(()=>__ev.push([Math.round(performance.now()-__t0),'log aria-busy', log.getAttribute('aria-busy')])).observe(log,{attributes:true,attributeFilter:['aria-busy']});}""")
    pg.fill('#chat-input', 'Doanh thu 6 tháng thế nào?'); pg.keyboard.press('Enter'); pg.wait_for_timeout(3800)
    words = pg.evaluate("document.querySelector('[role=log] li:last-child p:last-child').textContent.split(' ').length")
    print('$ python3 announce.py')
    for t, kind, v in pg.evaluate('__ev'): print(f'{t:>5} ms  {kind:14} → {v!r}')
    print(f'Câu trả lời dài {words} chữ, nhưng vùng status chỉ đổi {sum(1 for e in pg.evaluate("__ev") if e[1]=="status")} lần.')
    print('\n$ python3 naive_skip.py   # nếu skip link để trình duyệt tự nhảy tới #main')
    pg.evaluate("location.hash = '#main'"); pg.wait_for_timeout(300)
    print('URL:', pg.evaluate('location.hash'), '| h1:', pg.inner_text('h1'))
    b.close()
