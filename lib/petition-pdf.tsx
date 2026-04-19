import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
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
              {[0, 1, 2, 3, 4].map(j => (
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
