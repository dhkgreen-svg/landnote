'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Share2,
  Check,
  Edit3,
  Search,
  Users,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { UserBusinessCard, BUSINESS_INDUSTRIES, BusinessCardVisibility } from '@/types/businessCard';
import { BusinessCardStorage, SAMPLE_COMMUNITY_CARDS } from '@/lib/businessCardStorage';
import { ParkOnStorage } from '@/lib/storage';

interface BusinessCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'MY_CARD' | 'EXCHANGED';
}

export function BusinessCardModal({
  isOpen,
  onClose,
  initialTab = 'MY_CARD',
}: BusinessCardModalProps) {
  const [activeTab, setActiveTab] = useState<'MY_CARD' | 'EXCHANGED'>(initialTab);
  const [myCard, setMyCard] = useState<UserBusinessCard | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editIndustry, setEditIndustry] = useState<string>(BUSINESS_INDUSTRIES[0]);
  const [editBio, setEditBio] = useState('');
  const [editVisibility, setEditVisibility] = useState<BusinessCardVisibility>('PUBLIC');

  // Directory / Exchanged state
  const [exchangedCards, setExchangedCards] = useState<UserBusinessCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const card = BusinessCardStorage.getMyCard();
      setMyCard(card);
      setEditName(card.name);
      setEditCompany(card.company);
      setEditTitle(card.title);
      setEditPhone(card.phone);
      setEditEmail(card.email || '');
      setEditRegion(card.region);
      setEditIndustry(card.industry);
      setEditBio(card.bio);
      setEditVisibility(card.visibility);

      const list = BusinessCardStorage.getAllCommunityCards();
      setExchangedCards(list);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myCard) return;

    const updated: UserBusinessCard = {
      ...myCard,
      name: editName.trim() || '김대희',
      company: editCompany.trim() || '나우공인중개사사무소',
      title: editTitle.trim() || '대표',
      phone: editPhone.trim() || '010-3814-1422',
      email: editEmail.trim(),
      region: editRegion.trim() || '경북 구미 · 대구',
      industry: editIndustry,
      bio: editBio.trim() || '파크골프와 함께하는 건강한 비즈니스 파트너',
      visibility: editVisibility,
    };

    BusinessCardStorage.saveMyCard(updated);
    setMyCard(updated);
    setIsEditing(false);
    showToast('내 디지털 명함이 안전하게 저장되었습니다!');
  };

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const handleCopyCardInfo = (card: UserBusinessCard) => {
    const text = `[파크온 동호인 명함]\n성함: ${card.name} (${card.title})\n상호: ${card.company}\n업종: ${card.industry}\n지역: ${card.region}\n연락처: ${card.phone}\n소개: ${card.bio}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('명함 정보가 클립보드에 복사되었습니다!');
    }
  };

  const filteredCards = exchangedCards.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = selectedIndustry === 'ALL' || c.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-stone-900 rounded-3xl w-full max-w-lg shadow-2xl border border-amber-500/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-900 text-white px-5 py-4 flex items-center justify-between border-b border-amber-500/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-black shadow-md border border-amber-300">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">파크온 디지털 명함첩</h3>
                <span className="text-[10px] bg-amber-400/90 text-stone-950 font-black px-2 py-0.5 rounded-full shadow-xs">
                  비즈니스 네트워킹
                </span>
              </div>
              <p className="text-[11px] text-emerald-200">
                라운딩 동반자 및 지역 동호인과 명함을 주고받으세요
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-stone-300 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 bg-stone-950/80 p-1.5 border-b border-stone-800 shrink-0 text-sm font-black">
          <button
            type="button"
            onClick={() => setActiveTab('MY_CARD')}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'MY_CARD'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>내 디지털 명함</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('EXCHANGED')}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'EXCHANGED'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>동호인 명함첩 ({filteredCards.length})</span>
          </button>
        </div>

        {/* Toast */}
        {copiedToast && (
          <div className="bg-amber-400 text-stone-950 text-xs font-black text-center py-2 px-4 animate-bounce shrink-0 shadow-md">
            ✨ {copiedToast}
          </div>
        )}

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: 내 디지털 명함 */}
          {activeTab === 'MY_CARD' && myCard && (
            <div className="space-y-4">
              {/* Luxury Golf Business Card Preview */}
              <div className="relative bg-gradient-to-br from-emerald-900 via-stone-900 to-emerald-950 text-white rounded-2xl p-5 border-2 border-amber-400/80 shadow-xl overflow-hidden">
                {/* Gold Watermark & Accents */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start justify-between border-b border-amber-400/30 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> ParkOn Certified Golfer Card
                    </span>
                    <h4 className="text-xl font-black text-white mt-1">{myCard.company}</h4>
                    <p className="text-xs text-amber-200/90 font-bold">{myCard.industry}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                      {myCard.title}
                    </span>
                    <div className="text-lg font-black text-white mt-1">{myCard.name}</div>
                  </div>
                </div>

                {/* Card Body Details */}
                <div className="py-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-stone-300">
                    <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-bold text-white">{myCard.phone}</span>
                  </div>
                  {myCard.email && (
                    <div className="flex items-center gap-2 text-stone-300">
                      <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{myCard.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-stone-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{myCard.region}</span>
                  </div>
                </div>

                {/* Bio / Slogan */}
                <div className="bg-black/40 rounded-xl p-2.5 border border-white/10 text-[11px] text-amber-100 font-medium leading-relaxed">
                  "{myCard.bio}"
                </div>

                {/* Card Footer */}
                <div className="mt-3 flex items-center justify-between text-[9px] text-stone-400 border-t border-white/10 pt-2">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    공개 범위: {myCard.visibility === 'PUBLIC' ? '전체 공개' : myCard.visibility === 'COMPANIONS_ONLY' ? '동반자 전용' : '비공개'}
                  </span>
                  <span>최종 갱신: {myCard.updatedAt}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex-1 bg-stone-800 hover:bg-stone-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs border border-stone-700 flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isEditing ? '수정 취소' : '내 명함 정보 수정하기'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyCardInfo(myCard)}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-98 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>명함 공유</span>
                </button>
              </div>

              {/* Edit Form */}
              {isEditing && (
                <form onSubmit={handleSaveCard} className="bg-stone-950 rounded-2xl p-4 border border-stone-800 space-y-3 animate-fadeIn">
                  <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5 border-b border-stone-800 pb-2">
                    <Edit3 className="w-3.5 h-3.5" /> 명함 세부 정보 입력
                  </h5>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 block mb-1">대표자 / 성함</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="예: 김대희"
                        required
                        className="w-full bg-stone-900 border border-stone-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-400 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 block mb-1">직함</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="예: 대표 / 총무"
                        className="w-full bg-stone-900 border border-stone-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-400 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block mb-1">상호 / 회사 / 가게명</label>
                    <input
                      type="text"
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      placeholder="예: 나우공인중개사사무소"
                      required
                      className="w-full bg-stone-900 border border-stone-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-400 outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 block mb-1">연락처</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full bg-stone-900 border border-stone-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-400 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 block mb-1">활동 지역</label>
                      <input
                        type="text"
                        value={editRegion}
                        onChange={(e) => setEditRegion(e.target.value)}
                        placeholder="예: 경북 구미 · 대구"
                        className="w-full bg-stone-900 border border-stone-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-400 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 block mb-1">업종 분류</label>
                      <select
                        value={editIndustry}
                        onChange={(e) => setEditIndustry(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 text-white rounded-lg px-2 py-1.5 text-xs focus:border-amber-400 outline-hidden"
                      >
                        {BUSINESS_INDUSTRIES.map((ind) => (
                          <option key={ind} value={ind}>
                            {ind}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 block mb-1">공개 범위</label>
                      <select
                        value={editVisibility}
                        onChange={(e) => setEditVisibility(e.target.value as BusinessCardVisibility)}
                        className="w-full bg-stone-900 border border-stone-700 text-white rounded-lg px-2 py-1.5 text-xs focus:border-amber-400 outline-hidden"
                      >
                        <option value="PUBLIC">전체 공개 (동호인 마켓 노출)</option>
                        <option value="COMPANIONS_ONLY">동반자 전용 (함께 친 분만)</option>
                        <option value="PRIVATE">비공개</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block mb-1">한 줄 소개 / 홍보 슬로건</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={2}
                      placeholder="예: 수성구 범어동 160억 통빌딩 전문 매칭. 파크골프 동호인 여러분 환영합니다!"
                      className="w-full bg-stone-900 border border-stone-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-400 outline-hidden resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black py-2.5 rounded-xl text-xs shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>명함 정보 저장 완료</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: 동호인 명함첩 */}
          {activeTab === 'EXCHANGED' && (
            <div className="space-y-3">
              {/* Transparency Notice */}
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 text-amber-200 text-[11px] leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300">동호인 비즈니스 마켓 안내:</span>{' '}
                  아래 명함 중 <span className="bg-amber-500/30 text-amber-200 px-1 py-0.2 rounded font-bold">[예시/SAMPLE]</span> 표시가 있는 명함은 기능 이해를 돕기 위한 샘플입니다. 본인의 명함을 등록하시면 실제 동호인들에게 홍보됩니다.
                </div>
              </div>

              {/* Search & Industry Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="상호, 성함, 지역, 소개글 검색..."
                    className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:border-amber-400 outline-hidden"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSelectedIndustry('ALL')}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition ${
                      selectedIndustry === 'ALL'
                        ? 'bg-amber-400 text-stone-950 shadow-xs'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    전체 업종
                  </button>
                  {BUSINESS_INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setSelectedIndustry(ind)}
                      className={`px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition ${
                        selectedIndustry === ind
                          ? 'bg-amber-400 text-stone-950 shadow-xs'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-3">
                {filteredCards.length === 0 ? (
                  <div className="text-center py-8 text-stone-500 text-xs font-bold">
                    검색 조건에 맞는 동호인 명함이 없습니다.
                  </div>
                ) : (
                  filteredCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-stone-950 border border-stone-800 hover:border-amber-500/50 rounded-2xl p-4 transition shadow-md group relative overflow-hidden"
                    >
                      {card.isSample && (
                        <div className="absolute top-2 right-2 bg-stone-800/90 text-amber-300 border border-amber-400/40 text-[9px] font-black px-1.5 py-0.2 rounded shadow-2xs">
                          [예시/SAMPLE]
                        </div>
                      )}

                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-black text-sm text-white">{card.company}</h5>
                            <span className="text-[10px] text-amber-400 font-bold">
                              · {card.industry}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-stone-300 mt-0.5">
                            {card.name} <span className="text-[10px] text-stone-400">({card.title})</span>
                          </p>
                        </div>
                      </div>

                      <div className="my-2 text-[11px] text-stone-300 bg-stone-900/80 rounded-lg p-2 border border-stone-800/80 leading-relaxed">
                        "{card.bio}"
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800/60">
                        <span className="flex items-center gap-1 text-emerald-300">
                          <MapPin className="w-3 h-3" /> {card.region}
                        </span>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${card.phone.replace(/[^0-9]/g, '')}`}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 transition shadow-xs"
                          >
                            <Phone className="w-3 h-3" /> 전화
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyCardInfo(card)}
                            className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 transition"
                          >
                            <Share2 className="w-3 h-3" /> 복사
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 p-3 text-center border-t border-stone-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-2 rounded-xl text-xs transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
