import Image from 'next/image'
import InfoButton from './InfoButton'

export default function Header() {
  return (
    <header className="relative px-5 py-4 pb-3.5 border-b border-[#ebebeb] flex flex-col items-center text-center">
      <InfoButton />
      <Image
        src="/logo.png"
        alt="삼산타운1단지 소식지"
        width={280}
        height={80}
        priority
        className="h-[72px] w-auto"
        style={{ mixBlendMode: 'multiply' }}
      />
      <p className="mt-3 text-[13px] text-[#555] leading-relaxed">
        우리가 살고있는 아파트에 지금 어떤 일들이 있을까요?<br />
        주요 이슈들을 알기 쉽게 설명해드릴게요.<br />
        <span className="text-[12px] text-[#888]">비정기적으로 새로운 이야기가 상시 업데이트됩니다 😊</span>
      </p>
    </header>
  )
}
