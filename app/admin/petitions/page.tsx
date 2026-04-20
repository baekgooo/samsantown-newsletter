'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Petition } from '@/lib/petition'

export default function AdminPetitionsPage() {
  const [petitions, setPetitions] = useState<Petition[]>([])
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (!session) return
      const res = await fetch('/api/petition/list', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) setPetitions(await res.json())
    }
    load().finally(() => setLoading(false))
  }, [])

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function handleResend(id: string) {
    setResending(id)
    const token = await getToken()
    try {
      const res = await fetch(`/api/petition/resend/${id}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        setPetitions(prev => prev.map(p => p.id === id ? { ...p, email_sent: true, email_error: null } : p))
      } else {
        alert('재발송에 실패했어요.')
      }
    } finally {
      setResending(null)
    }
  }

  const failedCount = petitions.filter(p => !p.email_sent).length

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-[#888]">← 기사 관리</Link>
          <h1 className="text-xl font-bold text-[#111]">
            방청신청 내역
            {failedCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">
                {failedCount}
              </span>
            )}
          </h1>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-[#aaa] py-10">불러오는 중...</p>
      ) : petitions.length === 0 ? (
        <p className="text-center text-[#aaa] py-10">신청 내역이 없어요.</p>
      ) : (
        <div className="space-y-3">
          {petitions.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#f0f0f0] text-[#444] mr-2">
                    {p.form_type === 'election' ? '선관위' : '입대위'}
                  </span>
                  <span className="text-sm font-medium text-[#111]">
                    {p.applicants[0]?.name}
                    {p.applicants.length > 1 && ` 외 ${p.applicants.length - 1}명`}
                  </span>
                  <span className="text-xs text-[#aaa] ml-2">{p.applicants[0]?.unit}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  p.email_sent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {p.email_sent ? '발송완료' : '미발송'}
                </span>
              </div>

              <div className="text-xs text-[#888] mb-2">
                신청일 {p.petition_date} · 회의일 {p.meeting_date} {p.meeting_time} · 접수 {formatDateTime(p.created_at)}
              </div>

              <div className="text-xs text-[#666] space-y-0.5 mb-3">
                {p.applicants.map((a, i) => (
                  <div key={i}>{i + 1}. {a.unit} {a.name} {a.phone}</div>
                ))}
              </div>

              {p.email_error && (
                <p className="text-xs text-red-400 mb-2">오류: {p.email_error}</p>
              )}

              {!p.email_sent && (
                <button
                  onClick={() => handleResend(p.id)}
                  disabled={resending === p.id}
                  className="px-3 py-1.5 bg-[#FF6200] text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {resending === p.id ? '발송 중...' : '재발송'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
