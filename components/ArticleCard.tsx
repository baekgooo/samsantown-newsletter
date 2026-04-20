import Link from 'next/link'

interface Props {
  slug: string
  title: string
  summary: string
  published_at: string
  category: string
}

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

export default function ArticleCard({ slug, title, summary, published_at }: Props) {
  return (
    <article className="px-5 py-[18px] border-b border-[#f0f0f0]">
      <p className="text-[11px] text-[#aaa] mb-2">{formatDate(published_at)}</p>
      <h2 className="text-[16px] font-bold text-[#111] leading-snug mb-1.5">{title}</h2>
      <p className="text-[13px] text-[#666] leading-relaxed mb-2.5 line-clamp-3">{summary}</p>
      <Link
        href={`/articles/${slug}`}
        className="text-[13px] font-semibold text-[#FF6200]"
      >
        자세히 보기 →
      </Link>
    </article>
  )
}
