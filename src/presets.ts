export type GearCategory = 'tent' | 'tarp' | 'vehicle' | 'fire' | 'furniture' | 'obstacle';
export type GearTab = 'tent' | 'tarp' | 'car' | 'misc';

export interface GearPreset {
  id: string;
  brand: string;
  name: string;
  category: GearCategory;
  widthM: number;
  lengthM: number;
  ropeMarginM: number;
  windLimitMs: number;
  color: string;
  badge: string;
  group?: string; // 목록 안에서 종류별로 거를 때 쓰는 이름
  keywords?: string; // 검색에만 쓰는 비슷한 말
}

export interface PlacedItem extends GearPreset {
  uid: string;
  xM: number;
  yM: number;
  rotation: number;
}

export const GEAR_TAB_LABEL: Record<GearTab, string> = {
  tent: '⛺ 텐트',
  tarp: '⛱️ 타프',
  car: '🚙 차량·화로',
  misc: '🪑 가구·기타',
};

export const tabOf = (category: GearCategory): GearTab =>
  category === 'tent' ? 'tent' : category === 'tarp' ? 'tarp' : category === 'vehicle' || category === 'fire' ? 'car' : 'misc';

// 크기는 제조사 공식 값이 아니라 "바닥에 차지하는 대략적인 넓이"입니다.
// 내 텐트와 다르면 장비 목록 아래 "크기 직접 넣기"로 정확히 입력해 저장할 수 있어요.
export const GEAR_PRESETS: GearPreset[] = [
  // ---------- 텐트: 돔·백패킹 ----------
  { id: 'backpack-2', brand: '일반', name: '백패킹 텐트 (1~2인)', category: 'tent', group: '돔·백패킹', keywords: '솔로 1인 2인 소형 경량 백패킹', widthM: 1.3, lengthM: 2.2, ropeMarginM: 0.5, windLimitMs: 14, color: '#14b8a6', badge: '⛺ 백패킹' },
  { id: 'dome-4', brand: '일반', name: '돔텐트 (3~4인)', category: 'tent', group: '돔·백패킹', keywords: '가족 4인 기본', widthM: 2.4, lengthM: 2.4, ropeMarginM: 0.7, windLimitMs: 12, color: '#0ea5e9', badge: '⛺ 돔텐트' },
  { id: 'naturehike-dome', brand: '네이처하이크', name: '에어 6.3 / 코튼 돔텐트', category: 'tent', group: '돔·백패킹', keywords: '에어 코튼 가족', widthM: 3.0, lengthM: 2.1, ropeMarginM: 0.7, windLimitMs: 12, color: '#38bdf8', badge: '⛺ 돔텐트' },
  { id: 'dome-6', brand: '일반', name: '대형 돔텐트 (5~6인)', category: 'tent', group: '돔·백패킹', keywords: '가족 6인 큰', widthM: 4.0, lengthM: 3.0, ropeMarginM: 0.9, windLimitMs: 12, color: '#0284c7', badge: '⛺ 돔텐트' },

  // ---------- 텐트: 원터치 ----------
  { id: 'popup-3', brand: '일반', name: '원터치 텐트 (3~4인)', category: 'tent', group: '원터치', keywords: '팝업 자동 간편 당일 낚시', widthM: 2.1, lengthM: 2.1, ropeMarginM: 0.4, windLimitMs: 8, color: '#f97316', badge: '⛺ 원터치' },
  { id: 'popup-5', brand: '일반', name: '원터치 대형 (5~6인)', category: 'tent', group: '원터치', keywords: '팝업 자동 간편', widthM: 3.0, lengthM: 2.7, ropeMarginM: 0.5, windLimitMs: 9, color: '#fb923c', badge: '⛺ 원터치' },

  // ---------- 텐트: 터널·거실형 ----------
  { id: 'tunnel-4', brand: '일반', name: '터널형 텐트 (4인)', category: 'tent', group: '터널·거실형', keywords: '2룸 거실 가족 리빙', widthM: 3.0, lengthM: 4.5, ropeMarginM: 0.8, windLimitMs: 12, color: '#22c55e', badge: '⛺ 터널형' },
  { id: 'ergzen-ihwa', brand: '에르젠', name: '이화지작 S5 (리빙쉘)', category: 'tent', group: '터널·거실형', keywords: '리빙쉘 쉘터 이화', widthM: 3.4, lengthM: 5.4, ropeMarginM: 0.9, windLimitMs: 13, color: '#10b981', badge: '⛺ 리빙쉘' },
  { id: 'tunnel-6', brand: '일반', name: '대형 터널형 2룸 (6인)', category: 'tent', group: '터널·거실형', keywords: '2룸 거실 가족 큰', widthM: 3.6, lengthM: 5.8, ropeMarginM: 0.9, windLimitMs: 12, color: '#16a34a', badge: '⛺ 터널형' },
  { id: 'snowpeak-landlock', brand: '스노우피크', name: '랜드록 (대형 리빙쉘)', category: 'tent', group: '터널·거실형', keywords: '리빙쉘 쉘터 스노피', widthM: 4.05, lengthM: 6.25, ropeMarginM: 1.0, windLimitMs: 14, color: '#059669', badge: '⛺ 대형쉘터' },

  // ---------- 텐트: 캐빈 ----------
  { id: 'cabin-5', brand: '일반', name: '캐빈 텐트 (4~5인)', category: 'tent', group: '캐빈형', keywords: '박스 높은 천장 가족 하우스', widthM: 3.0, lengthM: 3.0, ropeMarginM: 0.8, windLimitMs: 11, color: '#8b5cf6', badge: '🏠 캐빈' },
  { id: 'cabin-10', brand: '일반', name: '대형 캐빈 (8~10인)', category: 'tent', group: '캐빈형', keywords: '박스 하우스 단체 큰', widthM: 4.2, lengthM: 4.2, ropeMarginM: 1.0, windLimitMs: 11, color: '#7c3aed', badge: '🏠 캐빈' },

  // ---------- 텐트: 티피·벨 ----------
  { id: 'tipi-4', brand: '일반', name: '티피 텐트 (4인)', category: 'tent', group: '티피·벨', keywords: '원뿔 인디언 감성', widthM: 3.0, lengthM: 3.0, ropeMarginM: 0.8, windLimitMs: 10, color: '#eab308', badge: '🎪 티피' },
  { id: 'tipi-8', brand: '일반', name: '대형 티피 (8인)', category: 'tent', group: '티피·벨', keywords: '원뿔 인디언 큰', widthM: 4.5, lengthM: 4.5, ropeMarginM: 1.0, windLimitMs: 10, color: '#ca8a04', badge: '🎪 티피' },
  { id: 'nordisk-asgard', brand: '노르디스크', name: '아스가르드 12.6 (면 벨텐트)', category: 'tent', group: '티피·벨', keywords: '벨텐트 면 코튼 노르디스크', widthM: 4.0, lengthM: 3.75, ropeMarginM: 1.2, windLimitMs: 15, color: '#d97706', badge: '🎪 벨텐트' },
  { id: 'bell-5m', brand: '일반', name: '벨텐트 5m', category: 'tent', group: '티피·벨', keywords: '면 코튼 큰', widthM: 5.0, lengthM: 4.7, ropeMarginM: 1.3, windLimitMs: 14, color: '#b45309', badge: '🎪 벨텐트' },

  // ---------- 텐트: 쉘터·차박 ----------
  { id: 'shelter-s', brand: '일반', name: '소형 쉘터 (2~3인)', category: 'tent', group: '쉘터·차박', keywords: '그늘막 스크린 간이', widthM: 2.4, lengthM: 2.4, ropeMarginM: 0.6, windLimitMs: 8, color: '#a3e635', badge: '🏕️ 쉘터' },
  { id: 'screen-house', brand: '일반', name: '스크린 쉘터 (4×4m)', category: 'tent', group: '쉘터·차박', keywords: '그늘막 스크린 모기장 거실', widthM: 4.0, lengthM: 4.0, ropeMarginM: 0.9, windLimitMs: 8, color: '#84cc16', badge: '🏕️ 쉘터' },
  { id: 'car-docking', brand: '일반', name: '차박 도킹텐트', category: 'tent', group: '쉘터·차박', keywords: '트렁크 SUV 꼬리 텐트', widthM: 2.4, lengthM: 2.6, ropeMarginM: 0.6, windLimitMs: 10, color: '#64748b', badge: '🚙 도킹' },

  // ---------- 타프 ----------
  { id: 'square-tarp', brand: '일반', name: '스퀘어 타프 (3×3m)', category: 'tarp', group: '타프', keywords: '사각 소형 그늘', widthM: 3.0, lengthM: 3.0, ropeMarginM: 0.9, windLimitMs: 8.5, color: '#fcd34d', badge: '⛱️ 스퀘어타프' },
  { id: 'wing-tarp', brand: '일반', name: '윙 타프 (4.0×3.0m)', category: 'tarp', group: '타프', keywords: '날개 소형 감성', widthM: 4.0, lengthM: 3.0, ropeMarginM: 1.0, windLimitMs: 8, color: '#fb923c', badge: '⛱️ 윙타프' },
  { id: 'recta-tarp-m', brand: '일반', name: '렉타 타프 M (3.6×4.4m)', category: 'tarp', group: '타프', keywords: '렉타 사각', widthM: 3.6, lengthM: 4.4, ropeMarginM: 1.1, windLimitMs: 9, color: '#fbbf24', badge: '⛱️ 렉타타프' },
  { id: 'recta-tarp-l', brand: '스노우피크/범용', name: '렉타 타프 L (4.4×5.5m)', category: 'tarp', group: '타프', keywords: '렉타 사각 스노피', widthM: 4.4, lengthM: 5.5, ropeMarginM: 1.3, windLimitMs: 8.5, color: '#f59e0b', badge: '⛱️ 렉타타프' },
  { id: 'hexa-tarp-m', brand: '코오롱/범용', name: '헥사 타프 M (4.2×4.0m)', category: 'tarp', group: '타프', keywords: '헥사 육각', widthM: 4.2, lengthM: 4.0, ropeMarginM: 1.1, windLimitMs: 10, color: '#eab308', badge: '⛱️ 헥사타프' },
  { id: 'hexa-tarp-l', brand: '일반', name: '헥사 타프 L (4.8×4.4m)', category: 'tarp', group: '타프', keywords: '헥사 육각 큰', widthM: 4.8, lengthM: 4.4, ropeMarginM: 1.2, windLimitMs: 9.5, color: '#facc15', badge: '⛱️ 헥사타프' },
  { id: 'recta-tarp-xl', brand: '일반', name: '대형 렉타 타프 (5.5×5.5m)', category: 'tarp', group: '타프', keywords: '렉타 사각 큰 단체', widthM: 5.5, lengthM: 5.5, ropeMarginM: 1.5, windLimitMs: 8, color: '#f59e0b', badge: '⛱️ 대형타프' },
  { id: 'awning-s', brand: '일반', name: '차량 어닝·소형 쉐이드 (2.5×2.0m)', category: 'tarp', group: '타프', keywords: '그늘막 어닝 차량 도킹', widthM: 2.5, lengthM: 2.0, ropeMarginM: 0.7, windLimitMs: 7, color: '#fde68a', badge: '⛱️ 어닝' },

  // ---------- 차량 ----------
  { id: 'car-small', brand: '일반', name: '경차·소형차', category: 'vehicle', group: '차량', keywords: '모닝 레이 승용차', widthM: 1.7, lengthM: 3.7, ropeMarginM: 0, windLimitMs: 99, color: '#94a3b8', badge: '🚗 소형차' },
  { id: 'car-sedan', brand: '일반', name: '승용차 (세단)', category: 'vehicle', group: '차량', keywords: '쏘나타 그랜저 아반떼', widthM: 1.85, lengthM: 4.8, ropeMarginM: 0, windLimitMs: 99, color: '#94a3b8', badge: '🚗 승용차' },
  { id: 'car-suv', brand: '일반', name: 'SUV (중형)', category: 'vehicle', group: '차량', keywords: '싼타페 쏘렌토 투싼', widthM: 1.9, lengthM: 4.7, ropeMarginM: 0, windLimitMs: 99, color: '#64748b', badge: '🚙 SUV' },
  { id: 'suv-carnival', brand: '기아', name: '카니발·승합차', category: 'vehicle', group: '차량', keywords: '카니발 스타리아 미니밴', widthM: 2.0, lengthM: 5.15, ropeMarginM: 0, windLimitMs: 99, color: '#475569', badge: '🚙 승합차' },
  { id: 'car-pickup', brand: '일반', name: '픽업트럭', category: 'vehicle', group: '차량', keywords: '렉스턴 칸 트럭', widthM: 1.95, lengthM: 5.4, ropeMarginM: 0, windLimitMs: 99, color: '#57534e', badge: '🛻 픽업' },
  { id: 'caravan-s', brand: '일반', name: '소형 카라반', category: 'vehicle', group: '차량', keywords: '캠핑카 트레일러', widthM: 2.2, lengthM: 5.5, ropeMarginM: 0, windLimitMs: 99, color: '#e2e8f0', badge: '🚐 카라반' },

  // ---------- 불 ----------
  { id: 'brazier-fire', brand: '화로대', name: '불멍 화로대', category: 'fire', group: '화로·불', keywords: '화로 불멍 장작 모닥불', widthM: 0.7, lengthM: 0.7, ropeMarginM: 0, windLimitMs: 9, color: '#ef4444', badge: '🔥 화로대' },
  { id: 'fire-large', brand: '화로대', name: '대형 화로대·모닥불', category: 'fire', group: '화로·불', keywords: '화로 캠프파이어 모닥불 큰', widthM: 1.0, lengthM: 1.0, ropeMarginM: 0, windLimitMs: 9, color: '#dc2626', badge: '🔥 모닥불' },
  { id: 'bbq-grill', brand: '화로대', name: '바비큐 그릴', category: 'fire', group: '화로·불', keywords: '숯불 그릴 고기 바베큐', widthM: 0.9, lengthM: 0.5, ropeMarginM: 0, windLimitMs: 9, color: '#b91c1c', badge: '🍖 그릴' },

  // ---------- 가구·기타 ----------
  { id: 'table-long', brand: '가구', name: '롱 테이블', category: 'furniture', group: '가구', keywords: '식탁 상 테이블', widthM: 1.4, lengthM: 0.7, ropeMarginM: 0, windLimitMs: 99, color: '#a16207', badge: '🍽️ 테이블' },
  { id: 'table-kitchen', brand: '가구', name: '키친 테이블 (버너용)', category: 'furniture', group: '가구', keywords: '주방 조리대 버너 스토브', widthM: 1.0, lengthM: 0.6, ropeMarginM: 0, windLimitMs: 99, color: '#92400e', badge: '🍳 키친' },
  { id: 'chair-relax', brand: '가구', name: '릴렉스 체어', category: 'furniture', group: '가구', keywords: '의자 체어 캠핑의자', widthM: 0.7, lengthM: 0.7, ropeMarginM: 0, windLimitMs: 99, color: '#0f766e', badge: '🪑 의자' },
  { id: 'cooler', brand: '가구', name: '쿨러박스', category: 'furniture', group: '가구', keywords: '아이스박스 냉장', widthM: 0.6, lengthM: 0.4, ropeMarginM: 0, windLimitMs: 99, color: '#0369a1', badge: '🧊 쿨러' },
  { id: 'tree-obstacle', brand: '장애물', name: '나무', category: 'obstacle', group: '시설·장애물', keywords: '소나무 수목', widthM: 0.75, lengthM: 0.75, ropeMarginM: 0, windLimitMs: 99, color: '#15803d', badge: '🌲 나무' },
  { id: 'rock', brand: '장애물', name: '큰 바위', category: 'obstacle', group: '시설·장애물', keywords: '돌', widthM: 1.0, lengthM: 0.8, ropeMarginM: 0, windLimitMs: 99, color: '#78716c', badge: '🪨 바위' },
  { id: 'sink', brand: '시설물', name: '수돗가·개수대', category: 'obstacle', group: '시설·장애물', keywords: '물 설거지', widthM: 0.8, lengthM: 0.6, ropeMarginM: 0, windLimitMs: 99, color: '#38bdf8', badge: '🚰 수돗가' },
  { id: 'power-box', brand: '시설물', name: '전기 배전반', category: 'obstacle', group: '시설·장애물', keywords: '전기 콘센트 릴선', widthM: 0.55, lengthM: 0.55, ropeMarginM: 0, windLimitMs: 99, color: '#eab308', badge: '⚡ 배전반' },
];

export const gearEmoji = (item: GearPreset): string => item.badge.split(' ')[0];

/** 이름·브랜드·종류·비슷한 말에서 검색어(띄어쓰기로 여러 개)를 모두 포함하는지 확인 */
const CATEGORY_WORDS: Record<GearCategory, string> = {
  tent: '텐트',
  tarp: '타프 그늘막',
  vehicle: '차량 자동차 차',
  fire: '불 화기',
  furniture: '가구',
  obstacle: '시설 장애물',
};

export function gearMatches(item: GearPreset, query: string): boolean {
  const hay = `${item.name} ${item.brand} ${item.badge} ${item.group ?? ''} ${item.keywords ?? ''} ${CATEGORY_WORDS[item.category]}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}
