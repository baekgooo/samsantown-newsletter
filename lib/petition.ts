import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type FormType = 'election' | 'board'

export interface Applicant {
  unit: string   // 예: "104-506"
  name: string
  phone: string  // 예: "010-1234-5678"
}

export interface Petition {
  id: string
  form_type: FormType
  petition_date: string
  meeting_date: string
  meeting_time: string
  applicants: Applicant[]
  email: string | null
  email_sent: boolean
  email_error: string | null
  ip_address: string | null
  created_at: string
}

export interface CreatePetitionInput {
  form_type: FormType
  petition_date: string
  meeting_date: string
  meeting_time: string
  applicants: Applicant[]
  email?: string
  ip_address?: string
}

export function validateApplicant(applicant: Applicant): boolean {
  if (!applicant.name.trim()) return false
  if (!/^\d{3,4}-\d{3,4}$/.test(applicant.unit)) return false
  if (!/^010-\d{4}-\d{4}$/.test(applicant.phone)) return false
  return true
}

export async function isRateLimited(ip: string, client: SupabaseClient): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
  const { data, error } = await client
    .from('petitions')
    .select('id')
    .eq('ip_address', ip)
    .gte('created_at', oneMinuteAgo)
    .limit(1)
  if (error) throw new Error(error.message)
  return Array.isArray(data) && data.length > 0
}

export function createAnonSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function createPetition(
  input: CreatePetitionInput,
  client: SupabaseClient
): Promise<Petition> {
  const { data, error } = await client
    .from('petitions')
    .insert(input)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updatePetitionEmailStatus(
  id: string,
  update: { email_sent: boolean; email_error?: string },
  client: SupabaseClient
): Promise<void> {
  const { error } = await client
    .from('petitions')
    .update(update)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getAllPetitions(client: SupabaseClient): Promise<Petition[]> {
  const { data, error } = await client
    .from('petitions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPetitionById(id: string, client: SupabaseClient): Promise<Petition | null> {
  const { data, error } = await client
    .from('petitions')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}
