import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase, getAllPetitions } from '@/lib/petition'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceSupabase()
  const { data: { user } } = await serviceClient.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const petitions = await getAllPetitions(serviceClient)
  return NextResponse.json(petitions)
}
