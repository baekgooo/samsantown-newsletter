'use client'

import { useState } from 'react'

export default function InfoButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[#ddd] text-[11px] text-[#888] hover:bg-[#f5f5f5]"
      >
        ⓘ 안내
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
          onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-[400px] shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[15px] font-bold text-[#111] mb-4">안내</h2>
            <p className="text-[13px] text-[#555] leading-relaxed">
              이 곳은 우리 아파트의 여러가지 일들을 입주민분들과 나누고자 개인적으로 제작한 공간으로,
              삼산타운1단지에서 공식적으로 발행하는 소식지가 아닙니다.
            </p>
            <p className="text-[13px] text-[#555] leading-relaxed mt-3">
              모든 게시글은 주민들의 의견 및 전달사항을 취합하고 최대한 사실관계를 확인하여 작성합니다.
              하지만 다소 부족한 점이 있거나 실제 사실과 다를 수 있으므로, 수정이 필요할 경우 언제든{' '}
              <span className="font-semibold text-[#111]">[이슈제보]</span> 버튼을 눌러 연락해주세요.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full py-2.5 bg-[#111] text-white text-[13px] font-bold rounded-xl"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  )
}
