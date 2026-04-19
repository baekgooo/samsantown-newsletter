/**
 * @jest-environment node
 */
import { POST } from '@/app/api/petition/submit/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/petition', () => ({
  validateApplicant: jest.fn(() => true),
  isRateLimited: jest.fn(() => false),
  createAnonSupabase: jest.fn(() => ({})),
  createServiceSupabase: jest.fn(() => ({})),
  createPetition: jest.fn(() => Promise.resolve({ id: 'test-uuid', email_sent: false })),
  updatePetitionEmailStatus: jest.fn(() => Promise.resolve()),
}))

jest.mock('@/lib/petition-pdf', () => ({
  PetitionDocument: jest.fn(() => null),
}))

jest.mock('@react-pdf/renderer', () => ({
  renderToBuffer: jest.fn(() => Promise.resolve(Buffer.from('pdf'))),
}))

jest.mock('@/lib/email', () => ({
  sendManagementEmail: jest.fn(() => Promise.resolve()),
  sendApplicantEmail: jest.fn(() => Promise.resolve()),
}))

jest.mock('@/lib/telegram', () => ({
  sendTelegramAlert: jest.fn(() => Promise.resolve()),
  buildFailureAlert: jest.fn(() => 'alert message'),
}))

const validBody = {
  form_type: 'election',
  petition_date: '2026-04-17',
  meeting_date: '2026-04-18',
  meeting_time: '19:30',
  applicants: [{ unit: '104-506', name: '홍길동', phone: '010-1234-5678' }],
}

describe('POST /api/petition/submit', () => {
  it('유효한 요청에 200을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/petition/submit', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('신청자가 없으면 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/petition/submit', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, applicants: [] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rate limit 초과 시 429를 반환한다', async () => {
    const { isRateLimited } = require('@/lib/petition')
    isRateLimited.mockResolvedValueOnce(true)
    const req = new NextRequest('http://localhost/api/petition/submit', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })
})
