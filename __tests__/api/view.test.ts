/**
 * @jest-environment node
 */
import { POST } from '@/app/api/view/[slug]/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn().mockResolvedValue({ error: null }),
  },
}))

import { supabase } from '@/lib/supabase'

describe('POST /api/view/[slug]', () => {
  it('정상 요청 시 200을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/view/test-slug')
    const res = await POST(req, { params: { slug: 'test-slug' } })
    expect(res.status).toBe(200)
  })

  it('increment_view_count RPC를 호출한다', async () => {
    const req = new NextRequest('http://localhost/api/view/test-slug')
    await POST(req, { params: { slug: 'test-slug' } })
    expect(supabase.rpc).toHaveBeenCalledWith('increment_view_count', {
      article_slug: 'test-slug',
    })
  })
})
