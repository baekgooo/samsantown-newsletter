'use client'

import { useState } from 'react'
import Link from 'next/link'
import { submitReport } from '@/lib/supabase'

export default function ReportPage() {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await submitReport({
        name: name.trim() || undefined,
        contact: contact.trim() || undefined,
        content,
      })
      setDone(true)
    } catch {
      setError('제출 중 오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm'

  if (done) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen flex flex-col items-center justify-center px-5">
        <div className="text-center">
          <p className="text-4xl mb-4">📬</p>
          <h2 className="text-lg font-bold text-[#111] mb-2">제보가 접수됐어요!</h2>
          <p className="text-sm text-[#666] mb-6">소중한 제보 감사해요. 검토 후 반영할게요.</p>
          <Link href="/" className="text-sm text-[#FF6200] font-semibold">← 홈으로 돌아가기</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen">
      <div className="px-5 pt-5 pb-2 border-b border-[#ebebeb]">
        <Link href="/" className="text-[13px] text-[#888]">← 돌아가기</Link>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-6 space-y-4">
        <div>
          <h1 className="text-[18px] font-bold text-[#111] mb-1">이슈 제보하기</h1>
          <p className="text-[13px] text-[#888]">단지 내 문제를 알려주세요. 이름과 연락처는 선택사항이에요.</p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-[#444] mb-1">
            이름 <span className="text-[#aaa] font-normal">(선택)</span>
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className={inputClass} placeholder="홍길동" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#444] mb-1">
            연락처 <span className="text-[#aaa] font-normal">(선택)</span>
          </label>
          <input value={contact} onChange={(e) => setContact(e.target.value)}
            className={inputClass} placeholder="010-0000-0000 또는 이메일" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#444] mb-1">
            제보 내용 <span className="text-[#FF6200]">*</span>
          </label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            rows={6} required
            className={`${inputClass} resize-none`}
            placeholder="어떤 문제인지 자세히 알려주세요." />
        </div>

        <button type="submit" disabled={loading || !content.trim()}
          className="w-full py-3.5 bg-[#111] text-white text-[14px] font-bold rounded-lg disabled:opacity-50">
          {loading ? '제출 중...' : '제보하기'}
        </button>
      </form>
    </div>
  )
}
