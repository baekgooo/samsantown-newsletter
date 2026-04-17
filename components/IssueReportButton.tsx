import Link from 'next/link'

export default function IssueReportButton() {
  return (
    <div className="px-5 py-5 bg-[#fafafa] border-t border-[#f0f0f0]">
      <p className="text-[12px] text-[#999] text-center mb-2.5 leading-relaxed">
        이 공간의 모든 게시글은 특정 개인이나 단체를 비난하기 위해 작성되지 않았습니다.<br />
        이견이 있을 경우 언제든 아래 버튼을 클릭해 말씀해주세요.
      </p>
      <Link
        href="/report"
        className="block w-full py-3.5 bg-[#111] text-white text-[14px] font-bold rounded-lg text-center"
      >
        📢 이슈 제보하기
      </Link>
    </div>
  )
}
