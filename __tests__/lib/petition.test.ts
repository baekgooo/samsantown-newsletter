/**
 * @jest-environment node
 */
import { validateApplicant, isRateLimited } from '@/lib/petition'

describe('validateApplicant', () => {
  it('유효한 신청자 데이터를 통과시킨다', () => {
    expect(validateApplicant({ unit: '104-506', name: '홍길동', phone: '010-1234-5678' })).toBe(true)
  })

  it('동-호수 형식이 잘못되면 false를 반환한다', () => {
    expect(validateApplicant({ unit: '104506', name: '홍길동', phone: '010-1234-5678' })).toBe(false)
  })

  it('전화번호 형식이 잘못되면 false를 반환한다', () => {
    expect(validateApplicant({ unit: '104-506', name: '홍길동', phone: '01012345678' })).toBe(false)
  })

  it('이름이 비어있으면 false를 반환한다', () => {
    expect(validateApplicant({ unit: '104-506', name: '', phone: '010-1234-5678' })).toBe(false)
  })
})

describe('isRateLimited', () => {
  it('최근 제출 기록이 없으면 false를 반환한다', async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => ({
              limit: () => Promise.resolve({ data: [], error: null })
            })
          })
        })
      })
    }
    const result = await isRateLimited('127.0.0.1', mockSupabase as any)
    expect(result).toBe(false)
  })

  it('60초 이내 제출 기록이 있으면 true를 반환한다', async () => {
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => ({
              limit: () => Promise.resolve({ data: [{ id: 'some-id' }], error: null })
            })
          })
        })
      })
    }
    const result = await isRateLimited('127.0.0.1', mockSupabase as any)
    expect(result).toBe(true)
  })
})
