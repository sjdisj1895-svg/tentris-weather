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

export const GEAR_PRESETS: GearPreset[] = [
  { id: 'ergzen-ihwa', brand: '에르젠', name: '이화지작 S5 (리빙쉘)', category: 'tent', widthM: 3.4, lengthM: 5.4, ropeMarginM: 0.9, windLimitMs: 13, color: '#10b981', badge: '⛺ 리빙쉘' },
  { id: 'snowpeak-landlock', brand: '스노우피크', name: '랜드록 (대형 리빙쉘)', category: 'tent', widthM: 4.05, lengthM: 6.25, ropeMarginM: 1.0, windLimitMs: 14, color: '#059669', badge: '⛺ 대형쉘터' },
  { id: 'nordisk-asgard', brand: '노르디스크', name: '아스가르드 12.6 (면 벨텐트)', category: 'tent', widthM: 4.0, lengthM: 3.75, ropeMarginM: 1.2, windLimitMs: 15, color: '#d97706', badge: '🎪 벨텐트' },
  { id: 'naturehike-dome', brand: '네이처하이크', name: '에어 6.3 / 코튼 돔텐트', category: 'tent', widthM: 3.0, lengthM: 2.1, ropeMarginM: 0.7, windLimitMs: 12, color: '#0ea5e9', badge: '⛺ 돔텐트' },
  { id: 'recta-tarp-l', brand: '스노우피크/범용', name: '렉타 타프 L (4.4×5.5m)', category: 'tarp', widthM: 4.4, lengthM: 5.5, ropeMarginM: 1.3, windLimitMs: 8.5, color: '#f59e0b', badge: '⛱️ 렉타타프' },
  { id: 'hexa-tarp-m', brand: '코오롱/범용', name: '헥사 타프 M (4.2×4.0m)', category: 'tarp', widthM: 4.2, lengthM: 4.0, ropeMarginM: 1.1, windLimitMs: 10, color: '#eab308', badge: '⛱️ 헥사타프' },
  { id: 'suv-carnival', brand: '기아', name: '카니발·쏘렌토 (차량)', category: 'vehicle', widthM: 2.0, lengthM: 5.15, ropeMarginM: 0, windLimitMs: 99, color: '#64748b', badge: '🚙 차량' },
  { id: 'brazier-fire', brand: '화로대', name: '불멍 화로대', category: 'fire', widthM: 0.7, lengthM: 0.7, ropeMarginM: 0, windLimitMs: 9, color: '#ef4444', badge: '🔥 화로대' },
  { id: 'tree-obstacle', brand: '장애물', name: '나무', category: 'obstacle', widthM: 0.75, lengthM: 0.75, ropeMarginM: 0, windLimitMs: 99, color: '#15803d', badge: '🌲 나무' },
  { id: 'power-box', brand: '시설물', name: '전기 배전반', category: 'obstacle', widthM: 0.55, lengthM: 0.55, ropeMarginM: 0, windLimitMs: 99, color: '#eab308', badge: '⚡ 배전반' },
];

export const gearEmoji = (item: GearPreset): string => item.badge.split(' ')[0];
