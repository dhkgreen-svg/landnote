import type { Metadata } from 'next';
import {
  PLAN_PRICE,
  TRIAL_DAYS,
  CANCELLED_DATA_RETENTION_DAYS,
} from '@landnote/shared';

export const metadata: Metadata = {
  title: '이용약관 - 랜드노트',
  description: '랜드노트 서비스 이용약관입니다.',
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

export default function TermsPage() {
  const minimalPrice = PLAN_PRICE.minimal.toLocaleString('ko-KR');
  const standardPrice = PLAN_PRICE.standard.toLocaleString('ko-KR');
  const proPrice = PLAN_PRICE.pro.toLocaleString('ko-KR');

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        이용약관
      </h1>
      <p className="mb-12 text-sm text-muted-foreground">
        시행일: 2026년 3월 13일
      </p>

      <div className="space-y-10">
        <Section title="제1조 (목적)">
          <p>
            이 약관은 [상호명] (이하 &quot;회사&quot;)가 운영하는
            &quot;랜드노트&quot; 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여
            회사와 회원 간의 권리, 의무 및 책임사항, 그 밖에 필요한 사항을
            규정함을 목적으로 합니다.
          </p>
        </Section>

        <Section title="제2조 (용어의 정의)">
          <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              &quot;서비스&quot;란 회사가 제공하는 공인중개사 전용 부동산 CRM
              클라우드 서비스(SaaS)로서, 고객 문의 접수·관리, 매물 등록, 스마트
              매칭, 통계 대시보드, QR코드/링크 생성 등 일체의 기능을 말합니다.
            </li>
            <li>
              &quot;회원&quot;이란 이 약관에 동의하고 회원가입을 완료하여 서비스를
              이용하는 공인중개사 자격 보유자를 말합니다.
            </li>
            <li>
              &quot;고객&quot;이란 회원이 생성한 접수 링크 또는 QR코드를 통해
              부동산 문의를 제출하는 이용자를 말합니다.
            </li>
            <li>
              &quot;콘텐츠&quot;란 회원이 서비스에 등록한 매물 정보, 고객 문의
              데이터, 이미지 등 일체의 정보를 말합니다.
            </li>
            <li>
              &quot;유료서비스&quot;란 월 정기결제를 통해 이용할 수 있는 서비스
              요금제(스타터, PRO)를 말합니다.
            </li>
          </ol>
        </Section>

        <Section title="제3조 (약관의 효력 및 변경)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게
              공지함으로써 효력이 발생합니다.
            </li>
            <li>
              회사는 관련 법령을 위반하지 않는 범위에서 이 약관을 변경할 수
              있으며, 변경된 약관은 적용일자 7일 전부터 공지합니다. 다만 회원에게
              불리한 변경의 경우 적용일자 30일 전부터 공지하며, 이메일 등
              전자적 수단으로 개별 통지합니다.
            </li>
            <li>
              회원이 변경된 약관의 적용에 동의하지 않는 경우 서비스 이용을
              중단하고 탈퇴할 수 있습니다. 변경된 약관의 효력 발생일 이후에도
              서비스를 계속 이용하는 경우 약관 변경에 동의한 것으로 봅니다.
            </li>
          </ol>
        </Section>

        <Section title="제4조 (서비스의 내용)">
          <p>회사가 제공하는 서비스의 주요 내용은 다음과 같습니다.</p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              고객 접수 관리: QR코드 또는 링크를 통한 고객 문의 접수 및 관리
            </li>
            <li>매물 등록 및 관리: 부동산 매물 정보 등록, 수정, 삭제</li>
            <li>
              스마트 매칭: 고객 문의 조건과 등록된 매물 간 자동 매칭 기능
            </li>
            <li>통계 대시보드: 접수 현황, 매칭 현황 등 업무 통계 제공</li>
            <li>QR코드/링크 생성: 고객 접수용 전용 링크 및 QR코드 발급</li>
            <li>기타 회사가 추가 개발하여 제공하는 일체의 부가 기능</li>
          </ol>
        </Section>

        <Section title="제5조 (회원가입 및 자격)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              서비스 회원가입은 공인중개사 자격증을 보유한 자에 한하여 가능합니다.
            </li>
            <li>
              회원가입 시 다음 정보를 필수로 제공해야 합니다: 이름, 이메일 주소,
              비밀번호, 전화번호, 공인중개사 자격증번호.
            </li>
            <li>
              사무소명은 선택적으로 제공할 수 있습니다.
            </li>
            <li>
              회사는 다음 각 호에 해당하는 경우 회원가입을 거부하거나 사후에
              이용계약을 해지할 수 있습니다.
              <ol className="mt-1.5 list-[lower-alpha] space-y-1 pl-5">
                <li>타인의 명의 또는 허위 정보로 신청한 경우</li>
                <li>공인중개사 자격이 확인되지 않는 경우</li>
                <li>
                  이전에 이 약관을 위반하여 이용계약이 해지된 적이 있는 경우
                </li>
                <li>기타 관련 법령에 위반되거나 부정한 목적인 경우</li>
              </ol>
            </li>
          </ol>
        </Section>

        <Section title="제6조 (요금 및 결제)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              서비스는 유료 구독제로 운영되며, 요금제는 미니멀(월 {minimalPrice}원), 스탠다드(월 {standardPrice}원), PRO(월 {proPrice}원)로 구분됩니다.
            </li>
            <li>
              모든 요금제는 최초 가입 시 {TRIAL_DAYS}일간 무료 체험 기간을
              제공합니다. 무료 체험 기간 중 해지하지 않으면 체험 종료일에 선택한
              요금제의 첫 결제가 자동으로 이루어집니다.
            </li>
            <li>
              결제는 Toss Payments를 통한 신용카드 또는 체크카드 정기결제
              방식으로 이루어지며, 매월 최초 결제일과 동일한 날짜에 자동
              갱신·결제됩니다.
            </li>
            <li>
              회사는 요금을 변경할 수 있으며, 변경 시 적용일 30일 전까지
              공지합니다. 변경된 요금은 다음 결제 주기부터 적용됩니다.
            </li>
            <li>
              결제 실패 시 회사는 이메일로 안내하며, 일정 기간 내 결제가
              이루어지지 않으면 서비스 이용이 제한될 수 있습니다.
            </li>
          </ol>
        </Section>

        <Section title="제7조 (해지 및 환불)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              회원은 서비스 설정 메뉴 또는 고객센터(help@landnote.app)를 통해
              언제든지 구독을 해지할 수 있습니다.
            </li>
            <li>
              구독 해지 시 해당 결제 주기의 잔여 기간 동안은 서비스를 계속 이용할
              수 있으며, 다음 결제일부터 과금이 중단됩니다.
            </li>
            <li>
              월 단위 정기결제의 특성상 이미 결제된 해당 월의 이용료는 환불되지
              않습니다. 다만 회사의 귀책사유로 서비스를 정상 제공하지 못한 경우
              그에 해당하는 금액을 환불합니다.
            </li>
            <li>
              해지 후 회원의 데이터(매물, 고객 문의 등)는{' '}
              {CANCELLED_DATA_RETENTION_DAYS}일간 보관되며, 보관 기간 내
              재구독 시 데이터가 복구됩니다.{' '}
              {CANCELLED_DATA_RETENTION_DAYS}일 경과 후에는 모든 데이터가
              영구적으로 삭제됩니다.
            </li>
            <li>
              무료 체험 기간 중 해지한 경우 별도의 비용이 발생하지 않습니다.
            </li>
          </ol>
        </Section>

        <Section title="제8조 (회원의 의무)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              회원은 가입 시 정확하고 최신의 정보를 제공해야 하며, 변경 사항이
              있을 경우 즉시 수정해야 합니다.
            </li>
            <li>
              회원은 자신의 계정 정보(이메일, 비밀번호)를 안전하게 관리해야 하며,
              이를 제3자에게 공유하거나 양도할 수 없습니다.
            </li>
            <li>
              회원은 서비스를 통해 접수된 고객의 개인정보를 관련 법령(개인정보
              보호법 등)에 따라 적법하게 처리해야 합니다.
            </li>
            <li>
              회원은 다음 각 호의 행위를 해서는 안 됩니다.
              <ol className="mt-1.5 list-[lower-alpha] space-y-1 pl-5">
                <li>허위 매물 정보를 등록하는 행위</li>
                <li>서비스를 스팸, 사기 등 부정한 목적으로 이용하는 행위</li>
                <li>
                  타인의 개인정보를 무단으로 수집하거나 서비스 외 목적으로 이용하는
                  행위
                </li>
                <li>
                  서비스의 정상적인 운영을 방해하거나 시스템에 과도한 부하를
                  발생시키는 행위
                </li>
                <li>
                  서비스를 역설계, 디컴파일, 복제하거나 무단으로 재배포하는 행위
                </li>
                <li>기타 관련 법령 또는 이 약관에 위반되는 행위</li>
              </ol>
            </li>
          </ol>
        </Section>

        <Section title="제9조 (서비스의 제한 및 중단)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              회사는 다음 각 호에 해당하는 경우 서비스의 전부 또는 일부를 제한하거나
              중단할 수 있습니다.
              <ol className="mt-1.5 list-[lower-alpha] space-y-1 pl-5">
                <li>시스템 점검, 보수, 교체 등 정기 또는 긴급 유지보수가 필요한 경우</li>
                <li>천재지변, 정전, 통신 장애 등 불가항력적 사유가 발생한 경우</li>
                <li>회원이 이 약관을 위반하여 서비스 이용을 제한할 필요가 있는 경우</li>
                <li>기타 서비스 운영상 상당한 이유가 있는 경우</li>
              </ol>
            </li>
            <li>
              회사는 서비스 중단이 예정된 경우 사전에 공지하며, 불가항력적 사유의
              경우 사후에 통지할 수 있습니다.
            </li>
            <li>
              회사는 회원이 제8조의 의무를 위반한 경우, 사전 통지 후 서비스 이용을
              제한하거나 이용계약을 해지할 수 있습니다. 다만 긴급한 경우 사후
              통지할 수 있습니다.
            </li>
          </ol>
        </Section>

        <Section title="제10조 (지식재산권)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              서비스의 디자인, 소프트웨어, 기술, 상표 등 일체의 지식재산권은
              회사에 귀속됩니다.
            </li>
            <li>
              회원이 서비스에 등록한 콘텐츠(매물 정보, 고객 문의 데이터 등)에
              대한 권리는 회원에게 귀속됩니다. 회사는 서비스 제공 목적 범위
              내에서만 해당 콘텐츠를 이용합니다.
            </li>
            <li>
              회원은 회사의 사전 서면 동의 없이 서비스의 전부 또는 일부를 복제,
              배포, 전송, 수정, 대여, 2차적 저작물 작성 등에 이용할 수 없습니다.
            </li>
          </ol>
        </Section>

        <Section title="제11조 (면책)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              회사는 스마트 매칭 기능의 결과에 대해 정확성이나 완전성을 보증하지
              않으며, 매칭 결과에 기반한 중개 거래의 성사 여부 및 그 결과에 대해
              책임을 지지 않습니다.
            </li>
            <li>
              회사는 회원 간 또는 회원과 고객 간에 서비스를 매개로 발생한 분쟁에
              대해 개입할 의무가 없으며, 이로 인한 손해에 대해 책임을 지지
              않습니다.
            </li>
            <li>
              회사는 천재지변, 전쟁, 테러, 해킹, 통신 장애 등 회사의 합리적
              통제 범위를 벗어난 사유로 인한 서비스 중단이나 데이터 손실에 대해
              책임을 지지 않습니다.
            </li>
            <li>
              회사는 회원이 서비스에 등록한 정보의 정확성, 적법성에 대해 보증하지
              않으며, 허위 매물 등록 등으로 인한 제3자의 손해에 대해 해당 회원이
              책임을 부담합니다.
            </li>
            <li>
              회사의 책임은 관련 법령에서 허용하는 범위 내에서 회원이 실제 납부한
              서비스 이용료를 한도로 합니다.
            </li>
          </ol>
        </Section>

        <Section title="제12조 (분쟁 해결)">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              이 약관에 관한 분쟁은 대한민국 법률을 준거법으로 합니다.
            </li>
            <li>
              서비스 이용과 관련하여 회사와 회원 간에 발생한 분쟁에 대해서는 민사소송법상의
              관할법원에 소를 제기할 수 있으며, 관할법원은 서울중앙지방법원으로
              합니다.
            </li>
            <li>
              회사와 회원 간의 분쟁은 소 제기 전에 상호 협의를 통해 원만히
              해결하도록 노력합니다.
            </li>
          </ol>
        </Section>

        <Section title="부칙">
          <p>이 약관은 2026년 3월 13일부터 시행합니다.</p>
        </Section>
      </div>
    </div>
  );
}
