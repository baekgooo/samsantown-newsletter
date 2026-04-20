import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createServiceSupabase, getPetitionById, updatePetitionEmailStatus } from '@/lib/petition'
import { PetitionDocument } from '@/lib/petition-pdf'
import { sendManagementEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceSupabase()
  const { data: { user } } = await serviceClient.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const petition = await getPetitionById(params.id, serviceClient)
  if (!petition) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const pdfBuffer = await renderToBuffer(
      React.createElement(PetitionDocument, {
        formType: petition.form_type,
        petitionDate: petition.petition_date,
        meetingDate: petition.meeting_date,
        meetingTime: petition.meeting_time,
        applicants: petition.applicants,
      }) as any
    )
    await sendManagementEmail({
      formType: petition.form_type,
      petitionDate: petition.petition_date,
      applicants: petition.applicants,
      pdfBuffer,
    })
    await updatePetitionEmailStatus(params.id, { email_sent: true, email_error: undefined }, serviceClient)
    return NextResponse.json({ success: true })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'unknown'
    await updatePetitionEmailStatus(params.id, { email_sent: false, email_error: errorMsg }, serviceClient)
      .catch(() => {})
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
