import Image from 'next/image'

export default function Header() {
  return (
    <header className="px-5 py-4 pb-3.5 border-b border-[#ebebeb] flex flex-col items-center text-center">
      <Image
        src="/logo.png"
        alt="삼산타운1단지 소식지"
        width={280}
        height={80}
        priority
        className="h-[72px] w-auto"
        style={{ mixBlendMode: 'multiply' }}
      />
      <p className="mt-1.5 text-[12px] text-[#888]">입주민이 알아야 할 우리 단지 이야기</p>
    </header>
  )
}
