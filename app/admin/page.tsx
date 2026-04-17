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
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-[#111]">기사 관리</h1>
        <div className="flex gap-3">
          <Link href="/admin/articles/new"
            className="px-4 py-2 bg-[#FF6200] text-white text-sm font-bold rounded-lg">
            + 새 기사 쓰기
          </Link>
          <button onClick={handleLogout}
            className="px-4 py-2 border border-[#ddd] text-sm text-[#666] rounded-lg">
            로그아웃
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-[#aaa] py-10">불러오는 중...</p>
      ) : articles.length === 0 ? (
        <p className="text-center text-[#aaa] py-10">기사가 없어요.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#eee] text-left text-[#888]">
              <th className="pb-3 font-medium">제목</th>
              <th className="pb-3 font-medium w-20">카테고리</th>
              <th className="pb-3 font-medium w-20">상태</th>
              <th className="pb-3 font-medium w-24">발행일</th>
              <th className="pb-3 font-medium w-16">조회수</th>
              <th className="pb-3 font-medium w-32">관리</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} className="border-b border-[#f5f5f5]">
                <td className="py-3 pr-4 text-[#111] font-medium">{article.title}</td>
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
                  <div className="flex gap-2">
                    <Link href={`/admin/articles/${article.id}`}
                      className="px-2 py-1 border border-[#ddd] rounded text-xs text-[#444] hover:bg-[#f5f5f5]">
                      수정
                    </Link>
                    <button onClick={() => togglePublish(article)}
                      className="px-2 py-1 border border-[#ddd] rounded text-xs text-[#444] hover:bg-[#f5f5f5]">
                      {article.is_published ? '취소' : '발행'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
