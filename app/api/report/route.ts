import { NextRequest, NextResponse } from 'next/server'
import { submitReport } from '@/lib/supabase'
import { sendTelegramAlert, buildReportAlert } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  let body: { name?: string; contact?: string; content?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 })
  }

  const { name, contact, content } = body
  if (!content?.trim()) {
    return NextResponse.json({ error: '제보 내용을 입력해주세요.' }, { status: 400 })
  }

  try {
    await submitReport({
      name: name?.trim() || undefined,
      contact: contact?.trim() || undefined,
      content: content.trim(),
    })
  } catch {
    return NextResponse.json({ error: '저장 중 오류가 발생했어요.' }, { status: 500 })
  }

  try {
    await sendTelegramAlert(buildReportAlert())
  } catch {
    // 알림 실패는 조용히 처리 — 메인 플로우를 막지 않음
  }

  return NextResponse.json({ ok: true })
}
