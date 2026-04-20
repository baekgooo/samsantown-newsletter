import path from 'path'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { Applicant, FormType } from './petition'

const isServer = typeof window === 'undefined'
const fontBase = isServer
  ? path.join(process.cwd(), 'public/fonts')
  : '/fonts'

Font.register({
  family: 'NanumGothic',
  fonts: [
    { src: `${fontBase}/NanumGothic-Regular.ttf` },
    { src: `${fontBase}/NanumGothic-Bold.ttf`, fontWeight: 'bold' },
  ],
})

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { year: '', month: '', day: '', dayOfWeek: '' }
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    dayOfWeek: DAYS[d.getDay()],
  }
}

const B = '1pt solid #000'
const T = '0.5pt solid #666'

const s = StyleSheet.create({
  page: {
    paddingTop: 45, paddingBottom: 45,
    paddingLeft: 50, paddingRight: 50,
    fontFamily: 'NanumGothic', fontSize: 10,
  },

  // 제목
  title: {
    fontSize: 20, fontWeight: 'bold', textAlign: 'center',
    marginBottom: 20, letterSpacing: 3,
  },

  // 필드 행
  fieldRow: { flexDirection: 'row', marginBottom: 9, alignItems: 'flex-start' },
  fieldLabel: { width: 155, fontSize: 10 },
  fieldValue: { flex: 1, fontSize: 10 },

  // "4. 신청자" 라벨
  sectionLabel: { fontSize: 10, marginBottom: 3, marginTop: 2 },

  // 표 — 외곽 테두리
  table: {
    borderTop: B, borderLeft: B, borderRight: B,
    marginBottom: 10,
  },

  // 헤더 행
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottom: B,
  },

  // 데이터 행
  dataRow: {
    flexDirection: 'row',
    borderBottom: B,
    minHeight: 22,
  },

  // 마지막 행 (borderBottom 없음 — 외곽으로 처리)
  dataRowLast: {
    flexDirection: 'row',
    minHeight: 22,
  },

  // 셀 공통
  cell: { borderRight: B, justifyContent: 'center', alignItems: 'center', padding: '4 3' },
  cellLast: { justifyContent: 'center', alignItems: 'center', padding: '4 3' },

  // 열 너비
  colNo:    { width: 28 },
  colUnit:  { width: 68 },
  colName:  { width: 62 },
  colPhone: { flex: 1 },
  colSign:  { width: 58 },

  cellText: { fontSize: 9, textAlign: 'center' },

  // 고지문 박스
  noticeBox: {
    borderTop: B, borderLeft: B, borderRight: B, borderBottom: B,
    padding: '7 8', marginBottom: 7,
  },
  noticeTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 3 },
  noticePara: { fontSize: 8.5, lineHeight: 1.6, marginBottom: 2 },
  noticeItem: { fontSize: 8.5, lineHeight: 1.6, marginLeft: 8 },

  // 참고 박스 (입대위 전용)
  refBox: {
    borderTop: B, borderLeft: B, borderRight: B, borderBottom: B,
    padding: '7 8', marginBottom: 7,
  },
  refPara: { fontSize: 8.5, lineHeight: 1.6, marginBottom: 1 },
  refItem: { fontSize: 8.5, lineHeight: 1.6, marginLeft: 8 },

  // 신청 근거 문구
  submitLine: { fontSize: 9, marginTop: 6, marginBottom: 2 },

  // 수신처
  footer: {
    fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginTop: 16,
  },
})

export interface PetitionDocumentProps {
  formType: FormType
  petitionDate: string
  meetingDate: string
  meetingTime: string
  applicants: Applicant[]
}

const HEADER_COLS = ['번 호', '동. 호수', '성  명', '전  화  번  호', '서  명']
const COL_WIDTHS = ['colNo', 'colUnit', 'colName', 'colPhone', 'colSign'] as const

export function PetitionDocument({ formType, petitionDate, meetingDate, meetingTime, applicants }: PetitionDocumentProps) {
  const isElection = formType === 'election'

  const title = isElection
    ? '선거관리위원회의 방청 신청서'
    : '입주자대표회의 회의 방청 신청서'
  const venue = isElection ? '관리사무소' : '입주자대표회의 회의실'
  const field3Label = isElection
    ? '3. 회의 개최 일자 :'
    : '3. 입주자대표회의 개최 일자 :'
  const recipient = isElection
    ? '삼산타운1단지아파트 선거관리위원회 위원장 귀중'
    : '삼산타운 1단지아파트 입주자대표회의 회장 귀중'

  const pd = formatDate(petitionDate)
  const md = formatDate(meetingDate)

  const allRows = [...applicants]
  while (allRows.length < 6) allRows.push({ unit: '', name: '', phone: '' })

  const clause2 = isElection
    ? '② 방청자는 발언할 수 없다. 다만, 의장이 안건심의와 관련하여 발언을 허가한 경우와 전문가에게 필요한 의견을 진술하게 한 경우에는 그러하지 아니한다.'
    : '② 방청인은 발언할 수 없다. 다만, 의장이 안건심의와 관련하여 발언을 허가한 경우와 전문가에게 필요한 의견을 진술하게 한 경우에는 그러하지 아니한다.'
  const clause3Intro = isElection
    ? '③ 의장은 다음 각 호의 어느 하나에 해당하는 자가 방청하고 있는 경우에는 퇴장을 명할 수 있으며, 방청자는 의장의 명에 따라야 한다.'
    : '③ 의장은 다음 각 호의 어느 하나에 해당하는 자가 방청하고 있는 경우에는 퇴장을 명할 수 있으며, 방청인은 의장의 명에 따라야 한다.'
  const clause3Item2 = isElection
    ? '2. 선거관리위원의 발언에 대하여 의견을 개진하거나 손뼉을 치는 사람'
    : '2. 동별 대표자의 발언에 대하여 의견을 개진하거나 손뼉을 치는 사람'

  function Cell({ colKey, isLast, children }: { colKey: typeof COL_WIDTHS[number], isLast?: boolean, children?: React.ReactNode }) {
    return React.createElement(
      View,
      { style: [isLast ? s.cellLast : s.cell, s[colKey]] },
      React.createElement(Text, { style: s.cellText }, children ?? '')
    )
  }

  return (
    React.createElement(Document, null,
      React.createElement(Page, { size: 'A4', style: s.page },

        // 제목
        React.createElement(Text, { style: s.title }, title),

        // 필드 1~3
        React.createElement(View, { style: s.fieldRow },
          React.createElement(Text, { style: s.fieldLabel }, '1. 신청 일자 :'),
          React.createElement(Text, { style: s.fieldValue },
            pd.year ? `${pd.year}년  ${pd.month}월  ${pd.day}일  (${pd.dayOfWeek})` : '')
        ),
        React.createElement(View, { style: s.fieldRow },
          React.createElement(Text, { style: s.fieldLabel }, '2. 장        소 :'),
          React.createElement(Text, { style: s.fieldValue }, venue)
        ),
        React.createElement(View, { style: s.fieldRow },
          React.createElement(Text, { style: s.fieldLabel }, field3Label),
          React.createElement(Text, { style: s.fieldValue },
            md.year ? `${md.year}년  ${md.month}월  ${md.day}일  (${md.dayOfWeek})  ${meetingTime}` : '')
        ),

        // 4. 신청자
        React.createElement(Text, { style: s.sectionLabel }, '4. 신  청  자'),

        // 표
        React.createElement(View, { style: s.table },
          // 헤더
          React.createElement(View, { style: s.headerRow },
            ...HEADER_COLS.map((h, i) =>
              React.createElement(Cell, { key: h, colKey: COL_WIDTHS[i], isLast: i === 4 }, h)
            )
          ),
          // 데이터 행
          ...allRows.map((a, i) =>
            React.createElement(View, { key: i, style: i < 5 ? s.dataRow : s.dataRowLast },
              React.createElement(Cell, { colKey: 'colNo' }, String(i + 1)),
              React.createElement(Cell, { colKey: 'colUnit' }, a.unit),
              React.createElement(Cell, { colKey: 'colName' }, a.name),
              React.createElement(Cell, { colKey: 'colPhone' }, a.phone),
              React.createElement(Cell, { colKey: 'colSign', isLast: true }, '')
            )
          )
        ),

        // 고지문 박스
        React.createElement(View, { style: s.noticeBox },
          React.createElement(Text, { style: s.noticeTitle }, '(회의 방청)'),
          React.createElement(Text, { style: s.noticePara },
            '① 의장은 회의를 개최함에 있어 입주자 등 이해 관계자가 1일전에 요청을 한 경우 공동주택관리의 투명화를 위하여 회의를 방청하게 하여야 하나, 다음 각 호의 어느 하나에 해당하는 자는 방청을 제한한다.'),
          React.createElement(Text, { style: s.noticeItem }, '1. 흉기 또는 위험한 물품을 휴대한 사람'),
          React.createElement(Text, { style: s.noticeItem }, '2. 음주자 또는 정신 이상이 있는 사람'),
          React.createElement(Text, { style: s.noticePara }, clause2),
          React.createElement(Text, { style: s.noticePara }, clause3Intro),
          React.createElement(Text, { style: s.noticeItem }, '1. 폭력 및 욕설을 하는 등 질서유지에 방해가 되는 사람'),
          React.createElement(Text, { style: s.noticeItem }, clause3Item2),
          React.createElement(Text, { style: s.noticeItem }, '3. 방청하면서 식음, 흡연을 하거나 잡지 등을 보는 사람'),
          React.createElement(Text, { style: s.noticeItem }, '4. 허락 없이 녹음, 비디오 및 사진 촬영을 하는 사람'),
          React.createElement(Text, { style: s.noticeItem }, '5. 그 밖에 회의 진행을 방해하는 사람')
        ),

        // 참고 (입대위 전용)
        ...(!isElection ? [
          React.createElement(View, { key: 'ref', style: s.refBox },
            React.createElement(Text, { style: s.refPara }, '(참고)'),
            React.createElement(Text, { style: s.refItem }, '1. 방청 근거: 관리규약 제 35조'),
            React.createElement(Text, { style: s.refItem }, '2. 주민임을 입증할 수 있는 증표를(신분증 등) 제시 바랍니다.'),
            React.createElement(Text, { style: s.refItem }, '3. 방청자가 많을 경우 회의 진행상 대표자를 선정하여 주시기 바랍니다.'),
            React.createElement(Text, { style: s.refItem }, '4. 입주자대표회의 시작 1일 전까지 신청서를 제출하여 주십시오.')
          ),
          React.createElement(Text, { key: 'submit', style: s.submitLine },
            '관리규약 제35조(회의 방청)에 의거 하여 입주자대표회의 회의 방청을 신청합니다.')
        ] : []),

        // 수신처
        React.createElement(Text, { style: s.footer }, recipient)
      )
    )
  )
}
