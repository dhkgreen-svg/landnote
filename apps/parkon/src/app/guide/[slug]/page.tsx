import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, Clock, Calendar, User, Share2, Sparkles, BookOpen, Tag, CheckCircle2, ChevronRight } from 'lucide-react';
import { PARK_GOLF_GUIDES } from '@/data/parkGolfGuides';

interface PageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return PARK_GOLF_GUIDES.map((g) => ({
    slug: g.slug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const guide = PARK_GOLF_GUIDES.find((g) => g.slug === params.slug);
  if (!guide) {
    return {
      title: '가이드를 찾을 수 없습니다 | 파크골프 올인원',
    };
  }

  const url = `https://www.parkgolfallinone.com/guide/${guide.slug}`;

  return {
    title: `${guide.title} | 파크골프 올인원 (ParkGolf All-in-One)`,
    description: guide.summary,
    keywords: guide.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: guide.title,
      description: guide.summary,
      url,
      siteName: '파크골프 올인원',
      type: 'article',
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      authors: [guide.author],
      tags: guide.keywords,
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: guide.summary,
    },
  };
}

export default function GuideDetailPage({ params }: PageProps) {
  const guideIndex = PARK_GOLF_GUIDES.findIndex((g) => g.slug === params.slug);
  if (guideIndex === -1) {
    notFound();
  }

  const guide = PARK_GOLF_GUIDES[guideIndex];
  const prevGuide = guideIndex > 0 ? PARK_GOLF_GUIDES[guideIndex - 1] : null;
  const nextGuide = guideIndex < PARK_GOLF_GUIDES.length - 1 ? PARK_GOLF_GUIDES[guideIndex + 1] : null;

  // Schema.org Article JSON-LD for Googlebot
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.summary,
    author: {
      '@type': 'Person',
      name: guide.author,
      jobTitle: guide.authorTitle,
    },
    publisher: {
      '@type': 'Organization',
      name: '파크골프 올인원 (ParkGolf All-in-One)',
      url: 'https://www.parkgolfallinone.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.parkgolfallinone.com/icon.png',
      },
    },
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.parkgolfallinone.com/guide/${guide.slug}`,
    },
    keywords: guide.keywords.join(', '),
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 p-4 pb-20">
      {/* Schema.org Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* 상단 Breadcrumb & 뒤로가기 */}
        <div className="flex items-center justify-between pt-2 text-xs font-bold text-stone-500">
          <Link
            href="/guide"
            className="flex items-center gap-1 hover:text-emerald-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            가이드 목록으로
          </Link>
          <div className="flex items-center gap-1.5 text-[11px]">
            <Link href="/" className="hover:text-stone-800">홈</Link>
            <span>&gt;</span>
            <Link href="/guide" className="hover:text-stone-800">가이드</Link>
            <span>&gt;</span>
            <span className="text-emerald-700 truncate max-w-[120px]">{guide.category}</span>
          </div>
        </div>

        {/* 아티클 메인 컨테이너 */}
        <article className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 space-y-6">
          {/* 아티클 헤더 */}
          <header className="space-y-3 border-b border-stone-100 pb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {guide.category}
              </span>
              <span className="text-xs font-bold text-stone-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {guide.readTime}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-snug">
              {guide.title}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
              {guide.subtitle}
            </p>

            {/* 작성자 & 발행일 정보 */}
            <div className="pt-3 flex items-center justify-between text-xs text-stone-500 border-t border-stone-50 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-black">
                  🏌️
                </div>
                <div>
                  <div className="font-bold text-stone-800">{guide.author}</div>
                  <div className="text-[10px] text-stone-400">{guide.authorTitle}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-stone-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  발행: {guide.publishedAt}
                </span>
                <span>최종 수정: {guide.updatedAt}</span>
              </div>
            </div>
          </header>

          {/* 요약 박스 (AdSense & 독자 배려) */}
          <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>핵심 요약 (Summary)</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              {guide.summary}
            </p>
          </div>

          {/* 본문 섹션들 */}
          <div className="space-y-8 text-stone-800 text-xs sm:text-sm leading-relaxed">
            {guide.sections.map((sec, sIdx) => (
              <section key={sIdx} className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-start gap-2 border-l-4 border-emerald-600 pl-3 leading-snug">
                  {sec.heading}
                </h2>

                <div className="space-y-2.5 text-stone-700 font-normal leading-relaxed text-xs sm:text-[13px]">
                  {sec.body.map((paragraph, pIdx) => (
                    <p key={pIdx}>{paragraph}</p>
                  ))}
                </div>

                {/* 핵심 포인트 박스 (있는 경우) */}
                {sec.keyPoints && sec.keyPoints.length > 0 && (
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="font-black text-stone-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>핵심 정리 체크포인트</span>
                    </div>
                    <ul className="space-y-1.5 text-stone-700">
                      {sec.keyPoints.map((kp, kIdx) => (
                        <li key={kIdx} className="flex items-start gap-1.5">
                          <span className="text-emerald-700 font-bold shrink-0">•</span>
                          <span>{kp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 팁 박스 (있는 경우) */}
                {sec.calloutTip && (
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 font-medium leading-relaxed">
                    💡 <strong>{sec.calloutTip}</strong>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* 키워드 태그 목록 */}
          <div className="pt-6 border-t border-stone-100 space-y-2">
            <span className="text-xs font-bold text-stone-400">관련 키워드:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {guide.keywords.map((kw, kwIdx) => (
                <span
                  key={kwIdx}
                  className="text-[11px] bg-stone-100 text-stone-600 px-2.5 py-1 rounded-lg font-medium"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>

          {/* 하단 이전글 / 다음글 네비게이션 */}
          <div className="pt-6 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {prevGuide ? (
              <Link
                href={`/guide/${prevGuide.slug}`}
                className="p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-600 bg-stone-50/70 hover:bg-emerald-50/30 transition text-left space-y-1"
              >
                <span className="text-[10px] font-bold text-stone-400">← 이전 가이드</span>
                <p className="font-bold text-stone-900 truncate">{prevGuide.title}</p>
              </Link>
            ) : <div />}

            {nextGuide ? (
              <Link
                href={`/guide/${nextGuide.slug}`}
                className="p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-600 bg-stone-50/70 hover:bg-emerald-50/30 transition text-right space-y-1"
              >
                <span className="text-[10px] font-bold text-stone-400">다음 가이드 →</span>
                <p className="font-bold text-stone-900 truncate">{nextGuide.title}</p>
              </Link>
            ) : <div />}
          </div>
        </article>

        {/* 하단 돌아가기 버튼 */}
        <div className="text-center pt-2">
          <Link
            href="/guide"
            className="inline-block py-3 px-6 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95"
          >
            가이드 목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
