import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import {
  validateApplicant, isRateLimited,
  createServiceSupabase,
  createPetition, updatePetitionEmailStatus,
  type FormType,
} from '@/lib/petition'
import { PetitionDocument } from '@/lib/petition-pdf'
import { sendManagementEmail, sendApplicantEmail } from '@/lib/email'
import { sendTelegramAlert, buildFailureAlert } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { form_type, petition_date, meeting_date, meeting_time, applicants, email } = body

  if (!form_type || !petition_date || !meeting_date || !meeting_time) {
    return NextResponse.json({ error: '필수 항목이 누락됐어요.' }, { status: 400 })
  }
  if (form_type !== 'election' && form_type !== 'board') {
    return NextResponse.json({ error: '올바르지 않은 양식 유형이에요.' }, { status: 400 })
  }
  if (!Array.isArray(applicants) || applicants.length === 0) {
    return NextResponse.json({ error: '신청자를 1명 이상 입력해주세요.' }, { status: 400 })
  }
  if (applicants.length > 6) {
    return NextResponse.json({ error: '신청자는 최대 6명까지 가능해요.' }, { status: 400 })
  }
  if (!applicants.every(validateApplicant)) {
    return NextResponse.json({ error: '신청자 정보를 올바르게 입력해주세요.' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const serviceClient = createServiceSupabase()

  if (await isRateLimited(ip, serviceClient)) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const petition = await createPetition(
    { form_type: form_type as FormType, petition_date, meeting_date, meeting_time, applicants, email, ip_address: ip },
    serviceClient
  )

  let emailSent = false
  try {
    const pdfBuffer = await renderToBuffer(
      React.createElement(PetitionDocument, {
        formType: form_type,
        petitionDate: petition_date,
        meetingDate: meeting_date,
        meetingTime: meeting_time,
        applicants: applicants,
      }) as React.ReactElement
    )

    await sendManagementEmail({ formType: form_type, petitionDate: petition_date, applicants, pdfBuffer })
    emailSent = true
    await updatePetitionEmailStatus(petition.id, { email_sent: true }, serviceClient)

    if (email) {
      try {
        await sendApplicantEmail({ to: email, pdfBuffer })
      } catch {
        // applicant email failure is silent
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'unknown error'
    await updatePetitionEmailStatus(petition.id, { email_sent: false, email_error: errorMsg }, serviceClient)
    await sendTelegramAlert(buildFailureAlert(form_type, applicants))
  }

  return NextResponse.json({ id: petition.id, email_sent: emailSent })
}
