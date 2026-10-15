export type GearCategory = 'tent' | 'tarp' | 'vehicle' | 'fire' | 'obstacle';

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
}

export interface PlacedItem extends GearPreset {
  uid: string;
  xM: number;
  yM: number;
  rotation: number;
}

export interface CampgroundLocation {
  name: string;
  region: string;
  lat: number;
  lon: number;
  elevationM: number;
}

export const CAMPGROUND_LOCATIONS: CampgroundLocation[] = [
  { name: '가평 연인산 다목적 캠핑장', region: '경기 가평 (산간)', lat: 37.89, lon: 127.42, elevationM: 480 },
  { name: '강릉 안반데기 운유촌 노지', region: '강원 강릉 (고지대)', lat: 37.62, lon: 128.73, elevationM: 1100 },
  { name: '태안 몽산포 오션뷰 캠핑장', region: '충남 태안 (해안)', lat: 36.67, lon: 126.28, elevationM: 15 },
  { name: '포천 백로주 캠핑장', region: '경기 포천 (평지/강변)', lat: 38.01, lon: 127.21, elevationM: 120 },
  { name: '양평 솔뜰 캠핑장', region: '경기 양평 (숲속)', lat: 37.55, lon: 127.58, elevationM: 360 },
  { name: '제주 금능해변 야영장', region: '제주 한림 (해변)', lat: 33.39, lon: 126.23, elevationM: 10 },
];

export const GEAR_PRESETS: GearPreset[] = [
  { id: 'ergzen-ihwa', brand: '에르젠', name: '이화지작 S5 (리빙쉘)', category: 'tent', widthM: 3.4, lengthM: 5.4, ropeMarginM: 0.9, windLimitMs: 13, color: '#10b981', badge: '⛺ 리빙쉘' },
  { id: 'snowpeak-landlock', brand: '스노우피크', name: '랜드록 (대형 리빙쉘)', category: 'tent', widthM: 4.05, lengthM: 6.25, ropeMarginM: 1.0, windLimitMs: 14, color: '#059669', badge: '⛺ 대형쉘터' },
  { id: 'nordisk-asgard', brand: '노르디스크', name: '아스가르드 12.6 (면벨텐트)', category: 'tent', widthM: 4.0, lengthM: 3.75, ropeMarginM: 1.2, windLimitMs: 15, color: '#d97706', badge: '🎪 벨텐트' },
  { id: 'naturehike-dome', brand: '네이처하이크', name: '에어 6.3 / 코튼 돔텐트', category: 'tent', widthM: 3.0, lengthM: 2.1, ropeMarginM: 0.7, windLimitMs: 12, color: '#0ea5e9', badge: '⛺ 돔텐트' },
  { id: 'recta-tarp-l', brand: '스노우피크/범용', name: '렉타 타프 L (4.4x5.5m)', category: 'tarp', widthM: 4.4, lengthM: 5.5, ropeMarginM: 1.3, windLimitMs: 8.5, color: '#f59e0b', badge: '⛱️ 렉타타프' },
  { id: 'hexa-tarp-m', brand: '코오롱/범용', name: '헥사 타프 M (4.2x4.0m)', category: 'tarp', widthM: 4.2, lengthM: 4.0, ropeMarginM: 1.1, windLimitMs: 10, color: '#eab308', badge: '⛱️ 헥사타프' },
  { id: 'suv-carnival', brand: '기아', name: '카니발/쏘렌토 (차박/사이드주차)', category: 'vehicle', widthM: 2.0, lengthM: 5.15, ropeMarginM: 0, windLimitMs: 99, color: '#64748b', badge: '🚙 차량' },
  { id: 'brazier-fire', brand: '화로대', name: '불멍 화로대 (풍향 주의)', category: 'fire', widthM: 0.7, lengthM: 0.7, ropeMarginM: 0, windLimitMs: 9, color: '#ef4444', badge: '🔥 화로대' },
  { id: 'tree-obstacle', brand: '장애물', name: '사이트 내 소나무', category: 'obstacle', widthM: 0.75, lengthM: 0.75, ropeMarginM: 0, windLimitMs: 99, color: '#15803d', badge: '🌲 나무' },
  { id: 'power-box', brand: '시설물', name: '전기 배전반 (릴선 기준점)', category: 'obstacle', widthM: 0.55, lengthM: 0.55, ropeMarginM: 0, windLimitMs: 99, color: '#eab308', badge: '⚡ 배전반' }
];
