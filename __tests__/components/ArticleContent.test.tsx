import { render, screen } from '@testing-library/react'
import ArticleContent from '@/components/ArticleContent'

describe('ArticleContent', () => {
  it('마크다운 제목을 렌더링한다', () => {
    render(<ArticleContent content={"## 배경\n\n본문 내용"} />)
    expect(screen.getByRole('heading', { name: '배경' })).toBeInTheDocument()
  })

  it('마크다운 단락을 렌더링한다', () => {
    render(<ArticleContent content={"## 배경\n\n본문 내용"} />)
    expect(screen.getByText('본문 내용')).toBeInTheDocument()
  })

  it('이미지를 렌더링한다', () => {
    render(<ArticleContent content="![설명](https://example.com/img.jpg)" />)
    const img = screen.getByRole('img', { name: '설명' })
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg')
  })
})
