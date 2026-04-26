/**
 * @jest-environment node
 */
import { sendTelegramAlert, buildReportAlert } from '@/lib/telegram'

global.fetch = jest.fn()

describe('sendTelegramAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'
    process.env.TELEGRAM_CHAT_ID = '12345'
  })

  it('Telegram API를 올바른 URL과 body로 호출한다', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    await sendTelegramAlert('테스트 메시지')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ chat_id: '12345', text: '테스트 메시지' }),
      })
    )
  })

  it('fetch 실패 시 예외를 던지지 않는다 (조용히 처리)', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network error'))
    await expect(sendTelegramAlert('메시지')).resolves.not.toThrow()
  })
})

describe('buildReportAlert', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('NEXT_PUBLIC_SITE_URL이 있으면 링크를 포함한다', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
    const msg = buildReportAlert()
    expect(msg).toContain('📬')
    expect(msg).toContain('https://example.com/admin/reports')
  })

  it('NEXT_PUBLIC_SITE_URL이 없으면 링크 없이 반환한다', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    const msg = buildReportAlert()
    expect(msg).toContain('📬')
    expect(msg).not.toContain('http')
  })
})
