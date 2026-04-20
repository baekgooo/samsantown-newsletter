import path from 'path'
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

const styles = StyleSheet.create({
  page: { paddingTop: 50, paddingBottom: 50, paddingLeft: 55, paddingRight: 55, fontFamily: 'NanumGothic', fontSize: 10 },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 28, letterSpacing: 2 },
  fieldRow: { flexDirection: 'row', marginBottom: 10 },
  fieldLabel: { width: 160 },
  fieldValue: { flex: 1 },
  sectionLabel: { marginBottom: 6, marginTop: 2 },
  table: { marginTop: 4, borderTop: '1pt solid #000', borderLeft: '1pt solid #000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5' },
  tableRow: { flexDirection: 'row' },
  // column widths mirroring original: 번호(narrow), 동호수, 성명, 전화번호, 서명
  colNo:    { width: 35,  padding: '5 4', borderRight: '1pt solid #000', borderBottom: '1pt solid #000', textAlign: 'center', fontSize: 9 },
  colUnit:  { width: 70,  padding: '5 4', borderRight: '1pt solid #000', borderBottom: '1pt solid #000', textAlign: 'center', fontSize: 9 },
  colName:  { width: 65,  padding: '5 4', borderRight: '1pt solid #000', borderBottom: '1pt solid #000', textAlign: 'center', fontSize: 9 },
  colPhone: { flex: 1,    padding: '5 4', borderRight: '1pt solid #000', borderBottom: '1pt solid #000', textAlign: 'center', fontSize: 9 },
  colSign:  { width: 65,  padding: '5 4', borderBottom: '1pt solid #000', textAlign: 'center', fontSize: 9 },
  noticeBox: { marginTop: 12, borderTop: '1pt solid #000', borderBottom: '1pt solid #000', borderLeft: '1pt solid #000', borderRight: '1pt solid #000', padding: '6 8' },
  noticeTitle: { fontWeight: 'bold', marginBottom: 4, fontSize: 9 },
  noticeLine: { fontSize: 8.5, lineHeight: 1.55, marginBottom: 1 },
  noticeIndent: { fontSize: 8.5, lineHeight: 1.55, marginBottom: 1, marginLeft: 10 },
  referenceBox: { marginTop: 8, padding: '5 8', fontSize: 8.5, lineHeight: 1.55 },
  submitLine: { marginTop: 10, fontSize: 9, textAlign: 'left' },
  footer: { marginTop: 18, fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
})

export interface PetitionDocumentProps {
  formType: FormType
  petitionDate: string
  meetingDate: string
  meetingTime: string
  applicants: Applicant[]
}

const HEADERS = ['번 호', '동. 호수', '성  명', '전  화  번  호', '서  명']

export function PetitionDocument({ formType, petitionDate, meetingDate, meetingTime, applicants }: PetitionDocumentProps) {
  const isElection = formType === 'election'
  const title = isElection ? '선거관리위원회의 방청 신청서' : '입주자대표회의 회의 방청 신청서'
  const venue = isElection ? '관리사무소' : '입주자대표회의 회의실'
  const field3Label = isElection ? '3. 회의 개최 일자 :' : '3. 입주자대표회의 개최 일자 :'
  const recipient = isElection
    ? '삼산타운1단지아파트 선거관리위원회 위원장 귀중'
    : '삼산타운 1단지아파트 입주자대표회의 회장 귀중'

  const pd = formatDate(petitionDate)
  const md = formatDate(meetingDate)
  const emptyRows = Math.max(0, 6 - applicants.length)

  // 법령 고지문 — 선관위/입대위 차이 반영
  const clause2 = isElection
    ? '② 방청자는 발언할 수 없다. 다만, 의장이 안건심의와 관련하여 발언을 허가한 경우와 전문가에게 필요한 의견을 진술하게 한 경우에는 그러하지 아니한다.'
    : '② 방청인은 발언할 수 없다. 다만, 의장이 안건심의와 관련하여 발언을 허가한 경우와 전문가에게 필요한 의견을 진술하게 한 경우에는 그러하지 아니한다.'

  const clause3Header = isElection
    ? '③ 의장은 다음 각 호의 어느 하나에 해당하는 자가 방청하고 있는 경우에는 퇴장을 명할 수 있으며, 방청자는 의장의 명에 따라야 한다.'
    : '③ 의장은 다음 각 호의 어느 하나에 해당하는 자가 방청하고 있는 경우에는 퇴장을 명할 수 있으며, 방청인은 의장의 명에 따라야 한다.'

  const clause3Item2 = isElection
    ? '2. 선거관리위원의 발언에 대하여 의견을 개진하거나 손뼉을 치는 사람'
    : '2. 동별 대표자의 발언에 대하여 의견을 개진하거나 손뼉을 치는 사람'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>1. 신청 일자 :</Text>
          <Text style={styles.fieldValue}>{pd.year}년 {pd.month}월 {pd.day}일 {pd.dayOfWeek}요일</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>2. 장　　소 :</Text>
          <Text style={styles.fieldValue}>{venue}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{field3Label}</Text>
          <Text style={styles.fieldValue}>{md.year}년 {md.month}월 {md.day}일 {md.dayOfWeek}요일 {meetingTime}</Text>
        </View>
        <Text style={styles.sectionLabel}>4. 신　청　자</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>{HEADERS[0]}</Text>
            <Text style={styles.colUnit}>{HEADERS[1]}</Text>
            <Text style={styles.colName}>{HEADERS[2]}</Text>
            <Text style={styles.colPhone}>{HEADERS[3]}</Text>
            <Text style={styles.colSign}>{HEADERS[4]}</Text>
          </View>
          {applicants.map((a, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colNo}>{i + 1}</Text>
              <Text style={styles.colUnit}>{a.unit}</Text>
              <Text style={styles.colName}>{a.name}</Text>
              <Text style={styles.colPhone}>{a.phone}</Text>
              <Text style={styles.colSign}></Text>
            </View>
          ))}
          {Array.from({ length: emptyRows }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.tableRow}>
              <Text style={styles.colNo}>{applicants.length + i + 1}</Text>
              <Text style={styles.colUnit}></Text>
              <Text style={styles.colName}></Text>
              <Text style={styles.colPhone}></Text>
              <Text style={styles.colSign}></Text>
            </View>
          ))}
        </View>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>(회의 방청)</Text>
          <Text style={styles.noticeLine}>① 의장은 회의를 개최함에 있어 입주자 등 이해 관계자가 1일전에 요청을 한 경우 공동주택관리의 투명화를 위하여 회의를 방청하게 하여야 하나, 다음 각 호의 어느 하나에 해당하는 자는 방청을 제한한다.</Text>
          <Text style={styles.noticeIndent}>1. 흉기 또는 위험한 물품을 휴대한 사람</Text>
          <Text style={styles.noticeIndent}>2. 음주자 또는 정신 이상이 있는 사람</Text>
          <Text style={styles.noticeLine}>{clause2}</Text>
          <Text style={styles.noticeLine}>{clause3Header}</Text>
          <Text style={styles.noticeIndent}>1. 폭력 및 욕설을 하는 등 질서유지에 방해가 되는 사람</Text>
          <Text style={styles.noticeIndent}>{clause3Item2}</Text>
          <Text style={styles.noticeIndent}>3. 방청하면서 식음, 흡연을 하거나 잡지 등을 보는 사람</Text>
          <Text style={styles.noticeIndent}>4. 허락 없이 녹음, 비디오 및 사진 촬영을 하는 사람</Text>
          <Text style={styles.noticeIndent}>5. 그 밖에 회의 진행을 방해하는 사람</Text>
        </View>

        {!isElection && (
          <View style={styles.referenceBox}>
            <Text style={styles.noticeLine}>(참고)</Text>
            <Text style={styles.noticeIndent}>1. 방청 근거: 관리규약 제 35조</Text>
            <Text style={styles.noticeIndent}>2. 주민임을 입증할 수 있는 증표를(신분증 등) 제시 바랍니다.</Text>
            <Text style={styles.noticeIndent}>3. 방청자가 많을 경우 회의 진행상 대표자를 선정하여 주시기 바랍니다.</Text>
            <Text style={styles.noticeIndent}>4. 입주자대표회의 시작 1일 전까지 신청서를 제출하여 주십시오.</Text>
          </View>
        )}

        {!isElection && (
          <Text style={styles.submitLine}>
            관리규약 제35조(회의 방청)에 의거 하여 입주자대표회의 회의 방청을 신청합니다.
          </Text>
        )}

        <Text style={styles.footer}>{recipient}</Text>
      </Page>
    </Document>
  )
}
