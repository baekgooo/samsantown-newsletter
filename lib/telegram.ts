export async function sendTelegramAlert(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    })
  } catch {
    // 알림 실패는 조용히 처리 — 메인 플로우를 막지 않음
  }
}

export function buildFailureAlert(formType: 'election' | 'board', applicants: Array<{ name: string; unit: string }>): string {
  const typeLabel = formType === 'election' ? '선관위' : '입대위'
  if (!applicants.length) return `📋 방청신청 이메일 발송 실패 - ${typeLabel} / (신청자 정보 없음)`
  const first = applicants[0]
  const extra = applicants.length > 1 ? ` 외 ${applicants.length - 1}명` : ''
  return `📋 방청신청 이메일 발송 실패 - ${typeLabel} / ${first.name}${extra} (${first.unit})`
}
