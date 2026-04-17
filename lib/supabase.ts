import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface Article {
  id: string
  slug: string
  title: string
  summary: string
  content: string
  category: string
  is_published: boolean
  published_at: string
  created_at: string
  updated_at: string
  view_count: number
}

export async function getPublishedArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) return null
  return data
}

export async function getAllArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

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
    .select()
    .single()

  if (error) throw new Error(error.message)
  return article
}

export async function updateArticle(
  id: string,
  data: Partial<{
    slug: string
    title: string
    summary: string
    content: string
    category: string
    is_published: boolean
  }>
): Promise<Article> {
  const { data: article, error } = await supabase
    .from('articles')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return article
}

export interface Report {
  id: string
  name: string | null
  contact: string | null
  content: string
  is_read: boolean
  created_at: string
}

export async function submitReport(data: {
  name?: string
  contact?: string
  content: string
}): Promise<void> {
  const { error } = await supabase.from('reports').insert(data)
  if (error) throw new Error(error.message)
}

export async function getReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function markReportRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({ is_read: true })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
