import Link from 'next/link';
import type { Metadata } from 'next';
import { PLAN_LIMITS, PLAN_PRICE, TRIAL_DAYS } from '@landnote/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: '요금제 - 랜드노트',
  description: '랜드노트 스타터 및 PRO 요금제를 비교하고 나에게 맞는 플랜을 선택하세요.',
};

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR');
}

interface ComparisonRow {
  label: string;
  starter: string;
  pro: string;
}

const comparisonRows: ComparisonRow[] = [
  {
    label: '월 요금',
    starter: `${formatPrice(PLAN_PRICE.starter)}원`,
    pro: `${formatPrice(PLAN_PRICE.pro)}원`,
  },
  {
    label: '카테고리',
    starter: `${PLAN_LIMITS.starter.max_categories}개 제한`,
    pro: `${PLAN_LIMITS.pro.max_categories}개 전체`,
  },
  {
    label: '매물 등록',
    starter: '무제한',
    pro: '무제한',
  },
  {
    label: 'QR코드',
    starter: `${PLAN_LIMITS.starter.max_qr_codes}개`,
    pro: `${PLAN_LIMITS.pro.max_qr_codes}개 (카테고리별)`,
  },
  {
    label: '이미지 업로드',
    starter: `${PLAN_LIMITS.starter.max_images_per_listing}장/매물`,
    pro: `${PLAN_LIMITS.pro.max_images_per_listing}장/매물`,
  },
  {
    label: '카테고리 변경',
    starter: `월 ${PLAN_LIMITS.starter.category_changes_per_month}회`,
    pro: '무제한',
  },
  {
    label: '고객 접수 관리',
    starter: '가능',
    pro: '가능',
  },
  {
    label: '스마트 매칭',
    starter: '가능',
    pro: '가능',
  },
  {
    label: '통계 대시보드',
    starter: '가능',
    pro: '가능',
  },
  {
    label: '데이터 격리',
    starter: '가능',
    pro: '가능',
  },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? 'h-5 w-5'}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <Badge variant="secondary" className="mb-4">요금제</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            나에게 맞는 플랜을 선택하세요
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            모든 플랜은 {TRIAL_DAYS}일 무료 체험을 제공합니다. 체험 기간 중 언제든 해지할 수 있으며,
            체험 종료 후 자동 결제됩니다.
          </p>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-4xl gap-8 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          {/* Starter */}
          <Card className="relative flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">스타터</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                가볍게 시작
              </p>
              <div className="mt-4">
                <span className="text-5xl font-extrabold text-foreground">
                  {formatPrice(PLAN_PRICE.starter)}
                </span>
                <span className="text-xl text-muted-foreground">원/월</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">하루 {Math.round(PLAN_PRICE.starter / 30)}원</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="flex-1 space-y-4">
                <FeatureItem text={`카테고리 최대 ${PLAN_LIMITS.starter.max_categories}개 선택`} />
                <FeatureItem text="매물 무제한 등록" />
                <FeatureItem text={`QR코드 ${PLAN_LIMITS.starter.max_qr_codes}개 발급`} />
                <FeatureItem text={`매물당 이미지 ${PLAN_LIMITS.starter.max_images_per_listing}장`} />
                <FeatureItem text={`카테고리 변경 월 ${PLAN_LIMITS.starter.category_changes_per_month}회`} />
                <FeatureItem text="고객 접수 관리" />
                <FeatureItem text="스마트 매칭" />
                <FeatureItem text="통계 대시보드" />
              </ul>
              <div className="mt-8">
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href="/register">무료 체험 시작</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="relative flex flex-col border-2 border-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="px-4 py-1 text-sm">추천</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">PRO</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                실사용 권장
              </p>
              <div className="mt-4">
                <span className="text-5xl font-extrabold text-primary">
                  {formatPrice(PLAN_PRICE.pro)}
                </span>
                <span className="text-xl text-muted-foreground">원/월</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">하루 {Math.round(PLAN_PRICE.pro / 30)}원</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="flex-1 space-y-4">
                <FeatureItem text={`카테고리 ${PLAN_LIMITS.pro.max_categories}개 전체 사용`} highlighted />
                <FeatureItem text="매물 무제한 등록" highlighted />
                <FeatureItem text={`QR코드 ${PLAN_LIMITS.pro.max_qr_codes}개 (카테고리별)`} highlighted />
                <FeatureItem text={`매물당 이미지 ${PLAN_LIMITS.pro.max_images_per_listing}장`} highlighted />
                <FeatureItem text="카테고리 변경 무제한" highlighted />
                <FeatureItem text="고객 접수 관리" highlighted />
                <FeatureItem text="스마트 매칭" highlighted />
                <FeatureItem text="통계 대시보드" highlighted />
              </ul>
              <div className="mt-8">
                <Button asChild className="w-full" size="lg">
                  <Link href="/register">PRO로 시작하기</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="mx-auto mt-6 max-w-4xl text-center text-sm text-muted-foreground">
          월 {(PLAN_PRICE.pro - PLAN_PRICE.starter).toLocaleString()}원 차이로 카테고리 2개, QR 3개, 이미지 15장 추가
        </p>
      </section>

      {/* Comparison Table */}
      <section className="bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground">
            상세 비교
          </h2>

          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-xl border bg-background shadow-sm md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    기능
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                    스타터
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary">
                    PRO <Badge className="ml-1 text-xs">추천</Badge>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i < comparisonRows.length - 1 ? 'border-b' : ''}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {row.label}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-muted-foreground">
                      {row.starter}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-foreground">
                      {row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 md:hidden">
            {comparisonRows.map((row) => (
              <div key={row.label} className="rounded-lg border bg-background p-4">
                <p className="mb-2 text-sm font-semibold text-foreground">{row.label}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">스타터</p>
                    <p className="text-sm">{row.starter}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary">PRO</p>
                    <p className="text-sm font-medium">{row.pro}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Pricing */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground">
            요금제 관련 FAQ
          </h2>
          <div className="space-y-4">
            {[
              {
                q: '무료 체험 기간은 어떻게 되나요?',
                a: `모든 플랜은 ${TRIAL_DAYS}일 무료 체험을 제공합니다. 카드 등록 후 ${TRIAL_DAYS}일간 무료로 모든 기능을 사용할 수 있으며, 체험 종료 후 자동 결제됩니다.`,
              },
              {
                q: '플랜을 변경할 수 있나요?',
                a: '언제든 변경 가능합니다. 스타터에서 PRO로 업그레이드하면 즉시 반영됩니다. PRO에서 스타터로 다운그레이드하면 다음 결제일부터 적용됩니다.',
              },
              {
                q: '해지 후 재구독이 가능한가요?',
                a: '해지 후 30일 이내에 재구독하면 기존 데이터가 그대로 복구됩니다. 30일이 지나면 데이터가 삭제될 수 있습니다.',
              },
              {
                q: '결제 수단은 무엇인가요?',
                a: 'Toss Payments를 통한 신용카드/체크카드 정기결제를 지원합니다.',
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-lg border bg-background p-6 shadow-sm">
                <h3 className="text-base font-semibold text-foreground">Q. {faq.q}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  A. {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center shadow-xl sm:px-16">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              지금 바로 시작해보세요
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-primary-foreground/80">
              {TRIAL_DAYS}일 무료 체험으로 모든 기능을 경험해 보세요.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="px-8 text-base font-semibold"
              >
                <Link href="/register">{TRIAL_DAYS}일 무료 체험 시작</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FeatureItem({
  text,
  highlighted = false,
}: {
  text: string;
  highlighted?: boolean;
}) {
  return (
    <li className="flex items-center gap-3">
      <CheckIcon
        className={`h-5 w-5 shrink-0 ${highlighted ? 'text-primary' : 'text-muted-foreground'}`}
      />
      <span
        className={`text-sm ${highlighted ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
      >
        {text}
      </span>
    </li>
  );
}
