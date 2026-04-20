import { render, screen, fireEvent } from '@testing-library/react'
import PetitionForm from '@/components/petition/PetitionForm'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))

describe('PetitionForm', () => {
  it('초기 렌더링 시 신청자 1명 행이 표시된다', () => {
    render(<PetitionForm formType="election" />)
    expect(screen.getByPlaceholderText('104-506')).toBeInTheDocument()
  })

  it('[+ 신청자 추가] 버튼 클릭 시 행이 추가된다', () => {
    render(<PetitionForm formType="election" />)
    fireEvent.click(screen.getByText('+ 신청자 추가'))
    expect(screen.getAllByPlaceholderText('104-506')).toHaveLength(2)
  })

  it('신청자가 6명일 때 추가 버튼이 비활성화된다', () => {
    render(<PetitionForm formType="election" />)
    const addBtn = screen.getByText('+ 신청자 추가')
    for (let i = 0; i < 5; i++) fireEvent.click(addBtn)
    expect(addBtn).toBeDisabled()
  })

  it('전화번호 입력 시 자동으로 하이픈이 추가된다', () => {
    render(<PetitionForm formType="election" />)
    const phoneInput = screen.getByPlaceholderText('010-0000-0000')
    fireEvent.change(phoneInput, { target: { value: '01012345678' } })
    expect((phoneInput as HTMLInputElement).value).toBe('010-1234-5678')
  })
})
