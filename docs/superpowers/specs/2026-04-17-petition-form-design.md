# 방청신청서 제출 기능 설계

**작성일**: 2026-04-17  
**프로젝트**: 삼산타운1차 아파트 소식지 (Next.js + Supabase + Vercel)

---

## 개요

입주민이 선거관리위원회 또는 입주자대표회의 방청신청서를 웹에서 작성하여 관리소 이메일로 제출할 수 있는 기능. 제출된 신청서는 PDF로 생성되어 관리소로 발송되며, 관리자 보드에서 발송 내역과 결과를 관리할 수 있다.

---

## 라우트 구조

| 경로 | 유형 | 설명 |
|---|---|---|
| `/petition` | 공개 | 양식 선택 화면 |
| `/petition/election` | 공개 | 선관위 방청신청서 폼 |
| `/petition/board` | 공개 | 입대위 방청신청서 폼 |
| `/petition/complete` | 공개 | 제출 완료 화면 (PDF 다운로드) |
| `/api/petition/submit` | API (POST) | 제출 처리 (rate limit 적용) |
| `/api/petition/resend/[id]` | API (POST) | 관리자 재발송 (인증 필요) |
| `/admin/petitions` | 관리자 | 신청 내역 + 발송결과 + 재발송 |

**PDF 다운로드**: 별도 API route 없음. 제출 완료 후 클라이언트 state에서 `@react-pdf/renderer`로 브라우저에서 직접 생성 및 다운로드. 서버 PDF route 불필요 — 개인정보 노출 위험 제거.

---

## UX 흐름

### 홈 화면 하단
- [선관위/입대위 방청신청서 제출] 버튼
- 클릭 시 두 버튼 노출: [선관위 방청신청서 작성], [입대위 방청신청서 작성]
- 각 버튼 클릭 시 해당 폼으로 이동

### 폼 화면
1. 신청일자 (date picker, 요일 자동 계산)
2. 회의 개최 일자 + 시간 (date picker + time picker)
3. 신청자 목록 (최대 6명)
   - 동-호수, 성명, 전화번호
   - [+ 신청자 추가] 버튼
4. 이메일 주소 (선택) — "PDF 사본을 받으려면 입력하세요"
5. 개인정보 안내 문구:
   > "입력하신 정보는 발송관리를 위해 저장돼요. 사이트 관리자만 조회할 수 있으며, 입력하신 정보는 발송여부 확인목적 외에 이용되지 않아요. 동의하실 경우 [신청서 제출] 버튼을 클릭해주세요."
6. [신청서 제출] 버튼

### 완료 화면
- **성공 시**: "관리소로 신청서가 발송됐어요. 관리소(032-512-9085)에 수신여부를 꼭 확인해주세요. 의도치않은 오류 발생시 발송이 실패할 수도 있어요."
- **실패 시**: "발송에 실패했어요. 아래 PDF를 직접 관리소 이메일(samsan1@hanmail.net)로 보내주세요."
- 공통: [PDF 다운로드] 버튼

---

## PDF 생성

- 라이브러리: `@react-pdf/renderer` (서버/클라이언트 양쪽 지원)
- 선관위/입대위 양식을 React 컴포넌트로 재현 (원본 레이아웃 참고)
- 서명란: 성명 텍스트로 대체
- **두 가지 생성 경로**:
  - **이메일 첨부용**: `/api/petition/submit` 내에서 서버 사이드 생성 (메모리 내, 파일 저장 없음)
  - **다운로드용**: `/petition/complete` 클라이언트에서 브라우저 사이드 생성 (제출 데이터를 state로 전달)

**PDF 포함 정보**:
- 양식 제목 (선관위 or 입대위)
- 신청일자 (년/월/일/요일)
- 회의 개최 일자 + 시간
- 신청자 테이블 (동-호수, 성명, 전화번호, 서명)
- 하단 수신처 문구

---

## 이메일 발송

- 라이브러리: `nodemailer` + Gmail SMTP (전용 Google 계정)
- 수신처: `samsan1@hanmail.net` (관리소)
- 발신자: 전용 Gmail 계정 (환경변수로 관리)

**제출 처리 순서**:
1. `petitions` 테이블에 저장 (`email_sent: false`)
2. `@react-pdf/renderer`로 PDF 생성
3. 관리소 이메일로 PDF 첨부 발송
   - 성공 → `email_sent: true`
   - 실패 → `email_error` 저장 + Telegram 알림 전송
4. 신청자 이메일 있으면 PDF 사본 발송 (실패해도 조용히 처리)
5. 완료 응답 반환 (성공/실패 여부 포함)

---

## Telegram 알림

- 발송 실패 시 관리자에게 즉시 알림
- 메시지 형식: `"📋 방청신청 이메일 발송 실패 - 선관위 / 홍길동 외 2명 (104-506)"`
- 환경변수: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

---

## DB 스키마 (`petitions` 테이블)

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
form_type     text NOT NULL  -- 'election' | 'board'
petition_date date NOT NULL
meeting_date  date NOT NULL
meeting_time  time NOT NULL
applicants    jsonb NOT NULL  -- [{unit, name, phone}, ...]
email         text            -- nullable
email_sent    boolean NOT NULL DEFAULT false
email_error   text            -- nullable
created_at    timestamptz NOT NULL DEFAULT now()
```

**RLS 정책**:
- INSERT: anon 허용 (공개 폼 제출용)
- SELECT/UPDATE: authenticated만 허용 (관리자 보드)
- API Route에서 관리자 조회 시 `SUPABASE_SERVICE_ROLE_KEY` 사용

---

## 관리자 보드 (`/admin/petitions`)

- 신청 목록: 날짜, 양식 종류, 신청자 수, 발송 결과
- 신청자 상세 정보 조회 가능 (이름, 동호수, 연락처)
- 미발송 건: 빨간 뱃지 표시 + [재발송] 버튼
- 기존 관리자 인증(Supabase Auth) 그대로 사용

---

## 환경변수

실제 값은 `.env.local`과 Vercel 대시보드에만 저장. 스펙에는 키 이름만 명시.

```
GMAIL_USER=
GMAIL_APP_PASSWORD=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
MANAGEMENT_EMAIL=samsan1@hanmail.net
MANAGEMENT_PHONE=032-512-9085
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 이메일 내용

**관리소 수신 이메일 (`samsan1@hanmail.net`)**
- 제목: `[방청신청] 선관위 방청신청서 접수 - 홍길동 외 N명 (2026-04-17)`
- 본문:
  > 첨부된 방청신청서를 확인해주세요.
  > 작성내용에 문제가 있을 경우, 신청자 연락처로 연락하시기 바랍니다.
  > 본 이메일로 답신할 경우 확인할 수 없습니다.
- 첨부: 생성된 PDF

**신청자 수신 이메일 (선택 입력한 경우)**
- 제목: `[삼산타운1차 소식지] 방청신청서 제출 완료 안내`
- 본문:
  > 안녕하세요.
  > 방청신청서가 관리소(samsan1@hanmail.net)로 발송됐어요.
  >
  > 수신 여부는 관리소(032-512-9085)에 직접 확인해주세요.
  > 의도치 않은 오류로 발송이 실패할 수 있으니 꼭 확인 부탁드려요.
  >
  > 신청서 사본은 첨부 파일을 확인해주세요.
- 첨부: 생성된 PDF

---

## 기술 스택 추가사항

| 항목 | 라이브러리 |
|---|---|
| PDF 생성 | `@react-pdf/renderer` (서버 API + 클라이언트 양쪽 지원) |
| 이메일 발송 | `nodemailer` |
| 기존 스택 | Next.js 14, Supabase, Tailwind CSS, Vercel |

**설치 필요**: `npm install @react-pdf/renderer nodemailer @types/nodemailer`  
**주의**: `@react-pdf/renderer` PDF 생성 컴포넌트는 server-only 파일 경계 필요. `next.config.mjs`에 `transpilePackages` 추가 확인 필요.

---

## 보안 및 운영 고려사항

**Rate Limiting**: `/api/petition/submit`은 IP당 60초에 1회로 제한. Vercel 서버리스는 프로세스가 매 요청마다 새로 생성되므로 in-memory 방식 불가 — Supabase `petitions` 테이블에서 동일 IP의 최근 제출 기록 조회로 구현. 관리소 이메일 스팸 방지 목적.

**Vercel 타임아웃**: Hobby 플랜 기본 10초. PDF 생성 + SMTP 발송이 타임아웃될 경우 DB는 저장되지만 Telegram 알림 미발송 가능. 허용 가능한 트레이드오프로 수용.

**완료 화면 새로고침**: `/petition/complete`는 제출 ID를 query param으로 전달 (`?id=xxx`). 새로고침 시 ID로 상태 재조회 가능.

**개인정보 동의 문구 (최종)**:
> "입력하신 정보는 발송관리를 위해 저장돼요. 사이트 관리자만 조회할 수 있으며, 입력하신 정보는 발송여부 확인목적 외에 이용되지 않아요. 정보는 발송 확인 후 6개월 이내 삭제됩니다. 동의하실 경우 [신청서 제출] 버튼을 클릭해주세요."

**입력 유효성 검사**:
- 전화번호: `010-XXXX-XXXX` 형식 마스킹 및 검증
- 동-호수: 숫자-숫자 형식 검증
- 이메일: 표준 이메일 형식 검증 (입력 시)
