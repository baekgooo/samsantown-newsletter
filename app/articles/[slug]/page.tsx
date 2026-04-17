import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getArticleBySlug, getPublishedArticles } from '@/lib/supabase'
import ArticleContent from '@/components/ArticleContent'
import IssueReportButton from '@/components/IssueReportButton'
import ViewTracker from '@/components/ViewTracker'

export const revalidate = 60

export async function generateStaticParams() {
  const articles = await getPublishedArticles()
  return articles.map((a) => ({ slug: a.slug }))
}

function formatDate(isoString: string | null): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

interface Props {
  params: { slug: string }
}

export default async function ArticlePage({ params }: Props) {
  const slug = decodeURIComponent(params.slug)
  const article = await getArticleBySlug(slug)

  if (!article) notFound()

  const formUrl = process.env.GOOGLE_FORM_URL ?? ''

  return (
    <main className="max-w-[480px] mx-auto">
      <div className="px-5 pt-4 pb-2">
        <Link href="/" className="text-[13px] text-[#888]">← 목록으로</Link>
      </div>
      <div className="px-5 pt-2">
        <h1 className="text-[20px] font-bold text-[#111] leading-snug mb-2">
          {article.title}
        </h1>
        <p className="text-[11px] text-[#aaa]">
          {formatDate(article.published_at)}
          {article.updated_at !== article.published_at && (
            <span> · 업데이트 {formatDate(article.updated_at)}</span>
          )}
        </p>
      </div>
      <ArticleContent content={article.content} />
      <IssueReportButton formUrl={formUrl} />
      <footer className="px-5 py-4 text-center text-[11px] text-[#ccc]">
        삼산타운1차 입주민 소식지 · 비공식
      </footer>
      <ViewTracker slug={slug} />
    </main>
  )
}
