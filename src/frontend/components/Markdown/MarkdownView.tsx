import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { rehypeHeadingIds } from './rehypeHeadingIds.ts'

export function MarkdownView({ markdown, components }: { markdown: string; components?: Components }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHeadingIds]} components={components}>{markdown}</ReactMarkdown>
}
