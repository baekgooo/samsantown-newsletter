'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, getAllArticles, updateArticle } from '@/lib/supabase'
import type { Article } from '@/lib/supabase'

export default function AdminPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllArticles().then(setArticles).finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  async function togglePublish(article: Article) {
    await updateArticle(article.id, { is_published: !article.is_published })
    setArticles((prev) =>
      prev.map((a) => a.id === article.id ? { ...a, is_published: !a.is_published } : a)
    )
  }

  function formatDate(iso: string | null) {
    if (!iso) return '-'
    return new Date(iso).toLocaleDateString('ko-KR')
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-[#111]">기사 관리</h1>
        <div className="flex gap-2">
          <Link href="/admin/articles/new"
            className="px-3 py-2 bg-[#FF6200] text-white text-sm font-bold rounded-lg">
            + 새 기사
          </Link>
          <button onClick={handleLogout}
            className="px-3 py-2 border border-[#ddd] text-sm text-[#666] rounded-lg">
            로그아웃
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-[#aaa] py-10">불러오는 중...</p>
      ) : articles.length === 0 ? (
        <p className="text-center text-[#aaa] py-10">기사가 없어요.</p>
      ) : (
        <>
          {/* 데스크탑 테이블 */}
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#eee] text-left text-[#888]">
                  <th className="pb-3 font-medium">제목</th>
                  <th className="pb-3 font-medium w-20">카테고리</th>
                  <th className="pb-3 font-medium w-20">상태</th>
                  <th className="pb-3 font-medium w-24">발행일</th>
                  <th className="pb-3 font-medium w-16">조회수</th>
                  <th className="pb-3 font-medium w-36">관리</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className="border-b border-[#f5f5f5]">
                    <td className="py-3 pr-4">
                      <Link href={`/articles/${article.slug}`} target="_blank"
                        className="text-[#111] font-medium hover:text-[#FF6200]">
                        {article.title}
                      </Link>
                    </td>
                    <td className="py-3 text-[#666]">{article.category}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        article.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {article.is_published ? '발행중' : '미발행'}
                      </span>
                    </td>
                    <td className="py-3 text-[#888]">{formatDate(article.published_at)}</td>
                    <td className="py-3 text-[#888]">{article.view_count}</td>
                    <td className="py-3">
                      <div className="flex gap-1.5">
                        <Link href={`/admin/articles/${article.id}`}
                          className="px-2 py-1 border border-[#ddd] rounded text-xs text-[#444] hover:bg-[#f5f5f5]">
                          수정
                        </Link>
                        <button onClick={() => togglePublish(article)}
                          className="px-2 py-1 border border-[#ddd] rounded text-xs text-[#444] hover:bg-[#f5f5f5]">
                          {article.is_published ? '발행취소' : '발행'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 */}
          <div className="sm:hidden space-y-3">
            {articles.map((article) => (
              <div key={article.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link href={`/articles/${article.slug}`} target="_blank"
                    className="text-[#111] font-medium text-sm leading-snug hover:text-[#FF6200]">
                    {article.title}
                  </Link>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                    article.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {article.is_published ? '발행중' : '미발행'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#aaa] mb-3">
                  <span>{article.category}</span>
                  <span>·</span>
                  <span>{formatDate(article.published_at)}</span>
                  <span>·</span>
                  <span>조회 {article.view_count}</span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/articles/${article.id}`}
                    className="px-3 py-1.5 border border-[#ddd] rounded-lg text-xs text-[#444]">
                    수정
                  </Link>
                  <button onClick={() => togglePublish(article)}
                    className="px-3 py-1.5 border border-[#ddd] rounded-lg text-xs text-[#444]">
                    {article.is_published ? '발행취소' : '발행'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
