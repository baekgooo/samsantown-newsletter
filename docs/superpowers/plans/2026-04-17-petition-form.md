# 방청신청서 제출 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 입주민이 선관위/입대위 방청신청서를 웹에서 작성하여 관리소 이메일로 PDF 첨부 발송하고, 관리자 보드에서 발송 내역을 관리할 수 있는 기능 구현.

**Architecture:** 공개 폼(PetitionForm 컴포넌트)에서 입력 → `/api/petition/submit` POST → Supabase 저장 + PDF 생성(서버) + Gmail SMTP 발송. 완료 화면에서 `@react-pdf/renderer` 클라이언트 사이드로 PDF 다운로드 제공. 발송 실패 시 Telegram 알림 + 관리자 보드에서 재발송.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (PostgreSQL), Tailwind CSS, `@react-pdf/renderer`, `nodemailer`, Telegram Bot API, Vercel

**Spec:** `docs/superpowers/specs/2026-04-17-petition-form-design.md`

---

## File Map

| 파일 | 역할 |
|---|---|
| `lib/petition.ts` | Supabase CRUD, TypeScript 타입, rate limit 체크 |
| `lib/petition-pdf.tsx` | `@react-pdf/renderer` PDF Document 컴포넌트 (서버/클라이언트 공용) |
| `lib/email.ts` | nodemailer Gmail SMTP 이메일 발송 |
| `lib/telegram.ts` | Telegram Bot API 알림 |
| `components/petition/PetitionForm.tsx` | 공용 폼 UI (선관위/입대위 공통) |
| `app/petition/page.tsx` | 양식 선택 화면 |
| `app/petition/election/page.tsx` | 선관위 폼 페이지 |
| `app/petition/board/page.tsx` | 입대위 폼 페이지 |
| `app/petition/complete/page.tsx` | 제출 완료 화면 + PDF 다운로드 |
| `app/api/petition/submit/route.tsx` | POST: 제출 처리 (공개, rate limit) — JSX 사용으로 `.tsx` |
| `app/api/petition/list/route.ts` | GET: 전체 목록 조회 (관리자 인증, 서버사이드 service key 사용) |
| `app/api/petition/resend/[id]/route.tsx` | POST: 재발송 (관리자 인증, Bearer token 검증) — JSX 사용으로 `.tsx` |
| `app/admin/petitions/page.tsx` | 관리자 신청 내역 + 재발송 |
| `app/page.tsx` | 수정: 하단에 방청신청 버튼 추가 |
| `next.config.mjs` | 수정: `@react-pdf/renderer` transpilePackages 추가 |
| `__tests__/lib/petition.test.ts` | petition.ts 단위 테스트 |
| `__tests__/lib/email.test.ts` | email.ts 단위 테스트 |
| `__tests__/lib/telegram.test.ts` | telegram.ts 단위 테스트 |
| `__tests__/api/petition-submit.test.ts` | submit API route 테스트 |
| `__tests__/components/PetitionForm.test.tsx` | 폼 컴포넌트 테스트 |

---

## Task 0: 패키지 설치 + 환경 설정 + DB 테이블 생성

**Files:**
- Modify: `next.config.mjs`
- Modify: `.env.local`

- [ ] **Step 1: 패키지 설치**

```bash
cd c:/Users/PSR/Workspace/samsantown1/newsletter
npm install @react-pdf/renderer nodemailer @types/nodemailer
```

Expected: 패키지 설치 완료, no errors.

- [ ] **Step 2: next.config.mjs에 transpilePackages 추가**

`next.config.mjs`의 `transpilePackages` 배열 맨 앞에 `'@react-pdf/renderer'` 추가:

```js
transpilePackages: [
  '@react-pdf/renderer',
  'react-markdown',
  // ... 나머지 기존 항목
],
```

- [ ] **Step 3: .env.local에 환경변수 추가**

`.env.local` 파일에 아래 항목 추가 (실제 값은 Gmail 계정 생성 후 입력):

```
GMAIL_USER=
GMAIL_APP_PASSWORD=
TELEGRAM_BOT_TOKEN=<실제값은 .env.local에만>
TELEGRAM_CHAT_ID=<실제값은 .env.local에만>
MANAGEMENT_EMAIL=white_soo@naver.com  # 테스트용 — 실서비스 전 samsan1@hanmail.net으로 교체
MANAGEMENT_PHONE=032-512-9085
SUPABASE_SERVICE_ROLE_KEY=
```

> **Note:** Vercel 대시보드에도 동일한 환경변수 추가 필요 (배포 전).

- [ ] **Step 4: Supabase에 petitions 테이블 생성**

Supabase 대시보드 → SQL Editor에서 실행:

```sql
CREATE TABLE petitions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type     text NOT NULL CHECK (form_type IN ('election', 'board')),
  petition_date date NOT NULL,
  meeting_date  date NOT NULL,
  meeting_time  time NOT NULL,
  applicants    jsonb NOT NULL,
  email         text,
  email_sent    boolean NOT NULL DEFAULT false,
  email_error   text,
  ip_address    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;

-- anon: INSERT만 허용 (공개 폼 제출)
CREATE POLICY "allow_anon_insert" ON petitions
  FOR INSERT TO anon WITH CHECK (true);

-- authenticated: SELECT + UPDATE 허용 (관리자 보드 + 재발송)
CREATE POLICY "allow_auth_select" ON petitions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_auth_update" ON petitions
  FOR UPDATE TO authenticated USING (true);
```

- [ ] **Step 5: 개발 서버 시작 확인**

```bash
npm run dev
```

Expected: `http://localhost:3000` 정상 실행.

---

## Task 1: lib/petition.ts — Supabase CRUD + 타입 + rate limit

**Files:**
- Create: `lib/petition.ts`
- Create: `__tests__/lib/petition.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`__tests__/lib/petition.test.ts`:

```typescript
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
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --testPathPattern="lib/petition" --no-coverage
```

Expected: FAIL (모듈 없음)

- [ ] **Step 3: lib/petition.ts 구현**

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type FormType = 'election' | 'board'

export interface Applicant {
  unit: string   // 예: "104-506"
  name: string
  phone: string  // 예: "010-1234-5678"
}

export interface Petition {
  id: string
  form_type: FormType
  petition_date: string
  meeting_date: string
  meeting_time: string
  applicants: Applicant[]
  email: string | null
  email_sent: boolean
  email_error: string | null
  ip_address: string | null
  created_at: string
}

export interface CreatePetitionInput {
  form_type: FormType
  petition_date: string
  meeting_date: string
  meeting_time: string
  applicants: Applicant[]
  email?: string
  ip_address?: string
}

export function validateApplicant(applicant: Applicant): boolean {
  if (!applicant.name.trim()) return false
  if (!/^\d{2,4}-\d{1,4}$/.test(applicant.unit)) return false
  if (!/^010-\d{4}-\d{4}$/.test(applicant.phone)) return false
  return true
}

export async function isRateLimited(ip: string, client: SupabaseClient): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
  const { data } = await client
    .from('petitions')
    .select('id')
    .eq('ip_address', ip)
    .gte('created_at', oneMinuteAgo)
    .limit(1)
  return Array.isArray(data) && data.length > 0
}

export function createAnonSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function createPetition(
  input: CreatePetitionInput,
  client: SupabaseClient
): Promise<Petition> {
  const { data, error } = await client
    .from('petitions')
    .insert(input)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updatePetitionEmailStatus(
  id: string,
  update: { email_sent: boolean; email_error?: string },
  client: SupabaseClient
): Promise<void> {
  const { error } = await client
    .from('petitions')
    .update(update)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getAllPetitions(client: SupabaseClient): Promise<Petition[]> {
  const { data, error } = await client
    .from('petitions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPetitionById(id: string, client: SupabaseClient): Promise<Petition | null> {
  const { data, error } = await client
    .from('petitions')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --testPathPattern="lib/petition" --no-coverage
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/petition.ts __tests__/lib/petition.test.ts
git commit -m "feat: add petition lib with types, CRUD, and rate limit"
```

---

## Task 2: lib/telegram.ts — Telegram 알림

**Files:**
- Create: `lib/telegram.ts`
- Create: `__tests__/lib/telegram.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`__tests__/lib/telegram.test.ts`:

```typescript
/**
 * @jest-environment node
 */
import { sendTelegramAlert } from '@/lib/telegram'

global.fetch = jest.fn()

describe('sendTelegramAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'
    process.env.TELEGRAM_CHAT_ID = '12345'
  })

  it('Telegram API를 올바른 URL과 body로 호출한다', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    await sendTelegramAlert('테스트 메시지')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ chat_id: '12345', text: '테스트 메시지' }),
      })
    )
  })

  it('fetch 실패 시 예외를 던지지 않는다 (조용히 처리)', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network error'))
    await expect(sendTelegramAlert('메시지')).resolves.not.toThrow()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --testPathPattern="lib/telegram" --no-coverage
```

Expected: FAIL

- [ ] **Step 3: lib/telegram.ts 구현**

```typescript
export async function sendTelegramAlert(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    })
  } catch {
    // 알림 실패는 조용히 처리 — 메인 플로우를 막지 않음
  }
}

export function buildFailureAlert(formType: 'election' | 'board', applicants: Array<{ name: string; unit: string }>): string {
  const typeLabel = formType === 'election' ? '선관위' : '입대위'
  const first = applicants[0]
  const extra = applicants.length > 1 ? ` 외 ${applicants.length - 1}명` : ''
  return `📋 방청신청 이메일 발송 실패 - ${typeLabel} / ${first.name}${extra} (${first.unit})`
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --testPathPattern="lib/telegram" --no-coverage
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/telegram.ts __tests__/lib/telegram.test.ts
git commit -m "feat: add telegram alert utility"
```

---

## Task 3: lib/email.ts — Gmail SMTP 이메일 발송

**Files:**
- Create: `lib/email.ts`
- Create: `__tests__/lib/email.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`__tests__/lib/email.test.ts`:

```typescript
/**
 * @jest-environment node
 */

const mockSendMail = jest.fn()
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}))

import { sendManagementEmail, sendApplicantEmail } from '@/lib/email'

describe('sendManagementEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GMAIL_USER = 'test@gmail.com'
    process.env.GMAIL_APP_PASSWORD = 'test-password'
    process.env.MANAGEMENT_EMAIL = 'samsan1@hanmail.net'
  })

  it('관리소 이메일을 올바른 수신자로 발송한다', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'test-id' })
    const pdfBuffer = Buffer.from('fake-pdf')
    await sendManagementEmail({
      formType: 'election',
      petitionDate: '2026-04-17',
      applicants: [{ unit: '104-506', name: '홍길동', phone: '010-1234-5678' }],
      pdfBuffer,
    })
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'samsan1@hanmail.net' })
    )
  })

  it('발송 실패 시 예외를 던진다', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'))
    await expect(
      sendManagementEmail({
        formType: 'election',
        petitionDate: '2026-04-17',
        applicants: [{ unit: '104-506', name: '홍길동', phone: '010-1234-5678' }],
        pdfBuffer: Buffer.from(''),
      })
    ).rejects.toThrow('SMTP error')
  })
})

describe('sendApplicantEmail', () => {
  it('신청자 이메일을 올바른 수신자로 발송한다', async () => {
    mockSendMail.mockResolvedValue({ messageId: 'test-id' })
    await sendApplicantEmail({
      to: 'applicant@example.com',
      pdfBuffer: Buffer.from('fake-pdf'),
    })
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'applicant@example.com' })
    )
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --testPathPattern="lib/email" --no-coverage
```

Expected: FAIL

- [ ] **Step 3: lib/email.ts 구현**

```typescript
import nodemailer from 'nodemailer'
import type { Applicant, FormType } from './petition'

function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`
}

function buildManagementSubject(formType: FormType, petitionDate: string, applicants: Applicant[]): string {
  const typeLabel = formType === 'election' ? '선관위' : '입대위'
  const first = applicants[0]
  const extra = applicants.length > 1 ? ` 외 ${applicants.length - 1}명` : ''
  return `[방청신청] ${typeLabel} 방청신청서 접수 - ${first.name}${extra} (${petitionDate})`
}

export async function sendManagementEmail(params: {
  formType: FormType
  petitionDate: string
  applicants: Applicant[]
  pdfBuffer: Buffer
}): Promise<void> {
  const { formType, petitionDate, applicants, pdfBuffer } = params
  const typeLabel = formType === 'election' ? '선관위' : '입대위'
  const transport = createTransport()

  await transport.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.MANAGEMENT_EMAIL,
    subject: buildManagementSubject(formType, petitionDate, applicants),
    text: [
      '첨부된 방청신청서를 확인해주세요.',
      '작성내용에 문제가 있을 경우, 신청자 연락처로 연락하시기 바랍니다.',
      '본 이메일로 답신할 경우 확인할 수 없습니다.',
    ].join('\n'),
    attachments: [{
      filename: `${typeLabel}_방청신청서_${petitionDate}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  })
}

export async function sendApplicantEmail(params: {
  to: string
  pdfBuffer: Buffer
}): Promise<void> {
  const { to, pdfBuffer } = params
  const transport = createTransport()

  await transport.sendMail({
    from: `삼산타운1차 소식지 <${process.env.GMAIL_USER}>`,
    to,
    subject: '[삼산타운1차 소식지] 방청신청서 제출 완료 안내',
    text: [
      '안녕하세요.',
      `방청신청서가 관리소(${process.env.MANAGEMENT_EMAIL})로 발송됐어요.`,
      '',
      `수신 여부는 관리소(${process.env.MANAGEMENT_PHONE})에 직접 확인해주세요.`,
      '의도치 않은 오류로 발송이 실패할 수 있으니 꼭 확인 부탁드려요.',
      '',
      '신청서 사본은 첨부 파일을 확인해주세요.',
    ].join('\n'),
    attachments: [{
      filename: '방청신청서.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    }],
  })
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --testPathPattern="lib/email" --no-coverage
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add lib/email.ts __tests__/lib/email.test.ts
git commit -m "feat: add email sending utility with nodemailer"
```

---

## Task 4: lib/petition-pdf.tsx — PDF Document 컴포넌트

**Files:**
- Create: `lib/petition-pdf.tsx`

> 이 컴포넌트는 `@react-pdf/renderer`의 Document/Page/View/Text 프리미티브만 사용하므로 서버/클라이언트 양쪽에서 import 가능. 단, `renderToBuffer`는 서버에서만, `PDFDownloadLink`는 클라이언트에서만 호출.

- [ ] **Step 1: lib/petition-pdf.tsx 구현**

```tsx
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { Applicant, FormType } from './petition'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    dayOfWeek: DAYS[d.getDay()],
  }
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  row: { flexDirection: 'row', marginBottom: 8 },
  label: { width: 140 },
  value: { flex: 1 },
  table: { marginTop: 12, border: '1pt solid #000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottom: '1pt solid #000' },
  tableRow: { flexDirection: 'row', borderBottom: '0.5pt solid #ccc' },
  tableCell: { padding: '4 6', flex: 1, borderRight: '0.5pt solid #ccc', fontSize: 9 },
  tableCellLast: { padding: '4 6', flex: 1, fontSize: 9 },
  notice: { marginTop: 16, fontSize: 8, color: '#444', lineHeight: 1.5 },
  footer: { marginTop: 24, fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
})

export interface PetitionDocumentProps {
  formType: FormType
  petitionDate: string
  meetingDate: string
  meetingTime: string
  applicants: Applicant[]
}

export function PetitionDocument({ formType, petitionDate, meetingDate, meetingTime, applicants }: PetitionDocumentProps) {
  const title = formType === 'election' ? '선거관리위원회의 방청 신청서' : '입주자대표회의 방청 신청서'
  const recipient = formType === 'election'
    ? '삼산타운1단지아파트 선거관리위원회 위원장 귀중'
    : '삼산타운1단지아파트 입주자대표회의 회장 귀중'
  const pd = formatDate(petitionDate)
  const md = formatDate(meetingDate)

  const emptyRows = Math.max(0, 6 - applicants.length)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>1. 신청일자 :</Text>
          <Text style={styles.value}>{pd.year}년 {pd.month}월 {pd.day}일 {pd.dayOfWeek}요일</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>2. 장　　소 :</Text>
          <Text style={styles.value}>관리사무소</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>3. 회의 개최 일자 :</Text>
          <Text style={styles.value}>{md.year}년 {md.month}월 {md.day}일 {md.dayOfWeek}요일 {meetingTime}</Text>
        </View>
        <Text style={{ marginBottom: 4 }}>4. 신　청　자</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {['번호', '동-호수', '성명', '전화번호', '서명'].map((h, i) => (
              <Text key={h} style={i < 4 ? styles.tableCell : styles.tableCellLast}>{h}</Text>
            ))}
          </View>
          {applicants.map((a, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCell}>{i + 1}</Text>
              <Text style={styles.tableCell}>{a.unit}</Text>
              <Text style={styles.tableCell}>{a.name}</Text>
              <Text style={styles.tableCell}>{a.phone}</Text>
              <Text style={styles.tableCellLast}>{a.name}</Text>
            </View>
          ))}
          {Array.from({ length: emptyRows }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.tableRow}>
              {[0,1,2,3,4].map(j => (
                <Text key={j} style={j < 4 ? styles.tableCell : styles.tableCellLast}> </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.notice}>
          <Text>(회의 방청)</Text>
          <Text>① 의장은 회의를 개최함에 있어 입주자 등 이해 관계자가 1일전에 요청을 한 경우 공동주택관리의 투명화를 위하여 회의를 방청하게 하여야 하나, 다음 각 호의 어느 하나에 해당하는 자는 방청을 제한한다.</Text>
          <Text>1. 흉기 또는 위험한 물품을 휴대한 사람  2. 음주자 또는 정신 이상이 있는 사람</Text>
          <Text>② 방청자는 발언할 수 없다. 다만, 의장이 안건심의와 관련하여 발언을 허가한 경우와 전문가에게 필요한 의견을 진술하게 한 경우에는 그러하지 아니한다.</Text>
          <Text>③ 의장은 다음 각 호의 어느 하나에 해당하는 자가 방청하고 있는 경우에는 퇴장을 명할 수 있으며, 방청자는 의장의 명에 따라야 한다.</Text>
          <Text>1. 폭력 및 욕설을 하는 등 질서유지에 방해가 되는 사람  2. 선거관리위원의 발언에 대하여 의견을 개진하거나 손뼉을 치는 사람</Text>
          <Text>3. 방청하면서 식음, 흡연을 하거나 잡지 등을 보는 사람  4. 허락없이 녹음, 비디오 및 사진 촬영을 하는 사람  5. 그 밖에 회의 진행을 방해하는 사람.</Text>
        </View>

        <Text style={styles.footer}>{recipient}</Text>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add lib/petition-pdf.tsx
git commit -m "feat: add petition PDF document component"
```

---

## Task 5: POST /api/petition/submit

**Files:**
- Create: `app/api/petition/submit/route.tsx`
- Create: `__tests__/api/petition-submit.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`__tests__/api/petition-submit.test.ts`:

```typescript
/**
 * @jest-environment node
 */
import { POST } from '@/app/api/petition/submit/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/petition', () => ({
  validateApplicant: jest.fn(() => true),
  isRateLimited: jest.fn(() => false),
  createAnonSupabase: jest.fn(() => ({})),
  createServiceSupabase: jest.fn(() => ({})),
  createPetition: jest.fn(() => Promise.resolve({ id: 'test-uuid', email_sent: false })),
  updatePetitionEmailStatus: jest.fn(() => Promise.resolve()),
}))

jest.mock('@/lib/petition-pdf', () => ({
  PetitionDocument: jest.fn(() => null),
}))

jest.mock('@react-pdf/renderer', () => ({
  renderToBuffer: jest.fn(() => Promise.resolve(Buffer.from('pdf'))),
}))

jest.mock('@/lib/email', () => ({
  sendManagementEmail: jest.fn(() => Promise.resolve()),
  sendApplicantEmail: jest.fn(() => Promise.resolve()),
}))

jest.mock('@/lib/telegram', () => ({
  sendTelegramAlert: jest.fn(() => Promise.resolve()),
  buildFailureAlert: jest.fn(() => 'alert message'),
}))

const validBody = {
  form_type: 'election',
  petition_date: '2026-04-17',
  meeting_date: '2026-04-18',
  meeting_time: '19:30',
  applicants: [{ unit: '104-506', name: '홍길동', phone: '010-1234-5678' }],
}

describe('POST /api/petition/submit', () => {
  it('유효한 요청에 200을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/petition/submit', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('신청자가 없으면 400을 반환한다', async () => {
    const req = new NextRequest('http://localhost/api/petition/submit', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, applicants: [] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rate limit 초과 시 429를 반환한다', async () => {
    const { isRateLimited } = require('@/lib/petition')
    isRateLimited.mockResolvedValueOnce(true)
    const req = new NextRequest('http://localhost/api/petition/submit', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --testPathPattern="api/petition-submit" --no-coverage
```

Expected: FAIL

- [ ] **Step 3: route.tsx 구현**

`app/api/petition/submit/route.tsx`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import {
  validateApplicant, isRateLimited,
  createAnonSupabase, createServiceSupabase,
  createPetition, updatePetitionEmailStatus,
  type FormType,
} from '@/lib/petition'
import { PetitionDocument } from '@/lib/petition-pdf'
import { sendManagementEmail, sendApplicantEmail } from '@/lib/email'
import { sendTelegramAlert, buildFailureAlert } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { form_type, petition_date, meeting_date, meeting_time, applicants, email } = body

  if (!form_type || !petition_date || !meeting_date || !meeting_time) {
    return NextResponse.json({ error: '필수 항목이 누락됐어요.' }, { status: 400 })
  }
  if (!Array.isArray(applicants) || applicants.length === 0) {
    return NextResponse.json({ error: '신청자를 1명 이상 입력해주세요.' }, { status: 400 })
  }
  if (applicants.length > 6) {
    return NextResponse.json({ error: '신청자는 최대 6명까지 가능해요.' }, { status: 400 })
  }
  if (!applicants.every(validateApplicant)) {
    return NextResponse.json({ error: '신청자 정보를 올바르게 입력해주세요.' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const anonClient = createAnonSupabase()

  if (await isRateLimited(ip, anonClient)) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const petition = await createPetition(
    { form_type: form_type as FormType, petition_date, meeting_date, meeting_time, applicants, email, ip_address: ip },
    anonClient
  )

  const serviceClient = createServiceSupabase()

  let emailSent = false
  try {
    const pdfBuffer = await renderToBuffer(
      <PetitionDocument
        formType={form_type}
        petitionDate={petition_date}
        meetingDate={meeting_date}
        meetingTime={meeting_time}
        applicants={applicants}
      />
    )

    await sendManagementEmail({ formType: form_type, petitionDate: petition_date, applicants, pdfBuffer })
    emailSent = true
    await updatePetitionEmailStatus(petition.id, { email_sent: true }, serviceClient)

    if (email) {
      try {
        await sendApplicantEmail({ to: email, pdfBuffer })
      } catch {
        // 신청자 이메일 실패는 조용히 처리
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'unknown error'
    await updatePetitionEmailStatus(petition.id, { email_sent: false, email_error: errorMsg }, serviceClient)
    await sendTelegramAlert(buildFailureAlert(form_type, applicants))
  }

  return NextResponse.json({ id: petition.id, email_sent: emailSent })
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --testPathPattern="api/petition-submit" --no-coverage
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add app/api/petition/submit/route.tsx __tests__/api/petition-submit.test.ts
git commit -m "feat: add petition submit API route"
```

---

## Task 6: POST /api/petition/resend/[id]

**Files:**
- Create: `app/api/petition/resend/[id]/route.tsx`

- [ ] **Step 1: route.ts 구현**

> **인증 방식**: 클라이언트(admin 페이지)가 Supabase 세션의 `access_token`을 `Authorization: Bearer <token>` 헤더로 전달. 서버에서 service role client로 토큰 검증. (`@/app/supabase`는 브라우저 전용이라 API route에서 세션 접근 불가.)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createServiceSupabase, getPetitionById, updatePetitionEmailStatus } from '@/lib/petition'
import { PetitionDocument } from '@/lib/petition-pdf'
import { sendManagementEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Authorization: Bearer <access_token> 헤더로 관리자 인증
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceSupabase()
  const { data: { user } } = await serviceClient.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const petition = await getPetitionById(params.id, serviceClient)
  if (!petition) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const pdfBuffer = await renderToBuffer(
      <PetitionDocument
        formType={petition.form_type}
        petitionDate={petition.petition_date}
        meetingDate={petition.meeting_date}
        meetingTime={petition.meeting_time}
        applicants={petition.applicants}
      />
    )
    await sendManagementEmail({
      formType: petition.form_type,
      petitionDate: petition.petition_date,
      applicants: petition.applicants,
      pdfBuffer,
    })
    await updatePetitionEmailStatus(params.id, { email_sent: true, email_error: undefined }, serviceClient)
    return NextResponse.json({ success: true })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'unknown'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add "app/api/petition/resend/[id]/route.tsx"
git commit -m "feat: add petition resend API route (admin only)"
```

---

## Task 7: PetitionForm 컴포넌트

**Files:**
- Create: `components/petition/PetitionForm.tsx`
- Create: `__tests__/components/PetitionForm.test.tsx`

- [ ] **Step 1: 테스트 파일 작성**

`__tests__/components/PetitionForm.test.tsx`:

```tsx
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
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --testPathPattern="components/PetitionForm" --no-coverage
```

Expected: FAIL

- [ ] **Step 3: PetitionForm.tsx 구현**

`components/petition/PetitionForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FormType, Applicant } from '@/lib/petition'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDateWithDay(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${DAYS[d.getDay()]}요일`
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

const emptyApplicant = (): Applicant => ({ unit: '', name: '', phone: '' })

export default function PetitionForm({ formType }: { formType: FormType }) {
  const router = useRouter()
  const [petitionDate, setPetitionDate] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [applicants, setApplicants] = useState<Applicant[]>([emptyApplicant()])
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function updateApplicant(index: number, field: keyof Applicant, value: string) {
    setApplicants(prev => prev.map((a, i) =>
      i === index ? { ...a, [field]: field === 'phone' ? formatPhone(value) : value } : a
    ))
  }

  function addApplicant() {
    if (applicants.length < 6) setApplicants(prev => [...prev, emptyApplicant()])
  }

  function removeApplicant(index: number) {
    if (applicants.length > 1) setApplicants(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/petition/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: formType,
          petition_date: petitionDate,
          meeting_date: meetingDate,
          meeting_time: meetingTime,
          applicants,
          email: email || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? '제출에 실패했어요. 다시 시도해주세요.')
        return
      }

      // 완료 화면에서 PDF 생성을 위해 폼 데이터 sessionStorage에 저장
      sessionStorage.setItem('petition_data', JSON.stringify({
        formType,
        petitionDate,
        meetingDate,
        meetingTime,
        applicants,
      }))

      router.push(`/petition/complete?id=${data.id}&sent=${data.email_sent}`)
    } catch {
      setError('네트워크 오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const typeLabel = formType === 'election' ? '선거관리위원회' : '입주자대표회의'

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-lg font-bold text-[#111]">{typeLabel} 방청신청서</h1>

      {/* 신청일자 */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[#333]">신청일자</label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            required
            value={petitionDate}
            onChange={e => setPetitionDate(e.target.value)}
            className="flex-1 border border-[#ddd] rounded-lg px-3 py-2 text-sm"
          />
          {petitionDate && (
            <span className="text-sm text-[#666]">{formatDateWithDay(petitionDate)}</span>
          )}
        </div>
      </div>

      {/* 회의 개최 일자 + 시간 */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[#333]">회의 개최 일자 및 시간</label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            required
            value={meetingDate}
            onChange={e => setMeetingDate(e.target.value)}
            className="flex-1 border border-[#ddd] rounded-lg px-3 py-2 text-sm"
          />
          {meetingDate && (
            <span className="text-sm text-[#666]">{formatDateWithDay(meetingDate)}</span>
          )}
          <input
            type="time"
            required
            value={meetingTime}
            onChange={e => setMeetingTime(e.target.value)}
            className="w-28 border border-[#ddd] rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* 신청자 목록 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#333]">신청자</label>
        {applicants.map((a, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="104-506"
                required
                value={a.unit}
                onChange={e => updateApplicant(i, 'unit', e.target.value)}
                className="border border-[#ddd] rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="성명"
                required
                value={a.name}
                onChange={e => updateApplicant(i, 'name', e.target.value)}
                className="border border-[#ddd] rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="tel"
                placeholder="010-0000-0000"
                required
                value={a.phone}
                onChange={e => updateApplicant(i, 'phone', e.target.value)}
                className="border border-[#ddd] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {applicants.length > 1 && (
              <button
                type="button"
                onClick={() => removeApplicant(i)}
                className="text-[#aaa] hover:text-red-400 text-sm px-1 pt-2"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addApplicant}
          disabled={applicants.length >= 6}
          className="text-sm text-[#FF6200] disabled:text-[#ccc]"
        >
          + 신청자 추가
        </button>
      </div>

      {/* 이메일 (선택) */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-[#333]">
          이메일 <span className="text-[#aaa] font-normal">(선택)</span>
        </label>
        <input
          type="email"
          placeholder="PDF 사본을 받으려면 입력하세요"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* 개인정보 안내 */}
      <p className="text-xs text-[#888] leading-relaxed bg-[#f8f8f8] rounded-lg p-3">
        입력하신 정보는 발송관리를 위해 저장돼요. 사이트 관리자만 조회할 수 있으며, 입력하신 정보는 발송여부 확인목적 외에 이용되지 않아요. 정보는 발송 확인 후 6개월 이내 삭제됩니다. 동의하실 경우 아래 버튼을 클릭해주세요.
      </p>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-[#FF6200] text-white font-bold rounded-xl disabled:opacity-50"
      >
        {submitting ? '제출 중...' : '신청서 제출'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --testPathPattern="components/PetitionForm" --no-coverage
```

Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add components/petition/PetitionForm.tsx __tests__/components/PetitionForm.test.tsx
git commit -m "feat: add PetitionForm component with validation and phone masking"
```

---

## Task 8: 공개 페이지 — 선택 화면 + 폼 페이지

**Files:**
- Create: `app/petition/page.tsx`
- Create: `app/petition/election/page.tsx`
- Create: `app/petition/board/page.tsx`

- [ ] **Step 1: 양식 선택 화면 구현**

`app/petition/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PetitionPage() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="max-w-lg mx-auto p-6 pt-12 text-center space-y-6">
      <h1 className="text-lg font-bold text-[#111]">방청신청서 제출</h1>
      <p className="text-sm text-[#666]">신청할 회의 종류를 선택해주세요.</p>
      <div className="flex flex-col gap-3">
        <Link
          href="/petition/election"
          className="py-4 border-2 border-[#FF6200] text-[#FF6200] font-bold rounded-xl hover:bg-[#fff5f0]"
        >
          선거관리위원회 방청신청서
        </Link>
        <Link
          href="/petition/board"
          className="py-4 border-2 border-[#333] text-[#333] font-bold rounded-xl hover:bg-[#f5f5f5]"
        >
          입주자대표회의 방청신청서
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 선관위 폼 페이지 구현**

`app/petition/election/page.tsx`:

```tsx
import PetitionForm from '@/components/petition/PetitionForm'

export default function ElectionPetitionPage() {
  return <PetitionForm formType="election" />
}
```

- [ ] **Step 3: 입대위 폼 페이지 구현**

`app/petition/board/page.tsx`:

```tsx
import PetitionForm from '@/components/petition/PetitionForm'

export default function BoardPetitionPage() {
  return <PetitionForm formType="board" />
}
```

- [ ] **Step 4: 개발 서버에서 동작 확인**

브라우저에서 `http://localhost:3000/petition` 접근 → 두 버튼 노출 확인 → 각 링크 클릭 시 폼 진입 확인.

- [ ] **Step 5: 커밋**

```bash
git add app/petition/page.tsx app/petition/election/page.tsx app/petition/board/page.tsx
git commit -m "feat: add petition selection and form pages"
```

---

## Task 9: 완료 화면 + 클라이언트 PDF 다운로드

**Files:**
- Create: `app/petition/complete/page.tsx`

- [ ] **Step 1: complete 페이지 구현**

`app/petition/complete/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { PetitionDocument, type PetitionDocumentProps } from '@/lib/petition-pdf'
import Link from 'next/link'

export default function PetitionCompletePage() {
  const searchParams = useSearchParams()
  const sent = searchParams.get('sent') === 'true'
  const [petitionData, setPetitionData] = useState<PetitionDocumentProps | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('petition_data')
    if (stored) {
      setPetitionData(JSON.parse(stored))
      sessionStorage.removeItem('petition_data')
    }
  }, [])

  const phone = process.env.NEXT_PUBLIC_MANAGEMENT_PHONE ?? '032-512-9085'
  const managementEmail = process.env.NEXT_PUBLIC_MANAGEMENT_EMAIL ?? 'samsan1@hanmail.net'

  return (
    <div className="max-w-lg mx-auto p-6 pt-12 space-y-6">
      <div className={`rounded-xl p-5 ${sent ? 'bg-green-50' : 'bg-red-50'}`}>
        <p className={`font-bold mb-2 ${sent ? 'text-green-700' : 'text-red-600'}`}>
          {sent ? '✅ 제출 완료' : '❌ 발송 실패'}
        </p>
        <p className="text-sm text-[#444] leading-relaxed">
          {sent
            ? `관리소로 신청서가 발송됐어요. 관리소(${phone})에 수신여부를 꼭 확인해주세요. 의도치않은 오류 발생시 발송이 실패할 수도 있어요.`
            : `발송에 실패했어요. 아래 PDF를 직접 관리소 이메일(${managementEmail})로 보내주세요.`
          }
        </p>
      </div>

      {petitionData ? (
        <PDFDownloadLink
          document={<PetitionDocument {...petitionData} />}
          fileName="방청신청서.pdf"
          className="block w-full py-3 bg-[#111] text-white font-bold rounded-xl text-center"
        >
          {({ loading }) => loading ? 'PDF 준비 중...' : 'PDF 다운로드'}
        </PDFDownloadLink>
      ) : (
        <p className="text-sm text-[#aaa] text-center">
          페이지를 새로고침하면 PDF 다운로드가 불가해요.
        </p>
      )}

      <Link href="/" className="block text-center text-sm text-[#888] underline">
        홈으로 돌아가기
      </Link>
    </div>
  )
}
```

> **Note:** `NEXT_PUBLIC_MANAGEMENT_PHONE`, `NEXT_PUBLIC_MANAGEMENT_EMAIL`을 `.env.local`에 추가:
> ```
> NEXT_PUBLIC_MANAGEMENT_PHONE=032-512-9085
> NEXT_PUBLIC_MANAGEMENT_EMAIL=samsan1@hanmail.net  # 완료화면 안내용 — 실제 수신주소와 별개
> ```

- [ ] **Step 2: .env.local에 public env 추가**

```
NEXT_PUBLIC_MANAGEMENT_PHONE=032-512-9085
NEXT_PUBLIC_MANAGEMENT_EMAIL=samsan1@hanmail.net  # 완료화면 안내용 — 실제 수신주소와 별개
```

- [ ] **Step 3: 개발 서버에서 폼 제출 → 완료 화면 흐름 확인**

브라우저에서 폼 작성 후 제출 → `/petition/complete` 이동 → 상태 메시지 + PDF 다운로드 버튼 확인.

- [ ] **Step 4: 커밋**

```bash
git add app/petition/complete/page.tsx
git commit -m "feat: add petition complete page with client-side PDF download"
```

---

## Task 10: 관리자 보드 /admin/petitions

> **중요**: `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 비밀키. 브라우저 클라이언트에서 직접 호출하면 devtools에 노출됨. 대신 `GET /api/petition/list` API route를 먼저 만들고, 관리자 페이지는 이 route를 fetch해서 데이터를 받음.

**Files:**
- Create: `app/api/petition/list/route.ts`
- Create: `app/admin/petitions/page.tsx`

- [ ] **Step 1: GET /api/petition/list route 구현 (서버사이드 데이터 조회)**

`app/api/petition/list/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase, getAllPetitions } from '@/lib/petition'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceSupabase()
  const { data: { user } } = await serviceClient.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const petitions = await getAllPetitions(serviceClient)
  return NextResponse.json(petitions)
}
```

- [ ] **Step 2: 관리자 페이지 구현**

`app/admin/petitions/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/app/supabase'
import type { Petition } from '@/lib/petition'

export default function AdminPetitionsPage() {
  const [petitions, setPetitions] = useState<Petition[]>([])
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const res = await fetch('/api/petition/list', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) setPetitions(await res.json())
    }).finally(() => setLoading(false))
  }, [])

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function handleResend(id: string) {
    setResending(id)
    const token = await getToken()
    try {
      const res = await fetch(`/api/petition/resend/${id}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        setPetitions(prev => prev.map(p => p.id === id ? { ...p, email_sent: true, email_error: null } : p))
      } else {
        alert('재발송에 실패했어요.')
      }
    } finally {
      setResending(null)
    }
  }

  const failedCount = petitions.filter(p => !p.email_sent).length

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-[#888]">← 기사 관리</Link>
          <h1 className="text-xl font-bold text-[#111]">
            방청신청 내역
            {failedCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">
                {failedCount}
              </span>
            )}
          </h1>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-[#aaa] py-10">불러오는 중...</p>
      ) : petitions.length === 0 ? (
        <p className="text-center text-[#aaa] py-10">신청 내역이 없어요.</p>
      ) : (
        <div className="space-y-3">
          {petitions.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#f0f0f0] text-[#444] mr-2">
                    {p.form_type === 'election' ? '선관위' : '입대위'}
                  </span>
                  <span className="text-sm font-medium text-[#111]">
                    {p.applicants[0]?.name}
                    {p.applicants.length > 1 && ` 외 ${p.applicants.length - 1}명`}
                  </span>
                  <span className="text-xs text-[#aaa] ml-2">{p.applicants[0]?.unit}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  p.email_sent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {p.email_sent ? '발송완료' : '미발송'}
                </span>
              </div>

              <div className="text-xs text-[#888] mb-2">
                신청일 {p.petition_date} · 회의일 {p.meeting_date} {p.meeting_time} · 접수 {formatDateTime(p.created_at)}
              </div>

              {/* 신청자 상세 */}
              <div className="text-xs text-[#666] space-y-0.5 mb-3">
                {p.applicants.map((a, i) => (
                  <div key={i}>{i + 1}. {a.unit} {a.name} {a.phone}</div>
                ))}
              </div>

              {p.email_error && (
                <p className="text-xs text-red-400 mb-2">오류: {p.email_error}</p>
              )}

              {!p.email_sent && (
                <button
                  onClick={() => handleResend(p.id)}
                  disabled={resending === p.id}
                  className="px-3 py-1.5 bg-[#FF6200] text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {resending === p.id ? '발송 중...' : '재발송'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 관리자 메인 페이지에 방청신청 링크 추가**

`app/admin/page.tsx`의 헤더 버튼 영역에 추가:

```tsx
<Link href="/admin/petitions"
  className="px-3 py-2 border border-[#ddd] text-sm text-[#444] rounded-lg">
  📋 방청신청
</Link>
```

기존 `📬 제보` 버튼 앞에 삽입.

- [ ] **Step 3: 브라우저에서 확인**

`http://localhost:3000/admin/petitions` 접근 → 신청 목록, 재발송 버튼 확인.

- [ ] **Step 4: 커밋**

```bash
git add app/admin/petitions/page.tsx app/admin/page.tsx
git commit -m "feat: add admin petitions board with resend"
```

---

## Task 11: 홈 화면 우측 최하단에 테스트 진입 링크 추가

> **테스트 단계**: 일반 유저에게 노출하지 않음. 화면 우측 최하단에 아주 작고 흐린 "test" 텍스트 링크로만 진입. 실서비스 전 눈에 띄는 버튼으로 교체 예정.

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: app/page.tsx 읽기**

현재 홈 화면 구조 파악 후 최하단 마크업 확인.

- [ ] **Step 2: 홈 화면 최하단 우측에 테스트 링크 추가**

홈 화면 최하단 (전체 컨테이너 바깥 or 마지막 자식)에 추가:

```tsx
{/* 테스트용 진입 링크 — 실서비스 전 제거 또는 정식 버튼으로 교체 */}
<div className="flex justify-end px-4 pb-4">
  <Link href="/petition" className="text-[10px] text-[#ddd] hover:text-[#bbb]">
    test
  </Link>
</div>
```

- [ ] **Step 3: 브라우저에서 확인**

홈 화면 우측 최하단에 흐린 "test" 텍스트 확인 → 클릭 시 `/petition` 이동 확인.

- [ ] **Step 4: 전체 테스트 실행**

```bash
npm test -- --no-coverage
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add components/petition/PetitionSection.tsx app/page.tsx
git commit -m "feat: add petition entry button to home page"
```

---

## Task 12: Gmail 계정 연동 + 환경변수 완성

> Gmail 계정 준비되면 진행.

- [ ] **Step 1: Gmail 앱 비밀번호 발급**

1. 새 Gmail 계정 로그인
2. Google 계정 → 보안 → 2단계 인증 활성화
3. 앱 비밀번호 → "메일" / "기타(직접입력)" → 16자리 비밀번호 생성

- [ ] **Step 2: .env.local 완성**

```
GMAIL_USER=새계정@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
SUPABASE_SERVICE_ROLE_KEY=Supabase_대시보드_Settings_API_service_role_key
```

- [ ] **Step 3: 로컬에서 실제 이메일 발송 테스트**

폼 작성 후 제출 → 관리소 이메일(`samsan1@hanmail.net`) 실제 수신 확인 → Telegram 알림 확인 (의도적으로 GMAIL_APP_PASSWORD를 틀리게 입력 후 재테스트).

- [ ] **Step 4: Vercel 환경변수 등록**

Vercel 대시보드 → Project Settings → Environment Variables에 모든 항목 추가 (NEXT_PUBLIC_ 포함).

- [ ] **Step 5: 배포 후 프로덕션 테스트**

`vercel --prod` 또는 git push → 프로덕션 URL에서 실제 제출 테스트.
