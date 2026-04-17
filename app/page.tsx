import { getPublishedArticles } from '@/lib/supabase'
import Header from '@/components/Header'
import ArticleCard from '@/components/ArticleCard'
import IssueReportButton from '@/components/IssueReportButton'
import Footer from '@/components/Footer'

export const revalidate = 60

export default async function HomePage() {
  const articles = await getPublishedArticles()
  return (
    <main className="max-w-[480px] mx-auto">
      <Header />
      <section>
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            slug={article.slug}
            title={article.title}
            summary={article.summary}
            published_at={article.published_at}
            category={article.category}
          />
        ))}
        {articles.length === 0 && (
          <p className="px-5 py-10 text-center text-[#aaa] text-sm">
            준비 중인 기사가 곧 발행될 예정이에요.
          </p>
        )}
      </section>
      <IssueReportButton />
      <Footer />
    </main>
  )
}
