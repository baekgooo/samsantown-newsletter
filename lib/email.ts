import nodemailer from 'nodemailer'
import type { Applicant, FormType } from './petition'

function createTransport() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Missing email configuration: GMAIL_USER or GMAIL_APP_PASSWORD not set')
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

function getTypeLabel(formType: FormType): string {
  return formType === 'election' ? '선관위' : '입대위'
}

function buildManagementSubject(formType: FormType, petitionDate: string, applicants: Applicant[]): string {
  const typeLabel = getTypeLabel(formType)
  const first = applicants[0]
  const extra = applicants.length > 1 ? ` 외 ${applicants.length - 1}명` : ''
  return `[방청신청] ${typeLabel} 방청신청서 접수 - ${first.name}${extra} (${petitionDate})`
}

export async function sendManagementEmail(params: {
  formType: FormType
  petitionDate: string
  applicants: Applicant[]
  pdfBuffer: Buffer
}): Promise<void> {
  const { formType, petitionDate, applicants, pdfBuffer } = params
  const typeLabel = getTypeLabel(formType)
  const transport = createTransport()

  await transport.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.MANAGEMENT_EMAIL,
    subject: buildManagementSubject(formType, petitionDate, applicants),
    text: [
      '첨부된 방청신청서를 확인해주세요.',
      '작성내용에 문제가 있을 경우, 신청자 연락처로 연락하시기 바랍니다.',
      '본 이메일로 답신할 경우 확인할 수 없습니다.',
    ].join('\n'),
    attachments: [{
      filename: `${typeLabel}_방청신청서_${petitionDate}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  })
}

export async function sendApplicantEmail(params: {
  to: string
  pdfBuffer: Buffer
}): Promise<void> {
  const { to, pdfBuffer } = params
  const transport = createTransport()

  await transport.sendMail({
    from: `삼산타운1차 소식지 <${process.env.GMAIL_USER}>`,
    to,
    subject: '[삼산타운1차 소식지] 방청신청서 제출 완료 안내',
    text: [
      '안녕하세요.',
      `방청신청서가 관리소(${process.env.MANAGEMENT_EMAIL})로 발송됐어요.`,
      '',
      `수신 여부는 관리소(${process.env.MANAGEMENT_PHONE})에 직접 확인해주세요.`,
      '의도치 않은 오류로 발송이 실패할 수 있으니 꼭 확인 부탁드려요.',
      '',
      '신청서 사본은 첨부 파일을 확인해주세요.',
    ].join('\n'),
    attachments: [{
      filename: '방청신청서.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  })
}
