import { render, screen } from '@testing-library/react'
import ArticleCard from '@/components/ArticleCard'

const mockArticle = {
  slug: '변압기-공사지연',
  title: '전기차 충전기 공사, 왜 이렇게 늦어지는 걸까요?',
  summary: '부평구청 과태료까지 나왔어요.',
  published_at: '2026-04-15T00:00:00Z',
  category: '변압기',
}

describe('ArticleCard', () => {
  it('제목을 렌더링한다', () => {
    render(<ArticleCard {...mockArticle} />)
    expect(screen.getByText(mockArticle.title)).toBeInTheDocument()
  })

  it('요약을 렌더링한다', () => {
    render(<ArticleCard {...mockArticle} />)
    expect(screen.getByText(mockArticle.summary)).toBeInTheDocument()
  })

  it('자세히 보기 링크가 올바른 href를 가진다', () => {
    render(<ArticleCard {...mockArticle} />)
    const link = screen.getByRole('link', { name: /자세히 보기/i })
    expect(link).toHaveAttribute('href', '/articles/변압기-공사지연')
  })

  it('발행일을 한국어 형식으로 렌더링한다', () => {
    render(<ArticleCard {...mockArticle} />)
    expect(screen.getByText('2026.04.15')).toBeInTheDocument()
  })
})
