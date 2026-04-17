import Link from 'next/link'

export default function IssueReportButton() {
  return (
    <div className="px-5 py-5 bg-[#fafafa] border-t border-[#f0f0f0]">
      <p className="text-[12px] text-[#999] text-center mb-2.5">단지 내 문제를 알고 계신가요?</p>
      <Link
        href="/report"
        className="block w-full py-3.5 bg-[#111] text-white text-[14px] font-bold rounded-lg text-center"
      >
        📢 이슈 제보하기
      </Link>
    </div>
  )
}
