/**
 * @jest-environment node
 */
import { sendTelegramAlert } from '@/lib/telegram'

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
