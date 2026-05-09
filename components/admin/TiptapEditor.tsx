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
import { useState, useRef, useEffect } from 'react'
import ImageUploadButton from './ImageUploadButton'
import { IndentExtension } from './IndentExtension'
import { CalloutExtension } from './CalloutExtension'

interface Props {
  content: string
  onChange: (html: string) => void
}

const COLORS = [
  { color: '#111111', label: '검정' },
  { color: '#FF6200', label: '주황' },
  { color: '#e53e3e', label: '빨강' },
  { color: '#2b6cb0', label: '파랑' },
  { color: '#276749', label: '초록' },
  { color: '#888888', label: '회색' },
]

const HIGHLIGHT_COLORS = [
  { color: '#FEF08A', label: '노랑' },
  { color: '#BBF7D0', label: '초록' },
  { color: '#BFDBFE', label: '파랑' },
  { color: '#FBB6CE', label: '분홍' },
  { color: '#FED7AA', label: '주황' },
  { color: '#DDD6FE', label: '보라' },
  { color: '#A5F3FC', label: '민트' },
  { color: '#F3F4F6', label: '밝은 회색' },
]

const CALLOUT_COLORS = [
  { color: '#DBEAFE', label: '파랑' },
  { color: '#DCFCE7', label: '초록' },
  { color: '#FEF9C3', label: '노랑' },
  { color: '#FCE7F3', label: '분홍' },
  { color: '#FFEDD5', label: '주황' },
  { color: '#EDE9FE', label: '보라' },
  { color: '#CFFAFE', label: '민트' },
  { color: '#F3F4F6', label: '밝은 회색' },
]

type Picker = 'color' | 'highlight' | 'callout' | null

export default function TiptapEditor({ content, onChange }: Props) {
  const [openPicker, setOpenPicker] = useState<Picker>(null)
  const colorRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const calloutRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const refs = [colorRef, highlightRef, calloutRef]
      if (refs.every((ref) => !ref.current?.contains(e.target as Node))) {
        setOpenPicker(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      IndentExtension,
      CalloutExtension,
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
    editor!.chain().focus().setLink({ href: url, target: '_blank' }).run()
  }

  function insertToggle() {
    editor!.chain().focus().insertContent(
      '<details><summary>제목을 입력하세요</summary><p>내용을 입력하세요</p></details>'
    ).run()
  }

  function togglePicker(name: Picker) {
    setOpenPicker((prev) => (prev === name ? null : name))
  }

  const btn = (active: boolean) =>
    `px-2 py-1 rounded text-sm hover:bg-[#f0f0f0] ${active ? 'bg-[#eee]' : ''}`

  const pickerPanel = 'absolute top-full left-0 mt-1 p-2 bg-white border border-[#ddd] rounded-lg shadow-lg z-10 flex gap-1.5 flex-wrap'

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

        {/* 글씨색 */}
        <div ref={colorRef} className="relative">
          <button type="button" onClick={() => togglePicker('color')}
            className={btn(openPicker === 'color')}>
            글씨색
          </button>
          {openPicker === 'color' && (
            <div className={pickerPanel} style={{ width: '10rem' }}>
              {COLORS.map(({ color, label }) => (
                <button key={color} type="button"
                  onClick={() => { editor.chain().focus().setColor(color).run(); setOpenPicker(null) }}
                  className="w-8 h-8 rounded border border-[#ddd] hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }} title={label} />
              ))}
            </div>
          )}
        </div>

        {/* 형광펜 */}
        <div ref={highlightRef} className="relative">
          <button type="button" onClick={() => togglePicker('highlight')}
            className={btn(openPicker === 'highlight' || editor.isActive('highlight'))}>
            형광펜
          </button>
          {openPicker === 'highlight' && (
            <div className={pickerPanel} style={{ width: '13rem' }}>
              {HIGHLIGHT_COLORS.map(({ color, label }) => (
                <button key={color} type="button"
                  onClick={() => { editor.chain().focus().toggleHighlight({ color }).run(); setOpenPicker(null) }}
                  className={`w-8 h-8 rounded border hover:scale-110 transition-transform ${
                    editor.isActive('highlight', { color }) ? 'border-gray-500 ring-1 ring-gray-400' : 'border-[#ddd]'
                  }`}
                  style={{ backgroundColor: color }} title={label} />
              ))}
              <button type="button"
                onClick={() => { editor.chain().focus().unsetHighlight().run(); setOpenPicker(null) }}
                className="w-8 h-8 rounded border border-[#ddd] hover:bg-[#f0f0f0] text-xs text-gray-400 flex items-center justify-center"
                title="형광펜 제거">✕</button>
            </div>
          )}
        </div>

        <span className="w-px bg-[#ddd] mx-1" />

        {/* 링크 / 이미지 / 토글 */}
        <button type="button" onClick={setLink}
          className={btn(editor.isActive('link'))}>🔗</button>
        <ImageUploadButton editor={editor} />
        <button type="button" onClick={insertToggle}
          className="px-2 py-1 rounded text-sm hover:bg-[#f0f0f0]" title="토글">▶ 토글</button>

        <span className="w-px bg-[#ddd] mx-1" />

        {/* 들여쓰기 */}
        <button type="button" onClick={() => editor.commands.outdent()}
          className="px-2 py-1 rounded text-sm hover:bg-[#f0f0f0]" title="내어쓰기 (Shift+Tab)">⇤ 내어쓰기</button>
        <button type="button" onClick={() => editor.commands.indent()}
          className="px-2 py-1 rounded text-sm hover:bg-[#f0f0f0]" title="들여쓰기 (Tab)">들여쓰기 ⇥</button>

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

        <span className="w-px bg-[#ddd] mx-1" />

        {/* 콜아웃 */}
        <div ref={calloutRef} className="relative">
          <button type="button" onClick={() => togglePicker('callout')}
            className={btn(openPicker === 'callout')}
            title="콜아웃">
            ◰ 콜아웃
          </button>
          {openPicker === 'callout' && (
            <div className={pickerPanel} style={{ width: '13rem' }}>
              {CALLOUT_COLORS.map(({ color, label }) => (
                <button key={color} type="button"
                  onClick={() => { editor.commands.insertCallout(color); setOpenPicker(null) }}
                  className="w-8 h-8 rounded border border-[#ddd] hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }} title={label} />
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="overflow-y-auto max-h-[600px]">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-4 min-h-[400px]"
        />
      </div>
    </div>
  )
}
