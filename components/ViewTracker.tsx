'use client'

import { useEffect } from 'react'

interface Props {
  slug: string
}

export default function ViewTracker({ slug }: Props) {
  useEffect(() => {
    fetch(`/api/view/${encodeURIComponent(slug)}`, { method: 'POST' })
  }, [slug])

  return null
}
