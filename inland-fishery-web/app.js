
const firebaseConfig = {
  apiKey: "AIzaSyBmzGsJJXzPFrXg5oEjRRJCMNQmiBl2Hf4",
  authDomain: "inland-fishery.firebaseapp.com",
  projectId: "inland-fishery",
  storageBucket: "inland-fishery.firebasestorage.app",
  messagingSenderId: "682627481944",
  appId: "1:682627481944:web:76f7a25d1568e11ea4252d",
  databaseURL: "https://inland-fishery-default-rtdb.firebaseio.com"
};

const app = window.firebaseInitializeApp(firebaseConfig);
const storage = window.firebaseGetStorage(app);

async function uploadToSupabase(base64Data, prefix) {
  if (!base64Data.startsWith('data:image')) return base64Data;
  const mimeType = base64Data.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/)[1];
  const ext = mimeType.split('/')[1] || 'jpg';
  const fileName = 'images/' + prefix + '_' + Date.now() + '_' + Math.floor(Math.random()*10000) + '.' + ext;
  
  try {
    const storageRef = window.firebaseRef(storage, fileName);
    const snapshot = await window.firebaseUploadString(storageRef, base64Data, 'data_url');
    const downloadURL = await window.firebaseGetDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Firebase Storage upload error:', error);
    throw error;
  }
}

window.addEventListener('error', function(e) {
  alert('에러 발생: ' + e.message + '\n줄번호: ' + e.lineno);
});
// Global State
function closeWelcomeNotice() {
  document.querySelectorAll('.dynamic-welcome-modal').forEach(el => el.remove());
}
let pastNotices = [];
let galleryItems = [];
let inquiriesList = [];
let accountingItems = [];
let usersList = [];
let pendingUsersList = [];
let editingItemId = null;
let currentLedgerYear = '2026';
let contactInfo = { address: '충북 단양', tel: '010-5468-3208', fax: '', email: 'dhkgreen@naver.com', bizNum: '', president: '이재완' };

let committeesList = [
  {
    id: 1,
    title: '🎯 1. 내수면 토종 어자원 생태 복원 특별위원회',
    chair: '이 순 신 수석부회장 (충남 지회)',
    members: '강감찬 감사, 김유신 이사, 윤관 이사 외 8명',
    purpose: '전국 주요 강과 호수의 수생태계 복원을 위한 토종 치어(뱀장어, 쏘가리, 붕어) 방류 사업 및 서식지 수질 모니터링 전담',
    status: '활동 중'
  },
  {
    id: 2,
    title: '🎯 2. 내수면 어구 현대화 및 법정 제도 개선 특별위원회',
    chair: '김 유 신 충북 지회장',
    members: '권율 이사, 계백 이사, 최영 국장 외 6명',
    purpose: '내수면 어로 어가의 노후 어구 교체 지원금 확대 및 내수면어업법 관련 억울한 규제 정비, 정부/지자체 건의안 작성',
    status: '활동 중'
  },
  {
    id: 3,
    title: '🎯 3. 외래어종 퇴치 및 수질 환경 보전 특별위원회',
    chair: '윤 관 강원 지회장',
    members: '을지문덕 대의원 의장, 신립 대의원 외 10명',
    purpose: '배스, 블루길 등 외래 어종 무단 퇴치 수거 사업 추진 및 하계 고온기 수질 오염 방지 현장 지도 점검',
    status: '활동 중'
  }
];

// 전국 시·도 지회 (지회장 전화번호 및 소속 대의원 기본 3명 명단 포함)
let branchOrgList = [
  {
    id: 2,
    name: '강원 지회',
    leader: '윤관 (010-5678-9012)',
    delegates: [
      { name: '원균 대의원', phone: '010-3333-4444' },
      { name: '김춘천 대의원', phone: '010-3333-5555' },
      { name: '박양구 대의원', phone: '010-3333-6666' }
    ],
    region: '강원 소양호, 의암호, 파로호, 춘천호 수계 어가',
    office: '강원 춘천시 공지로 456 지회 회관 3층'
  },
  {
    id: 5,
    name: '경기 지회',
    leader: '강감찬 (010-3456-7890)',
    delegates: [
      { name: '을지문덕 대의원 (중앙의장)', phone: '010-8901-2345' },
      { name: '이양평 대의원', phone: '010-2222-3333' },
      { name: '최가평 대의원', phone: '010-2222-4444' }
    ],
    region: '경기 남한강, 북한강, 임진강, 한탄강 수계 어가',
    office: '경기 양평군 양평읍 234 지회 회관 3층'
  },
  {
    id: 4,
    name: '경남 지회',
    leader: '계백 (010-7890-1234)',
    delegates: [
      { name: '박밀양 대의원', phone: '010-4444-5555' },
      { name: '정진주 대의원', phone: '010-4444-6666' },
      { name: '김합천 대의원', phone: '010-4444-7777' }
    ],
    region: '경남 낙동강 하류, 진양호, 밀양, 합천호 수계 어가',
    office: '경남 밀양시 중앙로 101 지회 회관 2층'
  },
  {
    id: 7,
    name: '경북 지회',
    leader: '정기룡 (010-7777-8888)',
    delegates: [
      { name: '정기룡 대의원', phone: '010-7777-8888' },
      { name: '이안동 대의원', phone: '010-5555-1111' },
      { name: '최임하 대의원', phone: '010-5555-2222' }
    ],
    region: '경북 안동호, 임하호, 낙동강 상류, 금호강 수계 어가',
    office: '경북 안동시 퇴계로 890 지회 회관 2층'
  },
  {
    id: 3,
    name: '전남 지회',
    leader: '권율 (010-6789-0123)',
    delegates: [
      { name: '곽재우 대의원', phone: '010-5555-6666' },
      { name: '이나주 대의원', phone: '010-6666-1111' },
      { name: '박목포 대의원', phone: '010-6666-2222' }
    ],
    region: '전남 영산강, 섬진강, 보성강, 탐진강 수계 어가',
    office: '전남 나주시 영산로 789 지회 회관 1층'
  },
  {
    id: 8,
    name: '전북 지회',
    leader: '황진 (010-9999-0000)',
    delegates: [
      { name: '황진 대의원', phone: '010-9999-0000' },
      { name: '김임실 대의원', phone: '010-7777-1111' },
      { name: '이옥정 대의원', phone: '010-7777-2222' }
    ],
    region: '전북 옥정호, 동진강, 만경강, 금강 하구 수계 어가',
    office: '전북 임실군 운암면 12 지회 회관 1층'
  },
  {
    id: 6,
    name: '충남 지회',
    leader: '이순신 (010-2345-6789)',
    delegates: [
      { name: '이순신 대의원', phone: '010-2345-6789' },
      { name: '박공주 대의원', phone: '010-8888-1111' },
      { name: '최대청 대의원', phone: '010-8888-2222' }
    ],
    region: '충남 금강 상류, 대청호, 예당호, 탑정호 수계 어가',
    office: '충남 공주시 금강로 567 지회 회관 2층'
  },
  {
    id: 1,
    name: '충북 지회',
    leader: '김유신 (010-4567-8901)',
    delegates: [
      { name: '신립 대의원', phone: '010-1111-2222' },
      { name: '이충주 대의원', phone: '010-1111-3333' },
      { name: '박제천 대의원', phone: '010-1111-4444' }
    ],
    region: '충북 충주호, 청풍호, 제천, 단양, 대청호 수계 어가',
    office: '충북 제천시 의림대로 123 지회 회관 2층'
  }
];

// User Auth Session State
let currentUser = JSON.parse(sessionStorage.getItem('kifa_user')) || null;
let pendingAction = null;

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem('kifa_user')) || currentUser;
}

function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    sessionStorage.setItem('kifa_user', JSON.stringify(user));
  } else {
    sessionStorage.removeItem('kifa_user');
  }
  updateHeaderUserStatus();
}

function updateHeaderUserStatus() {
  const areaMain = document.getElementById('header-user-status-main');
  const user = getCurrentUser();

  if (areaMain) {
    if (user) {
      let roleLabel = '👤 일반 회원';
      let badgeStyle = 'background: #F1F5F9; color: #475569; border: 1px solid #CBD5E1;';

      if (user.role === 'master') {
        roleLabel = '👑 대표이사 (마스터)';
        badgeStyle = 'background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;';
      } else if (user.role === 'branch') {
        roleLabel = `🏛️ ${user.branch || '지회장'}`;
        badgeStyle = 'background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0;';
      }

      const displayName = (user.name || '회원').split('(')[0].trim();

      areaMain.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="${badgeStyle} padding: 6px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 800; white-space: nowrap;">
            <i class="fa-solid fa-user-check"></i> ${roleLabel}: ${displayName}
          </span>
          <button onclick="handleLogout(event)" style="background: #EF4444; color: #FFF; border: none; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 0.82rem; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 6px rgba(239,68,68,0.3);">
            <i class="fa-solid fa-right-from-bracket"></i> 로그아웃
          </button>
        </div>
      `;
    } else {
      areaMain.innerHTML = `
        <button onclick="openLoginModal('', null, event)" style="background: linear-gradient(135deg, #0284C7, #0369A1); color: #FFF; border: none; padding: 9px 18px; border-radius: 10px; font-weight: 800; font-size: 0.88rem; cursor: pointer; box-shadow: 0 4px 12px rgba(2,132,199,0.35); white-space: nowrap;">
          <i class="fa-solid fa-right-to-bracket"></i> 🔐 로그인
        </button>
      `;
    }
  }
}
window.updateHeaderUserStatus = updateHeaderUserStatus;

function openLoginModal(promptMsg = '', actionTarget = null, e = null) {
  if (e && e.stopPropagation) e.stopPropagation();
  if (e && e.preventDefault) e.preventDefault();
  closeWelcomeNotice();
  hideModalClean('about-modal');
  hideModalClean('notice-modal');

  pendingAction = actionTarget;
  const promptEl = document.getElementById('login-modal-prompt');
  if (promptEl) {
    promptEl.innerHTML = (typeof promptMsg === 'string' && promptMsg) ? promptMsg : `일반 방문객(게스트)은 로그인 없이 연합회 소식과 조직도를 자유롭게 보실 수 있습니다.<br>마스터, 지회장 및 회원 권한으로 로그인하려면 아이디/비밀번호를 입력해 주세요.`;
  }
  const form = document.getElementById('login-form');
  if (form) form.reset();
  showModalClean('login-modal');
}
window.openLoginModal = openLoginModal;

function closeLoginModal() {
  hideModalClean('login-modal');
}
window.closeLoginModal = closeLoginModal;

function quickLogin(roleType) {
  let user = null;
  if (roleType === 'master') {
    user = { id: 'master', name: '홍길동 회장 (대표이사)', role: 'master', branch: '중앙 사무국' };
  } else if (roleType === 'branch') {
    user = { id: 'branch', name: '김충북 (충북 지회장)', role: 'branch', branch: '충북 지회' };
  }
  setCurrentUser(user);
    closeLoginModal();
    renderGalleryGrid('all');
    renderAccountingList();
    if (user && user.role === 'master') {
      insertMasterContactSettingsButton();
    }
  // renderWelcomeNotice();
  renderPresidentGreeting();

  const roleTitle = user.role === 'master' ? '👑 사단법인 대표이사 (총괄 마스터)' : '🏛️ 시·도 지회장 (이사회 관리자)';
  alert(`[로그인 성공]\n${user.name} 님 (${roleTitle}) 권한으로 접속되었습니다.`);

  if (pendingAction === 'admin') openAdminModal();
  else if (pendingAction === 'branch') openBranchAdminModal();
  pendingAction = null;
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const idInput = document.getElementById('login-id').value.trim().toLowerCase();
  const pwInput = document.getElementById('login-pw').value.trim();

  let user = null;
  if (idInput === 'master') {
    user = { id: 'master', name: '사무총장 (프로그램 총괄)', role: 'master', branch: '중앙 사무국' };
  } else if (idInput === 'branch') {
    user = { id: 'branch', name: '김충북 (충북 지회장)', role: 'branch', branch: '충북 지회' };
  } else {
    const found = usersList.find(u => u.id.toLowerCase() === idInput && u.pw === pwInput);
    if (found) {
      user = { id: found.id, name: found.name, role: found.role || 'member', branch: found.branch || '연합회 회원' };
    } else if (idInput.length > 0) {
      user = { id: idInput, name: `${idInput} 회원`, role: 'member', branch: '전국 회원' };
    }
  }

  if (!user) {
    alert("아이디를 입력해 주세요.");
    return;
  }

  setCurrentUser(user);
    closeLoginModal();
    renderGalleryGrid('all');
    renderAccountingList();
    if (user && user.role === 'master') {
      insertMasterContactSettingsButton();
    }
  // renderWelcomeNotice();
  renderPresidentGreeting();

  const roleTitle = user.role === 'master' ? '👑 사단법인 대표이사 (총괄 마스터)' : (user.role === 'branch' ? '🏛️ 시·도 지회장 (이사회 관리자)' : '👤 연합회 일반 회원');
  alert(`[로그인 성공]\n${user.name} 님 (${roleTitle}) 권한으로 접속되었습니다.`);

  if (pendingAction === 'admin') openAdminModal();
  else if (pendingAction === 'branch') openBranchAdminModal();
  pendingAction = null;
}

function handleLogout() {
  setCurrentUser(null);
  closeAdminModal();
  closeBranchAdminModal();
  renderGalleryGrid('all');
  renderAccountingList();
  alert("정상적으로 로그아웃되었습니다.");
}

function openChangePwModal() {
  const form = document.getElementById('change-pw-form');
  if (form) form.reset();
  showModalClean('change-pw-modal');
}

function closeChangePwModal() {
  hideModalClean('change-pw-modal');
}

async function handleChangePwSubmit(e) {
  e.preventDefault();
  const oldPw = document.getElementById('change-pw-old').value.trim();
  const newPw = document.getElementById('change-pw-new').value.trim();
  const confirmPw = document.getElementById('change-pw-confirm').value.trim();

  if (!currentUser || !currentUser.id) {
    alert('로그인 정보가 없습니다.');
    return;
  }

  // Find the exact user in usersList to verify old password
  const foundUser = usersList.find(u => u.id === currentUser.id);
  if (!foundUser || foundUser.pw !== oldPw) {
    alert('기존 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.');
    return;
  }

  if (newPw !== confirmPw) {
    alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
    return;
  }
  
  if (newPw.length < 4) {
    alert('비밀번호는 최소 4자리 이상이어야 합니다.');
    return;
  }

  try {
    const res = await fetch('/api/change-pw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentUser.id, newPw })
    });
    
    if (res.ok) {
      const result = await res.json();
      if (result.db && result.db.users) {
        usersList = result.db.users; // Update local state!
      }
      alert('비밀번호가 성공적으로 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용해주세요.');
      closeChangePwModal();
    } else {
      alert('비밀번호 변경에 실패했습니다.');
    }
  } catch (err) {
    console.error(err);
    alert('네트워크 오류가 발생했습니다.');
  }
}



// MEMBER AUTH MODAL ROUTER
function openMemberAuthModal() {
  const user = getCurrentUser();
  if (user && user.role === 'master') {
    openMasterApprovalModal();
  } else {
    openSignupModal();
  }
}

function openSignupModal() {
  hideModalClean('master-approval-modal');
  const form = document.getElementById('signup-form');
  if (form) form.reset();
  showModalClean('signup-modal');
}

function closeSignupModal() {
  hideModalClean('signup-modal');
}

function handleSignupRoleChange() {
  const roleSelect = document.getElementById('signup-role');
  const branchSelect = document.getElementById('signup-branch');
  const branchLabel = document.getElementById('signup-branch-label');
  const optCenter = document.getElementById('opt-center');
  
  if (roleSelect && roleSelect.value === 'master') {
    if (optCenter) optCenter.style.display = 'block';
    if (branchSelect) branchSelect.value = '중앙 사무국';
    if (branchLabel) branchLabel.innerText = '소속 (자동 설정) *';
  } else {
    if (optCenter) optCenter.style.display = 'none';
    if (branchSelect) branchSelect.value = '충북 지회';
    if (branchLabel) branchLabel.innerText = '소속 지회 *';
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  const roleSelect = document.getElementById('signup-role');
  const role = roleSelect ? roleSelect.value : 'branch';
  const name = document.getElementById('signup-name').value.trim();
  const branch = document.getElementById('signup-branch').value;
  const id = document.getElementById('signup-id').value.trim();
  const pw = document.getElementById('signup-pw').value.trim();
  const phone = document.getElementById('signup-phone').value.trim();
  const reason = document.getElementById('signup-reason').value.trim();

  const payload = {
    id, pw, name, branch, phone, reason,
    role: role,
    requestDate: new Date().toISOString().slice(0, 10),
    status: 'pending'
  };

  try {
    const res = await fetch('/api/signup-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const result = await res.json();
      pendingUsersList = result.db.pendingUsers || [];
      closeSignupModal();
      const roleText = role === 'master' ? '연합회 최고 마스터' : '시·도 지회 권한';
      alert(`[가입 신청 접수 완료]\n'${name}' 님의 [${roleText}] 가입 신청서가 성공적으로 접수되었습니다.\n\n사무총장 승인 후 로그인하여 관리자 권한으로 활동이 가능합니다.`);
      return;
    } else {
      const errRes = await res.json();
      alert(`[신청 실패] ${errRes.error || '오류가 발생했습니다.'}`);
      return;
    }
  } catch (err) {
    console.log('Error sending signup request:', err);
  }

  pendingUsersList.push(payload);
  closeSignupModal();
  const roleText = role === 'master' ? '연합회 최고 마스터' : '시·도 지회 권한';
  alert(`[가입 신청 접수 완료]\n'${name}' 님의 [${roleText}] 가입 신청서가 성공적으로 접수되었습니다.`);
}

function openMasterApprovalModal() {
  renderMasterApprovalList();
  showModalClean('master-approval-modal');
}

function closeMasterApprovalModal() {
  hideModalClean('master-approval-modal');
}

function renderMasterApprovalList() {
  const container = document.getElementById('master-approval-list-container');
  if (!container) return;

  let html = `
    <div style="font-size: 0.95rem; font-weight: 800; color: #0A2540; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
      <span><i class="fa-solid fa-user-clock" style="color: #D97706;"></i> 승인 대기 신청자 목록 (${pendingUsersList.length}건)</span>
      <span style="font-size: 0.8rem; color: #059669;"><i class="fa-solid fa-user-check"></i> 이미 승인된 지회 아이디: ${usersList.length}개</span>
    </div>
  `;

  if (!pendingUsersList || pendingUsersList.length === 0) {
    html += `
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 30px; text-align: center; border-radius: 10px; color: #94A3B8;">
        현재 승인 대기 중인 신규 가입 신청건이 없습니다.
      </div>
    `;
  } else {
    html += `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${pendingUsersList.map(item => `
          <div style="background: #FFF; border: 1px solid #CBD5E1; border-radius: 10px; padding: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="background: ${item.role === 'master' ? '#0A2540' : '#FEF3C7'}; color: ${item.role === 'master' ? '#FCD34D' : '#92400E'}; padding: 2px 8px; border-radius: 4px; font-size: 0.76rem; font-weight: 800;">
                  ${item.role === 'master' ? '<i class="fa-solid fa-crown"></i> 마스터 대기' : '지회 승인 대기'}
                </span>
                <strong style="color: #0A2540; font-size: 0.95rem;">${item.name}</strong>
                <span style="color: #0284C7; font-size: 0.82rem; font-weight: 700;">(${item.branch})</span>
              </div>
              <div style="font-size: 0.82rem; color: #64748B;">
                <strong>신청 권한:</strong> ${item.role === 'master' ? '연합회 최고 관리자' : '지회 관리자'} | <strong>신청 ID:</strong> <span style="color: #0F172A; font-weight: 800;">${item.id}</span> | <strong>연락처:</strong> ${item.phone} | <strong>신청일:</strong> ${item.requestDate || '2026-07-26'}
              </div>
              <div style="font-size: 0.82rem; color: #334155; margin-top: 4px; background: #F1F5F9; padding: 6px 10px; border-radius: 6px;">
                💬 신청 사유: ${item.reason}
              </div>
            </div>
            
            <div style="display: flex; gap: 6px;">
              <button onclick="approveUser('${item.id}')" style="background: #059669; color: #FFF; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: 0.82rem; cursor: pointer;">
                <i class="fa-solid fa-check"></i> 🟢 권한 승인
              </button>
              <button onclick="deletePendingUser('${item.id}')" style="background: #EF4444; color: #FFF; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: 0.82rem; cursor: pointer;">
                <i class="fa-solid fa-trash-can"></i> 🔴 거절 / 삭제
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- Approved Users Rendering ---
  html += `
    <div style="font-size: 0.95rem; font-weight: 800; color: #0A2540; margin-top: 30px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
      <span><i class="fa-solid fa-users" style="color: #059669;"></i> 이미 승인된 지회 아이디 목록 (${usersList.length}건)</span>
    </div>
  `;
  
  if (!usersList || usersList.length === 0) {
    html += `<div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 20px; text-align: center; border-radius: 10px; color: #94A3B8;">승인된 계정이 없습니다.</div>`;
  } else {
    html += `<div style="display: flex; flex-direction: column; gap: 10px;">`;
    html += usersList.map(item => `
      <div style="background: #FFF; border: 1px solid #CBD5E1; border-radius: 10px; padding: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="background: ${item.role === 'master' ? '#0A2540' : '#DCFCE7'}; color: ${item.role === 'master' ? '#FCD34D' : '#15803D'}; padding: 2px 8px; border-radius: 4px; font-size: 0.76rem; font-weight: 800;">
              ${item.role === 'master' ? '<i class="fa-solid fa-crown"></i> 마스터' : '지회 승인됨'}
            </span>
            <strong style="color: #0A2540; font-size: 0.95rem;">${item.name}</strong>
            <span style="color: #0284C7; font-size: 0.82rem; font-weight: 700;">(${item.branch})</span>
          </div>
          <div style="font-size: 0.82rem; color: #64748B;">
            <strong>권한:</strong> ${item.role === 'master' ? '연합회 최고 관리자' : '지회 관리자'} | <strong>로그인 ID:</strong> <span style="color: #0F172A; font-weight: 800;">${item.id}</span>
          </div>
        </div>
        
        ${item.role === 'master' ? '' : `
        <div style="display: flex; gap: 6px;">
          <button onclick="deleteApprovedUser('${item.id}')" style="background: #EF4444; color: #FFF; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: 0.82rem; cursor: pointer;">
            <i class="fa-solid fa-trash-can"></i> 삭제(해지)
          </button>
        </div>
        `}
      </div>
    `).join('');
    html += `</div>`;
  }

  container.innerHTML = html;
}

async function approveUser(userId) {
  try {
    const res = await fetch('/api/approve-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId })
    });
    if (res.ok) {
      const result = await res.json();
      usersList = result.db.users || [];
      pendingUsersList = result.db.pendingUsers || [];
      renderMasterApprovalList();
      alert(`[권한 승인 완료]\n아이디 '${userId}' 가 성공적으로 승인되었습니다. 해당 지회 계정으로 로그인이 가능합니다.`);
      return;
    }
  } catch (err) {
    console.log('Error approving user:', err);
  }
}

async function deletePendingUser(userId) {
  if (confirm("정말 이 가입 신청을 거절하고 삭제하시겠습니까?")) {
    try {
      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      });
      if (res.ok) {
        const result = await res.json();
        usersList = result.db.users || [];
        pendingUsersList = result.db.pendingUsers || [];
        renderMasterApprovalList();
        alert("[신청 삭제 완료] 해당 가입 신청건이 삭제되었습니다.");
        return;
      }
    } catch (err) {
      console.log('Error deleting pending user:', err);
    }
  }
}

// ACCORDION TOGGLE HELPER
function toggleAccordion(detailId, iconId) {
  const detail = document.getElementById(detailId);
  const icon = document.getElementById(iconId);
  if (!detail) return;

  if (detail.style.display === 'none' || detail.style.display === '') {
    detail.style.display = 'block';
    if (icon) icon.innerHTML = '<i class="fa-solid fa-chevron-up"></i> 닫기';
  } else {
    detail.style.display = 'none';
    if (icon) icon.innerHTML = '<i class="fa-solid fa-chevron-down"></i> 상세보기';
  }
}

// 🎯 SPECIAL COMMITTEES CONTROLS
function openCommitteeModal(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  renderCommitteeCards();
  showModalClean('committee-modal');
}

function closeCommitteeModal() {
  hideModalClean('committee-modal');
}

function renderCommitteeCards() {
  const container = document.getElementById('committee-cards-container');
  const btnArea = document.getElementById('committee-admin-btn-area');
  if (!container) return;

  const user = getCurrentUser();

  if (btnArea) {
    btnArea.innerHTML = `
      <div style="background: #FFFBEB; border: 1px solid #FDE68A; padding: 12px 16px; border-radius: 10px; margin-top: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <span style="font-size: 0.84rem; color: #92400E; font-weight: 700;">
          <i class="fa-solid fa-circle-info"></i> 현안에 따라 생성되는 특별위원회를 등록하고 세부 관리가 가능합니다.
        </span>
        ${(user && user.role === 'master') ? `
          <button onclick="openAddCommitteeModal()" style="background: #D97706; color: #FFF; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: 0.82rem; cursor: pointer;">
            + 🎯 신규 특별위원회 추가 생성 및 해체 관리
          </button>
        ` : ''}
      </div>
    `;
  }

  if (!committeesList || committeesList.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 30px; color: #94A3B8;">등록된 특별위원회가 없습니다.</div>`;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${committeesList.map(item => `
        <div style="border: 1px solid #FDE68A; border-radius: 10px; background: #FFF; overflow: hidden; box-shadow: 0 2px 6px rgba(217,119,6,0.06);">
          <div onclick="toggleAccordion('comm-detail-${item.id}', 'comm-icon-${item.id}')" style="padding: 12px 14px; background: #FFFBEB; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
              <span style="background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; flex-shrink: 0;">${item.status || '활동 중'}</span>
              <strong style="color: #0A2540; font-size: 0.95rem; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title || '특별위원회'}</strong>
            </div>
            <span id="comm-icon-${item.id}" style="color: #D97706; font-size: 0.8rem; font-weight: 700; white-space: nowrap; flex-shrink: 0;">
              <i class="fa-solid fa-chevron-down"></i> 상세보기
            </span>
          </div>
          
          <div id="comm-detail-${item.id}" style="display: none; padding: 14px 16px; border-top: 1px dashed #FDE68A; background: #FFF;">
            <div style="background: #F8FAFC; padding: 10px 12px; border-radius: 8px; font-size: 0.84rem; color: #334155; margin-bottom: 10px;">
              <div><strong>👤 위원장:</strong> ${item.chair || '위원장 미지정'}</div>
              <div style="margin-top: 2px;"><strong>👥 구성 위원 명단:</strong> ${item.members || '구성 위원 명부'}</div>
            </div>

            <div style="font-size: 0.88rem; color: #475569; line-height: 1.6;">
              <strong>🎯 추진 목적 및 현안:</strong> ${item.purpose || '특별위원회 설치 목적 및 해결 안건'}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function openAddCommitteeModal() {
  hideModalClean('committee-modal');
  editingCommitteeId = null;
  const form = document.getElementById('add-committee-form');
  if (form) form.reset();
  const submitBtn = document.querySelector('#add-committee-form button[type="submit"]');
  if (submitBtn) submitBtn.innerHTML = `신규 위원회 등록하기`;
  renderCommitteeManageList();
  showModalClean('add-committee-modal');
}

function renderCommitteeManageList() {
  let listEl = document.getElementById('committee-manage-list-area');
  const form = document.getElementById('add-committee-form');
  if (!form) return;

  if (!listEl) {
    listEl = document.createElement('div');
    listEl.id = 'committee-manage-list-area';
    listEl.style.cssText = 'margin-bottom: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 14px;';
    form.parentNode.insertBefore(listEl, form);
  }

  if (!committeesList || committeesList.length === 0) {
    listEl.innerHTML = `<div style="font-size: 0.82rem; color: #94A3B8;">현재 등록된 특별위원회가 없습니다.</div>`;
    return;
  }

  listEl.innerHTML = `
    <div style="font-size: 0.86rem; font-weight: 800; color: #0A2540; margin-bottom: 8px;">
      👑 현재 등록된 특별위원회 현황 및 해체 관리 (${committeesList.length}개):
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px; max-height: 160px; overflow-y: auto; padding-right: 4px;">
      ${committeesList.map(c => `
        <div style="background: #FFFBEB; border: 1px solid #FDE68A; padding: 8px 10px; border-radius: 6px; display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #0A2540; font-weight: 700;">${c.title}</span>
            <button type="button" onclick="toggleCommitteeManage(${c.id})" style="background: #E2E8F0; color: #475569; border: 1px solid #CBD5E1; padding: 2px 8px; border-radius: 4px; font-weight: 800; cursor: pointer; font-size: 0.75rem;">관리 ▾</button>
          </div>
          <div id="committee-manage-actions-${c.id}" style="display: none; justify-content: flex-end; gap: 6px; margin-top: 4px; padding-top: 6px; border-top: 1px dashed #FCD34D;">
            <button type="button" onclick="editCommittee(${c.id})" style="background: #DBEAFE; color: #1D4ED8; border: 1px solid #BFDBFE; padding: 2px 8px; border-radius: 4px; font-weight: 800; cursor: pointer; font-size: 0.75rem;">수정</button>
            <button type="button" onclick="deleteCommittee(${c.id})" style="background: #FEF2F2; color: #DC2626; border: 1px solid #FCA5A5; padding: 2px 8px; border-radius: 4px; font-weight: 800; cursor: pointer; font-size: 0.75rem;">삭제</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function toggleCommitteeManage(id) {
  const el = document.getElementById(`committee-manage-actions-${id}`);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  }
}

function editCommittee(id) {
  editingCommitteeId = id;
  const c = committeesList.find(x => x.id === id);
  if (!c) return;
  
  document.getElementById('committee-title').value = c.title.replace('🎯 ', '');
  document.getElementById('committee-chair').value = c.chair;
  document.getElementById('committee-members').value = c.members;
  document.getElementById('committee-purpose').value = c.purpose;
  
  const submitBtn = document.querySelector('#add-committee-form button[type="submit"]');
  if (submitBtn) submitBtn.innerHTML = `수정 내용 저장하기`;
}

function closeAddCommitteeModal() {
  hideModalClean('add-committee-modal');
  openCommitteeModal();
}

let editingCommitteeId = null;

function handleAddCommitteeSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('committee-title').value.trim();
  const chair = document.getElementById('committee-chair').value.trim();
  const members = document.getElementById('committee-members').value.trim();
  const purpose = document.getElementById('committee-purpose').value.trim();

  if (editingCommitteeId) {
    const idx = committeesList.findIndex(c => c.id === editingCommitteeId);
    if (idx !== -1) {
      committeesList[idx] = {
        ...committeesList[idx],
        title: title.startsWith('🎯') ? title : `🎯 ${title}`,
        chair, members, purpose
      };
    }
    editingCommitteeId = null;
    alert(`[수정 완료]\n'${title}' 특별위원회가 수정되었습니다.`);
  } else {
    const newComm = {
      id: Date.now(),
      title: title.startsWith('🎯') ? title : `🎯 ${title}`,
      chair, members, purpose,
      status: '활동 중'
    };
    committeesList.push(newComm);
    alert(`[생성 완료]\n'${title}' 특별위원회가 신규 생성 및 등록되었습니다.`);
  }

  syncOrgDataToServer();
  renderCommitteeManageList();
  renderCommitteeCards();
  const form = document.getElementById('add-committee-form');
  if (form) form.reset();
  
  const submitBtn = document.querySelector('#add-committee-form button[type="submit"]');
  if (submitBtn) submitBtn.innerHTML = `신규 위원회 등록하기`;
}

function deleteCommittee(id) {
  if (confirm("정말 이 특별위원회를 해체 및 삭제하시겠습니까?")) {
    committeesList = committeesList.filter(c => c.id !== id);
    syncOrgDataToServer();
    renderCommitteeManageList();
    renderCommitteeCards();
    alert("해체 삭제되었습니다.");
  }
}

// 🏛️ REGIONAL BRANCHES ORG CONTROLS (전국 시·도 지회 조직 관리)
function openBranchListModal(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  try {
    renderBranchCards();
  } catch (err) {
    console.log('Error rendering branch cards:', err);
  }
  const modal = document.getElementById('branch-list-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.style.zIndex = '300000';
    modal.classList.add('active');
    modal.scrollTop = 0;
    const content = modal.querySelector('.modal-content');
    if (content) content.scrollTop = 0;
  }
}

function closeBranchListModal() {
  hideModalClean('branch-list-modal');
}


function renderBranchCards() {
  const container = document.getElementById('branch-cards-grid-container');
  const btnArea = document.getElementById('branch-list-admin-btn-area');
  if (!container) return;

  const user = getCurrentUser();

  if (btnArea) {
    btnArea.innerHTML = `
      <div style="background: #F0F9FF; border: 1px solid #BAE6FD; padding: 12px 16px; border-radius: 10px; margin-top: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <span style="font-size: 0.84rem; color: #0369A1; font-weight: 700;">
          <i class="fa-solid fa-circle-info"></i> 시·도 지회 신설 및 삭제는 마스터가 관리할 수 있습니다.
        </span>
        ${(user && user.role === 'master') ? `
          <button onclick="openAddBranchModal()" style="background: #0284C7; color: #FFF; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: 0.82rem; cursor: pointer;">
            + 시·도 지회 신설 및 조직 관리
          </button>
        ` : ''}
      </div>
    `;
  }

  const activeBranches = (Array.isArray(branchOrgList) && branchOrgList.length > 0)
    ? branchOrgList
    : [
        { id: 2, name: '경기 지회', leader: '강감찬 (010-5678-9012)', delegates: [{ name: '강동 대의원', phone: '010-3333-4444' }, { name: '성남 대의원', phone: '010-3333-5555' }, { name: '남양주 대의원', phone: '010-3333-6666' }], region: '경기 팔당호, 평택호, 청평호, 시화호 등 내수면', office: '경기 성남시 분당구 456 지회 회관 3층' },
        { id: 5, name: '전남 지회', leader: '권율 (010-3456-7890)', delegates: [{ name: '권 대의원 (광주)', phone: '010-8901-2345' }, { name: '이순 대의원', phone: '010-2222-3333' }, { name: '김광 대의원', phone: '010-2222-4444' }], region: '전남 영산강, 탐진강, 보성강, 나주호 등 내수면', office: '전남 나주시 남평읍 234 지회 회관 3층' },
        { id: 4, name: '경북 지회', leader: '정기룡 (010-7890-1234)', delegates: [{ name: '자비원 대의원', phone: '010-4444-5555' }, { name: '정 대의원', phone: '010-4444-6666' }, { name: '신동 대의원', phone: '010-4444-7777' }], region: '경북 낙동강 상류, 안동호, 임하호, 형산강 등 내수면', office: '경북 안동시 중구동 101 지회 회관 2층' },
        { id: 7, name: '충남 지회', leader: '이순신 (010-7777-8888)', delegates: [{ name: '이 대의원', phone: '010-7777-8888' }, { name: '아산만 대의원', phone: '010-5555-1111' }, { name: '천 대의원', phone: '010-5555-2222' }], region: '충남 예당호, 삽교호, 금강 하구, 대청호 등 내수면', office: '충남 예산군 신양면 890 지회 회관 2층' },
        { id: 3, name: '경남 지회', leader: '계백 (010-6789-0123)', delegates: [{ name: '계 대의원', phone: '010-5555-6666' }, { name: '마산 대의원', phone: '010-6666-1111' }, { name: '창원 대의원', phone: '010-6666-2222' }], region: '경남 낙동강, 남강, 황강, 진양호 등 내수면', office: '경남 진주시 평거동 789 지회 회관 1층' },
        { id: 8, name: '전북 지회', leader: '황진 (010-9999-0000)', delegates: [{ name: '황진 대의원', phone: '010-9999-0000' }, { name: '임실 대의원', phone: '010-7777-1111' }, { name: '진안 대의원', phone: '010-7777-2222' }], region: '전북 옥정호, 동진강, 만경강, 금강 상류 등 내수면', office: '전북 임실군 운암면 12 지회 회관 1층' },
        { id: 6, name: '충북 지회', leader: '김유신 (010-2345-6789)', delegates: [{ name: '김유신 대의원', phone: '010-2345-6789' }, { name: '충주 대의원', phone: '010-8888-1111' }, { name: '단양청 대의원', phone: '010-8888-2222' }], region: '충북 충주호 상·하류, 대청호, 괴산호, 파로호 등 내수면', office: '충북 충주시 칠금동 567 지회 회관 2층' },
        { id: 1, name: '강원 지회', leader: '윤관 (010-4567-8901)', delegates: [{ name: '소양 대의원', phone: '010-1111-2222' }, { name: '윤 대의원', phone: '010-1111-3333' }, { name: '춘천 대의원', phone: '010-1111-4444' }], region: '강원 소양호, 청평호, 의암호, 북한강, 남한강 등 내수면', office: '강원 춘천시 퇴계동 123 지회 회관 2층' }
      ];

  const sortedBranchList = activeBranches;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${sortedBranchList.map((item, idx) => {
        const cleanName = (item.name || '시·도 지회').replace(/^(\d+\.\s*|🏛️\s*)/, '').trim();
        const displayTitle = `${idx + 1}. ${cleanName}`;
        const rawLeader = item.leader || '지회장 (연락처 미등록)';
        const cleanLeaderName = rawLeader.replace('지회장', '').split('(')[0].trim() || '지회장';

        // 중앙 이사회 겸임 여부 배지
        const boardSeat = (Array.isArray(boardList) ? boardList : []).find(b => 
          (b.branchId && String(b.branchId) === String(item.id)) || 
          (cleanLeaderName && cleanLeaderName !== '지회장' && b.name && b.name.includes(cleanLeaderName))
        );
        const boardBadge = boardSeat
          ? `<span style="background: #E0F2FE; color: #0284C7; border: 1px solid #BAE6FD; padding: 2px 8px; border-radius: 4px; font-size: 0.76rem; font-weight: 800; margin-left: 6px;"><i class="fa-solid fa-crown"></i> 중앙 이사회 ${boardSeat.tag || '겸임 이사'}</span>`
          : '';

        // delegateList 및 boardList에서 해당 지회 소속 임원(감사/이사 등) 및 대의원 동적 매칭
        const cleanNameNoSpace = cleanName.replace(/\s+/g, '');
        const branchRegionKey = cleanName.replace(/^[0-9.\s]+/, '').replace(/^🏛️\s*/, '').replace(/지회.*/, '').trim();

        // 1) 지회 소속 중앙 이사회 임원 (지회장 본인 제외, 감사/이사 등)
        const linkedBoardMembers = (Array.isArray(boardList) ? boardList : []).filter(b => {
          if (b.isBranchLeader) return false;
          const bBranchNoSpace = (b.branchName || '').replace(/\s+/g, '');
          return (b.branchId && String(b.branchId) === String(item.id)) ||
                 (bBranchNoSpace && (cleanNameNoSpace.includes(bBranchNoSpace) || bBranchNoSpace.includes(cleanNameNoSpace))) ||
                 (b.role && cleanNameNoSpace && b.role.replace(/\s+/g, '').includes(cleanNameNoSpace));
        }).map(b => ({
          name: b.name + (b.tag ? ` ${b.tag}` : ' 임원'),
          phone: b.phone,
          badge: `<span style="background: #E0F2FE; color: #0284C7; border: 1px solid #BAE6FD; padding: 1px 6px; border-radius: 4px; font-size: 0.72rem; font-weight: 800; margin-left: 4px;">중앙연합회 ${b.tag || '임원'}</span>`
        }));

        // 2) 지회 소속 대의원
        const linkedDelegates = (Array.isArray(delegateList) ? delegateList : []).filter(d => {
          const dBranchNoSpace = (d.branchName || '').replace(/\s+/g, '');
          return (d.branchId && String(d.branchId) === String(item.id)) ||
                 (dBranchNoSpace && (cleanNameNoSpace.includes(dBranchNoSpace) || dBranchNoSpace.includes(cleanNameNoSpace))) ||
                 (branchRegionKey && d.region && d.region.includes(branchRegionKey)) ||
                 (branchRegionKey && d.role && d.role.includes(branchRegionKey));
        }).map(d => ({
          name: d.name + (d.name.includes('대의원') ? '' : ' 대의원'),
          phone: d.phone,
          badge: ''
        }));

        let delegatesList = [...linkedBoardMembers, ...linkedDelegates];
        if (delegatesList.length === 0 && item.delegates && item.delegates.length > 0) {
          delegatesList = item.delegates.map(d => ({ name: d.name, phone: d.phone, badge: '' }));
        }

        return `
          <div style="border: 1px solid #BAE6FD; border-radius: 10px; background: #FFF; overflow: hidden; box-shadow: 0 2px 6px rgba(2,132,199,0.05);">
            <div onclick="toggleAccordion('branch-detail-${item.id}', 'branch-icon-${item.id}')" style="padding: 12px 14px; background: #F0F9FF; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                <strong style="color: #0A2540; font-size: 0.95rem; font-weight: 900; white-space: nowrap;">${displayTitle}</strong>
                <span style="font-size: 0.82rem; color: #0284C7; font-weight: 700; white-space: nowrap;">(지회장: ${cleanLeaderName})</span>
              </div>
              <span id="branch-icon-${item.id}" style="color: #0284C7; font-size: 0.8rem; font-weight: 700; white-space: nowrap; flex-shrink: 0;">
                <i class="fa-solid fa-chevron-down"></i> 상세보기
              </span>
            </div>

            <div id="branch-detail-${item.id}" style="display: none; padding: 14px 16px; border-top: 1px dashed #BAE6FD; background: #FFF;">
              <div style="font-size: 0.86rem; color: #334155; line-height: 1.6; background: #F8FAFC; padding: 12px 14px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #E2E8F0;">
                <div style="font-size: 0.89rem; color: #0A2540; font-weight: 800;">
                  👤 <strong>지회장:</strong> <span style="color: #0284C7; font-weight: 900;">${rawLeader}</span> ${boardBadge}
                </div>
                
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E2E8F0;">
                  <div style="font-size: 0.86rem; color: #0A2540; font-weight: 800; margin-bottom: 4px;">
                    👥 <strong>지회 소속 임원 및 대의원 (${delegatesList.length}명):</strong>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 3px; padding-left: 6px;">
                    ${delegatesList.map((d, dIdx) => `
                      <div style="font-size: 0.83rem; color: #475569; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <span style="color: #0284C7; font-weight: 800;">• ${dIdx + 1}.</span>
                        <strong>${d.name || '임원/대의원'}</strong>
                        <span style="color: #64748B;">(${d.phone || '연락처 미등록'})</span>
                        ${d.badge || ''}
                      </div>
                    `).join('')}
                  </div>
                </div>

                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E2E8F0;">
                  <div><strong>📍 관할 수계 및 주요 어가:</strong> ${item.region || '내수면 수계 어가'}</div>
                  <div style="margin-top: 4px;"><strong>🏢 지회 사무실 주소:</strong> ${item.office || '지회 회관 1층'}</div>
                  ${item.history ? `
                    <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #CBD5E1; font-size: 0.82rem; color: #0284C7; font-weight: 700;">
                      📅 <strong>조직 개편 및 신설 이력:</strong> ${item.history}
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

let activeBranchForAction = null;
let currentBranchActionOption = 'merge';

function toggleNewBranchForm(show) {
  const box = document.getElementById('new-branch-form-box');
  if (!box) return;
  if (show === undefined) {
    box.style.display = (box.style.display === 'none' || box.style.display === '') ? 'block' : 'none';
  } else {
    box.style.display = show ? 'block' : 'none';
  }
}

function openAddBranchModal() {
  currentEditingBranchId = null;
  hideModalClean('branch-list-modal');
  const form = document.getElementById('add-branch-form');
  if (form) form.reset();
  toggleNewBranchForm(false);
  renderBranchManageList();
  showModalClean('add-branch-modal');
}


let currentEditingBranchId = null;

function renderBranchManageList() {
    let listEl = document.getElementById('branch-manage-list-container');
    if (!listEl) {
      listEl = document.getElementById('branch-manage-list-area');
    }
    if (!listEl) return;
  
    if (!branchOrgList || branchOrgList.length === 0) {
      listEl.innerHTML = `<div style="font-size: 0.82rem; color: #94A3B8; padding: 20px; text-align: center;">등록된 시도 지회가 없습니다.</div>`;
      return;
    }
  
    listEl.innerHTML = `
      <div style="font-size: 0.88rem; font-weight: 800; color: #0A2540; margin-bottom: 10px;">
        현재 등록된 시·도 지회 현황 (${branchOrgList.length}개):
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px; max-height: 280px; overflow-y: auto; padding-right: 4px;">
        ${branchOrgList.map((b, idx) => {
          const cleanLeaderName = b.leader ? b.leader.split('(')[0].trim() : '지회장';
          return `
            <div style="background: #F0F9FF; border: 1px solid #BAE6FD; padding: 10px 12px; border-radius: 8px; display: flex; flex-direction: column; font-size: 0.86rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #0A2540; font-weight: 800;">${b.name} (지회장: ${cleanLeaderName})</span>
                <button type="button" onclick="toggleBranchAction(${idx})" style="background: #E0F2FE; color: #0284C7; border: 1px solid #BAE6FD; padding: 2px 8px; border-radius: 4px; font-weight: 800; cursor: pointer; font-size: 0.75rem;">관리</button>
              </div>
              <div id="branch-action-${idx}" style="display: none; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #BAE6FD; text-align: right;">
                <button type="button" onclick="moveBranchUp(${idx})" style="background: #E5E7EB; color: #4B5563; border: 1px solid #D1D5DB; padding: 2px 8px; border-radius: 4px; font-weight: 800; cursor: pointer; font-size: 0.75rem; margin-right: 4px;">▲위로</button>
                <button type="button" onclick="moveBranchDown(${idx})" style="background: #E5E7EB; color: #4B5563; border: 1px solid #D1D5DB; padding: 2px 8px; border-radius: 4px; font-weight: 800; cursor: pointer; font-size: 0.75rem; margin-right: 12px;">▼아래로</button>
                <button type="button" onclick="editBranchOrg(${idx})" style="background: #FEF3C7; color: #D97706; border: 1px solid #FDE68A; padding: 2px 10px; border-radius: 4px; font-weight: 800; cursor: pointer; font-size: 0.75rem; margin-right: 6px;">수정</button>
                <button type="button" onclick="deleteBranchItem(${idx})" style="background: #FEF2F2; color: #DC2626; border: 1px solid #FCA5A5; padding: 2px 10px; border-radius: 4px; font-weight: 800; cursor: pointer; font-size: 0.75rem;">삭제</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
}

function toggleBranchAction(idx) {
  const div = document.getElementById(`branch-action-${idx}`);
  if (div) {
    div.style.display = (div.style.display === 'none' || div.style.display === '') ? 'block' : 'none';
  }
}

function moveBranchUp(idx) {
  if (idx <= 0) return;
  const temp = branchOrgList[idx - 1];
  branchOrgList[idx - 1] = branchOrgList[idx];
  branchOrgList[idx] = temp;
  syncOrgDataToServer();
  renderBranchManageList();
  renderBranchCards();
}

function moveBranchDown(idx) {
  if (idx >= branchOrgList.length - 1) return;
  const temp = branchOrgList[idx + 1];
  branchOrgList[idx + 1] = branchOrgList[idx];
  branchOrgList[idx] = temp;
  syncOrgDataToServer();
  renderBranchManageList();
  renderBranchCards();
}

function editBranchOrg(idx) {
  const branch = branchOrgList[idx];
  if (!branch) return;
  currentEditingBranchId = branch.id;
  
  document.getElementById('branch-list-name').value = branch.name || '';
  let lName = '';
  let lPhone = '';
  if (branch.leader) {
    const match = branch.leader.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      lName = match[1].trim();
      lPhone = match[2].trim();
    } else {
      lName = branch.leader.trim();
    }
  }
  document.getElementById('branch-list-leader-name').value = lName;
  document.getElementById('branch-list-leader-phone').value = lPhone;
  
  const container = document.getElementById('dynamic-delegates-container');
  if (container) {
    container.innerHTML = '';
    const cleanBName = (branch.name || '').replace(/^[0-9.\s]+/, '').replace(/^🏛️\s*/, '').replace(/지회.*/, '').trim();
    // 1) 지회 소속 감사/이사 등 (지회장 제외)
    const linkedBoard = (Array.isArray(boardList) ? boardList : []).filter(b => 
      !b.isBranchLeader && (
        (b.branchId && String(b.branchId) === String(branch.id)) ||
        (b.branchName && (b.branchName.includes(cleanBName) || cleanBName.includes(b.branchName.replace(/지회.*/, '')))) ||
        (b.role && cleanBName && b.role.includes(cleanBName))
      )
    ).map(b => ({ name: b.name, phone: b.phone, role: b.tag || '감사' }));

    // 2) 지회 소속 대의원
    const linkedDels = (Array.isArray(delegateList) ? delegateList : []).filter(d => 
      (d.branchId && String(d.branchId) === String(branch.id)) ||
      (d.branchName && (d.branchName.includes(cleanBName) || cleanBName.includes(d.branchName.replace(/지회.*/, ''))))
    ).map(d => ({ name: d.name, phone: d.phone, role: '대의원' }));

    const allMembers = [...linkedBoard, ...linkedDels];
    const delsToShow = allMembers.length > 0
      ? allMembers
      : (branch.delegates && branch.delegates.length > 0 ? branch.delegates : []);
    if (delsToShow.length > 0) {
      delsToShow.forEach(d => {
        addDelegateRow(d.name, d.phone, d.role || (d.name && d.name.includes('감사') ? '감사' : (d.name && d.name.includes('이사') ? '이사' : '대의원')));
      });
    } else {
      addDelegateRow('', '', '대의원');
    }
  }
  
  document.getElementById('branch-list-region').value = branch.region || '';
  document.getElementById('branch-list-office').value = branch.office || '';

  const isBoardCheckbox = document.getElementById('branch-is-board-member');
  const boardRoleSelect = document.getElementById('branch-board-role');
  const boardRoleContainer = document.getElementById('branch-board-role-container');
  if (isBoardCheckbox) {
    const isConcurrent = !!(branch.isBoardMember || (Array.isArray(boardList) && boardList.some(b => (b.branchId && String(b.branchId) === String(branch.id)) || (lName && b.name === lName && b.isBranchLeader))));
    isBoardCheckbox.checked = isConcurrent;
    if (boardRoleContainer) boardRoleContainer.style.display = isConcurrent ? 'block' : 'none';
    if (boardRoleSelect) {
      const existingBoard = (Array.isArray(boardList) ? boardList : []).find(b => (b.branchId && String(b.branchId) === String(branch.id)) || (lName && b.name === lName));
      boardRoleSelect.value = branch.boardRole || (existingBoard ? existingBoard.tag : '이사');
    }
  }
  
  toggleNewBranchForm(true);
}

function deleteBranchItem(idx) {
  if (confirm("정말 이 지회를 삭제하시겠습니까?")) {
    branchOrgList.splice(idx, 1);
    syncOrgDataToServer();
    renderBranchManageList();
    renderBranchCards();
  }
}

function handleAddBranchSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('branch-list-name').value.trim();
  const leaderName = document.getElementById('branch-list-leader-name').value.trim();
  const leaderPhone = document.getElementById('branch-list-leader-phone').value.trim();
  const leader = leaderName ? `${leaderName} (${leaderPhone})` : '';
  const region = document.getElementById('branch-list-region').value.trim();
  const office = document.getElementById('branch-list-office').value.trim();

  let delegates = [];
  const delegateRows = document.querySelectorAll('.delegate-row');
  delegateRows.forEach(row => {
    const dRole = (row.querySelector('.del-role') ? row.querySelector('.del-role').value : '대의원') || '대의원';
    const dName = row.querySelector('.del-name').value.trim();
    const dPhone = row.querySelector('.del-phone').value.trim();
    if (dName || dPhone) {
      const cleanName = dName.replace(/(대의원|감사|이사|부회장)/g, '').trim();
      delegates.push({ name: `${cleanName} ${dRole}`, phone: dPhone || '', role: dRole, cleanName: cleanName });
    }
  });

  const formattedName = name.startsWith('🏛️') ? name : `🏛️ ${name}`;
  const isBoardMember = document.getElementById('branch-is-board-member') ? document.getElementById('branch-is-board-member').checked : false;
  const boardRole = document.getElementById('branch-board-role') ? document.getElementById('branch-board-role').value : '이사';
  const cleanBranchName = name.replace(/^(\d+\.\s*|🏛️\s*)/, '').trim();
  const targetBranchId = currentEditingBranchId || Date.now();

  // 지회장 이사회 겸임 동기화
  if (isBoardMember && leaderName) {
    const existingIdx = boardList.findIndex(b => 
      (b.branchId && String(b.branchId) === String(targetBranchId)) || 
      b.name === leaderName
    );

    let roleText = `중앙연합회 ${boardRole} (${cleanBranchName} 지회장)`;
    let tagText = boardRole;
    if (boardRole === '회장' || boardRole === '중앙회 연합회장') {
      tagText = '회장';
      roleText = `중앙회 연합회장 (${cleanBranchName} 지회장)`;
    } else if (boardRole === '수석부회장') {
      tagText = '수석부회장';
      roleText = `중앙연합회 수석부회장 (${cleanBranchName} 지회장)`;
    } else if (boardRole === '사무총장') {
      tagText = '사무총장';
      roleText = `사무국 총괄 국장 (${cleanBranchName} 지회장)`;
    }

    const prevImage = (existingIdx !== -1 && boardList[existingIdx].image) 
      ? boardList[existingIdx].image 
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

    const boardOfficerObj = {
      name: leaderName,
      role: roleText,
      tag: tagText,
      tagClass: 'tag-director',
      image: prevImage,
      phone: leaderPhone || (existingIdx !== -1 ? boardList[existingIdx].phone : '010-0000-0000'),
      region: region || cleanBranchName,
      branchId: targetBranchId,
      branchName: cleanBranchName,
      isBranchLeader: true
    };

    if (existingIdx !== -1) {
      boardList[existingIdx] = { ...boardList[existingIdx], ...boardOfficerObj };
    } else {
      boardList.push(boardOfficerObj);
    }

    // 중복 등록 방지 (동일인 중복 제거)
    boardList = boardList.filter((b, bIdx) => {
      if (b.name === leaderName) {
        return bIdx === (existingIdx !== -1 ? existingIdx : boardList.length - 1);
      }
      return true;
    });
  } else {
    // 겸임 해제 시 기존 중앙회 핵심 임원이면 지회장 표기만 제거, 지회장 전용 등록자면 목록에서 제거
    boardList.forEach(b => {
      if (String(b.branchId) === String(targetBranchId)) {
        b.isBranchLeader = false;
        b.branchId = null;
        b.branchName = '';
        if (b.role && b.role.includes('지회장')) {
          b.role = b.role.replace(/\s*\([^)]*지회장\)/, '').trim();
        }
      }
    });
    boardList = boardList.filter(b => !(String(b.branchId) === String(targetBranchId) && b.isBranchLeader));
  }

  if (currentEditingBranchId) {
    const idx = branchOrgList.findIndex(b => b.id === currentEditingBranchId);
    if (idx !== -1) {
      branchOrgList[idx] = {
        ...branchOrgList[idx],
        name: formattedName,
        leader, delegates, region, office,
        isBoardMember, boardRole
      };
    }
    currentEditingBranchId = null;
  } else {
    const newBranch = {
      id: targetBranchId,
      name: formattedName,
      leader, delegates, region, office,
      isBoardMember, boardRole
    };
    branchOrgList.push(newBranch);
  }

  // 👥 지회 소속 임원(감사/이사/부회장) 및 대의원 명부와 양방향 자동 일체화 동기화
  delegates.forEach(d => {
    const rawDName = d.cleanName || d.name.replace(/(대의원|감사|이사|부회장)/g, '').trim();
    if (!rawDName) return;

    if (d.role === '감사' || d.role === '이사' || d.role === '부회장') {
      // 1) 이사회 임원(boardList)으로 등록/업데이트
      const existingB = boardList.find(b => 
        (b.branchId && String(b.branchId) === String(targetBranchId) && b.name === rawDName) ||
        (b.name === rawDName && (b.phone === d.phone || b.tag === d.role))
      );
      const officerData = {
        name: rawDName,
        phone: d.phone,
        role: `중앙연합회 ${d.role} (${cleanBranchName})`,
        tag: d.role,
        tagClass: 'tag-director',
        branchId: targetBranchId,
        branchName: cleanBranchName,
        region: region || cleanBranchName,
        isBranchLeader: false,
        image: (existingB && existingB.image) ? existingB.image : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      };
      if (existingB) {
        Object.assign(existingB, officerData);
      } else {
        boardList.push(officerData);
      }
      // 대의원 명부에 혹시 기존 대의원으로 등록되어 있었다면 제거 (감사/이사로 승격/등록됨)
      delegateList = delegateList.filter(del => !(del.name === rawDName && String(del.branchId) === String(targetBranchId)));
    } else {
      // 2) 대의원(delegateList)으로 등록/업데이트
      const existingD = delegateList.find(item => 
        (item.branchId && String(item.branchId) === String(targetBranchId) && item.name === rawDName) ||
        (item.name === rawDName && item.phone === d.phone)
      );
      const delegateData = {
        name: rawDName,
        phone: d.phone,
        branchId: targetBranchId,
        branchName: cleanBranchName,
        region: region || cleanBranchName,
        role: `${cleanBranchName} 소속 대의원`,
        tag: `${cleanBranchName} 대의원`,
        tagClass: 'tag-delegate',
        image: (existingD && existingD.image) ? existingD.image : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      };
      if (existingD) {
        Object.assign(existingD, delegateData);
      } else {
        delegateList.push(delegateData);
      }
      // 이사회 명부에서 혹시 일반 대의원으로 전환된 것이면 제거 (지회장 제외)
      boardList = boardList.filter(b => !(b.name === rawDName && String(b.branchId) === String(targetBranchId) && !b.isBranchLeader));
    }
  });

  syncOrgDataToServer();
  renderBranchManageList();
  renderBranchCards();
  filterDirectory(currentDirectoryType || 'board');
  
  const form = document.getElementById('add-branch-form');
  if (form) form.reset();
  alert(`[반영 완료]\n'${name}' 지회 조직이 반영되었습니다.`);
}

function deleteBranchOrg(id) {
  if (confirm("정말 이 지회 조직을 통폐합 및 삭제하시겠습니까?")) {
    branchOrgList = branchOrgList.filter(b => b.id !== id);
    syncOrgDataToServer();
    renderBranchManageList();
    renderBranchCards();
    alert("지회 조직이 통폐합 삭제되었습니다.");
  }
}

// Dynamic Accounting Item Row Builders [+]
function formatInputWithComma(e) {
  let val = e.target.value.replace(/[^0-9-]/g, '');
  if (val === '-' || val === '') {
    e.target.value = val;
    return;
  }
  let isNegative = false;
  if (val.startsWith('-')) {
    isNegative = true;
    val = val.substring(1);
  }
  let numStr = Number(val).toLocaleString();
  if (isNegative) numStr = '-' + numStr;
  e.target.value = numStr;
}

function addIncomeRow(nameVal = '', amountVal = '') {
  const container = document.getElementById('income-rows-container');
  if (!container) return;
  const rowId = 'inc-row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
  const div = document.createElement('div');
  div.id = rowId;
  div.style.cssText = 'display: flex; gap: 8px; margin-bottom: 6px; align-items: center;';
  
  let formattedAmount = amountVal;
  if (formattedAmount) {
    let num = String(formattedAmount).replace(/[^0-9-]/g, '');
    if (num && !isNaN(Number(num))) {
      formattedAmount = Number(num).toLocaleString();
    }
  }
  
  div.innerHTML = `
    <input type="text" class="inc-name-input" placeholder="수입 내역" value="${nameVal}" style="flex: 1.2; padding: 8px; border: 1px solid #A7F3D0; border-radius: 6px; font-size: 0.85rem;">
    <input type="text" class="inc-amount-input" placeholder="금액 (원 단위)" value="${formattedAmount}" oninput="formatInputWithComma(event)" style="flex: 1; padding: 8px; border: 1px solid #A7F3D0; border-radius: 6px; font-size: 0.85rem;">
    <button type="button" onclick="document.getElementById('${rowId}').remove()" style="background: #FCA5A5; color: #7F1D1D; border: none; padding: 8px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;"><i class="fa-solid fa-trash-can"></i></button>
  `;
  container.appendChild(div);
}

function addExpenseRow(nameVal = '', amountVal = '') {
  const container = document.getElementById('expense-rows-container');
  if (!container) return;
  const rowId = 'exp-row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
  const div = document.createElement('div');
  div.id = rowId;
  div.style.cssText = 'display: flex; gap: 8px; margin-bottom: 6px; align-items: center;';
  
  let formattedAmount = amountVal;
  if (formattedAmount) {
    let num = String(formattedAmount).replace(/[^0-9-]/g, '');
    if (num && !isNaN(Number(num))) {
      formattedAmount = Number(num).toLocaleString();
    }
  }

  div.innerHTML = `
    <input type="text" class="exp-name-input" placeholder="지출 내역" value="${nameVal}" style="flex: 1.2; padding: 8px; border: 1px solid #FECACA; border-radius: 6px; font-size: 0.85rem;">
    <input type="text" class="exp-amount-input" placeholder="금액 (원 단위)" value="${formattedAmount}" oninput="formatInputWithComma(event)" style="flex: 1; padding: 8px; border: 1px solid #FECACA; border-radius: 6px; font-size: 0.85rem;">
    <button type="button" onclick="document.getElementById('${rowId}').remove()" style="background: #FCA5A5; color: #7F1D1D; border: none; padding: 8px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;"><i class="fa-solid fa-trash-can"></i></button>
  `;
  container.appendChild(div);
}

function showModalClean(modalId) {
  const openModals = document.querySelectorAll('.modal');
  openModals.forEach(m => {
    if (m.id !== modalId) {
      m.classList.remove('active');
      m.style.display = 'none';
    }
  });

  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('active');
  modal.scrollTop = 0;
  const content = modal.querySelector('.modal-content');
  if (content) content.scrollTop = 0;
}

function hideModalClean(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  modal.style.display = 'none';
}

let welcomeNotice = {
  title: '2026년도 상반기 정기 총회 및 내수면 어가 법정 결산 공시',
  date: '2026.06.25',
  content: '전국 16개 시·도 지회 회원 어업인 여러분 안녕하십니까.\n사단법인 연합회의 2026년도 상반기 주요 어가 현장 지도 활동 보고 및 수입·지출 법정 결산 장부가 공시되었습니다.'
};

function renderWelcomeNotice() {
  const container = document.getElementById('welcome-notice-body');
  if (!container) return;
  const formattedContent = (welcomeNotice.content || '').replace(/\n/g, '<br>');
  container.innerHTML = `
    <div style="background: #F8FAFC; padding: 18px; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 16px;">
      <span style="background: #EF4444; color: #FFF; padding: 3px 8px; border-radius: 4px; font-size: 0.76rem; font-weight: 800;">NEW 공지</span>
      <h3 style="font-size: 1.12rem; color: #0A2540; margin: 8px 0 4px; font-weight: 900;">${welcomeNotice.title}</h3>
      <span style="font-size: 0.8rem; color: #64748B;"><i class="fa-regular fa-calendar-check"></i> 공시일: ${welcomeNotice.date}</span>
      <p style="margin-top: 10px; color: #334155; font-size: 0.9rem; line-height: 1.65;">
        ${formattedContent}
      </p>
    </div>
  `;

  const listItem = document.getElementById('main-new-notice-item');
  if (listItem && welcomeNotice && welcomeNotice.title) {
    const escapedTitle = (welcomeNotice.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const escapedDate = (welcomeNotice.date || '').replace(/'/g, "\\'");
    const escapedContent = (welcomeNotice.content || '').replace(/\n/g, '<br>').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    listItem.setAttribute('onclick', `openNoticeModal('${escapedTitle}', '${escapedDate}', '${escapedContent}')`);
    listItem.innerHTML = `
      <span class="notice-tag tag-new">NEW</span>
      <div class="notice-info-wrap">
        <span class="notice-title-text">${welcomeNotice.title}</span>
        <span class="notice-date-text"><i class="fa-regular fa-calendar"></i> ${welcomeNotice.date} (최신 공지)</span>
      </div>
      <span class="notice-arrow">&rarr;</span>
    `;
  }
}

function openNoticeEditModal() {
  const user = getCurrentUser();
  if (!user || (user.role !== 'master' && user.role !== 'branch')) {
    if (confirm('🔒 공지사항 작성 및 수정은 마스터(관리자) 전용 기능입니다.\n로그인을 진행하시겠습니까?')) {
      closeWelcomeNotice();
      showModalClean('login-modal');
    }
    return;
  }
  document.getElementById('edit-notice-title').value = welcomeNotice.title || '';
  document.getElementById('edit-notice-date').value = welcomeNotice.date || '';
  document.getElementById('edit-notice-content').value = welcomeNotice.content || '';
  showModalClean('notice-edit-modal');
}

function closeNoticeEditModal() {
  hideModalClean('notice-edit-modal');
}

async function saveNoticeData() {
  const title = document.getElementById('edit-notice-title').value.trim();
  const date = document.getElementById('edit-notice-date').value.trim();
  const content = document.getElementById('edit-notice-content').value.trim();

  if (!title || !content) {
    alert('공지사항 제목과 내용을 입력해 주세요.');
    return;
  }

  welcomeNotice = { title, date: date || new Date().toISOString().slice(0, 10).replace(/-/g, '.'), content };
  // renderWelcomeNotice();
  localStorage.setItem('kifa_welcome_notice', JSON.stringify(welcomeNotice));

  try {
    await fetch('/api/save-org-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ welcomeNotice })
    });
  } catch (err) {
    console.log('Error saving notice to server:', err);
  }

  closeNoticeEditModal();
  alert('📢 최신 공지사항이 성공적으로 저장 및 즉시 반영되었습니다!');
}
window.openNoticeEditModal = openNoticeEditModal;
window.closeNoticeEditModal = closeNoticeEditModal;
window.saveNoticeData = saveNoticeData;

function checkAutoWelcomeNotice() {
    renderPastNotices();

    if (!pastNotices || pastNotices.length === 0) return;

    const sortedNotices = [...pastNotices].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    let popupNotices = [];
    popupNotices.push(sortedNotices[0]); // 가장 최신 공지
    sortedNotices.forEach(n => {
        if (n.isPopup && n.id !== sortedNotices[0].id) {
            popupNotices.push(n);
        }
    });

    const today = new Date().toISOString().slice(0, 10);
    
    document.querySelectorAll('.dynamic-welcome-modal').forEach(el => el.remove());

    let displayIndex = 0;

    popupNotices.forEach((notice) => {
        const hideKey = 'kifa_hide_notice_' + notice.id;
        const hideDate = localStorage.getItem(hideKey);
        
        if (hideDate === today) return;

        const formattedContent = (notice.content || '').replace(/\n/g, '<br>');
        const isNew = (notice.id === sortedNotices[0].id);
        const tagText = isNew ? 'NEW 최신공지' : '📌 중요공지';
        const tagColor = isNew ? '#EF4444' : '#F59E0B';

        const topPos = 40 + (displayIndex * 5); // 퍼센트
        const leftPos = 50 + (displayIndex * 5); // 퍼센트
        const modalId = 'dynamic-modal-' + notice.id;
        
        const modalHtml = '<div class="dynamic-welcome-modal" id="' + modalId + '" style="position: fixed; top: ' + topPos + '%; left: ' + leftPos + '%; transform: translate(-50%, -50%); z-index: ' + (1000 + displayIndex) + '; width: 90%; max-width: 500px; display: none;">' +
            '<div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); padding: 25px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.4);">' +
              '<div style="text-align: center; margin-bottom: 16px;">' +
                '<span style="background: #0284C7; color: #FFF; padding: 4px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 800;">' +
                  '<i class="fa-solid fa-bullhorn"></i> 사단법인 연합회 공지사항' +
                '</span>' +
              '</div>' +
              '<div style="background: #F8FAFC; padding: 18px; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 16px;">' +
                '<span style="background: ' + tagColor + '; color: #FFF; padding: 3px 8px; border-radius: 4px; font-size: 0.76rem; font-weight: 800;">' + tagText + '</span>' +
                '<h3 style="font-size: 1.12rem; color: #0A2540; margin: 8px 0 4px; font-weight: 900;">' + notice.title + '</h3>' +
                '<span style="font-size: 0.8rem; color: #64748B;"><i class="fa-regular fa-calendar-check"></i> 날짜: ' + notice.date + '</span>' +
                '<p style="margin-top: 10px; color: #334155; font-size: 0.9rem; line-height: 1.65;">' + formattedContent + '</p>' +
              '</div>' +
              '<div style="display: flex; justify-content: space-between; align-items: center; background: #F1F5F9; padding: 10px 14px; border-radius: 10px; font-size: 0.84rem; color: #64748B;">' +
                '<label style="cursor: pointer; display: flex; align-items: center; gap: 6px;">' +
                  '<input type="checkbox" onchange="toggleHideNotice(' + notice.id + ', event)"> 오늘 하루 이 창 안 보기' +
                '</label>' +
                '<button onclick="closeDynamicModal(\'' + modalId + '\')" style="background: #0A2540; color: #FFF; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 700; cursor: pointer;">닫기</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById(modalId).style.display = 'block';
        displayIndex++;
    });
}

function toggleHideNotice(id, e) {
    const today = new Date().toISOString().slice(0, 10);
    const key = 'kifa_hide_notice_' + id;
    if (e.target.checked) {
      localStorage.setItem(key, today);
    } else {
      localStorage.removeItem(key);
    }
}

function closeDynamicModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.remove();
}
function togglePastNoticesList() {
  const archive = document.getElementById('past-notices-archive');
  const chevron = document.getElementById('past-notice-chevron');
  if (!archive) return;

  if (archive.style.display === 'none' || archive.style.display === '') {
    archive.style.display = 'block';
    if (chevron) chevron.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
  } else {
    archive.style.display = 'none';
    if (chevron) chevron.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
  }
}

function selectLedgerYear(year) {
  currentLedgerYear = year;
  renderAccountingList();
}

function parseMoneyAmount(val) {
  if (!val || val === '-') return 0;
  const str = String(val).replace(/,/g, '');
  if (str.includes('억')) {
    const parts = str.split('억');
    const uk = parseFloat(parts[0]) || 0;
    const man = parseFloat(parts[1]) || 0;
    return uk * 100000000 + man * 10000;
  }
  if (str.includes('만')) {
    const man = parseFloat(str.replace(/만/g, '').replace(/원/g, '')) || 0;
    return man * 10000;
  }
  return parseFloat(str) || 0;
}

function formatMoneyDisplay(num) {
  if (!num || num === 0 || num === '0') return '0원';
  let val = String(num).replace(/[^0-9-]/g, '');
  if(!val) return '0원';
  return Number(val).toLocaleString() + '원';
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[1]}-${parts[2]}`;
  }
  return dateStr;
}

function renderAccountingList() {
  const container = document.getElementById('disclosure-list-wrap');
  if (!container) return;

  const user = getCurrentUser();

  const yearItems = accountingItems.filter(item => item.date && item.date.startsWith(currentLedgerYear));
  
  // Calculate cumulative balances chronologically first
  yearItems.sort((a, b) => a.date.localeCompare(b.date));
  let runningBalance = 0;
  yearItems.forEach(item => {
    let itemIncomeSum = 0;
    let itemExpenseSum = 0;
    if (item.accountingBreakdown && item.accountingBreakdown.length > 0) {
      item.accountingBreakdown.forEach(r => {
        const amt = parseMoneyAmount(r.amount);
        if (r.type === '수입') itemIncomeSum += amt;
        else itemExpenseSum += amt;
      });
    } else {
      itemIncomeSum = parseMoneyAmount(item.income);
      itemExpenseSum = parseMoneyAmount(item.expense);
    }
    runningBalance += (itemIncomeSum - itemExpenseSum);
    item.computedBalance = runningBalance;
  });

  // Now sort for display (newest first)
  yearItems.sort((a, b) => b.date.localeCompare(a.date));

  let totalIncomeNum = 0;
  let totalExpenseNum = 0;

  yearItems.forEach(item => {
    if (item.accountingBreakdown && item.accountingBreakdown.length > 0) {
      item.accountingBreakdown.forEach(r => {
        const amt = parseMoneyAmount(r.amount);
        if (r.type === '수입') totalIncomeNum += amt;
        else totalExpenseNum += amt;
      });
    } else {
      totalIncomeNum += parseMoneyAmount(item.income);
      totalExpenseNum += parseMoneyAmount(item.expense);
    }
  });

  const netBalanceNum = totalIncomeNum - totalExpenseNum;
  const years = ['2026', '2025', '2024'];

  const tabsHtml = years.map(y => `
    <button class="year-tab-btn ${y === currentLedgerYear ? 'active' : ''}" onclick="selectLedgerYear('${y}')">${y}년도</button>
  `).join('');

  if (!user) {
    container.innerHTML = `
      <div class="ledger-header-combined-row">
        <div class="year-tab-group">${tabsHtml}</div>
      </div>

      <div style="background: linear-gradient(135deg, #0A2540 0%, #0F3860 100%); color: #FFF; padding: 32px 24px; border-radius: 14px; text-align: center; margin-top: 14px; box-shadow: 0 10px 25px rgba(10,37,64,0.15);">
        <div style="font-size: 2.2rem; color: #FCD34D; margin-bottom: 10px;"><i class="fa-solid fa-lock"></i></div>
        <h3 style="font-size: 1.25rem; font-weight: 900; margin-bottom: 8px; color: #FFF;">🔒 사단법인 법정 세부 회계 결산 장부 보호 안내</h3>
        <p style="font-size: 0.88rem; color: #CBD5E1; line-height: 1.6; max-width: 540px; margin: 0 auto 20px;">
          일반 방문객(게스트)은 연합회 주요 활동 현황을 자유롭게 조회가 가능합니다.<br>
          <strong>법정 세부 수입·지출 결산 내역서 및 장부</strong>는 로그인한 연합회 회원 및 마스터 관리자에게 공개됩니다.
        </p>
        <button class="btn btn-primary" onclick="openLoginModal('🔒 <strong>[회원/마스터 전용 공시]</strong> 세부 회계 결산 장부 열람을 위해 로그인해 주세요.')" style="padding: 12px 24px; font-size: 0.92rem; font-weight: 800; background: #0284C7; border: none; margin: 0 auto; display: inline-flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-key" style="color: #FCD34D;"></i> 회원/마스터 로그인하고 세부 장부 확인하기
        </button>
      </div>
    `;
    return;
  }

  let tableRowsHtml = '';
  if (yearItems.length === 0) {
    tableRowsHtml = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 30px; color: #94A3B8;">${currentLedgerYear}년도에 등록된 연합회 회계 집행 내역이 없습니다.</td>
      </tr>
    `;
  } else {
    tableRowsHtml = yearItems.map(item => {
      let itemIncomeSum = 0;
      let itemExpenseSum = 0;

      if (item.accountingBreakdown && item.accountingBreakdown.length > 0) {
        item.accountingBreakdown.forEach(r => {
          const amt = parseMoneyAmount(r.amount);
          if (r.type === '수입') itemIncomeSum += amt;
          else itemExpenseSum += amt;
        });
      } else {
        itemIncomeSum = parseMoneyAmount(item.income);
        itemExpenseSum = parseMoneyAmount(item.expense);
      }

      const itemNetBal = typeof item.computedBalance !== 'undefined' ? item.computedBalance : (typeof item.cumulativeBalance !== 'undefined' ? item.cumulativeBalance : (itemIncomeSum - itemExpenseSum));
      const incDisplay = itemIncomeSum > 0 ? `+${formatMoneyDisplay(itemIncomeSum)}` : (item.income && item.income !== '-' ? item.income : '0원');
      const expDisplay = itemExpenseSum > 0 ? `-${formatMoneyDisplay(itemExpenseSum)}` : (item.expense && item.expense !== '-' ? item.expense : '0원');
      const balDisplay = formatMoneyDisplay(itemNetBal);

      const cleanTitle = item.title;
      const shortDate = formatShortDate(item.date);

      return `
        <tr onclick="openGalleryDetailModal(${item.id})" style="cursor: pointer; transition: background 0.2s;" title="클릭하시면 '${cleanTitle}' 세부 활동 내역 보고서가 엽니다.">
          <td style="text-align: center; font-weight: 800; color: #0284C7; font-size: 0.84rem; padding: 10px 2px; white-space: nowrap;">${shortDate}</td>
          <td style="padding: 10px 4px;">
            <strong style="color: #0A2540; font-size: 0.88rem; font-weight: 800; line-height: 1.35; display: block; word-break: keep-all;">${cleanTitle}</strong>
          </td>
          <td style="text-align: right; vertical-align: middle; padding: 6px 4px; white-space: nowrap;">
            <div style="color: #059669; font-weight: 800; font-size: 0.78rem; line-height: 1.25; white-space: nowrap;">수입: ${incDisplay}</div>
            <div style="color: #DC2626; font-weight: 800; font-size: 0.78rem; line-height: 1.25; margin-top: 1px; white-space: nowrap;">지출: ${expDisplay}</div>
            <div style="color: #0284C7; font-weight: 900; font-size: 0.78rem; line-height: 1.25; margin-top: 1px; background: #F0F9FF; padding: 1px 4px; border-radius: 4px; display: inline-block; white-space: nowrap;">잔액: ${balDisplay}</div>
          </td>
        </tr>
      `;
    }).join('');
  }

  container.innerHTML = `
    <div class="ledger-header-combined-row">
      <div class="year-tab-group">
        ${tabsHtml}
      </div>

      <div class="summary-inline-3capsules">
        <div class="capsule cap-inc">
          <span class="cap-label">총수입</span>
          <strong class="cap-val">${formatMoneyDisplay(totalIncomeNum)}</strong>
        </div>
        <div class="capsule cap-exp">
          <span class="cap-label">총지출</span>
          <strong class="cap-val">${formatMoneyDisplay(totalExpenseNum)}</strong>
        </div>
        <div class="capsule cap-bal">
          <span class="cap-label">당기잔액</span>
          <strong class="cap-val">${formatMoneyDisplay(netBalanceNum)}</strong>
        </div>
      </div>
    </div>

    <div class="ledger-table-wrap">
      <table class="ledger-table">
        <thead>
          <tr>
            <th style="width: 15%; text-align: center;">일자</th>
            <th style="width: 48%; text-align: left;">사업명</th>
            <th style="width: 37%; text-align: right;">수입/지출/잔액</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

function getOfficerRankPriority(item) {
  const tagStr = ((item.tag || '') + ' ' + (item.role || '')).toLowerCase();
  if (tagStr.includes('회장 (대표이사)') || tagStr.includes('연합회장') || (tagStr.includes('회장') && !tagStr.includes('지회장') && !tagStr.includes('부회장'))) return 1;
  if (tagStr.includes('수석부회장')) return 2;
  if (tagStr.includes('부회장')) return 3;
  if (tagStr.includes('감사')) return 4;
  if (tagStr.includes('이사')) return 5;
  if (tagStr.includes('지회장')) return 6;
  if (tagStr.includes('대의원')) return 7;
  return 8;
}

let presidentGreeting = {
  name: '이재완',
  badge: '연합회장',
  subtitle: '"전국 내수면 어로어업인 여러분의 든든한 동반자가 되겠습니다."',
  phone: '010-5468-3208',
  region: '충북 단양',
  photo: 'logo_clean.svg',
  message: '우리나라 내수면 어업은 강과 호수를 터전으로 국민들에게 건강한 수산먹거리를 제공해 온 소중한 민물 자원의 뿌리입니다. 전국내수면어로어업인연합회는 소통과 협력을 바탕으로 내수면 어업인의 경제적·사회적 지위 향상과 내수 경제 활성화에 최선을 다하겠습니다.\n\n어가의 현장 애로사항 청취, 수생태계 보전, 그리고 투명한 행정 집행을 통해 전국 시·도 지회 회원이 한마음으로 번영할 수 있도록 앞장서겠습니다.'
};

function renderPresidentGreeting() {
  const imgEl = document.getElementById('pres-img');
  const badgeEl = document.getElementById('pres-badge');
  const nameEl = document.getElementById('pres-name');
  const phoneEl = document.getElementById('pres-phone');
  const regionEl = document.getElementById('pres-region');
  const subtitleEl = document.getElementById('pres-subtitle');
  const messageEl = document.getElementById('pres-message-p');
  const sigEl = document.getElementById('pres-sig');

  if (imgEl) {
    imgEl.src = presidentGreeting.photo || 'logo_clean.svg';
    imgEl.onerror = function() {
      this.onerror = null;
      this.src = 'logo_clean.svg';
    };
  }
  if (badgeEl) badgeEl.textContent = presidentGreeting.badge || '연합회장';
  if (nameEl) nameEl.innerHTML = presidentGreeting.name ? `${presidentGreeting.name} <span class="title-sub">회장 (대표이사)</span>` : '이재완 <span class="title-sub">회장 (대표이사)</span>';
  if (phoneEl) phoneEl.innerHTML = presidentGreeting.phone ? `<i class="fa-solid fa-phone"></i> ${presidentGreeting.phone}` : '<i class="fa-solid fa-phone"></i> 010-5468-3208';
  if (regionEl) regionEl.innerHTML = presidentGreeting.region ? `<i class="fa-solid fa-location-dot"></i> ${presidentGreeting.region}` : '<i class="fa-solid fa-location-dot"></i> 충북 단양';
  if (subtitleEl) subtitleEl.textContent = presidentGreeting.subtitle || '"전국 내수면 어로어업인 여러분의 든든한 동반자가 되겠습니다."';
  if (messageEl) {
    const rawMsg = presidentGreeting.message || '우리나라 내수면 어업은 강과 호수를 터전으로 국민들에게 건강한 수산먹거리를 제공해 온 소중한 민물 자원의 뿌리입니다. 전국내수면어로어업인연합회는 소통과 협력을 바탕으로 내수면 어업인의 경제적·사회적 지위 향상과 내수 경제 활성화에 최선을 다하겠습니다.\n\n어가의 현장 애로사항 청취, 수생태계 보전, 그리고 투명한 행정 집행을 통해 전국 시·도 지회 회원이 한마음으로 번영할 수 있도록 앞장서겠습니다.';
    messageEl.innerHTML = rawMsg.replace(/\n/g, '<br>');
  }
  if (sigEl) {
    const presName = presidentGreeting.name || '이재완';
    sigEl.innerHTML = `사단법인 전국내수면어로어업인연합회 회장 <strong>${presName}</strong> 올림`;
  }
}

let uploadedPresImageBase64 = null;

async function handlePresImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const resized = await resizeImage(file, 400, 400); // 400x400 is plenty for profile photo
  uploadedPresImageBase64 = resized;
  document.getElementById('edit-pres-photo').value = '파일이 선택/압축되었습니다 (' + file.name + ')';
}

function openPresidentEditModal() {
  const user = getCurrentUser();
  if (!user || (user.role !== 'master' && user.role !== 'branch')) {
    if (confirm('🔒 회장 인사말 및 대표이사 정보 수정은 마스터/관리자 전용 기능입니다.\n로그인을 진행하시겠습니까?')) {
      showModalClean('login-modal');
    }
    return;
  }

  let modal = document.getElementById('president-greeting-edit-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'president-greeting-edit-modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; padding: 24px;">
        <button class="modal-close" onclick="closePresidentEditModal()">&times;</button>
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 1.35rem; color: #0A2540; font-weight: 900;"><i class="fa-solid fa-user-tie" style="color: #0284C7;"></i> 연합회장 인사말 및 프로필 설정</h2>
          <p style="font-size: 0.88rem; color: #64748B; margin-top: 6px;">홈페이지 중앙에 노출되는 회장님의 프로필과 인사말을 변경합니다.</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px;">회장 성함 *</label>
              <input type="text" id="edit-pres-name" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
            </div>
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px;">직책 (뱃지)</label>
              <input type="text" id="edit-pres-badge" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px;">전화번호</label>
              <input type="text" id="edit-pres-phone" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
            </div>
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px;">지역/소속</label>
              <input type="text" id="edit-pres-region" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
            </div>
          </div>
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px;">프로필 사진 파일 선택 (또는 이미지 주소)</label>
            <input type="file" id="edit-pres-photo-upload" accept="image/*" onchange="handlePresImageUpload(event)" style="margin-bottom: 6px; font-size: 0.85rem; width: 100%;">
            <input type="text" id="edit-pres-photo" placeholder="또는 이미지 주소 URL 직접 입력" style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
          </div>
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px;">강조 문구 (서브타이틀)</label>
            <input type="text" id="edit-pres-subtitle" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px;">
          </div>
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px;">인사말 본문 *</label>
            <textarea id="edit-pres-message" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 8px; height: 120px; resize: vertical;"></textarea>
          </div>
        </div>
        <div style="margin-top: 24px; display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" onclick="closePresidentEditModal()" class="btn" style="background: #E2E8F0; color: #475569;">취소</button>
          <button type="button" onclick="savePresidentGreetingData()" class="btn btn-primary" style="background: #0284C7;"><i class="fa-solid fa-floppy-disk"></i> 저장하기</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  hideModalClean('master-dashboard-modal');
  document.getElementById('edit-pres-name').value = presidentGreeting.name || '';
  document.getElementById('edit-pres-badge').value = presidentGreeting.badge || '';
  document.getElementById('edit-pres-phone').value = presidentGreeting.phone || '';
  document.getElementById('edit-pres-region').value = presidentGreeting.region || '';
  document.getElementById('edit-pres-photo').value = presidentGreeting.photo || '';
  document.getElementById('edit-pres-subtitle').value = presidentGreeting.subtitle || '';
  document.getElementById('edit-pres-message').value = presidentGreeting.message || '';
  
  uploadedPresImageBase64 = null;
  if (document.getElementById('edit-pres-photo-upload')) {
    document.getElementById('edit-pres-photo-upload').value = '';
  }
  showModalClean('president-greeting-edit-modal');
}

function closePresidentEditModal() {
  hideModalClean('president-greeting-edit-modal');
}

async function savePresidentGreetingData() {
  const saveBtn = document.querySelector("#president-greeting-edit-modal button[onclick^='savePresidentGreetingData']");
  if (saveBtn) { saveBtn.innerText = "업로드 중..."; saveBtn.disabled = true; }
  const name = document.getElementById('edit-pres-name').value.trim();
  const badge = document.getElementById('edit-pres-badge').value.trim();
  const phone = document.getElementById('edit-pres-phone').value.trim();
  const region = document.getElementById('edit-pres-region').value.trim();
  let photo = document.getElementById('edit-pres-photo').value.trim();
    if (uploadedPresImageBase64) {
      photo = await uploadToSupabase(uploadedPresImageBase64, 'president');
      uploadedPresImageBase64 = null;
    }
  if (uploadedPresImageBase64) {
    photo = uploadedPresImageBase64;
  }
  const subtitle = document.getElementById('edit-pres-subtitle').value.trim();
  const message = document.getElementById('edit-pres-message').value.trim();

  if (!name || !message) {
    alert('회장 성함과 인사말 본문을 입력해 주세요.');
    return;
  }

  presidentGreeting = { name, badge, phone, region, photo: photo || '', subtitle, message };
  renderPresidentGreeting();
  localStorage.setItem('kifa_president_greeting', JSON.stringify(presidentGreeting));

  let presIdx = boardList.findIndex(i => (i.tag || '').includes('회장') || (i.role || '').includes('회장'));
  const presOfficerObj = {
    name: name,
    role: `사단법인 중앙연합회 회장 (${badge || '대표이사'})`,
    tag: '회장 (대표이사)',
    tagClass: 'tag-president',
    image: photo || 'logo_clean.svg',
    phone: phone || '010-1234-5678',
    region: region || '중앙 사무국 (서울)'
  };

  if (presIdx !== -1) {
    boardList[presIdx] = presOfficerObj;
  } else {
    boardList.unshift(presOfficerObj);
  }

  try {
    await fetch('/api/save-org-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presidentGreeting, boardList, branches: branchOrgList, committees: committeesList })
    });
  } catch (err) {
    console.log('Error saving president greeting:', err);
  }

  filterDirectory('board');
  closePresidentEditModal();
  alert('👑 회장 인사말 및 대표이사 정보가 성공적으로 반영되었습니다!');
}

let boardList = [];

let delegateList = [];

async function syncOrgDataToServer() {
  localStorage.setItem('kifa_branch_org_list', JSON.stringify(branchOrgList));
  localStorage.setItem('kifa_committees_list', JSON.stringify(committeesList));
  localStorage.setItem('kifa_board_list', JSON.stringify(boardList));
  localStorage.setItem('kifa_delegate_list', JSON.stringify(delegateList));
  try {
    await fetch('/api/save-org-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branches: branchOrgList, committees: committeesList, boardList: boardList, delegateList: delegateList })
    });
  } catch (err) {
    console.log('Error syncing org data to server:', err);
  }
}

async function loadServerData() {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const db = await res.json();
      galleryItems = db.gallery || [];
      accountingItems = db.accounting || [];
      usersList = db.users || [];
      pendingUsersList = db.pendingUsers || [];
      if (db.branches && db.branches.length > 0) branchOrgList = db.branches;
      if (db.committees && db.committees.length > 0) committeesList = db.committees;
      if (db.boardList && db.boardList.length > 0) boardList = db.boardList;
      if (db.delegateList && db.delegateList.length > 0) delegateList = db.delegateList;
      if (db.welcomeNotice && db.welcomeNotice.title) welcomeNotice = db.welcomeNotice;
      if (db.presidentGreeting && db.presidentGreeting.name) presidentGreeting = db.presidentGreeting;
        if (db.pastNotices) pastNotices = db.pastNotices;
        if (db.contactInfo) contactInfo = db.contactInfo;
        if (db.inquiries) inquiriesList = db.inquiries;

                // AUTO-SYNC ORG DATA (PRESIDENT, CONTACT, BOARD)
        try {
          const locPres = JSON.parse(localStorage.getItem('kifa_president_greeting'));
          const locBoard = JSON.parse(localStorage.getItem('kifa_board_list'));
          const locDelegate = JSON.parse(localStorage.getItem('kifa_delegate_list'));
          const locContact = JSON.parse(localStorage.getItem('kifa_contact_info'));
          
          let needsOrgSync = false;
          let syncPayload = {};
          
          // If local has data but server doesn't, or we want to force local data if server is missing it
          if (locPres && locPres.name && (!db.presidentGreeting || !db.presidentGreeting.name)) {
            syncPayload.presidentGreeting = locPres;
            presidentGreeting = locPres;
            needsOrgSync = true;
          }
          if (locBoard && locBoard.length > 0 && (!db.boardList || db.boardList.length === 0)) {
            syncPayload.boardList = locBoard;
            boardList = locBoard;
            needsOrgSync = true;
          }
          if (locDelegate && locDelegate.length > 0 && (!db.delegateList || db.delegateList.length === 0)) {
            syncPayload.delegateList = locDelegate;
            delegateList = locDelegate;
            needsOrgSync = true;
          }
          if (locContact && locContact.address && (!db.contactInfo || !db.contactInfo.address)) {
            syncPayload.contactInfo = locContact;
            contactInfo = locContact;
            needsOrgSync = true;
          }

          if (needsOrgSync) {
            fetch('/api/save-org-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(syncPayload)
            }).then(r => console.log('Recovered and synced org data to server')).catch(e => console.log(e));
          }
        } catch(e) { console.error(e); }

        // AUTO-SYNC LOCALSTORAGE ITEMS THAT FAILED TO SAVE
        try {
          const localGallery = JSON.parse(localStorage.getItem('kifa_gallery') || '[]');
          const localAccounting = JSON.parse(localStorage.getItem('kifa_accounting') || '[]');
          let needsSync = false;
          localGallery.forEach(lg => {
            if (!galleryItems.find(g => g.id === lg.id)) {
              galleryItems.push(lg);
              needsSync = true;
            }
          });
          localAccounting.forEach(la => {
            if (!accountingItems.find(a => a.id === la.id)) {
              accountingItems.push(la);
              needsSync = true;
            }
          });
          if (needsSync) {
            galleryItems.sort((a,b) => b.id - a.id);
            accountingItems.sort((a,b) => b.id - a.id);
            fetch('/api/sync-restore', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gallery: galleryItems, accounting: accountingItems })
            }).then(r=>console.log('Restored local data')).catch(e=>console.log(e));
          }
        } catch(e) { console.error(e); }

      updateHeaderUserStatus();
      renderGalleryGrid('all');
      renderAccountingList();
      // renderWelcomeNotice();
      renderPresidentGreeting();
      renderContactInfo();
      checkAutoWelcomeNotice();
      renderBranchCards();
      filterDirectory(currentDirectoryType || 'board');
      return;
    }
  } catch (err) {
    console.log('Server sync fallback to local storage:', err);
  }

  galleryItems = JSON.parse(localStorage.getItem('kifa_gallery')) || [];
  accountingItems = JSON.parse(localStorage.getItem('kifa_accounting')) || [];
  const localBranches = JSON.parse(localStorage.getItem('kifa_branch_org_list'));
  const localCommittees = JSON.parse(localStorage.getItem('kifa_committees_list'));
  const localBoard = JSON.parse(localStorage.getItem('kifa_board_list'));
  const localDelegate = JSON.parse(localStorage.getItem('kifa_delegate_list'));

  if (localBranches && localBranches.length > 0) branchOrgList = localBranches;
  if (localCommittees && localCommittees.length > 0) committeesList = localCommittees;
  if (localBoard && localBoard.length > 0) boardList = localBoard;
  if (localDelegate && localDelegate.length > 0) delegateList = localDelegate;

  updateHeaderUserStatus();
  renderGalleryGrid('all');
  renderAccountingList();
  renderPresidentGreeting();
  renderContactInfo();
  checkAutoWelcomeNotice();
  renderBranchCards();
  filterDirectory(currentDirectoryType || 'board');
}

function renderGalleryGrid(filterCategory = 'all', event = null) {
  if (event && event.target) {
    const tabs = document.querySelectorAll('.filter-tabs .tab-btn');
    tabs.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
  } else {
    const tabs = document.querySelectorAll('.filter-tabs .tab-btn');
    tabs.forEach(btn => {
      if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${filterCategory}'`)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = '';

  let filtered = galleryItems.filter(item => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'field') return item.category === 'field' || item.category === 'edu';
    return item.category === filterCategory;
  });
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94A3B8;">해당 카테고리에 등록된 활동이 없습니다. 상단의 [+ 🏛️ 시·도 지회 행사 등록] 버튼을 통해 지회 활동을 등록해 주세요.</div>`;
    return;
  }

  filtered.forEach((item) => {
    const isFieldOrEdu = item.category === 'field' || item.category === 'edu';
    const badgeClass = isFieldOrEdu ? 'badge-field' : (item.category === 'meeting' ? 'badge-meeting' : 'badge-branch');
    const badgeName = isFieldOrEdu ? '현장활동 및 교육' : (item.categoryName || (item.category === 'meeting' ? '총회/이사회' : '지부활동'));

    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.onclick = () => openGalleryDetailModal(item.id);
    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${item.image}" alt="${item.title}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80';">
        <span class="card-badge ${badgeClass}">${badgeName}</span>
      </div>
      <div class="card-body">
        <span class="card-date"><i class="fa-regular fa-calendar-days"></i> ${item.date}</span>
        <h4 class="card-title">${item.title}</h4>
        <p class="card-text">${item.summary || item.content.replace(/<[^>]*>?/gm, '').substring(0, 55)}...</p>
        <span style="font-size: 0.8rem; color: #0284C7; font-weight: 700; display: inline-block; margin-top: 10px;">활동 내역 보기 &rarr;</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

let currentDirectoryType = 'board';
let uploadedOfficerImageBase64 = null;

function filterDirectory(type = 'board') {
  currentDirectoryType = type;
  const grid = document.getElementById('directory-grid');
  const btnBoard = document.getElementById('btn-toggle-board');
  const btnDelegate = document.getElementById('btn-toggle-delegate');
  const user = getCurrentUser();

  if (!grid || !btnBoard || !btnDelegate) return;

  grid.innerHTML = '';

  const isBoard = (type === 'board');
  if (isBoard) {
    btnBoard.classList.add('active');
    btnDelegate.classList.remove('active');
  } else {
    btnDelegate.classList.add('active');
    btnBoard.classList.remove('active');
  }

  if (isBoard) {
    // boardList.sort((a, b) => getOfficerRankPriority(a) - getOfficerRankPriority(b));
  }
  const currentList = isBoard ? boardList : delegateList;

  if (!currentList || currentList.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 30px; color: #94A3B8;';
    emptyDiv.innerHTML = `등록된 ${isBoard ? '임원' : '대의원'} 명단이 없습니다.`;
    grid.appendChild(emptyDiv);
  } else {
    const listContainer = document.createElement('div');
    listContainer.style.cssText = 'grid-column: 1/-1; display: flex; flex-direction: column; gap: 8px; width: 100%;';

    listContainer.innerHTML = currentList.map((item, idx) => {
      const tagClass = item.tagClass || (isBoard ? 'tag-director' : 'tag-delegate');
      return `
        <div style="border: 1px solid #CBD5E1; border-radius: 10px; background: #FFF; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.04);">
          <div onclick="toggleAccordion('dir-detail-${type}-${idx}', 'dir-icon-${type}-${idx}')" style="padding: 12px 14px; background: #F8FAFC; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
              <span class="officer-tag ${tagClass}" style="flex-shrink: 0; font-size: 0.76rem; padding: 2px 8px; border-radius: 4px;">${item.tag || (isBoard ? '임원' : '대의원')}</span>
              <strong style="color: #0A2540; font-size: 0.95rem; font-weight: 900; white-space: nowrap;">${idx + 1}. ${item.name}</strong>
              <span style="font-size: 0.84rem; color: #64748B; font-weight: 700; white-space: nowrap;">(${item.role})</span>
              ${item.branchName ? `<span style="font-size: 0.76rem; color: #0284C7; background: #E0F2FE; border: 1px solid #BAE6FD; padding: 2px 7px; border-radius: 4px; font-weight: 800; white-space: nowrap;"><i class="fa-solid fa-building-flag"></i> ${item.branchName}</span>` : ''}
              ${item.region ? `<span style="margin-left: auto; font-size: 0.8rem; color: #15803D; background: #DCFCE7; padding: 2px 6px; border-radius: 4px; font-weight: 800; white-space: nowrap;">${item.region}</span>` : ""}
            </div>
            <span id="dir-icon-${type}-${idx}" style="color: #0284C7; font-size: 0.8rem; font-weight: 700; white-space: nowrap; flex-shrink: 0;">
              <i class="fa-solid fa-chevron-down"></i> 상세보기
            </span>
          </div>

          <div id="dir-detail-${type}-${idx}" style="display: none; padding: 16px; border-top: 1px dashed #CBD5E1; background: #FFF;">
            <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
              <div style="width: 105px; height: 115px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid #E2E8F0; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                <img src="${item.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
              <div style="flex: 1; min-width: 200px; font-size: 0.88rem; color: #334155; line-height: 1.8;">
                <div style="font-size: 1.05rem; font-weight: 900; color: #0A2540; margin-bottom: 4px;">
                  👤 <strong>${item.name}</strong> <span style="font-size: 0.85rem; color: #0284C7; font-weight: 800;">(${item.tag || (isBoard ? '임원' : '대의원')})</span>
                </div>
                ${item.branchName ? `<div style="font-size: 0.88rem; color: #0284C7; font-weight: 800;">🏛️ <strong>소속 지회:</strong> ${item.branchName}</div>` : ''}
                <div>📌 <strong>직책 및 역할:</strong> ${item.role}</div>
                <div>📞 <strong>연락처:</strong> <a href="tel:${item.phone}" style="color: #0284C7; font-weight: 800;">${item.phone}</a></div>
                <div>📍 <strong>소속 수계 및 관할 어가:</strong> ${item.region}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    grid.appendChild(listContainer);
  }

  // Master Admin Button Box (Moved to VERY BOTTOM below list)
  const adminBox = document.createElement('div');
  adminBox.style.cssText = 'grid-column: 1/-1; background: #F0F9FF; border: 1px solid #BAE6FD; padding: 12px 16px; border-radius: 10px; margin-top: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;';
  adminBox.innerHTML = `
    <span style="font-size: 0.84rem; color: #0369A1; font-weight: 700;">
      <i class="fa-solid fa-circle-info"></i> 항목을 클릭하시면 프로필 사진, 직책, 연락처 및 관할 수계 상세 내역이 열립니다.
    </span>
    ${(user && user.role === 'master') ? `
      <button onclick="openAddOfficerModal('${type}')" style="background: #0284C7; color: #FFF; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 800; font-size: 0.82rem; cursor: pointer;">
        + 👤 신규 ${isBoard ? '임원(이사/부회장/감사)' : '대의원'} 등록 및 관리
      </button>
    ` : ''}
  `;
  grid.appendChild(adminBox);
}

function openAddOfficerModal(type = 'board') {
  uploadedOfficerImageBase64 = null;
  const form = document.getElementById('add-officer-form');
  if (form) form.reset();
  resetOfficerFormState(false);
  switchOfficerModalTab(type);
  showModalClean('add-officer-modal');
}
window.openAddOfficerModal = openAddOfficerModal;

function populateBranchSelectOptions() {
  const branchSelect = document.getElementById('officer-branch-select');
  const concurrentSelect = document.getElementById('officer-concurrent-branch-select');
  const branches = Array.isArray(branchOrgList) ? branchOrgList : [];
  
  let optionsHtml = '';
  if (branches.length === 0) {
    optionsHtml = '<option value="">등록된 지회가 없습니다</option>';
  } else {
    optionsHtml = branches.map(b => {
      const cleanName = (b.name || '시·도 지회').replace(/^(\d+\.\s*|🏛️\s*)/, '').trim();
      return `<option value="${b.id}">${cleanName}</option>`;
    }).join('');
  }

  if (branchSelect) branchSelect.innerHTML = optionsHtml;
  if (concurrentSelect) concurrentSelect.innerHTML = optionsHtml;
}

function handleOfficerBranchSelect(branchId) {
  const branches = Array.isArray(branchOrgList) ? branchOrgList : [];
  const branch = branches.find(b => String(b.id) === String(branchId));
  if (branch) {
    const cleanName = (branch.name || '').replace(/^(\d+\.\s*|🏛️\s*)/, '').trim();
    const tagInput = document.getElementById('officer-tag');
    const roleInput = document.getElementById('officer-role');
    const regionInput = document.getElementById('officer-region');
    if (tagInput && (!tagInput.value || tagInput.value.includes('대의원'))) {
      tagInput.value = `${cleanName} 대의원`;
    }
    if (roleInput && (!roleInput.value || roleInput.value.includes('소속 대의원'))) {
      roleInput.value = `${cleanName} 소속 대의원`;
    }
    if (regionInput && branch.region) {
      regionInput.value = branch.region;
    }
  }
}
window.handleOfficerBranchSelect = handleOfficerBranchSelect;

function toggleOfficerBranchLeaderOptions(checked) {
  const container = document.getElementById('officer-branch-leader-select-container');
  if (container) container.style.display = checked ? 'block' : 'none';
  if (checked) {
    const concurrentSelect = document.getElementById('officer-concurrent-branch-select');
    if (concurrentSelect && concurrentSelect.value) {
      handleOfficerConcurrentBranchSelect(concurrentSelect.value);
    }
  }
}
window.toggleOfficerBranchLeaderOptions = toggleOfficerBranchLeaderOptions;

function handleOfficerConcurrentBranchSelect(branchId) {
  const branches = Array.isArray(branchOrgList) ? branchOrgList : [];
  const branch = branches.find(b => String(b.id) === String(branchId));
  if (branch) {
    const cleanName = (branch.name || '').replace(/^(\d+\.\s*|🏛️\s*)/, '').trim();
    let lName = '';
    let lPhone = '';
    if (branch.leader) {
      const match = branch.leader.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        lName = match[1].trim();
        lPhone = match[2].trim();
      } else {
        lName = branch.leader.trim();
      }
    }
    if (lName) document.getElementById('officer-name').value = lName;
    if (lPhone) document.getElementById('officer-phone').value = lPhone;
    if (branch.region) document.getElementById('officer-region').value = branch.region;
    document.getElementById('officer-tag').value = '이사';
    document.getElementById('officer-role').value = `중앙연합회 이사 (${cleanName} 지회장)`;
  }
}
window.handleOfficerConcurrentBranchSelect = handleOfficerConcurrentBranchSelect;

function toggleBranchBoardRoleSelect(checked) {
  const container = document.getElementById('branch-board-role-container');
  if (container) container.style.display = checked ? 'block' : 'none';
}
window.toggleBranchBoardRoleSelect = toggleBranchBoardRoleSelect;

function switchOfficerModalTab(type = 'board') {
  const select = document.getElementById('officer-group-type');
  if (select) select.value = type;

  const btnBoard = document.getElementById('tab-btn-modal-board');
  const btnDelegate = document.getElementById('tab-btn-modal-delegate');
  if (btnBoard && btnDelegate) {
    if (type === 'board') {
      btnBoard.style.borderColor = '#0284C7';
      btnBoard.style.background = '#0284C7';
      btnBoard.style.color = '#FFF';
      btnDelegate.style.borderColor = '#CBD5E1';
      btnDelegate.style.background = '#F8FAFC';
      btnDelegate.style.color = '#64748B';
    } else {
      btnDelegate.style.borderColor = '#0284C7';
      btnDelegate.style.background = '#0284C7';
      btnDelegate.style.color = '#FFF';
      btnBoard.style.borderColor = '#CBD5E1';
      btnBoard.style.background = '#F8FAFC';
      btnBoard.style.color = '#64748B';
    }
  }

  const formTitle = document.getElementById('officer-form-title');
  if (formTitle) {
    formTitle.innerHTML = type === 'board' 
      ? '➕ 신규 임원(이사/부회장/감사) 추가 등록 (사진 포함)' 
      : '➕ 신규 대의원 추가 등록 (사진 포함)';
  }

  const branchGroup = document.getElementById('officer-branch-group');
  const boardConcurrentGroup = document.getElementById('officer-board-concurrent-group');
  populateBranchSelectOptions();

  const tagInput = document.getElementById('officer-tag');
  const roleInput = document.getElementById('officer-role');

  if (type === 'delegate') {
    if (branchGroup) branchGroup.style.display = 'block';
    if (boardConcurrentGroup) boardConcurrentGroup.style.display = 'none';
    const branchSelect = document.getElementById('officer-branch-select');
    if (branchSelect && branchSelect.value) {
      handleOfficerBranchSelect(branchSelect.value);
    }
    if (tagInput) tagInput.placeholder = '예: 대의원, 대의원 의장';
    if (roleInput) roleInput.placeholder = '예: 충북 지역 대의원 또는 남한강 수계 대의원';
  } else {
    if (branchGroup) branchGroup.style.display = 'none';
    if (boardConcurrentGroup) boardConcurrentGroup.style.display = 'block';
    if (tagInput) {
      tagInput.placeholder = '예: 부회장, 감사, 이사';
      if (!tagInput.value || tagInput.value.includes('대의원')) tagInput.value = '이사';
    }
    if (roleInput) {
      roleInput.placeholder = '예: 중앙연합회 부회장 또는 충북 수계 이사';
      if (!roleInput.value || roleInput.value.includes('대의원')) roleInput.value = '중앙연합회 이사';
    }
  }

  renderOfficerManageList();
}
window.switchOfficerModalTab = switchOfficerModalTab;

function closeAddOfficerModal() {
  hideModalClean('add-officer-modal');
  resetOfficerFormState(false);
}

let currentEditingOfficerIndex = -1;
let currentEditingOfficerType = '';

function renderOfficerManageList() {
  const area = document.getElementById('officer-manage-list-area');
  const select = document.getElementById('officer-group-type');
  const type = select ? select.value : 'board';
  if (!area) return;

  const currentList = (type === 'board') ? boardList : delegateList;

  if (!currentList || currentList.length === 0) {
    area.innerHTML = `
      <div style="font-size: 0.86rem; font-weight: 800; color: #0A2540; margin-bottom: 8px;">
        👑 현재 등록된 ${type === 'board' ? '임원(이사회)' : '대의원'} 현황 (0명):
      </div>
      <div style="font-size: 0.82rem; color: #94A3B8; padding: 12px; background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 6px; text-align: center;">
        등록된 ${type === 'board' ? '임원이' : '대의원이'} 없습니다. 아래 양식에서 신규 ${type === 'board' ? '임원을' : '대의원을'} 등록해 주세요.
      </div>
    `;
    return;
  }

  area.innerHTML = `
    <div style="font-size: 0.86rem; font-weight: 800; color: #0A2540; margin-bottom: 8px;">
      👑 현재 등록된 ${type === 'board' ? '임원(이사회)' : '대의원'} 현황 (${currentList.length}명):
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px; max-height: 160px; overflow-y: auto; padding-right: 4px;">
      ${currentList.map((item, idx) => {
        let displayRole = item.tag || item.role;
        if (type === 'delegate') {
          const bName = (item.branchName || (item.region ? item.region.split(' ')[0] : '')).replace(/^🏛️\s*/, '').trim();
          if (bName) {
            displayRole = bName.includes('대의원') ? bName : `${bName} 대의원`;
          } else if (item.role && item.role.includes('대의원')) {
            displayRole = item.role;
          } else {
            displayRole = '지회 대의원';
          }
        }
        return `
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 8px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem;">
          <span style="color: #0A2540; font-weight: 700;">
            ${item.name} <span style="color: #0284C7; font-weight: 800;">(${displayRole})</span>
          </span>
          <button type="button" onclick="openIndividualOfficerModal(${idx}, '${type}')" style="background: #0284C7; color: #FFF; border: none; padding: 4px 12px; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 0.76rem; display: flex; align-items: center; gap: 4px; box-shadow: 0 1px 3px rgba(2,132,199,0.25);">
            <i class="fa-solid fa-pen-to-square"></i> 관리 (수정)
          </button>
        </div>
      `;
      }).join('')}
    </div>
  `;
}

function toggleOfficerAction(idx, type) {
  const div = document.getElementById(`officer-action-${type}-${idx}`);
  if (div) {
    div.style.display = (div.style.display === 'none' || div.style.display === '') ? 'block' : 'none';
  }
}

function editOfficer(idx, type) {
  const currentList = (type === 'board') ? boardList : delegateList;
  const officer = currentList[idx];
  if (!officer) return;

  currentEditingOfficerIndex = idx;
  currentEditingOfficerType = type;

  switchOfficerModalTab(type);

  document.getElementById('officer-name').value = officer.name || '';
  document.getElementById('officer-tag').value = officer.tag || '';
  document.getElementById('officer-role').value = officer.role || '';
  document.getElementById('officer-phone').value = officer.phone || '';
  document.getElementById('officer-region').value = officer.region || '';
  
  if (type === 'delegate') {
    const branchSelect = document.getElementById('officer-branch-select');
    if (branchSelect) {
      if (officer.branchId) {
        branchSelect.value = officer.branchId;
      } else if (officer.branchName) {
        const found = (branchOrgList || []).find(b => b.name && b.name.includes(officer.branchName.replace(/^🏛️\s*/, '')));
        if (found) branchSelect.value = found.id;
      }
    }
  }
  
  if (officer.image && officer.image.startsWith('http')) {
    document.getElementById('officer-image-url').value = officer.image;
  } else {
    document.getElementById('officer-image-url').value = '';
    uploadedOfficerImageBase64 = officer.image; 
  }

  const submitBtn = document.getElementById('officer-submit-btn');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fa-solid fa-pen"></i> 수정된 인적사항 반영하기';
    submitBtn.style.background = '#D97706';
  }
  
  const actionDiv = document.getElementById(`officer-action-${type}-${idx}`);
  if (actionDiv) actionDiv.style.display = 'none';
}

function resetOfficerFormState(keepType = true) {
  const select = document.getElementById('officer-group-type');
  const savedType = select ? select.value : 'board';
  currentEditingOfficerIndex = -1;
  currentEditingOfficerType = '';
  const submitBtn = document.getElementById('officer-submit-btn');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> 신규 등록 및 반영하기';
    submitBtn.style.background = '#0284C7';
  }
  const form = document.getElementById('add-officer-form');
  if (form) form.reset();
  if (keepType && select) select.value = savedType;
  uploadedOfficerImageBase64 = null;
}

function deleteOfficer(index, type) {
  if (confirm("정말 이 인원 명부를 삭제하시겠습니까?")) {
    if (type === 'board') {
      const removed = boardList.splice(index, 1)[0];
      if (removed && removed.branchId) {
        const br = branchOrgList.find(b => String(b.id) === String(removed.branchId));
        if (br) br.isBoardMember = false;
      }
    } else {
      const removed = delegateList.splice(index, 1)[0];
      if (removed) {
        branchOrgList.forEach(br => {
          if (Array.isArray(br.delegates)) {
            br.delegates = br.delegates.filter(d => !d.name.includes(removed.name));
          }
        });
      }
    }
    if (currentEditingOfficerIndex === index && currentEditingOfficerType === type) {
      resetOfficerFormState(true);
    }
    syncOrgDataToServer();
    renderOfficerManageList();
    renderBranchCards();
    filterDirectory(type);
    alert("삭제 처리되었습니다.");
  }
}

function handleOfficerImageFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    uploadedOfficerImageBase64 = event.target.result;
  };
  reader.readAsDataURL(file);
}

async function handleAddOfficerSubmit(e) {
  e.preventDefault();
  const groupType = document.getElementById('officer-group-type').value;
  const name = document.getElementById('officer-name').value.trim();
  const tag = document.getElementById('officer-tag').value.trim();
  const role = document.getElementById('officer-role').value.trim();
  const phone = document.getElementById('officer-phone').value.trim();
  const region = document.getElementById('officer-region').value.trim();
  const urlInput = document.getElementById('officer-image-url').value.trim();

  if (uploadedOfficerImageBase64 && uploadedOfficerImageBase64.startsWith('data:image')) {
      uploadedOfficerImageBase64 = await uploadToSupabase(uploadedOfficerImageBase64, 'officer');
    }
    let finalImg = uploadedOfficerImageBase64 || urlInput || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    uploadedOfficerImageBase64 = null;

  let branchId = null;
  let branchName = '';
  let isBranchLeader = false;

  if (groupType === 'delegate') {
    const branchSelect = document.getElementById('officer-branch-select');
    branchId = branchSelect ? branchSelect.value : null;
    const branches = Array.isArray(branchOrgList) ? branchOrgList : [];
    const targetBranch = branches.find(b => String(b.id) === String(branchId));
    if (targetBranch) {
      branchName = (targetBranch.name || '').replace(/^(\d+\.\s*|🏛️\s*)/, '').trim();
      if (!Array.isArray(targetBranch.delegates)) targetBranch.delegates = [];
      const dIdx = targetBranch.delegates.findIndex(d => d.name.includes(name));
      const delItem = { name: `${name} 대의원`, phone: phone || '' };
      if (dIdx !== -1) {
        targetBranch.delegates[dIdx] = delItem;
      } else {
        targetBranch.delegates.push(delItem);
      }
    }
  } else {
    const isLeaderCheck = document.getElementById('officer-is-branch-leader');
    if (isLeaderCheck && isLeaderCheck.checked) {
      isBranchLeader = true;
      const concSelect = document.getElementById('officer-concurrent-branch-select');
      branchId = concSelect ? concSelect.value : null;
      const targetBranch = branchOrgList.find(b => String(b.id) === String(branchId));
      if (targetBranch) {
        targetBranch.isBoardMember = true;
        targetBranch.boardRole = tag || '이사';
      }
    }
  }

  const newOfficer = {
    name, role, tag,
    tagClass: groupType === 'board' ? 'tag-director' : 'tag-delegate',
    image: finalImg,
    phone, region,
    branchId: branchId || null,
    branchName: branchName || '',
    isBranchLeader: isBranchLeader
  };

  if (currentEditingOfficerIndex !== -1 && currentEditingOfficerType === groupType) {
    if (groupType === 'board') {
      boardList[currentEditingOfficerIndex] = newOfficer;
    } else {
      delegateList[currentEditingOfficerIndex] = newOfficer;
    }
    alert(`[수정 완료]\n'${name}' 님의 정보가 성공적으로 수정되었습니다.`);
  } else {
    if (groupType === 'board') {
      boardList.push(newOfficer);
    } else {
      delegateList.push(newOfficer);
    }
    alert(`[등록 완료]\n'${name}' 님이 신규 ${groupType === 'board' ? '임원' : '대의원'}으로 명부에 등록되었습니다.`);
  }

  syncOrgDataToServer();
  resetOfficerFormState();
  renderOfficerManageList();
  filterDirectory(groupType);
}

function scrollToDirectory(type = 'board') {
  filterDirectory('board');
  const section = document.getElementById('directory-section');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

function openAboutModal(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  if (e && e.preventDefault) e.preventDefault();
  closeWelcomeNotice();
  hideModalClean('notice-modal');
  renderPresidentGreeting();
  filterDirectory('board');
  showModalClean('about-modal');
}
window.openAboutModal = openAboutModal;

function closeAboutModal() {
  hideModalClean('about-modal');
}
window.closeAboutModal = closeAboutModal;

function openNoticeModalFull(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  if (e && e.preventDefault) e.preventDefault();
  closeWelcomeNotice();
  hideModalClean('about-modal');
  renderAccountingList();
  showModalClean('notice-modal');
}
window.openNoticeModalFull = openNoticeModalFull;

function closeNoticeModalFull() {
  hideModalClean('notice-modal');
}
window.closeNoticeModalFull = closeNoticeModalFull;


// ==========================================================================
// Executive Briefing & PT/PDF Report Formatter
// ==========================================================================
function switchReportViewMode(mode) {
  const ptWrap = document.getElementById('report-view-pt');
  const rawWrap = document.getElementById('report-view-raw');
  const btnPt = document.getElementById('btn-report-view-pt');
  const btnRaw = document.getElementById('btn-report-view-raw');

  if (mode === 'pt') {
    if (ptWrap) ptWrap.style.display = 'block';
    if (rawWrap) rawWrap.style.display = 'none';
    if (btnPt) {
      btnPt.style.background = '#0284C7';
      btnPt.style.color = '#FFF';
    }
    if (btnRaw) {
      btnRaw.style.background = 'transparent';
      btnRaw.style.color = '#94A3B8';
    }
  } else {
    if (ptWrap) ptWrap.style.display = 'none';
    if (rawWrap) rawWrap.style.display = 'block';
    if (btnPt) {
      btnPt.style.background = 'transparent';
      btnPt.style.color = '#94A3B8';
    }
    if (btnRaw) {
      btnRaw.style.background = '#0284C7';
      btnRaw.style.color = '#FFF';
    }
  }
}

function renderActivityExecutiveReport(item) {
  const rawContent = item.content || item.desc || '';
  if (!rawContent || rawContent === '현안토의') {
    return `
      <div style="line-height: 1.8; color: #334155; font-size: 0.95rem; margin-bottom: 14px; background: #FFF; padding: 16px 20px; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
        <i class="fa-solid fa-circle-info" style="color: #0284C7; margin-right: 6px;"></i> ${rawContent || '해당 날짜에 실시된 주요 현장 활동 및 사업 집행 결과 보고 내용입니다.'}
      </div>
    `;
  }

  if (rawContent.includes('report-executive-container')) {
    return rawContent;
  }

  const plainText = rawContent.replace(/<[^>]*>/g, '').trim();
  const hasNumberedSections = /1\.\s+[^\n]+/.test(plainText) && /2\.\s+[^\n]+/.test(plainText);

  if (!hasNumberedSections) {
    return `
      <div style="line-height: 1.85; color: #334155; font-size: 0.95rem; margin-bottom: 14px; background: #FFF; padding: 18px 20px; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 2px 8px rgba(0,0,0,0.03); white-space: pre-line;">
        ${plainText}
      </div>
    `;
  }

  // Parse Title & Body
  let docTitle = item.title ? `${item.title} 주요 보고 및 의결 사항` : '연합회 주요 보고 및 의결 사항';
  let bodyText = plainText;
  const firstMatch = plainText.match(/1\.\s+/);
  if (firstMatch) {
    const rawTitle = plainText.substring(0, firstMatch.index).trim();
    if (rawTitle.length > 5) docTitle = rawTitle;
    bodyText = plainText.substring(firstMatch.index);
  }

  const rawSections = bodyText.split(/(?=(?:^|\n|\s+)\d+\.\s+)/).map(s => s.trim()).filter(Boolean);

  const sectionsHtml = rawSections.map((sec, idx) => {
    const lines = sec.split('\n').map(l => l.trim()).filter(Boolean);
    let secTitle = lines[0] || `안건 0${idx + 1}`;
    secTitle = secTitle.replace(/^\d+\.\s*/, '').trim();

    const subText = lines.slice(1).join('\n');
    const subParts = subText.split(/(?=(?:^|\n)[^\n:]{2,35}:\s*)/);
    const splitItems = [];

    subParts.forEach(part => {
      const trimmed = part.trim();
      if (!trimmed) return;
      const cIdx = trimmed.indexOf(':');
      if (cIdx !== -1 && cIdx < 40) {
        splitItems.push({
          label: trimmed.substring(0, cIdx).trim(),
          desc: trimmed.substring(cIdx + 1).trim()
        });
      } else {
        splitItems.push({
          label: '추진 세부내용',
          desc: trimmed
        });
      }
    });

    const rowsHtml = splitItems.map(it => `
      <tr style="border-bottom: 1px solid #E2E8F0; transition: background 0.15s ease;">
        <td style="width: 28%; min-width: 140px; background: #F8FAFC; padding: 12px 14px; font-weight: 800; color: #0F172A; font-size: 0.85rem; border-right: 1px solid #E2E8F0; vertical-align: middle;">
          <span style="display: inline-block; width: 6px; height: 6px; background: #0284C7; border-radius: 50%; margin-right: 6px; vertical-align: middle;"></span>
          ${it.label}
        </td>
        <td style="padding: 12px 16px; color: #334155; font-size: 0.88rem; line-height: 1.7; vertical-align: middle; background: #FFFFFF;">
          ${it.desc.replace(/\n+/g, '<br>')}
        </td>
      </tr>
    `).join('');

    return `
      <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 12px; margin-bottom: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);">
        <div style="background: linear-gradient(90deg, #0A2540 0%, #1E3A8A 100%); color: #FFFFFF; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #F59E0B; color: #000; font-weight: 900; font-size: 0.74rem; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.3px;">안건 0${idx + 1}</span>
            <span style="font-size: 0.94rem; font-weight: 800; letter-spacing: -0.3px; color: #FFFFFF;">${secTitle}</span>
          </div>
          <span style="font-size: 0.72rem; color: #BAE6FD; font-weight: 600;"><i class="fa-solid fa-circle-check" style="color: #38BDF8;"></i> 의결/추진 확정</span>
        </div>
        <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; min-width: 480px;">
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="report-executive-container">
      <!-- 공식 보고서 상단 브리핑 배너 -->
      <div style="background: linear-gradient(135deg, #0A2540 0%, #1E293B 100%); border-radius: 12px; padding: 14px 18px; color: #FFFFFF; margin-bottom: 14px; box-shadow: 0 4px 14px rgba(10, 37, 64, 0.12); border-left: 5px solid #0284C7; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <div style="font-size: 0.73rem; color: #38BDF8; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 3px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-file-shield"></i> <span>사단법인 공식 브리핑 요약 보고서 (PT/PDF 행·열 정렬)</span>
          </div>
          <h4 style="font-size: 1.05rem; font-weight: 900; margin: 0; color: #FFFFFF; line-height: 1.35;">
            ${docTitle}
          </h4>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <!-- 뷰 모드 전환 탭 -->
          <div style="display: flex; background: rgba(0,0,0,0.3); padding: 2px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15);">
            <button id="btn-report-view-pt" onclick="switchReportViewMode('pt')" style="background: #0284C7; color: #FFF; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              <i class="fa-solid fa-table-columns"></i> PT/표 요약
            </button>
            <button id="btn-report-view-raw" onclick="switchReportViewMode('raw')" style="background: transparent; color: #94A3B8; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              <i class="fa-solid fa-align-left"></i> 원문 줄글
            </button>
          </div>
          <!-- 인쇄 / PDF 저장 -->
          <button onclick="window.print()" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #FFFFFF; padding: 5px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'" title="이 보고서를 PDF로 저장하거나 인쇄합니다">
            <i class="fa-solid fa-print"></i> PDF/인쇄
          </button>
        </div>
      </div>

      <!-- 1) PT/표 요약 뷰 -->
      <div id="report-view-pt" class="report-sections-wrap">
        ${sectionsHtml}
      </div>

      <!-- 2) 원문 텍스트 뷰 (초기 숨김) -->
      <div id="report-view-raw" style="display: none; background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 12px; padding: 18px 20px; line-height: 1.85; color: #334155; font-size: 0.92rem; white-space: pre-line; box-shadow: 0 2px 8px rgba(15,23,42,0.04);">
        ${plainText}
      </div>
    </div>
  `;
}


// ==========================================================================
// Interactive Agenda Accordion Functions
// ==========================================================================
function toggleAgendaAccordion(idx) {
  const body = document.getElementById('agenda-body-' + idx);
  const arrow = document.getElementById('agenda-arrow-' + idx);
  if (!body) return;
  const isHidden = (body.style.display === 'none');
  body.style.display = isHidden ? 'block' : 'none';
  if (arrow) {
    arrow.innerHTML = isHidden 
      ? '<i class="fa-solid fa-chevron-up"></i> 접기' 
      : '<i class="fa-solid fa-chevron-down"></i> 상세보기';
  }
}

function renderInteractiveAgendaSection(item) {
  if (!item.agenda || item.agenda.length === 0) return '';

  const itemsHtml = item.agenda.map((a, idx) => {
    const isObj = (typeof a === 'object' && a !== null);
    const title = isObj ? (a.title || '안건') : a;
    const detail = isObj ? a.detail : '해당 안건에 대해 이사회 및 집행부 간 심도 있는 현안 협의와 심의가 진행되었습니다.';
    const decision = isObj ? a.decision : '원안 가결 및 세부 추진 계획 승인';
    const hasAcc = isObj ? a.hasAccounting : (title.includes('회계') || title.includes('예산') || title.includes('집행') || title.includes('정산'));

    // By default, open the first item (idx === 0) for great immediate preview
    const isOpen = (idx === 0);

    return `
      <div style="background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 10px; margin-bottom: 10px; overflow: hidden; box-shadow: 0 2px 6px rgba(15,23,42,0.04);">
        <!-- 클릭 가능한 아코디언 헤더 -->
        <div onclick="toggleAgendaAccordion(${idx})" style="padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; background: #F8FAFC; border-bottom: ${isOpen ? '1px solid #E2E8F0' : 'none'}; user-select: none; transition: background 0.15s;" onmouseover="this.style.background='#F1F5F9'" onmouseout="this.style.background='#F8FAFC'">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1; padding-right: 12px;">
            <span style="background: #0284C7; color: #FFF; font-weight: 800; font-size: 0.72rem; padding: 2px 7px; border-radius: 4px; white-space: nowrap;">안건 0${idx + 1}</span>
            <span style="font-size: 0.92rem; font-weight: 800; color: #0F172A; line-height: 1.35;">${title}</span>
          </div>
          <span id="agenda-arrow-${idx}" style="font-size: 0.78rem; color: #0284C7; font-weight: 700; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
            ${isOpen ? '<i class="fa-solid fa-chevron-up"></i> 접기' : '<i class="fa-solid fa-chevron-down"></i> 상세보기'}
          </span>
        </div>

        <!-- 펼쳐지는 상세 내용 바디 -->
        <div id="agenda-body-${idx}" style="display: ${isOpen ? 'block' : 'none'}; padding: 14px 16px; background: #FFFFFF; font-size: 0.88rem; line-height: 1.7; color: #334155;">
          ${detail ? `
            <div style="margin-bottom: 10px;">
              <strong style="color: #1E293B; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="display: inline-block; width: 6px; height: 6px; background: #0284C7; border-radius: 50%;"></span>
                추진 경과 및 상세 협의 내용:
              </strong>
              <div style="background: #F8FAFC; padding: 10px 14px; border-radius: 8px; border: 1px solid #E2E8F0; color: #475569;">
                ${detail}
              </div>
            </div>
          ` : ''}

          ${decision ? `
            <div style="margin-bottom: ${hasAcc ? '10px' : '0'};">
              <strong style="color: #059669; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <i class="fa-solid fa-circle-check"></i> 의결 결과 및 성과:
              </strong>
              <div style="background: #ECFDF5; padding: 10px 14px; border-radius: 8px; border: 1px solid #A7F3D0; color: #065F46; font-weight: 600;">
                ${decision}
              </div>
            </div>
          ` : ''}

          ${hasAcc ? `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #E2E8F0; display: flex; justify-content: flex-end;">
              <button onclick="document.getElementById('accounting-section-wrap')?.scrollIntoView({behavior: 'smooth'})" style="background: #FFFBEB; border: 1px solid #FDE68A; color: #B45309; padding: 5px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.2s;" onmouseover="this.style.background='#FEF3C7'" onmouseout="this.style.background='#FFFBEB'">
                <i class="fa-solid fa-receipt" style="color: #D97706;"></i> 해당 활동 세부 지출·수입 회계 장부 확인 &darr;
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="margin-top: 16px; background: #F8FAFC; padding: 16px; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 2px 8px rgba(15,23,42,0.03);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;">
        <h4 style="font-size: 0.98rem; color: #0A2540; margin: 0; font-weight: 800; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-list-check" style="color: #0284C7;"></i> 주요 성과 및 의결 안건
          <span style="font-size: 0.75rem; color: #64748B; font-weight: normal;">(클릭 시 세부 내용이 펼쳐집니다)</span>
        </h4>
        <span style="background: #E0F2FE; color: #0369A1; font-size: 0.73rem; font-weight: 800; padding: 3px 9px; border-radius: 12px;">
          총 ${item.agenda.length}건
        </span>
      </div>
      <div>
        ${itemsHtml}
      </div>
    </div>
  `;
}

function openGalleryDetailModal(id) {
  const user = getCurrentUser();
  const item = galleryItems.find(i => i.id === id) || accountingItems.find(i => i.id === id) || {
    id: id,
    title: '연합회 주요 활동 현황 보고서',
    date: '2026-06-25',
    categoryName: '현장활동 및 교육',
    content: '등록된 활동 세부 내용입니다.'
  };

  const agendaHtml = renderInteractiveAgendaSection(item);

  let accTableHtml = '';
  if (user) {
    if (item.accountingBreakdown && item.accountingBreakdown.length > 0) {
      accTableHtml = `
        <div style="margin-top: 16px;">
          <div id="accounting-section-wrap"><h4 style="font-size: 0.98rem; color: #0A2540; margin-bottom: 8px;"><i class="fa-solid fa-calculator" style="color: #D97706;"></i> 해당 활동 예산 집행 세부 회계 내역</h4>
          <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
            <table style="width: 100%; min-width: 440px; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
              <thead>
                <tr style="background: #0A2540; color: #FFF;">
                  <th style="padding: 8px 10px; border-radius: 6px 0 0 0;">적요 / 항목명</th>
                  <th style="padding: 8px 10px;">구분</th>
                  <th style="padding: 8px 10px;">금액</th>
                  <th style="padding: 8px 10px; border-radius: 0 6px 0 0;">비고</th>
                </tr>
              </thead>
              <tbody>
                ${item.accountingBreakdown.map((row, idx) => `
                  <tr style="background: ${idx % 2 === 0 ? '#FFFFFF' : '#F1F5F9'}; border-bottom: 1px solid #E2E8F0;">
                    <td style="padding: 8px 10px; font-weight: 600; color: #1E293B;">${row.item}</td>
                    <td style="padding: 8px 10px;"><span style="color: ${row.type === '수입' ? '#059669' : '#DC2626'}; font-weight: 700;">${row.type}</span></td>
                    <td style="padding: 8px 10px; font-weight: 700;">${formatMoneyDisplay(row.amount)}</td>
                    <td style="padding: 8px 10px; color: #64748B;">${row.note}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  } else {
    accTableHtml = `
      <div id="accounting-section-wrap" style="margin-top: 16px; background: #F0F9FF; border: 1px solid #BAE6FD; padding: 14px 16px; border-radius: 10px; font-size: 0.85rem; color: #0369A1; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div>
          <i class="fa-solid fa-lock" style="color: #0284C7;"></i> <strong>세부 회계 결산 장부는 회원/마스터 로그인 시 열람 가능합니다.</strong>
        </div>
        <button onclick="closeModal(); openLoginModal('🔒 <strong>[회원/마스터 전용 공시]</strong> 세부 회계 장부를 보시려면 로그인해 주세요.')" style="background: #0284C7; color: #FFF; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 800; font-size: 0.78rem; cursor: pointer;">
          <i class="fa-solid fa-key"></i> 로그인하기
        </button>
      </div>
    `;
  }

  const categoryName = (item.category === 'field' || item.category === 'edu') ? '현장활동 및 교육' : (item.categoryName || (item.category === 'meeting' ? '총회/이사회' : '지부활동'));

  const modalContent = document.getElementById('modal-body-content');
  modalContent.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
      <span style="background: #0284C7; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 800;"><i class="fa-solid fa-camera"></i> 연합회 활동 동향 [${categoryName}]</span>
      <span style="font-size: 0.82rem; color: #0284C7; font-weight: 700;"><i class="fa-regular fa-calendar-days"></i> 일자: ${item.date}</span>
    </div>

    <h3 style="font-size: clamp(1.15rem, 4vw, 1.45rem); color: #0A2540; margin-bottom: 12px; line-height: 1.35; font-weight: 900;">${item.title}</h3>

    <div style="background: #F1F5F9; padding: 12px 14px; border-radius: 10px; font-size: 0.85rem; color: #334155; margin-bottom: 14px; line-height: 1.6;">
      <div><strong>📍 장소 및 수계:</strong> ${item.location || '사단법인 연합회 대회의실 및 현장 수계'}</div>
      <div><strong>👥 참석 대상:</strong> ${item.participants || '전국 16개 시·도 지회장 및 회원 어업인'}</div>
    </div>

    ${(item.images && item.images.length > 0) ? `
      <div style="font-size: 0.82rem; color: #475569; margin-bottom: 8px; font-weight: 700; display: flex; align-items: center; justify-content: space-between;">
        <span><i class="fa-regular fa-images" style="color: #0284C7;"></i> 등록된 행사 사진 (${item.images.length}장) <span style="font-size: 0.75rem; color: #94A3B8; font-weight: normal;">(좌우 스크롤 / 클릭시 원본 확대)</span></span>
      </div>
      <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 16px; -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory;">
        ${item.images.map((img, idx) => `
          <div style="flex: 0 0 88%; max-width: 520px; scroll-snap-align: center; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.08); background: #F1F5F9; position: relative; border: 1px solid #E2E8F0;">
            <img src="${img}" alt="행사 사진 ${idx + 1}" loading="lazy" onerror="this.onerror=null; this.src=\'${item.image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'}\';" style="width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; cursor: pointer; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'" onclick="window.open('${img}', '_blank')" title="클릭하여 원본 사진 크게 보기">
            <span style="position: absolute; bottom: 8px; right: 8px; background: rgba(15, 23, 42, 0.75); color: #fff; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 12px; pointer-events: none; backdrop-filter: blur(4px);"><i class="fa-solid fa-camera"></i> ${idx + 1} / ${item.images.length}</span>
          </div>
        `).join('')}
      </div>
    ` : `
      <div style="width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); background: #F1F5F9; border: 1px solid #E2E8F0;">
        <img src="${item.image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'}" alt="${item.title}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80';" style="width: 100%; height: 100%; object-fit: cover; display: block;">
      </div>
    `}

    ${renderActivityExecutiveReport(item)}

    ${agendaHtml}

    ${accTableHtml}

    <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #E2E8F0; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; background: #FAFAFA; padding: 14px; border-radius: 10px;">
      <span style="font-size: 0.8rem; color: #64748B;"><i class="fa-solid fa-user-shield"></i> 사무국 및 지부 권한으로 수정을 진행하실 수 있습니다.</span>
      <div style="display: flex; gap: 8px; width: 100%; justify-content: flex-end;">
        <button class="btn btn-edit-action" onclick="editPost(${item.id})">
          <i class="fa-solid fa-pen-to-square"></i> 내용 수정하기
        </button>
        <button class="btn btn-delete-action" onclick="deletePost(${item.id})">
          <i class="fa-solid fa-trash-can"></i> 삭제
        </button>
      </div>
    </div>
  `;
  showModalClean('detail-modal');
}

function openNoticeModal(title, date, content) {
  const modalContent = document.getElementById('modal-body-content');
  modalContent.innerHTML = `
    <span style="background: #EF4444; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">공지사항</span>
    <h3 style="font-size: clamp(1.1rem, 4vw, 1.3rem); color: #0A2540; margin: 10px 0 6px; line-height: 1.35;">${title}</h3>
    <span style="font-size: 0.82rem; color: #64748B; display: block; margin-bottom: 16px;"><i class="fa-regular fa-calendar"></i> 공시일: ${date}</span>
    <div style="background: #F8FAFC; padding: 16px; border-radius: 10px; border: 1px solid #E2E8F0; line-height: 1.75; color: #334155; font-size: 0.9rem;">
      ${content}
    </div>
  `;
  showModalClean('detail-modal');
}

function closeModal() {
  hideModalClean('detail-modal');
}

function editPost(id) {
  const user = getCurrentUser();
  if (!user) {
    closeModal();
    openLoginModal(`🔒 <strong>[안내] 게시글 및 회계 수정</strong>은 마스터 또는 지부 관리자 로그인 권한이 필요합니다.`, 'admin');
    return;
  }

  closeModal();

  const item = galleryItems.find(i => i.id === id) || accountingItems.find(i => i.id === id);
  if (!item) return;

  editingItemId = id;

  document.getElementById('entry-title').value = item.title;
  document.getElementById('entry-date').value = item.date;
  document.getElementById('entry-category').value = (item.category === 'edu' || item.category === 'field') ? 'field' : (item.category || 'meeting');
  document.getElementById('entry-img-url').value = item.image || '';
  document.getElementById('entry-desc').value = (item.content || item.desc || '').replace(/<[^>]*>?/gm, '');

  document.getElementById('income-rows-container').innerHTML = '';
  document.getElementById('expense-rows-container').innerHTML = '';

  if (item.accountingBreakdown && item.accountingBreakdown.length > 0) {
    item.accountingBreakdown.forEach(row => {
      if (row.type === '수입') {
        addIncomeRow(row.item, row.amount);
      } else {
        addExpenseRow(row.item, row.amount);
      }
    });
  } else {
    if (item.income && item.income !== '-') addIncomeRow('수입 금액', item.income);
    if (item.expense && item.expense !== '-') addExpenseRow('지출/집행 금액', item.expense);
  }

  const headerText = document.querySelector('#admin-modal .admin-modal-header h2');
  if (headerText) headerText.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> [사무국] 게시글 및 회계 내역 수정`;

  const submitBtn = document.querySelector('#unified-admin-form button[type="submit"]');
  if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> 수정 사항 저장 및 반영하기`;

  openAdminModal();
}

async function deletePost(id) {
  const user = getCurrentUser();
  if (!user) {
    closeModal();
    openLoginModal(`🔒 <strong>[안내] 게시글 삭제</strong>는 마스터 또는 지부 관리자 로그인 권한이 필요합니다.`);
    return;
  }

  if (confirm("정말 이 게시글과 회계 내역을 삭제하시겠습니까?")) {
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const result = await res.json();
        galleryItems = result.db.gallery;
        accountingItems = result.db.accounting;
        localStorage.setItem('kifa_gallery', JSON.stringify(galleryItems));
        localStorage.setItem('kifa_accounting', JSON.stringify(accountingItems));
        renderGalleryGrid('all');
        renderAccountingList();
        closeModal();
        alert("삭제되었습니다.");
        return;
      }
    } catch (err) {
      console.log('Error deleting from server:', err);
    }

    galleryItems = galleryItems.filter(i => i.id !== id);
    accountingItems = accountingItems.filter(i => i.id !== id);
    localStorage.setItem('kifa_gallery', JSON.stringify(galleryItems));
    localStorage.setItem('kifa_accounting', JSON.stringify(accountingItems));
    renderGalleryGrid('all');
    renderAccountingList();
    closeModal();
    alert("삭제되었습니다.");
  }
}

// --- ADMIN ROUTING LOGIC ---

function openAdminModal() {
  const user = getCurrentUser();
  if (!user || user.role !== 'master') {
    openLoginModal(`🔒 <strong>[안내] 사단법인 중앙 연합회 활동 및 회계 결산 등록</strong>은 총괄 마스터 권한이 필요합니다. 아이디/비밀번호로 로그인해 주세요.`, 'admin');
    return;
  }
  insertMasterContactSettingsButton();
  showModalClean('master-dashboard-modal');
}

function openChangePwModalFromDashboard() {
  hideModalClean('master-dashboard-modal');
  hideModalClean('branch-dashboard-modal');
  openChangePwModal();
}

function openNewAdminEntry() {
  hideModalClean('master-dashboard-modal');
  editingItemId = null;
  const user = getCurrentUser();
  const nameEl = document.getElementById('admin-user-name');
  if (nameEl && user) nameEl.textContent = user.name;
  
  document.getElementById('unified-admin-form').reset();
  document.getElementById('entry-date').valueAsDate = new Date();
  document.getElementById('income-rows-container').innerHTML = '';
  document.getElementById('expense-rows-container').innerHTML = '';
  addIncomeRow('', '');
  addExpenseRow('', '');

  const headerText = document.querySelector('#admin-modal .admin-modal-header h2');
  if (headerText) headerText.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> 사단법인 연합회 활동 & 회계 동시 등록`;
  const submitBtn = document.querySelector('#unified-admin-form button[type="submit"]');
  if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> 연합회 활동 & 회계 동시 등록 및 반영`;
  const delBtn = document.getElementById('admin-delete-btn');
  if (delBtn) delBtn.style.display = 'none';

  showModalClean('admin-modal');
}

function openMasterEditList() {
  hideModalClean('master-dashboard-modal');
  const container = document.getElementById('master-edit-list-container');
  container.innerHTML = '';
  
  // Filter unified items from gallery (category is field or meeting, NOT branch)
  const masterItems = galleryItems.filter(g => g.category !== 'branch').sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (masterItems.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 20px; color:#64748B;">등록된 기존 활동이 없습니다.</div>`;
  } else {
    masterItems.forEach(item => {
      const div = document.createElement('div');
      div.style.padding = '12px';
      div.style.border = '1px solid #CBD5E1';
      div.style.borderRadius = '8px';
      div.style.cursor = 'pointer';
      div.style.background = '#F8FAFC';
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      
      div.innerHTML = `
        <div>
          <div style="font-weight: 700; color: #0F172A; margin-bottom: 4px;">${item.title}</div>
          <div style="font-size: 0.8rem; color: #64748B;">📅 ${item.date} | 📂 ${item.categoryName}</div>
        </div>
        <div style="color: #0284C7;"><i class="fa-solid fa-chevron-right"></i></div>
      `;
      div.onclick = () => populateAdminModalForEdit(item.id);
      
      div.onmouseenter = () => div.style.background = '#E0F2FE';
      div.onmouseleave = () => div.style.background = '#F8FAFC';
      
      container.appendChild(div);
    });
  }
  
  showModalClean('master-edit-list-modal');
}

function populateAdminModalForEdit(id) {
  hideModalClean('master-edit-list-modal');
  editingItemId = id;
  
  const user = getCurrentUser();
  const nameEl = document.getElementById('admin-user-name');
  if (nameEl && user) nameEl.textContent = user.name;
  
  const gItem = galleryItems.find(g => g.id === id);
  const aItem = accountingItems.find(a => a.id === id);
  
  if (!gItem) return;
  
  document.getElementById('entry-title').value = gItem.title;
  document.getElementById('entry-date').value = gItem.date;
  document.getElementById('entry-category').value = gItem.category;
  
  // Extract text from `<p>` wrapper in content
  const contentMatch = gItem.content.match(/<p[^>]*>(.*?)<\/p>/);
  document.getElementById('entry-desc').value = contentMatch ? contentMatch[1] : gItem.content;
  document.getElementById('entry-img-url').value = gItem.image.startsWith('http') ? gItem.image : '';
  
  if (gItem.images && gItem.images.length > 0) {
    tempUploadedImages = [...gItem.images];
    const mainIdx = gItem.images.indexOf(gItem.image);
    tempMainImageIndex = mainIdx !== -1 ? mainIdx : 0;
  } else if (gItem.image) {
    tempUploadedImages = [gItem.image];
    tempMainImageIndex = 0;
  } else {
    tempUploadedImages = [];
    tempMainImageIndex = 0;
  }
  renderImagePreviews('img-preview-box', tempUploadedImages, tempMainImageIndex, 'master');
  
  document.getElementById('income-rows-container').innerHTML = '';
  document.getElementById('expense-rows-container').innerHTML = '';
  
  let hasInc = false;
  let hasExp = false;
  
  if (gItem.accountingBreakdown && gItem.accountingBreakdown.length > 0) {
    gItem.accountingBreakdown.forEach(b => {
      if (b.type === '수입') {
        addIncomeRow(b.item, b.amount);
        hasInc = true;
      } else if (b.type === '지출') {
        addExpenseRow(b.item, b.amount);
        hasExp = true;
      }
    });
  }
  
  if (!hasInc) addIncomeRow('', '');
  if (!hasExp) addExpenseRow('', '');

  const headerText = document.querySelector('#admin-modal .admin-modal-header h2');
  if (headerText) headerText.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> 기존 활동 & 회계 내역 수정`;
  const submitBtn = document.querySelector('#unified-admin-form button[type="submit"]');
  if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> 수정 내용 저장하기`;
  const delBtn = document.getElementById('admin-delete-btn');
  if (delBtn) delBtn.style.display = 'flex';
  
  showModalClean('admin-modal');
}

function closeAdminModal() {
  editingItemId = null;
  hideModalClean('admin-modal');
}

// --- BRANCH ROUTING LOGIC ---

function openBranchAdminModal() {
  const user = getCurrentUser();
  if (!user) {
    openLoginModal(`🔒 <strong>[안내] 시·도 지회 행사 및 활동 등록</strong>은 지부 관리자 또는 마스터 권한이 필요합니다. 로그인해 주세요.`, 'branch');
    return;
  }
  showModalClean('branch-dashboard-modal');
}

function openNewBranchAdminEntry() {
  hideModalClean('branch-dashboard-modal');
  editingItemId = null;
  const user = getCurrentUser();
  const nameEl = document.getElementById('branch-user-name');
  if (nameEl && user) nameEl.textContent = user.name;

  document.getElementById('branch-admin-form').reset();
  document.getElementById('branch-entry-date').valueAsDate = new Date();
  
  const imgPreview = document.getElementById('branch-img-preview');
  tempUploadedBranchImages = [];
  tempMainBranchImageIndex = 0;
  renderImagePreviews('branch-img-preview-box', tempUploadedBranchImages, tempMainBranchImageIndex, 'branch');
  const headerText = document.querySelector('#branch-admin-modal .admin-modal-header h2');
  if (headerText) headerText.innerHTML = `<i class="fa-solid fa-building-flag"></i> 시·도 지회 행사 & 활동 전용 등록`;
  const submitBtn = document.querySelector('#branch-admin-form button[type="submit"]');
  if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-building-flag"></i> 🏛️ 지회 행사 활동 등록하기 (회계 미반영)`;
  const delBtn = document.getElementById('branch-delete-btn');
  if (delBtn) delBtn.style.display = 'none';

  showModalClean('branch-admin-modal');
}

function openBranchEditList() {
  hideModalClean('branch-dashboard-modal');
  const container = document.getElementById('branch-edit-list-container');
  container.innerHTML = '';
  
  // Filter branch items from gallery (category === branch)
  const branchItems = galleryItems.filter(g => g.category === 'branch').sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (branchItems.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 20px; color:#64748B;">등록된 기존 활동이 없습니다.</div>`;
  } else {
    branchItems.forEach(item => {
      const div = document.createElement('div');
      div.style.padding = '12px';
      div.style.border = '1px solid #CBD5E1';
      div.style.borderRadius = '8px';
      div.style.cursor = 'pointer';
      div.style.background = '#F0F9FF';
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      
      div.innerHTML = `
        <div>
          <div style="font-weight: 700; color: #0369A1; margin-bottom: 4px;">${item.title}</div>
          <div style="font-size: 0.8rem; color: #0284C7;">📅 ${item.date} | 📍 ${item.location}</div>
        </div>
        <div style="color: #0284C7;"><i class="fa-solid fa-chevron-right"></i></div>
      `;
      div.onclick = () => populateBranchAdminModalForEdit(item.id);
      
      div.onmouseenter = () => div.style.background = '#E0F2FE';
      div.onmouseleave = () => div.style.background = '#F0F9FF';
      
      container.appendChild(div);
    });
  }
  
  showModalClean('branch-edit-list-modal');
}

function populateBranchAdminModalForEdit(id) {
  hideModalClean('branch-edit-list-modal');
  editingItemId = id;
  
  const user = getCurrentUser();
  const nameEl = document.getElementById('branch-user-name');
  if (nameEl && user) nameEl.textContent = user.name;
  
  const gItem = galleryItems.find(g => g.id === id);
  if (!gItem) return;
  
  document.getElementById('branch-entry-title').value = gItem.title;
  document.getElementById('branch-entry-date').value = gItem.date;
  document.getElementById('branch-entry-location').value = gItem.location;
  
  // Extract text from `<p>` wrapper in content
  const contentMatch = gItem.content.match(/<p[^>]*>(.*?)<\/p>/);
  document.getElementById('branch-entry-desc').value = contentMatch ? contentMatch[1] : gItem.content;
  document.getElementById('branch-entry-img-url').value = gItem.image.startsWith('http') ? gItem.image : '';
  
  if (gItem.images && gItem.images.length > 0) {
    tempUploadedBranchImages = [...gItem.images];
    const mainIdx = gItem.images.indexOf(gItem.image);
    tempMainBranchImageIndex = mainIdx !== -1 ? mainIdx : 0;
  } else if (gItem.image) {
    tempUploadedBranchImages = [gItem.image];
    tempMainBranchImageIndex = 0;
  } else {
    tempUploadedBranchImages = [];
    tempMainBranchImageIndex = 0;
  }
  renderImagePreviews('branch-img-preview-box', tempUploadedBranchImages, tempMainBranchImageIndex, 'branch');

  const headerText = document.querySelector('#branch-admin-modal .admin-modal-header h2');
  if (headerText) headerText.innerHTML = `<i class="fa-solid fa-building-flag"></i> 기존 지회 활동 내역 수정`;
  const submitBtn = document.querySelector('#branch-admin-form button[type="submit"]');
  if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> 수정 내용 저장하기`;
  const delBtn = document.getElementById('branch-delete-btn');
  if (delBtn) delBtn.style.display = 'flex';
  
  showModalClean('branch-admin-modal');
}

function closeBranchAdminModal() {
  editingItemId = null;
  hideModalClean('branch-admin-modal');
}

async function deleteMasterActivity() {
  if (!editingItemId) return;
  if (!confirm("정말 이 활동 및 회계 내역을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;

  galleryItems = galleryItems.filter(g => g.id !== editingItemId);
  accountingItems = accountingItems.filter(a => a.id !== editingItemId);
  localStorage.setItem('kifa_gallery', JSON.stringify(galleryItems));
  localStorage.setItem('kifa_accounting', JSON.stringify(accountingItems));
  
  await syncOrgDataToServer();
  renderGalleryGrid('all');
  renderAccountingList();
  closeAdminModal();
  alert("해당 활동 및 회계 내역이 성공적으로 삭제되었습니다.");
}

async function deleteBranchActivity() {
  if (!editingItemId) return;
  if (!confirm("정말 이 지회 행사 내역을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;

  galleryItems = galleryItems.filter(g => g.id !== editingItemId);
  localStorage.setItem('kifa_gallery', JSON.stringify(galleryItems));
  
  await syncOrgDataToServer();
  renderGalleryGrid('all');
  closeBranchAdminModal();
  alert("해당 지회 행사 내역이 성공적으로 삭제되었습니다.");
}

function resizeImage(file, maxWidth = 800, maxHeight = 800) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderImagePreviews(containerId, imagesArr, mainIdx, type) {
  const box = document.getElementById(containerId);
  const placeholderId = type === 'master' ? 'img-preview-placeholder' : 'branch-img-preview-placeholder';
  
  if (imagesArr.length === 0) {
    box.innerHTML = `<span id="${placeholderId}">선택된 사진 미리보기 (클릭하여 대표사진 변경, X를 눌러 삭제)</span>`;
    return;
  }
  
  box.innerHTML = '';
  imagesArr.forEach((imgSrc, idx) => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = '80px';
    wrapper.style.height = '80px';
    wrapper.style.cursor = 'pointer';
    wrapper.style.border = idx === mainIdx ? '3px solid #0284C7' : '1px solid #CBD5E1';
    wrapper.style.borderRadius = '6px';
    wrapper.style.overflow = 'hidden';
    
    const imgEl = document.createElement('img');
    imgEl.src = imgSrc;
    imgEl.style.width = '100%';
    imgEl.style.height = '100%';
    imgEl.style.objectFit = 'cover';
    imgEl.onclick = () => setMainImage(idx, type);
    
    if (idx === mainIdx) {
      const badge = document.createElement('div');
      badge.textContent = '대표';
      badge.style.position = 'absolute';
      badge.style.bottom = '0';
      badge.style.left = '0';
      badge.style.width = '100%';
      badge.style.background = 'rgba(2, 132, 199, 0.8)';
      badge.style.color = '#FFF';
      badge.style.fontSize = '0.65rem';
      badge.style.fontWeight = 'bold';
      badge.style.textAlign = 'center';
      wrapper.appendChild(badge);
    }
    
    const delBtn = document.createElement('div');
    delBtn.innerHTML = '&times;';
    delBtn.style.position = 'absolute';
    delBtn.style.top = '2px';
    delBtn.style.right = '2px';
    delBtn.style.background = 'rgba(220, 38, 38, 0.8)';
    delBtn.style.color = '#FFF';
    delBtn.style.width = '18px';
    delBtn.style.height = '18px';
    delBtn.style.borderRadius = '50%';
    delBtn.style.display = 'flex';
    delBtn.style.alignItems = 'center';
    delBtn.style.justifyContent = 'center';
    delBtn.style.fontSize = '0.75rem';
    delBtn.style.fontWeight = 'bold';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      removeImage(idx, type);
    };
    
    wrapper.appendChild(imgEl);
    wrapper.appendChild(delBtn);
    box.appendChild(wrapper);
  });
}

function setMainImage(idx, type) {
  if (type === 'master') {
    tempMainImageIndex = idx;
    renderImagePreviews('img-preview-box', tempUploadedImages, tempMainImageIndex, 'master');
  } else {
    tempMainBranchImageIndex = idx;
    renderImagePreviews('branch-img-preview-box', tempUploadedBranchImages, tempMainBranchImageIndex, 'branch');
  }
}

function removeImage(idx, type) {
  if (type === 'master') {
    tempUploadedImages.splice(idx, 1);
    if (tempMainImageIndex === idx) tempMainImageIndex = 0;
    else if (tempMainImageIndex > idx) tempMainImageIndex--;
    renderImagePreviews('img-preview-box', tempUploadedImages, tempMainImageIndex, 'master');
  } else {
    tempUploadedBranchImages.splice(idx, 1);
    if (tempMainBranchImageIndex === idx) tempMainBranchImageIndex = 0;
    else if (tempMainBranchImageIndex > idx) tempMainBranchImageIndex--;
    renderImagePreviews('branch-img-preview-box', tempUploadedBranchImages, tempMainBranchImageIndex, 'branch');
  }
}

let tempUploadedImages = [];
let tempMainImageIndex = 0;

async function previewImageFile(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  for (let i = 0; i < files.length; i++) {
    if (tempUploadedImages.length >= 20) {
      alert("최대 20장까지만 업로드 가능합니다.");
      break;
    }
    const resized = await resizeImage(files[i]);
    tempUploadedImages.push(resized);
  }
  
  if (tempMainImageIndex >= tempUploadedImages.length) tempMainImageIndex = 0;
  renderImagePreviews('img-preview-box', tempUploadedImages, tempMainImageIndex, 'master');
}

let tempUploadedBranchImages = [];
let tempMainBranchImageIndex = 0;

async function previewBranchImageFile(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  for (let i = 0; i < files.length; i++) {
    if (tempUploadedBranchImages.length >= 20) {
      alert("최대 20장까지만 업로드 가능합니다.");
      break;
    }
    const resized = await resizeImage(files[i]);
    tempUploadedBranchImages.push(resized);
  }
  
  if (tempMainBranchImageIndex >= tempUploadedBranchImages.length) tempMainBranchImageIndex = 0;
  renderImagePreviews('branch-img-preview-box', tempUploadedBranchImages, tempMainBranchImageIndex, 'branch');
}

async function handleBranchSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('branch-entry-title').value;
  const date = document.getElementById('branch-entry-date').value;
  const region = document.getElementById('branch-entry-region').value;
  const urlInput = document.getElementById('branch-entry-img-url').value;
  const desc = document.getElementById('branch-entry-desc').value;

  const finalImages = tempUploadedBranchImages.length > 0 ? [...tempUploadedBranchImages] : [];
  if (urlInput && finalImages.length === 0) finalImages.push(urlInput);
  const finalImg = finalImages.length > 0 ? finalImages[tempMainBranchImageIndex] || finalImages[0] : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80';

  const targetId = editingItemId || Date.now();

  const galleryEntry = {
    id: targetId,
    title: title,
    date: date,
    category: 'branch',
    categoryName: '지부활동',
    location: `${region} 사무실 및 현장 수계`,
    participants: `${region} 회원 어업인`,
    image: finalImg,
    images: finalImages,
    summary: desc.substring(0, 60),
    agenda: [
      `${title} 현장 개최 안내`,
      `${region} 어가 현장 애로사항 청취 및 활동 지원`
    ],
    accountingBreakdown: [],
    content: `<p style="line-height: 1.75; color: #334155;">${desc}</p>`
  };

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        editingItemId: editingItemId,
        galleryEntry: galleryEntry,
        accountingEntry: null
      })
    });

    if (res.ok) {
      const result = await res.json();
      galleryItems = result.db.gallery;
      accountingItems = result.db.accounting;
      renderGalleryGrid('all');
      renderAccountingList();
      closeBranchAdminModal();
      document.getElementById('branch-admin-form').reset();
      tempUploadedBranchImages = [];
      tempMainBranchImageIndex = 0;
      renderImagePreviews('branch-img-preview-box', tempUploadedBranchImages, tempMainBranchImageIndex, 'branch');
      alert(`[지회 행사 등록 완료]\n'${title}' (${date})\n\n※ 지회 행사는 연합회 회계 결산에 반영되지 않으며, [지부활동] 갤러리 동향에만 게시되었습니다.`);
      return;
    }
  } catch (err) {
    console.log('Error submitting branch activity:', err);
  }

  galleryItems.push(galleryEntry);
  localStorage.setItem('kifa_gallery', JSON.stringify(galleryItems));
  renderGalleryGrid('all');
  renderAccountingList();
  closeBranchAdminModal();
  alert(`[지회 행사 등록 완료]\n'${title}' (${date}) 내역이 등록되었습니다.`);
}

async function handleUnifiedSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('entry-title').value;
  const date = document.getElementById('entry-date').value;
  const category = document.getElementById('entry-category').value;
  const urlInput = document.getElementById('entry-img-url').value;
  const desc = document.getElementById('entry-desc').value;

  const categoryMap = { field: '현장활동 및 교육', meeting: '총회/이사회', branch: '지부활동' };
  
  const finalImages = tempUploadedImages.length > 0 ? [...tempUploadedImages] : [];
  if (urlInput && finalImages.length === 0) finalImages.push(urlInput);
  const finalImg = finalImages.length > 0 ? finalImages[tempMainImageIndex] || finalImages[0] : 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80';

  let breakdown = [];
  let incomeSummaryList = [];
  let expenseSummaryList = [];

  const incNames = document.querySelectorAll('.inc-name-input');
  const incAmounts = document.querySelectorAll('.inc-amount-input');
  incNames.forEach((input, idx) => {
    const name = input.value.trim();
    const amt = incAmounts[idx] ? incAmounts[idx].value.trim() : '';
    if (name || amt) {
      breakdown.push({ item: name || '수입 금액', type: '수입', amount: amt || '-', note: '입금 완료' });
      if (amt) incomeSummaryList.push(`${name ? name + ': ' : ''}${amt}`);
    }
  });

  const expNames = document.querySelectorAll('.exp-name-input');
  const expAmounts = document.querySelectorAll('.exp-amount-input');
  expNames.forEach((input, idx) => {
    const name = input.value.trim();
    const amt = expAmounts[idx] ? expAmounts[idx].value.trim() : '';
    if (name || amt) {
      breakdown.push({ item: name || '지출/집행비', type: '지출', amount: amt || '-', note: '집행 완료' });
      if (amt) expenseSummaryList.push(`${name ? name + ': ' : ''}${amt}`);
    }
  });

  const targetId = editingItemId || Date.now();

  const galleryEntry = {
    id: targetId,
    title: title,
    date: date,
    category: category,
    categoryName: categoryMap[category] || '현장활동 및 교육',
    location: '사단법인 연합회 대회의실 및 현장',
    participants: '전국 지회장 및 회원 어업인',
    image: finalImg,
    images: finalImages,
    summary: desc.substring(0, 60),
    agenda: [
      `${title} 관련 주요 추진 성과`,
      `해당 날짜(${date}) 예산 집행 및 수입/지출 내역`
    ],
    accountingBreakdown: breakdown,
    content: `<p style="line-height: 1.75; color: #334155;">${desc}</p>`
  };

  const accountingEntry = {
    id: targetId,
    title: title,
    date: date,
    income: incomeSummaryList.join(', ') || '-',
    expense: expenseSummaryList.join(', ') || '-',
    fileType: 'PDF',
    fileSize: '집행서식.pdf',
    desc: desc,
    image: finalImg,
    accountingBreakdown: breakdown
  };

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        editingItemId: editingItemId,
        galleryEntry: galleryEntry,
        accountingEntry: accountingEntry
      })
    });

    if (res.ok) {
      const result = await res.json();
      galleryItems = result.db.gallery;
      accountingItems = result.db.accounting;
      renderGalleryGrid('all');
      renderAccountingList();
      closeAdminModal();
      document.getElementById('unified-admin-form').reset();
      tempUploadedImages = [];
      tempMainImageIndex = 0;
      renderImagePreviews('img-preview-box', tempUploadedImages, tempMainImageIndex, 'master');
      editingItemId = null;

      alert(`[서버 실시간 저장 완료]\n'${title}' (${date})\n\n연합회 활동 및 수입/지출 결산 회계가 동시 반영되었습니다!`);
      return;
    }
  } catch (err) {
    console.log('Error submitting to server:', err);
  }

  if (editingItemId) {
    const galleryIdx = galleryItems.findIndex(i => i.id === editingItemId);
    if (galleryIdx !== -1) galleryItems[galleryIdx] = galleryEntry;
    const accIdx = accountingItems.findIndex(i => i.id === editingItemId);
    if (accIdx !== -1) accountingItems[accIdx] = accountingEntry;
  } else {
    galleryItems.push(galleryEntry);
    accountingItems.push(accountingEntry);
  }

  localStorage.setItem('kifa_gallery', JSON.stringify(galleryItems));
  localStorage.setItem('kifa_accounting', JSON.stringify(accountingItems));
  renderGalleryGrid('all');
  renderAccountingList();
  closeAdminModal();
  document.getElementById('unified-admin-form').reset();
  tempUploadedImages = [];
  tempMainImageIndex = 0;
  renderImagePreviews('img-preview-box', tempUploadedImages, tempMainImageIndex, 'master');
  editingItemId = null;

  alert(`[등록 완료]\n'${title}' (${date}) 내역이 등록되었습니다!`);
}

async function handleInquirySubmit(e) {
  e.preventDefault();
  const name = document.getElementById('form-name').value.trim();
  const phone = document.getElementById('form-phone').value.trim();
  const region = document.getElementById('form-region').value.trim();
  const content = document.querySelector('#inquiry-form textarea').value.trim();
  
  if (!name || !phone || !region || !content) {
    alert('모든 필수 항목을 입력해 주세요.');
    return;
  }

  const payload = { name, phone, region, content };
  try {
    const res = await fetch('/api/submit-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert(`[접수 완료]\n\n${name} 님의 문의가 사무국으로 정상적으로 전달되었습니다.\n(입력 연락처: ${phone})`);
      document.getElementById('inquiry-form').reset();
      
      const data = await res.json();
      if (data.newInquiry) inquiriesList.unshift(data.newInquiry);
    } else {
      alert('접수 중 오류가 발생했습니다.');
    }
  } catch (err) {
    alert('서버와 통신 중 오류가 발생했습니다.');
  }
}

function openInquiryListModal() {
  hideModalClean('master-dashboard-modal');
  renderInquiryList();
  showModalClean('inquiry-list-modal');
}

function renderInquiryList() {
  const container = document.getElementById('inquiry-list-container');
  if (!container) return;
  
  if (!inquiriesList || inquiriesList.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748B;">접수된 문의 내역이 없습니다.</div>';
    return;
  }
  
  container.innerHTML = inquiriesList.map(inq => `
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; position: relative;">
      <button onclick="deleteInquiry('${inq.id}')" style="position: absolute; top: 16px; right: 16px; background: #EF4444; color: #FFF; border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 0.8rem;" title="삭제"><i class="fa-solid fa-trash"></i></button>
      <div style="font-size: 0.85rem; color: #64748B; margin-bottom: 8px;">
        <span style="background: #E2E8F0; padding: 2px 8px; border-radius: 4px; margin-right: 6px; font-weight: bold;">${inq.region}</span>
        <span>접수일: ${inq.date}</span>
      </div>
      <div style="margin-bottom: 12px; font-weight: bold; color: #0F172A;">
        <i class="fa-solid fa-user"></i> ${inq.name} &nbsp; <i class="fa-solid fa-phone" style="margin-left: 8px;"></i> ${inq.phone}
      </div>
      <div style="background: #FFF; border: 1px solid #CBD5E1; border-radius: 8px; padding: 12px; font-size: 0.95rem; color: #334155; white-space: pre-wrap; line-height: 1.5;">${inq.content}</div>
    </div>
  `).join('');
}

async function deleteInquiry(id) {
  if (!confirm('이 문의 내역을 정말 삭제하시겠습니까?')) return;
  try {
    const res = await fetch('/api/delete-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      inquiriesList = inquiriesList.filter(i => i.id !== id);
      renderInquiryList();
    } else {
      alert('삭제 중 오류가 발생했습니다.');
    }
  } catch (err) {
    alert('삭제 통신 오류');
  }
}


// ==========================================
// 👤 INDIVIDUAL OFFICER EDIT MODAL LOGIC (개인별 팝업 관리)
// ==========================================
let uploadedIndivOfficerImageBase64 = null;

function openIndividualOfficerModal(idx, type) {
  const currentList = (type === 'board') ? boardList : delegateList;
  const officer = currentList[idx];
  if (!officer) return;

  uploadedIndivOfficerImageBase64 = null;
  document.getElementById('indiv-officer-idx').value = idx;
  document.getElementById('indiv-officer-type').value = type;

  // Title & badge
  document.getElementById('indiv-officer-title').innerHTML = `👤 [${officer.name}] 인적사항 및 직책 관리`;
  document.getElementById('indiv-officer-badge').textContent = type === 'board' ? '🏛️ 중앙 이사회 명단' : '👥 대의원회 명단';
  document.getElementById('indiv-officer-group-type').value = type;

  // Populate branch select options
  const branchSelect = document.getElementById('indiv-officer-branch-select');
  const branches = Array.isArray(branchOrgList) ? branchOrgList : [];
  let bOptions = '<option value="">소속 지회 없음 (중앙 전용)</option>';
  branches.forEach(b => {
    const cleanBName = (b.name || '').replace(/^(\d+\.\s*|🏛️\s*)/, '').trim();
    bOptions += `<option value="${b.id}">🏛️ ${cleanBName}</option>`;
  });
  if (branchSelect) {
    branchSelect.innerHTML = bOptions;
    if (officer.branchId) {
      branchSelect.value = officer.branchId;
    } else if (officer.branchName) {
      const found = branches.find(b => b.name && b.name.includes(officer.branchName.replace(/^🏛️\s*/, '').trim()));
      if (found) branchSelect.value = found.id;
      else branchSelect.value = "";
    } else {
      branchSelect.value = "";
    }
  }

  // Fields
  document.getElementById('indiv-officer-name').value = officer.name || '';
  document.getElementById('indiv-officer-tag').value = officer.tag || '';
  document.getElementById('indiv-officer-role').value = officer.role || '';
  document.getElementById('indiv-officer-phone').value = officer.phone || '';
  document.getElementById('indiv-officer-region').value = officer.region || '';
  
  if (officer.image && officer.image.startsWith('http')) {
    document.getElementById('indiv-officer-image-url').value = officer.image;
  } else {
    document.getElementById('indiv-officer-image-url').value = '';
    uploadedIndivOfficerImageBase64 = officer.image;
  }
  document.getElementById('indiv-officer-image-file').value = '';

  const modal = document.getElementById('individual-officer-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.style.zIndex = '300050';
    modal.classList.add('active');
    modal.scrollTop = 0;
    const content = modal.querySelector('.modal-content');
    if (content) content.scrollTop = 0;
  }
}
window.openIndividualOfficerModal = openIndividualOfficerModal;

function closeIndividualOfficerModal() {
  const modal = document.getElementById('individual-officer-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
  uploadedIndivOfficerImageBase64 = null;
}
window.closeIndividualOfficerModal = closeIndividualOfficerModal;

function handleIndivGroupTypeChange(newType) {
  const tagInput = document.getElementById('indiv-officer-tag');
  const roleInput = document.getElementById('indiv-officer-role');
  if (newType === 'board') {
    if (tagInput.value.includes('대의원')) tagInput.value = '이사';
    if (roleInput.value.includes('소속 대의원')) roleInput.value = '중앙연합회 이사';
  } else {
    if (!tagInput.value.includes('대의원')) tagInput.value = '지회 대의원';
    if (!roleInput.value.includes('대의원')) roleInput.value = '지회 소속 대의원';
  }
}
window.handleIndivGroupTypeChange = handleIndivGroupTypeChange;

function handleIndivBranchSelect(branchId) {
  const branches = Array.isArray(branchOrgList) ? branchOrgList : [];
  const branch = branches.find(b => String(b.id) === String(branchId));
  if (branch) {
    const cleanName = (branch.name || '').replace(/^(\d+\.\s*|🏛️\s*)/, '').trim();
    const groupType = document.getElementById('indiv-officer-group-type').value;
    const tagInput = document.getElementById('indiv-officer-tag');
    const roleInput = document.getElementById('indiv-officer-role');
    const regionInput = document.getElementById('indiv-officer-region');
    if (groupType === 'delegate') {
      tagInput.value = `${cleanName} 대의원`;
      roleInput.value = `${cleanName} 소속 대의원`;
    } else {
      if (!roleInput.value.includes(cleanName)) {
        roleInput.value = `${roleInput.value || '중앙연합회 ' + tagInput.value} (${cleanName})`;
      }
    }
    if (branch.region) regionInput.value = branch.region;
  }
}
window.handleIndivBranchSelect = handleIndivBranchSelect;

function handleIndivOfficerImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    uploadedIndivOfficerImageBase64 = event.target.result;
  };
  reader.readAsDataURL(file);
}
window.handleIndivOfficerImageUpload = handleIndivOfficerImageUpload;

async function handleIndividualOfficerSubmit(e) {
  e.preventDefault();
  const idx = parseInt(document.getElementById('indiv-officer-idx').value, 10);
  const origType = document.getElementById('indiv-officer-type').value;
  const targetType = document.getElementById('indiv-officer-group-type').value;
  const name = document.getElementById('indiv-officer-name').value.trim();
  const tag = document.getElementById('indiv-officer-tag').value.trim();
  const role = document.getElementById('indiv-officer-role').value.trim();
  const phone = document.getElementById('indiv-officer-phone').value.trim();
  const region = document.getElementById('indiv-officer-region').value.trim();
  const urlInput = document.getElementById('indiv-officer-image-url').value.trim();
  const branchId = document.getElementById('indiv-officer-branch-select').value;

  const branches = Array.isArray(branchOrgList) ? branchOrgList : [];
  const targetBranch = branches.find(b => String(b.id) === String(branchId));
  const branchName = targetBranch ? (targetBranch.name || '').replace(/^(\d+\.\s*|🏛️\s*)/, '').trim() : '';

  if (uploadedIndivOfficerImageBase64 && uploadedIndivOfficerImageBase64.startsWith('data:image')) {
    uploadedIndivOfficerImageBase64 = await uploadToSupabase(uploadedIndivOfficerImageBase64, 'officer');
  }

  const currentList = (origType === 'board') ? boardList : delegateList;
  const origOfficer = (idx >= 0 && currentList[idx]) ? currentList[idx] : {};
  let finalImg = uploadedIndivOfficerImageBase64 || urlInput || origOfficer.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
  uploadedIndivOfficerImageBase64 = null;

  const updatedObj = {
    name, tag, role, phone, region,
    tagClass: targetType === 'board' ? 'tag-director' : 'tag-delegate',
    image: finalImg,
    branchId: branchId || null,
    branchName: branchName || '',
    isBranchLeader: origOfficer.isBranchLeader || false
  };

  if (origType === targetType) {
    if (origType === 'board') {
      boardList[idx] = updatedObj;
    } else {
      delegateList[idx] = updatedObj;
    }
  } else {
    if (origType === 'board') {
      boardList.splice(idx, 1);
      delegateList.push(updatedObj);
    } else {
      delegateList.splice(idx, 1);
      boardList.push(updatedObj);
    }
  }

  if (targetBranch) {
    if (!Array.isArray(targetBranch.delegates)) targetBranch.delegates = [];
    const cleanDName = name.replace(/(대의원|감사|이사|부회장)/g, '').trim();
    const dIdx = targetBranch.delegates.findIndex(d => d.name.includes(cleanDName));
    const roleSuffix = targetType === 'board' ? (tag || '임원') : '대의원';
    const delItem = { name: `${cleanDName} ${roleSuffix}`, phone: phone || '', role: roleSuffix, cleanName: cleanDName };
    if (dIdx !== -1) {
      targetBranch.delegates[dIdx] = delItem;
    } else {
      targetBranch.delegates.push(delItem);
    }
  }

  syncOrgDataToServer();
  renderOfficerManageList();
  renderBranchCards();
  filterDirectory(targetType);
  closeIndividualOfficerModal();
  alert(`[수정 완료]\n'${name}' 님의 인적사항 및 직책이 성공적으로 반영되었습니다.`);
}
window.handleIndividualOfficerSubmit = handleIndividualOfficerSubmit;

function moveIndivOfficer(dir) {
  const idx = parseInt(document.getElementById('indiv-officer-idx').value, 10);
  const type = document.getElementById('indiv-officer-type').value;
  const list = type === 'board' ? boardList : delegateList;
  if (dir === 'up') {
    if (idx <= 0) return alert('이미 가장 첫 번째 순서입니다.');
    const temp = list[idx - 1];
    list[idx - 1] = list[idx];
    list[idx] = temp;
    document.getElementById('indiv-officer-idx').value = idx - 1;
  } else {
    if (idx >= list.length - 1) return alert('이미 가장 마지막 순서입니다.');
    const temp = list[idx + 1];
    list[idx + 1] = list[idx];
    list[idx] = temp;
    document.getElementById('indiv-officer-idx').value = idx + 1;
  }
  syncOrgDataToServer();
  renderOfficerManageList();
  filterDirectory(type);
}
window.moveIndivOfficer = moveIndivOfficer;

function deleteIndivOfficer() {
  const idx = parseInt(document.getElementById('indiv-officer-idx').value, 10);
  const type = document.getElementById('indiv-officer-type').value;
  const name = document.getElementById('indiv-officer-name').value;
  if (!confirm(`정말 '${name}' 님을 명부에서 삭제하시겠습니까?`)) return;
  deleteOfficer(idx, type);
  closeIndividualOfficerModal();
}
window.deleteIndivOfficer = deleteIndivOfficer;

window.onclick = function(event) {
  const detailModal = document.getElementById('detail-modal');
  const adminModal = document.getElementById('admin-modal');
  const branchAdminModal = document.getElementById('branch-admin-modal');
  const aboutModal = document.getElementById('about-modal');
  const noticeModal = document.getElementById('notice-modal');
  const welcomeModal = document.getElementById('welcome-notice-modal');
  const loginModal = document.getElementById('login-modal');
  const signupModal = document.getElementById('signup-modal');
  const masterApprovalModal = document.getElementById('master-approval-modal');
  const committeeModal = document.getElementById('committee-modal');
  const addCommitteeModal = document.getElementById('add-committee-modal');
  const branchListModal = document.getElementById('branch-list-modal');
  const addBranchModal = document.getElementById('add-branch-modal');
  const indivOfficerModal = document.getElementById('individual-officer-modal');
  const addOfficerModal = document.getElementById('add-officer-modal');
  const pastNoticeEditModal = document.getElementById('past-notice-edit-modal');
  const noticeEditModal = document.getElementById('notice-edit-modal');

  if (event.target === indivOfficerModal) closeIndividualOfficerModal();
  if (event.target === addOfficerModal) closeAddOfficerModal();
  if (event.target === pastNoticeEditModal) closePastNoticeEditModal();
  if (event.target === noticeEditModal) closeNoticeEditModal();

  if (event.target === detailModal) closeModal();
  if (event.target === adminModal) closeAdminModal();
  if (event.target === branchAdminModal) closeBranchAdminModal();
  if (event.target === aboutModal) closeAboutModal();
  if (event.target === noticeModal) closeNoticeModalFull();
  if (event.target === welcomeModal) closeWelcomeNotice();
  if (event.target === loginModal) closeLoginModal();
  if (event.target === signupModal) closeSignupModal();
  if (event.target === masterApprovalModal) closeMasterApprovalModal();
  if (event.target === committeeModal) closeCommitteeModal();
  if (event.target === addCommitteeModal) closeAddCommitteeModal();
  if (event.target === branchListModal) closeBranchListModal();
  if (event.target === addBranchModal) closeAddBranchModal();
};

document.addEventListener('DOMContentLoaded', () => {
  updateHeaderUserStatus();
  loadServerData();
  filterDirectory('board');
});
updateHeaderUserStatus();

let editingPastNoticeId = null;

function renderPastNotices() {
  const container = document.getElementById('past-notices-list-container');
  if (!container) return;
  const user = getCurrentUser();
  const isMaster = user && user.role === 'master';

  pastNotices.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  
  if (pastNotices.length > 0) {
    const latest = pastNotices[0];
    const mainItem = document.getElementById('main-new-notice-item');
    if (mainItem) {
      const escapedTitle = (latest.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const escapedDate = (latest.date || '').replace(/'/g, "\\'");
      const escapedContent = (latest.content || '').replace(/\n/g, '<br>').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      
      mainItem.setAttribute('onclick', 'openNoticeModal(\'' + escapedTitle + '\', \'' + escapedDate + '\', \'' + escapedContent + '\')');
      mainItem.innerHTML = '<span class="notice-tag tag-new">NEW</span>' +
        '<div class="notice-info-wrap">' +
          '<span class="notice-title-text">' + latest.title + '</span>' +
          '<span class="notice-date-text"><i class="fa-regular fa-calendar"></i> ' + latest.date + ' (최신 공지)</span>' +
        '</div>' +
        '<span class="notice-arrow">&rarr;</span>';
    }
  }

  container.innerHTML = '';
  pastNotices.forEach((notice, index) => {
    let li = document.createElement('li');
    li.style.position = 'relative';
    
    let html = '<div style="flex:1" onclick="openNoticeModal(\'' + (notice.title || '').replace(/'/g, "\\'") + '\', \'' + (notice.date || '').replace(/'/g, "\\'") + '\', \'' + (notice.content || '').replace(/'/g, "\\'").replace(/\n/g, '<br>') + '\')">' +
        '<span class="notice-tag" style="background: #0284C7;">' + notice.tag + '</span>' +
        '<div class="notice-info-wrap">' +
          '<span class="notice-title-text">' + notice.title + '</span>' +
          '<span class="notice-date-text"><i class="fa-regular fa-calendar"></i> ' + notice.date + '</span>' +
        '</div>' +
        '<span class="notice-arrow">&rarr;</span>' +
      '</div>';

    if (isMaster) {
      html += '<div style="display:flex; gap:5px; margin-left: 10px; z-index: 10;">' +
        '<button onclick="openPastNoticeEditModal(' + notice.id + ', event)" style="background:#F59E0B; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">수정</button>' +
        '<button onclick="deletePastNotice(' + notice.id + ', event)" style="background:#EF4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">삭제</button>' +
      '</div>';
    }
    
    li.innerHTML = html;
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    container.appendChild(li);
  });
}
function openPastNoticeEditModal(id = null, e = null) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  editingPastNoticeId = id;
  const isPopupCheckbox = document.getElementById('edit-past-notice-is-popup');
  const titleEl = document.getElementById('past-notice-modal-title');

  if (id !== null) {
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> 공지사항 수정';
    const notice = pastNotices.find(n => n.id === id);
    if (notice) {
      document.getElementById('edit-past-notice-title').value = notice.title || '';
      document.getElementById('edit-past-notice-date').value = (notice.date || '').replace(/\./g, '-');
      document.getElementById('edit-past-notice-tag').value = notice.tag || '';
      document.getElementById('edit-past-notice-content').value = notice.content || '';
      if (isPopupCheckbox) isPopupCheckbox.checked = !!notice.isPopup;
    }
  } else {
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-bullhorn"></i> 📢 신규 공지사항 등록 / 작성';
    document.getElementById('edit-past-notice-title').value = '';
    const today = new Date();
    document.getElementById('edit-past-notice-date').value = today.toISOString().slice(0, 10);
    document.getElementById('edit-past-notice-tag').value = '이사회 공지';
    document.getElementById('edit-past-notice-content').value = '';
    if (isPopupCheckbox) isPopupCheckbox.checked = true;
  }

  const modal = document.getElementById('past-notice-edit-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.style.zIndex = '300050';
    modal.classList.add('active');
    modal.scrollTop = 0;
    const content = modal.querySelector('.modal-content');
    if (content) content.scrollTop = 0;
  }
}
window.openPastNoticeEditModal = openPastNoticeEditModal;

function closePastNoticeEditModal() {
  const modal = document.getElementById('past-notice-edit-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
  editingPastNoticeId = null;
}
window.closePastNoticeEditModal = closePastNoticeEditModal;

async function savePastNoticeData() {
  const title = document.getElementById('edit-past-notice-title').value.trim();
  const date = document.getElementById('edit-past-notice-date').value.trim().replace(/-/g, '.');
  const tag = document.getElementById('edit-past-notice-tag').value.trim();
  const content = document.getElementById('edit-past-notice-content').value.trim();
  const isPopupCheckbox = document.getElementById('edit-past-notice-is-popup');
  const isPopup = isPopupCheckbox ? isPopupCheckbox.checked : false;

  if (!title || !date || !tag || !content) {
    alert("모든 항목을 입력해주세요.");
    return;
  }

  if (editingPastNoticeId !== null) {
    const notice = pastNotices.find(n => n.id === editingPastNoticeId);
    if (notice) {
      notice.title = title;
      notice.date = date;
      notice.tag = tag;
      notice.content = content;
      notice.isPopup = isPopup;
    }
  } else {
    pastNotices.unshift({
      id: Date.now(),
      title: title,
      date: date,
      tag: tag,
      content: content,
      isPopup: isPopup
    });
  }

  renderPastNotices();
  closePastNoticeEditModal();
  
  pastNotices.forEach(n => {
    localStorage.removeItem('kifa_hide_notice_' + n.id);
  });
  
  try {
    await fetch('/api/save-org-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pastNotices: pastNotices })
    });
    checkAutoWelcomeNotice();
    alert("📢 공지사항이 성공적으로 등록되었습니다!\n홈페이지 팝업 및 공지사항 목록에 즉시 반영되었습니다.");
  } catch (err) {
    console.log("Error:", err);
  }
}
window.savePastNoticeData = savePastNoticeData;

async function deletePastNotice(id, e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  if (confirm("정말 삭제하시겠습니까?")) {
    pastNotices = pastNotices.filter(n => n.id !== id);
    renderPastNotices();
    try {
      await fetch('/api/save-org-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pastNotices: pastNotices })
      });
    } catch(err) {
      console.log(err);
    }
  }
}

// --- Contact Info & Settings ---
function renderContactInfo() {
  const pList = document.querySelectorAll('.info-list .info-item p');
  if (pList && pList.length >= 3) {
    pList[0].innerText = contactInfo.address || '충북 단양';
    pList[1].innerText = 'Tel: ' + (contactInfo.tel || '010-5468-3208') + (contactInfo.fax ? ' | Fax: ' + contactInfo.fax : '');
    pList[2].innerText = contactInfo.email || 'dhkgreen@naver.com';
  }
  const headerTel = document.getElementById('header-contact-tel');
  if (headerTel) {
    headerTel.innerText = contactInfo.tel || '010-5468-3208';
  }

  // Footer dynamic rendering
  const footerBizNum = document.getElementById('footer-biznum');
  const footerPresident = document.getElementById('footer-president');
  const footerAddress = document.getElementById('footer-address');

  if (footerBizNum) {
    footerBizNum.innerText = contactInfo.bizNum || '등록 대기중';
  }
  if (footerPresident) {
    footerPresident.innerText = contactInfo.president || (presidentGreeting && presidentGreeting.name) || '이재완';
  }
  if (footerAddress) {
    footerAddress.innerText = contactInfo.address || '충북 단양';
  }

  const footerAdminWrap = document.getElementById('footer-admin-btn-wrap');
  const user = getCurrentUser();
  if (footerAdminWrap) {
    if (user && user.role === 'master') {
      footerAdminWrap.innerHTML = `
        <button type="button" onclick="openContactSettingsModal()" style="background: rgba(255,255,255,0.12); color: #BAE6FD; border: 1px solid rgba(255,255,255,0.25); padding: 5px 14px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">
          <i class="fa-solid fa-gear"></i> 고유번호 / 대표자 / 주소 정보 변경
        </button>
      `;
    } else {
      footerAdminWrap.innerHTML = '';
    }
  }
}

function insertMasterContactSettingsButton() {
  const masterModal = document.getElementById('master-dashboard-modal');
  if (!masterModal) return;
  const container = masterModal.querySelector('.modal-content > div:nth-child(3)');
  if (!container || container.querySelector('#btn-contact-settings')) return;
  const btn = document.createElement('button');
  btn.id = 'btn-contact-settings';
  btn.type = 'button';
  btn.onclick = openContactSettingsModal;
  btn.style.cssText = 'background: #8B5CF6; color: #FFF; border: none; padding: 16px; border-radius: 12px; font-size: 1.05rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px;';
  btn.innerHTML = '<i class="fa-solid fa-address-book"></i> 기본 연락처 및 고유번호/주소 변경';
  container.appendChild(btn);

    if (!container.querySelector('#btn-president-settings')) {
      const btn2 = document.createElement('button');
      btn2.id = 'btn-president-settings';
      btn2.type = 'button';
      btn2.onclick = openPresidentEditModal;
      btn2.style.cssText = 'background: #0284C7; color: #FFF; border: none; padding: 16px; border-radius: 12px; font-size: 1.05rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px;';
      btn2.innerHTML = '<i class="fa-solid fa-user-tie"></i> 연합회장 인사말 및 프로필 설정';
      container.appendChild(btn2);
    }
}

function openContactSettingsModal() {
  hideModalClean('master-dashboard-modal');
  
  let modal = document.getElementById('contact-settings-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'contact-settings-modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; padding: 24px;">
        <button class="modal-close" onclick="hideModalClean('contact-settings-modal')">&times;</button>
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 1.3rem; color: #0A2540; font-weight: 900;"><i class="fa-solid fa-address-book" style="color: #0284C7;"></i> 연합회 고유번호 및 기본 정보 설정</h2>
          <p style="font-size: 0.84rem; color: #64748B; margin-top: 4px;">홈페이지 하단(Footer)에 표시되는 대표자, 고유번호, 주소 및 연락처를 변경합니다.</p>
        </div>
        <form id="contact-settings-form" onsubmit="saveContactSettings(event)">
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; gap: 10px;">
              <div style="flex: 1;">
                <label style="display: block; font-size: 0.84rem; font-weight: 700; color: #334155; margin-bottom: 4px;">대표자 성함 *</label>
                <input type="text" id="contact-edit-president" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 6px;">
              </div>
              <div style="flex: 1;">
                <label style="display: block; font-size: 0.84rem; font-weight: 700; color: #334155; margin-bottom: 4px;">고유번호 (사업자등록번호)</label>
                <input type="text" id="contact-edit-biznum" placeholder="예: 000-00-00000" style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 6px;">
              </div>
            </div>
            <div>
              <label style="display: block; font-size: 0.84rem; font-weight: 700; color: #334155; margin-bottom: 4px;">중앙 사무국 주소 *</label>
              <input type="text" id="contact-edit-address" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 6px;">
            </div>
            <div style="display: flex; gap: 10px;">
              <div style="flex: 1;">
                <label style="display: block; font-size: 0.84rem; font-weight: 700; color: #334155; margin-bottom: 4px;">대표 전화 (Tel) *</label>
                <input type="text" id="contact-edit-tel" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 6px;">
              </div>
              <div style="flex: 1;">
                <label style="display: block; font-size: 0.84rem; font-weight: 700; color: #334155; margin-bottom: 4px;">팩스 (Fax)</label>
                <input type="text" id="contact-edit-fax" placeholder="선택 사항" style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 6px;">
              </div>
            </div>
            <div>
              <label style="display: block; font-size: 0.84rem; font-weight: 700; color: #334155; margin-bottom: 4px;">이메일 문의 *</label>
              <input type="email" id="contact-edit-email" required style="width: 100%; padding: 10px; border: 1px solid #CBD5E1; border-radius: 6px;">
            </div>
          </div>
          <div style="margin-top: 22px; display: flex; gap: 8px; justify-content: flex-end;">
            <button type="button" onclick="hideModalClean('contact-settings-modal')" class="btn" style="background: #E2E8F0; color: #475569;">취소</button>
            <button type="submit" class="btn btn-primary" style="background: #0284C7;"><i class="fa-solid fa-floppy-disk"></i> 저장하기</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  document.getElementById('contact-edit-president').value = contactInfo.president || (presidentGreeting && presidentGreeting.name) || '이재완';
  document.getElementById('contact-edit-biznum').value = contactInfo.bizNum || '';
  document.getElementById('contact-edit-address').value = contactInfo.address || '충북 단양';
  document.getElementById('contact-edit-tel').value = contactInfo.tel || '010-5468-3208';
  document.getElementById('contact-edit-fax').value = contactInfo.fax || '';
  document.getElementById('contact-edit-email').value = contactInfo.email || 'dhkgreen@naver.com';
  
  showModalClean('contact-settings-modal');
}

async function saveContactSettings(e) {
  e.preventDefault();
  contactInfo.president = document.getElementById('contact-edit-president').value.trim() || '이재완';
  contactInfo.bizNum = document.getElementById('contact-edit-biznum').value.trim();
  contactInfo.address = document.getElementById('contact-edit-address').value.trim();
  contactInfo.tel = document.getElementById('contact-edit-tel').value.trim();
  contactInfo.fax = document.getElementById('contact-edit-fax').value.trim();
  contactInfo.email = document.getElementById('contact-edit-email').value.trim();
  localStorage.setItem('kifa_contact_info', JSON.stringify(contactInfo));
  
  renderContactInfo();
  hideModalClean('contact-settings-modal');
  
  try {
    await fetch('/api/save-org-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactInfo: contactInfo })
    });
    alert('연합회 고유번호, 대표자, 주소 및 연락처 정보가 성공적으로 저장되었습니다.');
  } catch (err) {
    console.log(err);
  }
}

// --- Officer Reordering Functions ---
function moveOfficerUp(idx, type) {
  if (idx <= 0) return;
  const currentList = (type === 'board') ? boardList : delegateList;
  const temp = currentList[idx - 1];
  currentList[idx - 1] = currentList[idx];
  currentList[idx] = temp;
  syncOrgDataToServer();
  renderOfficerManageList();
  filterDirectory(type);
}

function moveOfficerDown(idx, type) {
  const currentList = (type === 'board') ? boardList : delegateList;
  if (idx >= currentList.length - 1) return;
  const temp = currentList[idx + 1];
  currentList[idx + 1] = currentList[idx];
  currentList[idx] = temp;
  syncOrgDataToServer();
  renderOfficerManageList();
  filterDirectory(type);
}

function closeAddBranchModal() {
  hideModalClean('add-branch-modal');
}

// --- Dynamic Branch Member / Delegate Input Functions ---
function addDelegateRow(name = '', phone = '', role = '대의원') {
  const container = document.getElementById('dynamic-delegates-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'delegate-row';
  row.style = 'display: flex; gap: 8px; margin-bottom: 8px; align-items: center; flex-wrap: wrap;';

  let cleanName = (name || '').trim();
  let selectedRole = role || '대의원';
  if (cleanName.includes('대의원')) {
    cleanName = cleanName.replace('대의원', '').trim();
    selectedRole = '대의원';
  } else if (cleanName.includes('감사')) {
    cleanName = cleanName.replace('감사', '').trim();
    selectedRole = '감사';
  } else if (cleanName.includes('이사')) {
    cleanName = cleanName.replace('이사', '').trim();
    selectedRole = '이사';
  } else if (cleanName.includes('부회장')) {
    cleanName = cleanName.replace('부회장', '').trim();
    selectedRole = '부회장';
  }

  row.innerHTML = `
    <select class="del-role" style="padding: 9px 6px; border: 1px solid #7DD3FC; border-radius: 6px; background: #F0F9FF; font-weight: 800; font-size: 0.82rem; color: #0284C7; width: 95px; flex-shrink: 0;">
      <option value="대의원" ${selectedRole === '대의원' ? 'selected' : ''}>👥 대의원</option>
      <option value="감사" ${selectedRole === '감사' ? 'selected' : ''}>⚖️ 감사</option>
      <option value="이사" ${selectedRole === '이사' ? 'selected' : ''}>🏛️ 이사</option>
      <option value="부회장" ${selectedRole === '부회장' ? 'selected' : ''}>✨ 부회장</option>
    </select>
    <input type="text" class="del-name" placeholder="성함 (예: 홍길동)" value="${cleanName}" style="flex: 1; min-width: 90px; padding: 9px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.84rem;">
    <input type="text" class="del-phone" placeholder="연락처" value="${phone}" style="flex: 1.2; min-width: 120px; padding: 9px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 0.84rem;">
    <button type="button" onclick="this.parentElement.remove()" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; padding: 9px 12px; border-radius: 6px; cursor: pointer; font-weight: 800;"><i class="fa-solid fa-xmark"></i></button>
  `;
  container.appendChild(row);
}

async function deleteUser(userId) {
  if (!confirm(`아이디 '${userId}' 의 계정 권한을 정말 삭제하시겠습니까?\n삭제 시 해당 아이디로는 더 이상 로그인할 수 없습니다.`)) return;
  
  try {
    const res = await fetch('/api/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    if (res.ok) {
      alert(`아이디 '${userId}' 계정이 성공적으로 삭제되었습니다.`);
      const data = await res.json();
      if (data.usersList) usersList = data.usersList;
      else usersList = usersList.filter(u => u.id !== userId);
      renderMasterApprovalList();
    } else {
      const err = await res.json();
      alert('오류 발생: ' + err.error);
    }
  } catch (e) {
    alert('서버와 통신하는 중 오류가 발생했습니다.');
  }
}

async function deleteApprovedUser(userId) {
  if (!confirm('아이디 ' + userId + ' 의 계정 권한을 정말 삭제하시겠습니까?\n삭제 시 해당 아이디로는 더 이상 로그인할 수 없습니다.')) return;
  
  try {
    const res = await fetch('/api/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId })
    });
    
    if (res.ok) {
      alert('아이디 ' + userId + ' 계정이 성공적으로 삭제되었습니다.');
      const data = await res.json();
      if (data.db && data.db.users) usersList = data.db.users;
      else usersList = usersList.filter(u => u.id !== userId);
      renderMasterApprovalList();
    } else {
      const err = await res.json();
      alert('오류 발생: ' + err.error);
    }
  } catch (e) {
    alert('서버와 통신하는 중 오류가 발생했습니다.');
  }
}


// Explicitly expose functions to window scope for inline onclick handlers
window.openPresidentEditModal = openPresidentEditModal;
window.closePresidentEditModal = closePresidentEditModal;
window.savePresidentGreetingData = savePresidentGreetingData;
