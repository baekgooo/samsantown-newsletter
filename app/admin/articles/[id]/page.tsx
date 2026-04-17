'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getArticleById } from '@/lib/supabase'
import type { Article } from '@/lib/supabase'
import ArticleForm from '@/components/admin/ArticleForm'

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getArticleById(id).then(setArticle).finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="p-8 text-[#aaa]">불러오는 중...</p>
  if (!article) return <p className="p-8 text-red-500">기사를 찾을 수 없어요.</p>

  return <ArticleForm article={article} />
}
