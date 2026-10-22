import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { rehypeHeadingIds } from './rehypeHeadingIds.ts'

/** `resolveUrl` maps a link or image URL (e.g. a relative image path) before the default sanitizer runs. */
export function MarkdownView({ markdown, components, resolveUrl }: { markdown: string; components?: Components; resolveUrl?: (url: string) => string }) {
  const urlTransform = resolveUrl ? (url: string) => defaultUrlTransform(resolveUrl(url)) : undefined
  return <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHeadingIds]} components={components} urlTransform={urlTransform}>{markdown}</ReactMarkdown>
}
