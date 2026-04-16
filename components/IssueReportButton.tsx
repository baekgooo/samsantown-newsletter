interface Props {
  formUrl: string
}

export default function IssueReportButton({ formUrl }: Props) {
  if (!formUrl) return null

  return (
    <div className="px-5 py-5 bg-[#fafafa] border-t border-[#f0f0f0]">
      <p className="text-[12px] text-[#999] text-center mb-2.5">단지 내 문제를 알고 계신가요?</p>
      <a
        href={formUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-3.5 bg-[#111] text-white text-[14px] font-bold rounded-lg text-center"
      >
        📢 이슈 제보하기
      </a>
    </div>
  )
}
