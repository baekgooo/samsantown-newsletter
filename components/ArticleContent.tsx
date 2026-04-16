'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
}

export default function ArticleContent({ content }: Props) {
  // Normalize literal \n sequences to actual newlines (handles JSX string attributes and DB content)
  const normalizedContent = content.replace(/\\n/g, '\n')

  return (
    <div className="px-5 py-6 prose prose-sm max-w-none prose-headings:text-[#111] prose-headings:font-bold prose-p:text-[#444] prose-p:leading-relaxed prose-img:rounded-lg prose-img:w-full prose-a:text-[#FF6200] prose-a:no-underline">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {normalizedContent}
      </ReactMarkdown>
    </div>
  )
}
