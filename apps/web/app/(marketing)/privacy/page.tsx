import type { Metadata } from 'next';
import { CANCELLED_DATA_RETENTION_DAYS } from '@landnote/shared';

export const metadata: Metadata = {
  title: '개인정보처리방침 - 랜드노트',
  description: '랜드노트 개인정보처리방침입니다.',
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        개인정보처리방침
      </h1>
      <p className="mb-12 text-sm text-muted-foreground">
        시행일: 2026년 3월 13일
      </p>

      <div className="space-y-10">
        <p className="text-sm leading-relaxed text-muted-foreground">
          [상호명] (이하 &quot;회사&quot;)는 「개인정보 보호법」 제30조에 따라
          정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게
          처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>

        <Section title="제1조 (개인정보의 처리 목적)">
          <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              <strong className="text-foreground">회원 가입 및 관리:</strong>{' '}
              회원제 서비스 이용에 따른 본인 확인, 회원자격 유지·관리, 서비스
              부정이용 방지, 공인중개사 자격 확인
            </li>
            <li>
              <strong className="text-foreground">서비스 제공:</strong> 고객 문의
              접수·관리, 매물 등록, 스마트 매칭, 통계 제공, QR코드/링크 생성 등
              서비스 제공에 관한 계약 이행
            </li>
            <li>
              <strong className="text-foreground">요금 결제:</strong> 유료서비스
              이용에 대한 정기결제 처리, 결제 내역 관리
            </li>
            <li>
              <strong className="text-foreground">고객 문의 처리:</strong> 고객이
              접수 폼을 통해 제출한 문의를 해당 중개사에게 전달하기 위한 처리
            </li>
            <li>
              <strong className="text-foreground">서비스 개선:</strong> 접속
              통계, 서비스 이용 분석, 신규 기능 개발
            </li>
            <li>
              <strong className="text-foreground">고지 및 통지:</strong> 서비스
              관련 공지사항 전달, 결제 안내, 체험 만료 알림 등 필수 안내
            </li>
          </ol>
        </Section>

        <Section title="제2조 (수집하는 개인정보의 항목 및 수집 방법)">
          <p className="font-medium text-foreground">1. 회원(공인중개사)</p>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                    구분
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                    수집 항목
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2.5">필수</td>
                  <td className="px-4 py-2.5">
                    이름, 이메일 주소, 비밀번호(암호화 저장), 전화번호,
                    공인중개사 자격증번호
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2.5">선택</td>
                  <td className="px-4 py-2.5">사무소명, 프로필 이미지</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2.5">자동 수집</td>
                  <td className="px-4 py-2.5">
                    접속 IP, 접속 일시, 이용 기록(접속 로그)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 font-medium text-foreground">2. 고객(문의 제출자)</p>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                    구분
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                    수집 항목
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2.5">필수</td>
                  <td className="px-4 py-2.5">
                    이름, 전화번호(AES-256-CBC 암호화 저장)
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2.5">선택</td>
                  <td className="px-4 py-2.5">
                    이메일, 희망 조건(거래 유형, 가격, 면적, 희망 지역 등), 매물
                    이미지, 위치 정보(좌표), 메모
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 font-medium text-foreground">3. 수집 방법</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>회원: 회원가입 화면에서 직접 입력</li>
            <li>고객: 접수 폼(QR코드/링크)을 통해 직접 입력</li>
            <li>자동 수집: 서비스 이용 과정에서 시스템에 의해 자동 생성</li>
          </ul>
        </Section>

        <Section title="제3조 (개인정보의 처리 및 보유 기간)">
          <p>
            회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터
            개인정보를 수집 시에 동의받은 개인정보 보유·이용 기간 내에서
            개인정보를 처리·보유합니다.
          </p>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                    보유 항목
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                    보유 기간
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                    근거
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2.5">회원 정보</td>
                  <td className="px-4 py-2.5">
                    탈퇴 후 {CANCELLED_DATA_RETENTION_DAYS}일
                  </td>
                  <td className="px-4 py-2.5">서비스 이용 계약</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2.5">고객 문의 정보</td>
                  <td className="px-4 py-2.5">
                    회원 탈퇴 후 {CANCELLED_DATA_RETENTION_DAYS}일 또는 문의
                    삭제 시
                  </td>
                  <td className="px-4 py-2.5">서비스 제공 계약</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2.5">
                    계약 또는 청약철회 등에 관한 기록
                  </td>
                  <td className="px-4 py-2.5">5년</td>
                  <td className="px-4 py-2.5">전자상거래법</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2.5">
                    대금결제 및 재화 등의 공급에 관한 기록
                  </td>
                  <td className="px-4 py-2.5">5년</td>
                  <td className="px-4 py-2.5">전자상거래법</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2.5">
                    소비자 불만 또는 분쟁 처리에 관한 기록
                  </td>
                  <td className="px-4 py-2.5">3년</td>
                  <td className="px-4 py-2.5">전자상거래법</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2.5">접속 기록(로그)</td>
                  <td className="px-4 py-2.5">3개월 이상</td>
                  <td className="px-4 py-2.5">통신비밀보호법</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="제4조 (개인정보의 제3자 제공)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              회사는 정보주체의 개인정보를 제1조에서 명시한 범위 내에서만
              처리하며, 정보주체의 동의 또는 법률의 특별한 규정 등이 없는 한
              개인정보를 제3자에게 제공하지 않습니다.
            </li>
            <li>
              다만, 고객이 접수 폼을 통해 제출한 문의 정보(이름, 전화번호,
              이메일, 문의 조건 등)는 서비스의 본질적 기능 수행을 위해 해당 접수
              링크를 소유한 회원(공인중개사)에게 제공됩니다. 이는 고객이 폼
              제출 시 인지할 수 있도록 안내됩니다.
            </li>
          </ol>
        </Section>

        <Section title="제5조 (개인정보 처리의 위탁)">
          <p>
            회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를
            위탁하고 있습니다.
          </p>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                    수탁업체
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold text-foreground">
                    위탁 업무
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2.5">Supabase Inc.</td>
                  <td className="px-4 py-2.5">
                    데이터베이스 호스팅, 파일 스토리지, 사용자 인증
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2.5">
                    주식회사 비바리퍼블리카 (Toss Payments)
                  </td>
                  <td className="px-4 py-2.5">결제 처리 및 정기결제 관리</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2.5">Resend Inc.</td>
                  <td className="px-4 py-2.5">이메일 발송 (안내 메일)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2">
            회사는 위탁계약 시 개인정보 보호법에 따라 위탁업무 수행 목적 외
            개인정보 처리 금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에
            대한 관리·감독, 손해배상 등에 관한 사항을 계약서에 명시하고 있습니다.
          </p>
        </Section>

        <Section title="제6조 (개인정보의 파기 절차 및 방법)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가
              불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
            </li>
            <li>
              전자적 파일 형태의 정보는 복구 및 재생이 되지 않도록 기술적 방법을
              사용하여 안전하게 삭제합니다.
            </li>
            <li>
              법령에 따라 보존이 필요한 정보는 해당 기간 동안 별도의 데이터베이스로
              옮겨 보관한 후, 기간 만료 시 파기합니다.
            </li>
          </ol>
        </Section>

        <Section title="제7조 (정보주체의 권리·의무 및 행사 방법)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련
              권리를 행사할 수 있습니다.
              <ol className="mt-1.5 list-[lower-alpha] space-y-1 pl-5">
                <li>개인정보 열람 요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리정지 요구</li>
              </ol>
            </li>
            <li>
              위 권리 행사는 이메일(help@landnote.app)을 통해 할 수 있으며,
              회사는 이에 대해 지체없이 조치합니다.
            </li>
            <li>
              회원은 서비스 내 설정 메뉴에서 자신의 개인정보를 직접 열람·수정할 수
              있으며, 회원탈퇴를 통해 개인정보 삭제를 요청할 수 있습니다.
            </li>
            <li>
              정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우,
              회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나
              제공하지 않습니다.
            </li>
          </ol>
        </Section>

        <Section title="제8조 (개인정보의 안전성 확보 조치)">
          <p>
            회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
            있습니다.
          </p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              <strong className="text-foreground">개인정보 암호화:</strong> 고객
              전화번호는 AES-256-CBC 알고리즘으로 암호화하여 저장하며,
              비밀번호는 해시 함수를 이용하여 암호화 저장합니다.
            </li>
            <li>
              <strong className="text-foreground">접근 통제:</strong>{' '}
              데이터베이스에 행 수준 보안(Row Level Security) 정책을 적용하여
              각 회원은 자신의 데이터에만 접근할 수 있으며, 다른 회원의 고객 정보나
              매물 정보에 접근할 수 없습니다.
            </li>
            <li>
              <strong className="text-foreground">이미지 접근 보안:</strong>{' '}
              이미지 파일은 비공개(private) 스토리지에 저장되며, 1시간 유효한
              서명된 URL(Signed URL)을 통해서만 접근 가능합니다.
            </li>
            <li>
              <strong className="text-foreground">전송 구간 암호화:</strong> 모든
              데이터 전송은 HTTPS(SSL/TLS) 프로토콜을 통해 암호화됩니다.
            </li>
            <li>
              <strong className="text-foreground">접속 기록 보관:</strong> 서비스
              접속 기록을 관리하여 비인가 접근을 탐지합니다.
            </li>
          </ol>
        </Section>

        <Section title="제9조 (자동으로 수집되는 개인정보 및 거부에 관한 사항)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              회사는 서비스 이용 과정에서 다음 정보를 자동으로 수집할 수
              있습니다: 접속 IP 주소, 접속 일시, 서비스 이용 기록, 브라우저 유형.
            </li>
            <li>
              회사는 서비스 운영을 위해 쿠키(Cookie)를 사용할 수 있습니다.
              쿠키는 회원 인증 및 세션 유지 목적으로 사용되며, 브라우저 설정을
              통해 쿠키 저장을 거부할 수 있습니다. 다만 쿠키 저장을 거부할 경우
              로그인이 필요한 일부 서비스 이용에 어려움이 있을 수 있습니다.
            </li>
            <li>
              고객의 위치 정보(좌표)는 접수 폼에서 브라우저 위치 권한 허용 시에만
              수집되며, 허용하지 않아도 서비스 이용에 제한이 없습니다.
            </li>
          </ol>
        </Section>

        <Section title="제10조 (개인정보 보호책임자)">
          <p>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와
            관련한 정보주체의 불만 처리 및 피해구제 등을 위하여 아래와 같이
            개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <div className="mt-2 rounded-lg border bg-muted/30 px-4 py-3">
            <p>
              <strong className="text-foreground">개인정보 보호책임자</strong>
            </p>
            <ul className="mt-1.5 space-y-0.5">
              <li>성명: [담당자명]</li>
              <li>직위: [직위]</li>
              <li>연락처: help@landnote.app</li>
            </ul>
          </div>
          <p className="mt-2">
            정보주체는 서비스를 이용하면서 발생한 모든 개인정보 보호 관련 문의,
            불만 처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의할
            수 있습니다.
          </p>
        </Section>

        <Section title="제11조 (권익침해 구제 방법)">
          <p>
            정보주체는 개인정보침해로 인한 구제를 받기 위하여 아래의 기관에
            분쟁 해결이나 상담 등을 신청할 수 있습니다.
          </p>
          <div className="mt-2 space-y-3">
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <p className="font-medium text-foreground">
                개인정보분쟁조정위원회
              </p>
              <p>전화: 1833-6972 | kopico.go.kr</p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <p className="font-medium text-foreground">
                개인정보침해신고센터 (한국인터넷진흥원)
              </p>
              <p>전화: (국번없이) 118 | privacy.kisa.or.kr</p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <p className="font-medium text-foreground">
                대검찰청 사이버수사과
              </p>
              <p>전화: (국번없이) 1301 | spo.go.kr</p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <p className="font-medium text-foreground">
                경찰청 사이버수사국
              </p>
              <p>전화: (국번없이) 182 | ecrm.police.go.kr</p>
            </div>
          </div>
        </Section>

        <Section title="제12조 (개인정보처리방침의 변경)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른
              변경 내용의 추가, 삭제 및 수정이 있는 경우에는 변경사항의 시행
              7일 전부터 서비스 공지사항 또는 이메일을 통하여 공지합니다.
            </li>
            <li>
              정보주체에게 불리한 변경의 경우 시행 30일 전에 공지하며, 개별
              이메일 통지를 병행합니다.
            </li>
          </ol>
        </Section>

        <Section title="부칙">
          <p>이 개인정보처리방침은 2026년 3월 13일부터 시행합니다.</p>
        </Section>
      </div>
    </div>
  );
}
