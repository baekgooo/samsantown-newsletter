'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FormType, Applicant } from '@/lib/petition'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDateWithDay(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return `${DAYS[d.getDay()]}요일`
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

const emptyApplicant = (): Applicant => ({ unit: '', name: '', phone: '' })

export default function PetitionForm({ formType }: { formType: FormType }) {
  const router = useRouter()
  const [petitionDate, setPetitionDate] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [applicants, setApplicants] = useState<Applicant[]>([emptyApplicant()])
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function updateApplicant(index: number, field: keyof Applicant, value: string) {
    setApplicants(prev => prev.map((a, i) =>
      i === index ? { ...a, [field]: field === 'phone' ? formatPhone(value) : value } : a
    ))
  }

  function addApplicant() {
    if (applicants.length < 6) setApplicants(prev => [...prev, emptyApplicant()])
  }

  function removeApplicant(index: number) {
    if (applicants.length > 1) setApplicants(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/petition/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: formType,
          petition_date: petitionDate,
          meeting_date: meetingDate,
          meeting_time: meetingTime,
          applicants,
          email: email || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? '제출에 실패했어요. 다시 시도해주세요.')
        return
      }

      sessionStorage.setItem('petition_data', JSON.stringify({
        formType,
        petitionDate,
        meetingDate,
        meetingTime,
        applicants,
      }))

      router.push(`/petition/complete?id=${data.id}&sent=${data.email_sent}`)
    } catch {
      setError('네트워크 오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const typeLabel = formType === 'election' ? '선거관리위원회' : '입주자대표회의'

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-lg font-bold text-[#111]">{typeLabel} 방청신청서</h1>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[#333]">신청일자</label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            required
            value={petitionDate}
            onChange={e => setPetitionDate(e.target.value)}
            className="flex-1 border border-[#ddd] rounded-lg px-3 py-2 text-sm"
          />
          {petitionDate && (
            <span className="text-sm text-[#666]">{formatDateWithDay(petitionDate)}</span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[#333]">회의 개최 일자 및 시간</label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            required
            value={meetingDate}
            onChange={e => setMeetingDate(e.target.value)}
            className="flex-1 border border-[#ddd] rounded-lg px-3 py-2 text-sm"
          />
          {meetingDate && (
            <span className="text-sm text-[#666]">{formatDateWithDay(meetingDate)}</span>
          )}
          <input
            type="time"
            required
            value={meetingTime}
            onChange={e => setMeetingTime(e.target.value)}
            className="w-28 border border-[#ddd] rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#333]">신청자</label>
        {applicants.map((a, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="104-506"
                required
                value={a.unit}
                onChange={e => updateApplicant(i, 'unit', e.target.value)}
                className="border border-[#ddd] rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="성명"
                required
                value={a.name}
                onChange={e => updateApplicant(i, 'name', e.target.value)}
                className="border border-[#ddd] rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="tel"
                placeholder="010-0000-0000"
                required
                value={a.phone}
                onChange={e => updateApplicant(i, 'phone', e.target.value)}
                className="border border-[#ddd] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {applicants.length > 1 && (
              <button
                type="button"
                onClick={() => removeApplicant(i)}
                className="text-[#aaa] hover:text-red-400 text-sm px-1 pt-2"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addApplicant}
          disabled={applicants.length >= 6}
          className="text-sm text-[#FF6200] disabled:text-[#ccc]"
        >
          + 신청자 추가
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[#333]">
          이메일 <span className="text-[#aaa] font-normal">(선택)</span>
        </label>
        <input
          type="email"
          placeholder="PDF 사본을 받으려면 입력하세요"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <p className="text-xs text-[#888] leading-relaxed bg-[#f8f8f8] rounded-lg p-3">
        입력하신 정보는 발송관리를 위해 저장돼요. 사이트 관리자만 조회할 수 있으며, 입력하신 정보는 발송여부 확인목적 외에 이용되지 않아요. 정보는 발송 확인 후 6개월 이내 삭제됩니다. 동의하실 경우 아래 버튼을 클릭해주세요.
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-[#FF6200] text-white font-bold rounded-xl disabled:opacity-50"
      >
        {submitting ? '제출 중...' : '신청서 제출'}
      </button>
    </form>
  )
}
