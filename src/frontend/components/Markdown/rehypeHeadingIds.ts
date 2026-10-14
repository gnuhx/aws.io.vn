import type { Element, ElementContent, Root, RootContent } from 'hast'

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4'])

/** "Cấu hình VPC & Subnets" → "cau-hinh-vpc-subnets". ASCII only, so IDs stay valid in URLs and in the reading API. */
export function slugify(text: string) {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 100)
    .replace(/^-+|-+$/g, '')
  return slug || 'section'
}

const textOf = (node: ElementContent | RootContent): string =>
  node.type === 'text' ? node.value : 'children' in node ? node.children.map(textOf).join('') : ''

/**
 * Gives every h1–h4 a stable `id` from its text, de-duplicated in document order (`intro`, `intro-2`, …), like
 * GitHub. Reading positions are saved by these IDs, so they survive layout changes; renaming a heading only means
 * a saved position for it is no longer found.
 */
export function rehypeHeadingIds() {
  return (tree: Root) => {
    const used = new Set<string>()
    const walk = (nodes: (ElementContent | RootContent)[]) => {
      for (const node of nodes) {
        if (node.type !== 'element') continue
        if (HEADINGS.has(node.tagName) && !(node as Element).properties.id) {
          const base = slugify(textOf(node))
          let id = base
          for (let n = 2; used.has(id); n++) id = `${base}-${n}`
          used.add(id)
          node.properties.id = id
        }
        walk(node.children)
      }
    }
    walk(tree.children)
  }
}
