import Link from 'next/link'

export default function PetitionPage() {
  return (
    <div className="max-w-lg mx-auto p-6 pt-12 text-center space-y-6">
      <h1 className="text-lg font-bold text-[#111]">방청신청서 제출</h1>
      <p className="text-sm text-[#666]">신청할 회의 종류를 선택해주세요.</p>
      <div className="flex flex-col gap-3">
        <Link
          href="/petition/election"
          className="py-4 border-2 border-[#FF6200] text-[#FF6200] font-bold rounded-xl hover:bg-[#fff5f0]"
        >
          선거관리위원회 방청신청서
        </Link>
        <Link
          href="/petition/board"
          className="py-4 border-2 border-[#333] text-[#333] font-bold rounded-xl hover:bg-[#f5f5f5]"
        >
          입주자대표회의 방청신청서
        </Link>
      </div>
    </div>
  )
}
