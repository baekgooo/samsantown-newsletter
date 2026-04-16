import { render, screen } from '@testing-library/react'
import IssueReportButton from '@/components/IssueReportButton'

describe('IssueReportButton', () => {
  it('버튼 텍스트를 렌더링한다', () => {
    render(<IssueReportButton formUrl="https://forms.google.com/test" />)
    expect(screen.getByText(/이슈 제보하기/i)).toBeInTheDocument()
  })

  it('formUrl이 없으면 버튼을 숨긴다', () => {
    render(<IssueReportButton formUrl="" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('올바른 href와 target을 가진다', () => {
    render(<IssueReportButton formUrl="https://forms.google.com/test" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://forms.google.com/test')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
