'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getReports, markReportRead } from '@/lib/supabase'
import type { Report } from '@/lib/supabase'

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReports().then(setReports).finally(() => setLoading(false))
  }, [])

  async function handleRead(id: string) {
    await markReportRead(id)
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, is_read: true } : r))
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const unreadCount = reports.filter((r) => !r.is_read).length

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#111]">제보 관리</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-[#FF6200] text-white text-xs font-bold rounded-full">
              새 제보 {unreadCount}
            </span>
          )}
        </div>
        <Link href="/admin" className="text-sm text-[#888] hover:text-[#111]">← 기사 관리</Link>
      </div>

      {loading ? (
        <p className="text-center text-[#aaa] py-10">불러오는 중...</p>
      ) : reports.length === 0 ? (
        <p className="text-center text-[#aaa] py-10">아직 제보가 없어요.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id}
              className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                report.is_read ? 'border-[#eee]' : 'border-[#FF6200]'
              }`}>
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="text-xs text-[#aaa]">{formatDate(report.created_at)}</div>
                {!report.is_read && (
                  <button onClick={() => handleRead(report.id)}
                    className="shrink-0 text-xs text-[#FF6200] hover:underline">
                    읽음 처리
                  </button>
                )}
              </div>

              {(report.name || report.contact) && (
                <div className="flex gap-3 text-xs text-[#666] mb-2">
                  {report.name && <span>👤 {report.name}</span>}
                  {report.contact && <span>📞 {report.contact}</span>}
                </div>
              )}

              <p className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap">
                {report.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
