/**
 * @jest-environment node
 */
import { POST } from '@/app/api/report/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase', () => ({
  submitReport: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/telegram', () => ({
  sendTelegramAlert: jest.fn().mockResolvedValue(undefined),
  buildReportAlert: jest.fn().mockReturnValue('📬 새 제보가 왔어요!'),
}))

import { submitReport } from '@/lib/supabase'
import { sendTelegramAlert, buildReportAlert } from '@/lib/telegram'

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/report', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/report', () => {
  beforeEach(() => jest.clearAllMocks())

  it('정상 요청 시 200을 반환한다', async () => {
    const res = await POST(makeReq({ content: '테스트 제보' }))
    expect(res.status).toBe(200)
  })

  it('content가 없으면 400을 반환한다', async () => {
    const res = await POST(makeReq({ name: '홍길동' }))
    expect(res.status).toBe(400)
  })

  it('content가 공백만 있으면 400을 반환한다', async () => {
    const res = await POST(makeReq({ content: '   ' }))
    expect(res.status).toBe(400)
  })

  it('유효하지 않은 JSON이면 400을 반환한다', async () => {
    const res = await POST(makeReq('not-json'))
    expect(res.status).toBe(400)
  })

  it('submitReport가 실패하면 500을 반환한다', async () => {
    ;(submitReport as jest.Mock).mockRejectedValueOnce(new Error('DB error'))
    const res = await POST(makeReq({ content: '테스트' }))
    expect(res.status).toBe(500)
  })

  it('DB 저장 후 Telegram 알림을 발송한다', async () => {
    await POST(makeReq({ content: '테스트 제보' }))
    expect(submitReport).toHaveBeenCalledWith({ content: '테스트 제보' })
    expect(buildReportAlert).toHaveBeenCalled()
    expect(sendTelegramAlert).toHaveBeenCalledWith('📬 새 제보가 왔어요!')
  })

  it('name·contact도 함께 전달된다', async () => {
    await POST(makeReq({ name: '홍길동', contact: '010-1234-5678', content: '테스트' }))
    expect(submitReport).toHaveBeenCalledWith({
      name: '홍길동',
      contact: '010-1234-5678',
      content: '테스트',
    })
  })

  it('Telegram 알림이 실패해도 200을 반환한다', async () => {
    ;(sendTelegramAlert as jest.Mock).mockRejectedValueOnce(new Error('telegram error'))
    const res = await POST(makeReq({ content: '테스트' }))
    expect(res.status).toBe(200)
  })
})
