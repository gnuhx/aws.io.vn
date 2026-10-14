#!/bin/bash
# Lighthouse Accessibility cho mọi màn hình, 2 cấu hình: mobile (mặc định) và desktop
for preset in mobile desktop; do
  for r in login register workspaces workspaces/new w/acme/chat w/acme/dashboard w/acme/customers khong-co; do
    n=$(echo "$preset-$r" | tr '/' '_')
    extra=""; [ "$preset" = desktop ] && extra="--preset=desktop"
    timeout 150 npx lighthouse "http://localhost:4190/#/$r" $extra --only-categories=accessibility \
      --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=lh/$n.json --quiet >/dev/null 2>&1
    node -e "const r=require('./lh/$n.json');const f=Object.values(r.audits).filter(a=>a.score===0&&a.scoreDisplayMode==='binary').map(a=>a.id);console.log('$preset'.padEnd(8), '#/$r'.padEnd(20), String(Math.round(r.categories.accessibility.score*100)).padStart(3), f.length?'✗ '+f.join(', '):'✓')"
  done
done
