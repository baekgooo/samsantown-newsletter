import { render, screen } from '@testing-library/react'
import ArticleContent from '@/components/ArticleContent'

describe('ArticleContent', () => {
  it('HTML 제목을 렌더링한다', () => {
    render(<ArticleContent content="<h2>배경</h2>" />)
    expect(screen.getByRole('heading', { name: '배경' })).toBeInTheDocument()
  })

  it('HTML 단락을 렌더링한다', () => {
    render(<ArticleContent content="<p>본문 내용</p>" />)
    expect(screen.getByText('본문 내용')).toBeInTheDocument()
  })

  it('이미지를 렌더링한다', () => {
    render(<ArticleContent content='<img src="https://example.com/img.jpg" alt="설명" />' />)
    const img = screen.getByRole('img', { name: '설명' })
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg')
  })

  it('XSS 스크립트를 제거한다', () => {
    render(<ArticleContent content='<p>안전</p><script>alert("xss")</script>' />)
    expect(screen.getByText('안전')).toBeInTheDocument()
    expect(document.querySelector('script')).not.toBeInTheDocument()
  })
})
