import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = decodeURIComponent(params.slug)
  await supabase.rpc('increment_view_count', { article_slug: slug })
  return NextResponse.json({ ok: true })
}
