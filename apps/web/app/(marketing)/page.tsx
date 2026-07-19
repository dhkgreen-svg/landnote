import Link from 'next/link';
import { PLAN_LIMITS, PLAN_PRICE, TRIAL_DAYS } from '@landnote/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/* ─────────────────────── Hero ─────────────────────── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]" />

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pb-32 sm:pt-32 lg:px-8">
        <div className="flex flex-col items-center text-center">


          <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.15] text-foreground sm:text-5xl md:text-6xl lg:text-[3.75rem]">
            공인중개사 스마트 매칭 앱, 랜드노트
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              매물 관리와 고객 관리, 자동 매칭을 한 번에
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            고객은 QR 또는 링크로 접수하고,
            <br className="sm:hidden" />
            {' '}중개사는 랜드노트 안에서만 고객·매물·매칭을 관리합니다.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/30">
              <Link href="/register">회원가입 후 무료 체험</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-8 text-base font-medium">
              <Link href="/#features">기능 살펴보기</Link>
            </Button>
          </div>


        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Pain Point ─────────────────── */

const painPoints = [
  {
    emoji: '📞',
    title: '전화 반복 설명',
    description: '고객이 조건을 설명할 때마다 전화로 다시 물어보는 번거로운 상황이 반복되나요?',
  },
  {
    emoji: '🔍',
    title: '매칭 누락',
    description: '어떤 고객에게 어떤 매물이 맞는지 기억이 안 나서 기회를 놓치고 계신가요?',
  },
  {
    emoji: '🔒',
    title: '매물 노출 불안',
    description: '타 플랫폼에 올린 내 매물이 경쟁 중개사에게도 노출되어 걱정되시나요?',
  },
];

function PainPointSection() {
  return (
    <section className="border-y bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            이런 경험 있으신가요?
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            많은 공인중개사분들이 겪는 공통적인 어려움입니다
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-1 lg:grid-cols-3">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="group rounded-2xl border bg-background p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <span className="text-3xl">{point.emoji}</span>
              <h3 className="mt-4 text-lg font-bold text-foreground">
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Solution ─────────────────── */

const solutions = [
  {
    icon: '📱',
    title: '나만의 QR/링크',
    description: '고객이 QR코드나 링크로 접속해 조건을 직접 입력합니다. 전화 통화 없이 깔끔하게 접수하세요.',
    gradient: 'from-blue-500/10 to-blue-600/5',
    iconBg: 'bg-blue-500/10',
  },
  {
    icon: '✨',
    title: '자동 매칭',
    description: '접수된 고객 조건과 내 매물을 자동으로 비교해 최적의 매물을 추천합니다.',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    iconBg: 'bg-emerald-500/10',
  },
  {
    icon: '🛡️',
    title: '완전 격리',
    description: '내 데이터는 나만 볼 수 있습니다. 다른 중개사에게 절대 노출되지 않습니다.',
    gradient: 'from-violet-500/10 to-violet-600/5',
    iconBg: 'bg-violet-500/10',
  },
];

function SolutionSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Solution</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            랜드노트가 해결해 드립니다
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            간단하지만 강력한 3가지 핵심 기능
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {solutions.map((sol) => (
            <div
              key={sol.title}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b ${sol.gradient} p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
            >
              <span className="text-4xl">{sol.icon}</span>
              <h3 className="mt-5 text-xl font-bold text-foreground">
                {sol.title}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {sol.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Feature Showcase ─────────────────── */

const features = [
  {
    step: '01',
    title: '4단계 고객 접수 폼',
    description: '거래 방향 선택부터 세부 조건까지, 고객이 직접 4단계로 깔끔하게 조건을 입력합니다.',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50 text-blue-600',
  },
  {
    step: '02',
    title: '스마트 매칭 대시보드',
    description: '접수된 고객 조건과 등록된 매물을 자동으로 비교, 매칭 점수를 기반으로 최적의 매물을 추천합니다.',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 text-emerald-600',
  },
  {
    step: '03',
    title: '통계 차트',
    description: '고객 접수 추이, 매물 현황, 매칭 성공률 등 핵심 지표를 한눈에 확인하고 비즈니스를 성장시키세요.',
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50 text-violet-600',
  },
  {
    step: '04',
    title: 'QR코드 발급',
    description: '카테고리별 QR코드를 생성해 명함, 현수막, 전단지에 부착하세요. 스캔 한 번으로 접수 완료.',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50 text-amber-600',
  },
];

function FeatureShowcaseSection() {
  return (
    <section id="features" className="border-y bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Features</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            효율적인 부동산 중개를 위한 핵심 기능
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            접수부터 매칭, 통계까지 한곳에서 관리하세요
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.step}
              className="group flex gap-5 rounded-2xl border bg-background p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-8"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${feature.lightColor}`}>
                {feature.step}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Pricing ─────────────────── */

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR');
}

function PricingSection() {
  const proLimits = PLAN_LIMITS.pro;

  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Pricing</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            합리적인 요금제
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            {TRIAL_DAYS}일 무료 체험 후 자동 결제 · 언제든 해지 가능
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-md">
          {/* Pro Plan */}
          <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-background p-8 shadow-lg shadow-primary/10">
            <div>
              <h3 className="text-lg font-semibold text-foreground">프로</h3>
              <p className="mt-1 text-sm text-muted-foreground">전문 중개사를 위한 무제한 플랜</p>
              <div className="mt-5">
                <span className="text-4xl font-extrabold text-primary">
                  {formatPrice(PLAN_PRICE.pro)}
                </span>
                <span className="text-base text-muted-foreground">원/월</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">하루 {Math.round(PLAN_PRICE.pro / 30)}원</p>
            </div>
            <div className="mt-8 flex-1">
              <ul className="space-y-3.5">
                <PricingFeatureItem text={`카테고리 ${proLimits.max_categories}개 전체`} highlighted />
                <PricingFeatureItem text="매물 무제한" highlighted />
                <PricingFeatureItem text={`QR코드 ${proLimits.max_qr_codes}개`} highlighted />
                <PricingFeatureItem text={`이미지 ${proLimits.max_images_per_listing}장/매물`} highlighted />
              </ul>
            </div>
            <div className="mt-8">
              <Button asChild className="w-full rounded-xl shadow-lg shadow-primary/25" size="lg">
                <Link href="/register">PRO로 시작하기</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingFeatureItem({
  text,
  highlighted = false,
}: {
  text: string;
  highlighted?: boolean;
}) {
  return (
    <li className="flex items-center gap-3">
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${highlighted ? 'bg-primary/10' : 'bg-muted'}`}>
        <svg
          className={`h-3 w-3 ${highlighted ? 'text-primary' : 'text-muted-foreground'}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <span className={`text-sm ${highlighted ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
        {text}
      </span>
    </li>
  );
}

/* ─────────────────── FAQ ─────────────────── */

const faqs = [
  {
    question: '고객이 앱을 설치해야 하나요?',
    answer: '아닙니다. 링크나 QR로 접속해 조건만 입력합니다. 별도의 앱 설치나 회원가입이 필요 없습니다.',
  },
  {
    question: '컴퓨터와 휴대폰에 어떻게 설치하나요?',
    answer: '랜드노트는 브라우저에서 바로 사용 가능한 최신 웹 앱입니다. [PC] 주소창 우측의 "앱 설치" 아이콘을 클릭하여 바탕화면에 설치할 수 있고, [휴대폰] 브라우저 메뉴에서 "홈 화면에 추가"를 선택하시면 일반 앱처럼 빠르고 편리하게 사용하실 수 있습니다. 하나의 계정으로 PC와 휴대폰에서 동시에 연동됩니다.',
  },
  {
    question: '내 매물이 다른 중개사에게 보이나요?',
    answer: '절대 보이지 않습니다. 데이터는 중개사별로 완전히 격리됩니다. 데이터베이스 수준에서 접근을 차단합니다.',
  },
  {
    question: '카테고리를 나중에 바꿀 수 있나요?',
    answer: '원하시는 대로 언제든 카테고리를 변경하실 수 있으며, 변경 즉시 매칭 폼에 반영됩니다.',
  },
  {
    question: '무료 체험 중 결제가 되나요?',
    answer: `카드를 등록해도 ${TRIAL_DAYS}일간 결제되지 않습니다. 체험 종료 후 자동 결제됩니다. 체험 중 언제든 해지할 수 있습니다.`,
  },
  {
    question: '구독을 해지하면 데이터는 어떻게 되나요?',
    answer: '해지 후 30일간 보존됩니다. 재구독 시 그대로 복구됩니다.',
  },
];

function FAQSection() {
  return (
    <section id="faq" className="border-t bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">
            자주 묻는 질문
          </h2>
        </div>
        <div className="mt-14 space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-2xl border bg-background p-6 shadow-sm transition-colors hover:border-primary/20"
            >
              <h3 className="flex items-start gap-3 font-semibold text-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  Q
                </span>
                {faq.question}
              </h3>
              <p className="mt-3 pl-8 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Bottom CTA ─────────────────── */



/* ─────────────────── Page ─────────────────── */

export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <PainPointSection />
      <SolutionSection />
      <FeatureShowcaseSection />
      <PricingSection />
      <FAQSection />
    </>
  );
}
