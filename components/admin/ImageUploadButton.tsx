'use client'

import { type Editor } from '@tiptap/react'
import { supabase } from '@/lib/supabase'

interface Props {
  editor: Editor
}

export default function ImageUploadButton({ editor }: Props) {
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('article-images')
      .upload(fileName, file)

    if (error) {
      alert('이미지 업로드 실패: ' + error.message)
      return
    }

    const { data } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName)

    editor.chain().focus().setImage({ src: data.publicUrl }).run()
  }

  return (
    <label className="cursor-pointer px-2 py-1 rounded text-sm hover:bg-[#f0f0f0]" title="이미지">
      🖼
      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </label>
  )
}
