/**
 * @jest-environment node
 */

const mockSendMail = jest.fn()
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}))

import { sendManagementEmail, sendApplicantEmail } from '@/lib/email'

describe('sendManagementEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GMAIL_USER = 'test@gmail.com'
    process.env.GMAIL_APP_PASSWORD = 'test-password'
    process.env.MANAGEMENT_EMAIL = 'white_soo@naver.com'
  })

  it('관리소 이메일을 올바른 수신자로 발송한다', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'test-id' })
    const pdfBuffer = Buffer.from('fake-pdf')
    await sendManagementEmail({
      formType: 'election',
      petitionDate: '2026-04-17',
      applicants: [{ unit: '104-506', name: '홍길동', phone: '010-1234-5678' }],
      pdfBuffer,
    })
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'white_soo@naver.com' })
    )
  })

  it('발송 실패 시 예외를 던진다', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'))
    await expect(
      sendManagementEmail({
        formType: 'election',
        petitionDate: '2026-04-17',
        applicants: [{ unit: '104-506', name: '홍길동', phone: '010-1234-5678' }],
        pdfBuffer: Buffer.from(''),
      })
    ).rejects.toThrow('SMTP error')
  })
})

describe('sendApplicantEmail', () => {
  it('신청자 이메일을 올바른 수신자로 발송한다', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'test-id' })
    await sendApplicantEmail({
      to: 'applicant@example.com',
      pdfBuffer: Buffer.from('fake-pdf'),
    })
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'applicant@example.com' })
    )
  })
})
