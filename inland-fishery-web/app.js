// Gallery Filtering
const tabBtns = document.querySelectorAll('.tab-btn');
const galleryCards = document.querySelectorAll('.gallery-card');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');

    galleryCards.forEach(card => {
      const category = card.getAttribute('data-category');
      if (filter === 'all' || category === filter) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

// Gallery Items Data for Modal Detail View
const galleryData = [
  {
    title: '내수면 양식 어가 현장 수질 및 시설 점검',
    date: '2026-07-18',
    category: '현장활동',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    content: `
      <p style="line-height: 1.7; color: #475569; margin-bottom: 16px;">
        사단법인 한국내수면어업연합회는 하계 고온기 및 집중호우 대비 전국 주요 내수면 양식 어가를 방문하여 수질 관리 상태와 용존 산소 공급 시설 현장 지도 점검을 실시하였습니다.
      </p>
      <p style="line-height: 1.7; color: #475569; margin-bottom: 16px;">
        이번 현장 점검에는 해양수산부 수산 자원 전문가와 연합회 지도위원이 공동 참석하여 어가별 맞춤형 수질 모니터링 장비 점검 및 고온기 피해 예방 수칙을 전달했습니다.
      </p>
      <div style="background: #F1F5F9; padding: 16px; border-radius: 8px; font-size: 0.9rem; color: #1E293B;">
        <strong>[주요 점검 항목]</strong><br>
        - 어가별 자동 급이 및 산소 공급 수중 펌프 작동 상태 점검<br>
        - 수온 상승 대비 고온기 양식 어종 사료 투입량 조절 가이드 보급<br>
        - 집중호우 시 양식장 둑 터짐 및 유실 방지 안전대책 지도
      </div>
    `
  },
  {
    title: '2026년도 상반기 정기 총회 및 정책 간담회',
    date: '2026-06-25',
    category: '총회/이사회',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    content: `
      <p style="line-height: 1.7; color: #475569; margin-bottom: 16px;">
        전국 16개 시·도 지회 대표 및 해양수산부 관계자들이 참석한 가운데 2026년도 상반기 정기 총회를 성공적으로 완료하였습니다.
      </p>
      <p style="line-height: 1.7; color: #475569;">
        이번 총회에서는 내수면 어업 육성법 지원 확대 안건과 어가 경영 자금 금리 인하 정책 건의서 채택이 주요 의안으로 다뤄졌습니다.
      </p>
    `
  },
  {
    title: '친환경 스마트 내수면 양식 기술 전문가 초청 강연',
    date: '2026-05-30',
    category: '기술교육',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
    content: `
      <p style="line-height: 1.7; color: #475569; margin-bottom: 16px;">
        전국 120 여 명의 어업인이 모여 순환가두리 및 에너지 절감형 스마트 양식 시설 도입을 위한 세미나를 진행하였습니다.
      </p>
    `
  },
  {
    title: '내수면 외래어종 퇴치 및 환경 정화 활동',
    date: '2026-05-12',
    category: '현장활동',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    content: `
      <p style="line-height: 1.7; color: #475569; margin-bottom: 16px;">
        대청호 및 금강 수계 일대에서 외래 어종(배스, 블루길) 퇴치 수중 자원조사와 수생태계 정화 캠페인을 전개하였습니다.
      </p>
    `
  }
];

function openGalleryModal(index) {
  const item = galleryData[index];
  if (!item) return;

  const modalContent = document.getElementById('modal-body-content');
  modalContent.innerHTML = `
    <span style="background: #0284C7; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">${item.category}</span>
    <h3 style="font-size: 1.4rem; color: #0A2540; margin: 12px 0 6px;">${item.title}</h3>
    <span style="font-size: 0.85rem; color: #64748B; display: block; margin-bottom: 16px;"><i class="fa-regular fa-calendar"></i> 작성일: ${item.date}</span>
    <img src="${item.image}" alt="${item.title}" style="width: 100%; height: 260px; object-fit: cover; border-radius: 12px; margin-bottom: 20px;">
    ${item.content}
  `;

  document.getElementById('detail-modal').classList.add('active');
}

function openNoticeModal(title, date, content) {
  const modalContent = document.getElementById('modal-body-content');
  modalContent.innerHTML = `
    <span style="background: #EF4444; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">공지사항</span>
    <h3 style="font-size: 1.3rem; color: #0A2540; margin: 12px 0 6px;">${title}</h3>
    <span style="font-size: 0.85rem; color: #64748B; display: block; margin-bottom: 20px;"><i class="fa-regular fa-calendar"></i> 공시일: ${date}</span>
    <div style="background: #F8FAFC; padding: 20px; border-radius: 10px; border: 1px solid #E2E8F0; line-height: 1.8; color: #334155;">
      ${content}
    </div>
  `;
  document.getElementById('detail-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('detail-modal').classList.remove('active');
}

// Inquiry Form Handling
function handleInquirySubmit(e) {
  e.preventDefault();
  const name = document.getElementById('form-name').value;
  const phone = document.getElementById('form-phone').value;
  
  alert(`[접수 완료]\n\n${name} 님의 문의가 사단법인 한국내수면어업연합회 사무국으로 전달되었습니다.\n(입력 연락처: ${phone})`);
  document.getElementById('inquiry-form').reset();
}

// Window click to close modal
window.onclick = function(event) {
  const modal = document.getElementById('detail-modal');
  if (event.target === modal) {
    closeModal();
  }
}
