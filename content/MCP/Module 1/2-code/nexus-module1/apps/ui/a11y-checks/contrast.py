import re, sys
def oklch_to_lin(L,C,H):
    import math
    h=math.radians(H); a=C*math.cos(h); b=C*math.sin(h)
    l_=L+0.3963377774*a+0.2158037573*b; m_=L-0.1055613458*a-0.0638541728*b; s_=L-0.0894841775*a-1.2914855480*b
    l,m,s=l_**3,m_**3,s_**3
    rgb=[4.0767416621*l-3.3077115913*m+0.2309699292*s,-1.2684380046*l+2.6097574011*m-0.3413193965*s,-0.0041960863*l-0.7034186147*m+1.7076147010*s]
    return [min(1,max(0,v)) for v in rgb]
def parse(s):
    m=re.match(r'oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)',s); return oklch_to_lin(float(m[1]),float(m[2]),float(m[3]))
lum=lambda c:0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
def ratio(a,b):
    x,y=lum(parse(a)),lum(parse(b)); return (max(x,y)+.05)/(min(x,y)+.05)
def tokens(css, block):
    body=re.search(block+r'\s*\{(.*?)\}', css, re.S)[1]
    return dict(re.findall(r'--([\w-]+):\s*(oklch\([^)]*\))', body))
if __name__=='__main__':
    css=open(sys.argv[1]).read(); L=tokens(css,':root'); D=tokens(css,r'\.dark')
    pairs=[('foreground','background'),('muted-foreground','background'),('muted-foreground','muted'),('muted-foreground','sidebar'),
           ('muted-foreground','card'),('primary-foreground','primary'),('sidebar-primary-foreground','sidebar-primary'),
           ('secondary-foreground','secondary'),('destructive','background')]
    for name,T in (('SÁNG',L),('TỐI',D)):
        print(f'--- {name}')
        for fg,bg in pairs:
            r=ratio(T[fg],T[bg]); print(f'{fg:28} trên {bg:16} {r:5.2f}:1  {"✓" if r>=4.5 else "✗"}')
