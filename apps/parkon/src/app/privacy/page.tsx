import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, Bell, ExternalLink } from 'lucide-react';

export const metadata = {
  title: '개인정보처리방침 | 파크온 (ParkOn)',
  description: '파크온 서비스의 개인정보처리방침 및 구글 애드센스 쿠키 정책 안내입니다.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 p-4 pb-16">
      <div className="max-w-xl mx-auto space-y-6">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </Link>
          <span className="text-[11px] font-bold text-stone-500">최종 시행일: 2026년 9월 12일</span>
        </div>

        {/* 헤더 카드 */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 rounded-3xl shadow-xl space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-700/60 px-3 py-1 rounded-full text-xs font-bold text-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            파크온 공식 정책
          </div>
          <h1 className="text-2xl font-black tracking-tight">개인정보처리방침</h1>
          <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
            파크온(ParkOn)은 이용자의 소중한 개인정보를 안전하게 보호하며, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 및 개인정보보호법을 철저히 준수합니다.
          </p>
        </div>

        {/* 본문 섹션 카드들 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-6 text-xs leading-relaxed">
          {/* 제 1 조 */}
          <section className="space-y-2">
            <h2 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              제 1 조 (수집하는 개인정보의 항목 및 수집 방법)
            </h2>
            <p className="text-stone-600">
              파크온은 회원가입, 원활한 고객상담, 서비스 제공을 위해 최소한의 개인정보를 수집하고 있습니다.
            </p>
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1.5 text-stone-700">
              <p>• <strong>카카오 간편 로그인 시:</strong> 닉네임, 프로필 사진, 고유 식별자(ID)</p>
              <p>• <strong>서비스 이용 과정에서 생성/수집되는 정보:</strong> 파크골프 스코어카드 기록, 클럽 및 대회 참가 내역, 구장 방문 및 컨디션 투표 기록, 서비스 이용 기록, 접속 로그, 쿠키(Cookie), 접속 IP 정보</p>
              <p>• <strong>비회원 이용 시:</strong> 브라우저 로컬 저장소(LocalStorage)를 통해 기기 내에만 라운드 기록이 보관되며 서버로 전송되지 않습니다.</p>
            </div>
          </section>

          {/* 제 2 조 (구글 애드센스 및 쿠키 정책 - 애드센스 승인 필수 조항) */}
          <section className="space-y-2 bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80">
            <h2 className="font-black text-sm text-amber-950 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              제 2 조 (Google AdSense 광고 및 쿠키(Cookie) 운용 안내)
            </h2>
            <p className="text-amber-900">
              파크온은 지속적인 무료 서비스 운영을 위해 제3자 광고 사업자인 Google AdSense를 이용하며, 다음과 같은 원칙에 따라 쿠키를 운용합니다.
            </p>
            <ul className="list-disc pl-4 space-y-1.5 text-amber-950/90 text-[11px]">
              <li>
                <strong>Google 및 제3자 광고 공급업체의 쿠키 사용:</strong> Google을 포함한 제3자 공급업체는 쿠키를 사용하여 이용자의 파크온 방문 기록 및 인터넷상의 다른 웹사이트 방문 기록을 바탕으로 관심사 기반 맞춤형 광고를 게재합니다.
              </li>
              <li>
                <strong>광고 쿠키의 사용:</strong> Google의 광고 쿠키를 통해 Google 및 파트너는 이용자가 본 사이트 및 타 사이트를 방문한 정보를 바탕으로 적합한 광고를 게재할 수 있습니다.
              </li>
              <li>
                <strong>맞춤 광고 수신 거부(Opt-Out) 방법:</strong> 이용자는 언제든지 Google의{' '}
                <a
                  href="https://adssettings.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-amber-900 underline inline-flex items-center gap-0.5"
                >
                  Google 광고 설정
                  <ExternalLink className="w-3 h-3" />
                </a>
                을 방문하여 맞춤형 광고 게재를 비활성화하거나 해제할 수 있습니다.
              </li>
              <li>
                또한 이용자는{' '}
                <a
                  href="https://www.aboutads.info"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-amber-900 underline inline-flex items-center gap-0.5"
                >
                  www.aboutads.info
                  <ExternalLink className="w-3 h-3" />
                </a>
                를 방문하여 맞춤형 광고에 사용되는 제3자 공급업체의 쿠키를 일괄적으로 거부할 수 있습니다.
              </li>
            </ul>
          </section>

          {/* 제 3 조 */}
          <section className="space-y-2">
            <h2 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              제 3 조 (개인정보의 이용 목적)
            </h2>
            <p className="text-stone-600">
              수집된 개인정보는 다음의 목적을 위해 활용됩니다:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-stone-700">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <strong>1. 서비스 제공 및 기록 보관</strong>
                <p className="text-[11px] text-stone-500 mt-0.5">라운드별 스코어 계산, 코스별 타수 통계 리포트 제공</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <strong>2. 클럽 및 대회 운영</strong>
                <p className="text-[11px] text-stone-500 mt-0.5">조 편성, 실시간 리더보드 순위 산출, 참가자 명단 관리</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <strong>3. AI 룰 솔로몬 고도화</strong>
                <p className="text-[11px] text-stone-500 mt-0.5">파크골프 규정 질의응답 품질 향상 및 서비스 최적화</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <strong>4. 부정 이용 방지</strong>
                <p className="text-[11px] text-stone-500 mt-0.5">서비스 악용 방지 및 안정적인 서버 운영</p>
              </div>
            </div>
          </section>

          {/* 제 4 조 */}
          <section className="space-y-2">
            <h2 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              제 4 조 (개인정보의 보유 및 파기 절차)
            </h2>
            <p className="text-stone-600">
              원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 회원이 탈퇴를 요청하거나 개인정보 삭제를 요구하는 경우, 재생할 수 없는 안전한 기술적 방법을 사용하여 즉시 파기합니다.
            </p>
          </section>

          {/* 제 5 조 */}
          <section className="space-y-2">
            <h2 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              제 5 조 (이용자의 권리와 행사 방법)
            </h2>
            <p className="text-stone-600">
              이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 데이터 초기화 및 회원 탈퇴를 요청할 수 있습니다. 브라우저 설정(쿠키 차단 등)을 통해 로컬 데이터 저장을 직접 통제할 수 있습니다.
            </p>
          </section>

          {/* 제 6 조 */}
          <section className="space-y-2">
            <h2 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              제 6 조 (개인정보 보호책임자 및 고객 문의처)
            </h2>
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-stone-700 space-y-1">
              <p>• <strong>담당 부서:</strong> 파크온(ParkOn) 운영팀</p>
              <p>• <strong>문의 이메일:</strong> <span dangerouslySetInnerHTML={{ __html: '<!--email_off-->contact@parkongolf.com<!--/email_off-->' }} /></p>
              <p>• <strong>문의 안내:</strong> 서비스 이용 중 발생하는 모든 개인정보보호 관련 민원은 위 이메일로 신속히 답변해 드립니다.</p>
            </div>
          </section>
        </div>

        {/* 하단 뒤로가기 버튼 */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-block py-3 px-6 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
