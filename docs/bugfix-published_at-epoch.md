# 버그: 홈화면 아티클 날짜 1970.01.01 표시

## 증상
홈화면 아티클 카드 좌상단 날짜가 `1970.01.01`로 표시됨.

## 원인
`createArticle()` 함수가 `published_at` 필드를 DB에 전달하지 않아서, 해당 컬럼이 `null`로 저장됨.  
`formatDate(null)` → `new Date(null)` → Unix epoch(1970.01.01) 출력.

## 관련 파일

| 파일 | 라인 | 내용 |
|------|------|------|
| `lib/supabase.ts` | 66–82 | `createArticle()` — `published_at` 인자 없음 (근본 원인) |
| `lib/supabase.ts` | 22–30 | `getPublishedArticles()` — DB 값 그대로 반환 |
| `components/ArticleCard.tsx` | 11–22 | `formatDate()` — null 방어 없음 |
| `app/page.tsx` | 15–23 | `published_at` 그대로 ArticleCard에 전달 |

## 수정 방법

### A. 근본 해결 — `createArticle()`에 `published_at` 추가

`lib/supabase.ts` `createArticle()` 함수:

```typescript
// 수정 전
export async function createArticle(data: {
  slug: string
  title: string
  summary: string
  content: string
  category: string
  is_published: boolean
}): Promise<Article> {
  const { data: article, error } = await supabase
    .from('articles')
    .insert(data)

// 수정 후
export async function createArticle(data: {
  slug: string
  title: string
  summary: string
  content: string
  category: string
  is_published: boolean
  published_at?: string  // 추가
}): Promise<Article> {
  const insertData = {
    ...data,
    published_at: data.published_at ?? new Date().toISOString(),  // 추가
  }
  const { data: article, error } = await supabase
    .from('articles')
    .insert(insertData)
```

### B. 방어 코드 추가 — `formatDate()` null 처리

`components/ArticleCard.tsx`:

```typescript
// 수정 전
function formatDate(isoString: string): string {
  const date = new Date(isoString)

// 수정 후
function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return ''
  const date = new Date(isoString)
```

### C. DB에 이미 저장된 아티클 수동 수정 (선택)
Supabase 대시보드에서 해당 아티클의 `published_at` 컬럼을 올바른 날짜로 직접 업데이트.

## 권장 순서
1. **A** 수정 (재발 방지)
2. **B** 수정 (방어 코드)
3. **C** 수정 (기존 데이터 보정)
