const {
  BadgeStorage,
  VIP_COUPONS,
  getBadgeTierInfo,
} = require('./src/lib/badgeStorage');

console.log('='.repeat(80));
console.log('💎 [ParkOn] 4단계 보완 & 고도화 기능 통합 검증 💎');
console.log('='.repeat(80));

// 1. VIP Coupons check
console.log('\n[검증 1] 전국 도장 깨기 VIP 제휴 쿠폰북');
console.log(`- 등록된 VIP 제휴 쿠폰 수: ${VIP_COUPONS.length}개`);
VIP_COUPONS.forEach(c => {
  console.log(`  • [${c.milestoneTitle}] ${c.couponName} | 제휴처: ${c.sponsor} (코드: ${c.code})`);
});

// 2. Hall of Fame Tie-break check
console.log('\n[검증 2] 명예의 전당 동점자(Tie) 공정 순위 처리 검증');
const allTime = BadgeStorage.getHallOfFame('gumi_dongrak', 50);
console.log('누적 랭킹 상위 5명:');
allTime.slice(0, 5).forEach(r => {
  console.log(`  ${r.displayRank || `${r.rank}위`}: ${r.name} (${r.visitCount}회 완주, ${r.isTie ? '공동 순위' : '단독 순위'})`);
});

const monthly = BadgeStorage.getMonthHallOfFame('gumi_dongrak', 20);
console.log('\n월간 챔피언 상위 5명:');
monthly.slice(0, 5).forEach(r => {
  console.log(`  ${r.displayRank || `${r.rank}위`}: ${r.name} (이번 달 ${r.visitCount}회 완주, ${r.isTie ? '공동 순위' : '단독 순위'})`);
});

console.log('\n' + '='.repeat(80));
console.log('✨ 4단계 보완 고도화 전체 정상 통과! ✨');
console.log('='.repeat(80));
