'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TiptapEditor from './TiptapEditor'
import { createArticle, updateArticle } from '@/lib/supabase'
import type { Article } from '@/lib/supabase'

interface Props {
  article?: Article
}

function generateSlug(title: string): string {
  return title.trim().replace(/\s+/g, '-').replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ-]/g, '')
}

export default function ArticleForm({ article }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(article?.title ?? '')
  const [slug, setSlug] = useState(article?.slug ?? '')
  const [summary, setSummary] = useState(article?.summary ?? '')
  const [category, setCategory] = useState(article?.category ?? '')
  const [content, setContent] = useState(article?.content ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSlug, setShowSlug] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!article) setSlug(generateSlug(value))
  }

  async function handleSubmit(isPublished: boolean) {
    setLoading(true)
    setError('')
    try {
      if (article) {
        await updateArticle(article.id, { title, slug, summary, content, category, is_published: isPublished })
      } else {
        await createArticle({ title, slug, summary, content, category, is_published: isPublished })
      }
      router.push('/admin')
      router.refresh()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '오류가 발생했어요.'
      setError(message.includes('slug') ? '이미 사용 중인 slug예요.' : message)
      setLoading(false)
    }
  }

  const inputClass = 'w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm'

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8">
      <h1 className="text-xl font-bold text-[#111] mb-6">
        {article ? '기사 수정' : '새 기사 쓰기'}
      </h1>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#444] mb-1">제목</label>
          <input value={title} onChange={(e) => handleTitleChange(e.target.value)}
            className={inputClass} placeholder="기사 제목" required />
          {slug && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-[#aaa]">URL: /articles/{slug}</span>
              <button type="button" onClick={() => setShowSlug(!showSlug)}
                className="text-xs text-[#FF6200] hover:underline">
                {showSlug ? '닫기' : '수정'}
              </button>
            </div>
          )}
          {showSlug && (
            <input value={slug} onChange={(e) => setSlug(e.target.value)}
              className={`${inputClass} font-mono mt-2`} placeholder="url-slug" />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#444] mb-1">한 줄 요약</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)}
            rows={2} className={`${inputClass} resize-none`}
            placeholder="홈화면에 표시될 한 줄 요약" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#444] mb-1">카테고리</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)}
            className={inputClass} placeholder="예: 변압기, 주차차단기" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#444] mb-1">본문</label>
          <TiptapEditor content={content} onChange={setContent} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <button type="button" onClick={() => router.back()} disabled={loading}
          className="px-4 py-2.5 border border-[#ddd] rounded-lg text-sm text-[#444] hover:bg-[#f5f5f5] disabled:opacity-50">
          취소
        </button>
        <button type="button" onClick={() => handleSubmit(false)} disabled={loading}
          className="px-4 py-2.5 border border-[#111] rounded-lg text-sm font-bold text-[#111] hover:bg-[#f5f5f5] disabled:opacity-50">
          임시저장
        </button>
        <button type="button" onClick={() => handleSubmit(true)} disabled={loading}
          className="px-4 py-2.5 bg-[#FF6200] text-white rounded-lg text-sm font-bold hover:bg-[#e05500] disabled:opacity-50">
          {article?.is_published ? '저장' : '발행하기'}
        </button>
        {article?.is_published && (
          <button type="button" onClick={() => handleSubmit(false)} disabled={loading}
            className="px-4 py-2.5 bg-[#888] text-white rounded-lg text-sm font-bold disabled:opacity-50">
            발행 취소
          </button>
        )}
      </div>
    </div>
  )
}
