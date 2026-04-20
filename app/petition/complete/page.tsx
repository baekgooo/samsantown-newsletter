'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { PetitionDocument, type PetitionDocumentProps } from '@/lib/petition-pdf'
import Link from 'next/link'

function PetitionCompleteContent() {
  const searchParams = useSearchParams()
  const sent = searchParams.get('sent') === 'true'
  const [petitionData, setPetitionData] = useState<PetitionDocumentProps | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('petition_data')
    if (stored) {
      setPetitionData(JSON.parse(stored))
      sessionStorage.removeItem('petition_data')
    }
  }, [])

  const phone = process.env.NEXT_PUBLIC_MANAGEMENT_PHONE ?? '032-512-9085'
  const managementEmail = process.env.NEXT_PUBLIC_MANAGEMENT_EMAIL ?? 'white_soo@naver.com'

  return (
    <div className="max-w-lg mx-auto p-6 pt-12 space-y-6">
      <div className={`rounded-xl p-5 ${sent ? 'bg-green-50' : 'bg-red-50'}`}>
        <p className={`font-bold mb-2 ${sent ? 'text-green-700' : 'text-red-600'}`}>
          {sent ? '✅ 제출 완료' : '❌ 발송 실패'}
        </p>
        <p className="text-sm text-[#444] leading-relaxed">
          {sent
            ? `관리소로 신청서가 발송됐어요. 관리소(${phone})에 수신여부를 꼭 확인해주세요. 의도치않은 오류 발생시 발송이 실패할 수도 있어요.`
            : `발송에 실패했어요. 아래 PDF를 직접 관리소 이메일(${managementEmail})로 보내주세요.`
          }
        </p>
      </div>

      {petitionData ? (
        <PDFDownloadLink
          document={<PetitionDocument {...petitionData} />}
          fileName="방청신청서.pdf"
          className="block w-full py-3 bg-[#111] text-white font-bold rounded-xl text-center"
        >
          {({ loading }) => loading ? 'PDF 준비 중...' : 'PDF 다운로드'}
        </PDFDownloadLink>
      ) : (
        <p className="text-sm text-[#aaa] text-center">
          페이지를 새로고침하면 PDF 다운로드가 불가해요.
        </p>
      )}

      <Link href="/" className="block text-center text-sm text-[#888] underline">
        홈으로 돌아가기
      </Link>
    </div>
  )
}

export default function PetitionCompletePage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto p-6 pt-12">로딩 중...</div>}>
      <PetitionCompleteContent />
    </Suspense>
  )
}
