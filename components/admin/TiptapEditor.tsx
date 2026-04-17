'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import ImageUploadButton from './ImageUploadButton'

interface Props {
  content: string
  onChange: (html: string) => void
}

const COLORS = ['#111111', '#FF6200', '#e53e3e', '#2b6cb0', '#276749', '#888888']

export default function TiptapEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  function setLink() {
    const url = window.prompt('URL을 입력하세요:')
    if (!url) return
    editor.chain().focus().setLink({ href: url, target: '_blank' }).run()
  }

  function insertToggle() {
    editor.chain().focus().insertContent(
      '<details><summary>제목을 입력하세요</summary><p>내용을 입력하세요</p></details>'
    ).run()
  }

  const btn = (active: boolean) =>
    `px-2 py-1 rounded text-sm hover:bg-[#f0f0f0] ${active ? 'bg-[#eee]' : ''}`

  return (
    <div className="border border-[#ddd] rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 border-b border-[#eee] bg-[#fafafa]">

        {/* 텍스트 스타일 */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive('bold'))}><strong>B</strong></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive('italic'))}><em>I</em></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btn(editor.isActive('underline'))}><u>U</u></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btn(editor.isActive('strike'))}><s>S</s></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={btn(editor.isActive('highlight'))} title="형광펜">🖊</button>

        <span className="w-px bg-[#ddd] mx-1" />

        {/* 제목 */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(editor.isActive('heading', { level: 2 }))}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btn(editor.isActive('heading', { level: 3 }))}>H3</button>

        <span className="w-px bg-[#ddd] mx-1" />

        {/* 정렬 */}
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={btn(editor.isActive({ textAlign: 'left' }))} title="왼쪽">≡</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={btn(editor.isActive({ textAlign: 'center' }))} title="가운데">☰</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={btn(editor.isActive({ textAlign: 'right' }))} title="오른쪽">⇒</button>

        <span className="w-px bg-[#ddd] mx-1" />

        {/* 컬러 */}
        {COLORS.map((color) => (
          <button key={color} type="button"
            onClick={() => editor.chain().focus().setColor(color).run()}
            className="w-6 h-6 rounded border border-[#ddd] hover:scale-110 transition-transform"
            style={{ backgroundColor: color }} title={color} />
        ))}

        <span className="w-px bg-[#ddd] mx-1" />

        {/* 링크 / 이미지 / 토글 */}
        <button type="button" onClick={setLink}
          className={btn(editor.isActive('link'))}>🔗</button>
        <ImageUploadButton editor={editor} />
        <button type="button" onClick={insertToggle}
          className="px-2 py-1 rounded text-sm hover:bg-[#f0f0f0]" title="토글">▶ 토글</button>

        <span className="w-px bg-[#ddd] mx-1" />

        {/* 목록 / 인용 / 구분선 */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive('bulletList'))}>• 목록</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive('orderedList'))}>1. 목록</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btn(editor.isActive('blockquote'))} title="인용구">&ldquo; 인용</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-2 py-1 rounded text-sm hover:bg-[#f0f0f0]" title="구분선">— 구분</button>

      </div>

      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[400px]"
      />
    </div>
  )
}
