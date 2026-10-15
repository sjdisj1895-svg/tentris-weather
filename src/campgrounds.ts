export type RegionGroup = '경기·인천' | '강원' | '충청' | '경상' | '전라' | '제주';
export type PlaceType = 'sea' | 'mountain' | 'water' | 'plain';

export interface Campground {
  name: string;
  region: RegionGroup;
  type: PlaceType;
  lat: number;
  lon: number;
}

export const REGION_GROUPS: RegionGroup[] = ['경기·인천', '강원', '충청', '경상', '전라', '제주'];

export const PLACE_TYPE_INFO: Record<PlaceType, { emoji: string; label: string }> = {
  sea: { emoji: '🏖️', label: '바다' },
  mountain: { emoji: '⛰️', label: '산' },
  water: { emoji: '🏞️', label: '계곡·호수·강' },
  plain: { emoji: '🌾', label: '평지' },
};

// 좌표는 각 지역 대표 지점(소수 둘째 자리) 기준의 대략적인 위치입니다.
// 정확한 캠핑장은 화면의 검색창으로 찾을 수 있고, 해발고도는 날씨 조회 시 자동으로 받아옵니다.
export const CAMPGROUNDS: Campground[] = [
  // 경기·인천
  { name: '가평 자라섬', region: '경기·인천', type: 'water', lat: 37.82, lon: 127.52 },
  { name: '가평 남이섬', region: '경기·인천', type: 'water', lat: 37.79, lon: 127.53 },
  { name: '가평 연인산', region: '경기·인천', type: 'mountain', lat: 37.89, lon: 127.42 },
  { name: '가평 명지산', region: '경기·인천', type: 'mountain', lat: 37.97, lon: 127.45 },
  { name: '양평 용문산', region: '경기·인천', type: 'mountain', lat: 37.55, lon: 127.58 },
  { name: '양평 두물머리', region: '경기·인천', type: 'water', lat: 37.53, lon: 127.31 },
  { name: '포천 백운계곡', region: '경기·인천', type: 'water', lat: 37.98, lon: 127.31 },
  { name: '포천 산정호수', region: '경기·인천', type: 'water', lat: 38.07, lon: 127.33 },
  { name: '파주 임진각', region: '경기·인천', type: 'plain', lat: 37.89, lon: 126.74 },
  { name: '안산 대부도', region: '경기·인천', type: 'sea', lat: 37.25, lon: 126.56 },
  { name: '강화 동막해변', region: '경기·인천', type: 'sea', lat: 37.59, lon: 126.46 },
  { name: '인천 영흥도 십리포', region: '경기·인천', type: 'sea', lat: 37.26, lon: 126.47 },

  // 강원
  { name: '춘천 의암호', region: '강원', type: 'water', lat: 37.86, lon: 127.69 },
  { name: '홍천 홍천강', region: '강원', type: 'water', lat: 37.69, lon: 127.89 },
  { name: '인제 내린천·자작나무숲 일대', region: '강원', type: 'mountain', lat: 38.07, lon: 128.17 },
  { name: '평창 대관령', region: '강원', type: 'mountain', lat: 37.69, lon: 128.75 },
  { name: '평창 오대산', region: '강원', type: 'mountain', lat: 37.73, lon: 128.59 },
  { name: '강릉 경포해변', region: '강원', type: 'sea', lat: 37.8, lon: 128.91 },
  { name: '강릉 안반데기', region: '강원', type: 'mountain', lat: 37.63, lon: 128.75 },
  { name: '속초 설악산 소공원', region: '강원', type: 'mountain', lat: 38.17, lon: 128.49 },
  { name: '속초 영랑호', region: '강원', type: 'water', lat: 38.22, lon: 128.58 },
  { name: '양양 낙산해변', region: '강원', type: 'sea', lat: 38.12, lon: 128.63 },
  { name: '고성 화진포', region: '강원', type: 'sea', lat: 38.47, lon: 128.45 },
  { name: '동해 망상해변', region: '강원', type: 'sea', lat: 37.59, lon: 129.01 },
  { name: '삼척 장호항', region: '강원', type: 'sea', lat: 37.29, lon: 129.34 },
  { name: '정선 아우라지', region: '강원', type: 'water', lat: 37.38, lon: 128.66 },
  { name: '영월 동강', region: '강원', type: 'water', lat: 37.18, lon: 128.46 },
  { name: '태백 고원', region: '강원', type: 'mountain', lat: 37.16, lon: 128.99 },

  // 충청
  { name: '태안 몽산포', region: '충청', type: 'sea', lat: 36.67, lon: 126.28 },
  { name: '태안 학암포', region: '충청', type: 'sea', lat: 36.89, lon: 126.19 },
  { name: '태안 안면도 꽃지', region: '충청', type: 'sea', lat: 36.5, lon: 126.34 },
  { name: '보령 대천해변', region: '충청', type: 'sea', lat: 36.31, lon: 126.51 },
  { name: '단양 도담삼봉', region: '충청', type: 'water', lat: 36.99, lon: 128.34 },
  { name: '제천 청풍호', region: '충청', type: 'water', lat: 36.98, lon: 128.22 },
  { name: '충주 충주호', region: '충청', type: 'water', lat: 36.97, lon: 127.93 },
  { name: '괴산 화양계곡', region: '충청', type: 'water', lat: 36.67, lon: 127.93 },
  { name: '보은 속리산', region: '충청', type: 'mountain', lat: 36.54, lon: 127.84 },

  // 경상
  { name: '문경 문경새재', region: '경상', type: 'mountain', lat: 36.77, lon: 128.07 },
  { name: '안동 하회마을', region: '경상', type: 'plain', lat: 36.54, lon: 128.52 },
  { name: '봉화 청량산', region: '경상', type: 'mountain', lat: 36.8, lon: 128.91 },
  { name: '울진 울진해변', region: '경상', type: 'sea', lat: 36.99, lon: 129.4 },
  { name: '영덕 장사해변', region: '경상', type: 'sea', lat: 36.42, lon: 129.38 },
  { name: '포항 칠포해변', region: '경상', type: 'sea', lat: 36.13, lon: 129.4 },
  { name: '경주 보문단지', region: '경상', type: 'water', lat: 35.84, lon: 129.28 },
  { name: '울산 간절곶', region: '경상', type: 'sea', lat: 35.36, lon: 129.36 },
  { name: '부산 다대포', region: '경상', type: 'sea', lat: 35.05, lon: 128.97 },
  { name: '밀양 표충사(영남알프스)', region: '경상', type: 'mountain', lat: 35.54, lon: 128.99 },
  { name: '합천 황매산', region: '경상', type: 'mountain', lat: 35.49, lon: 127.99 },
  { name: '합천 가야산', region: '경상', type: 'mountain', lat: 35.8, lon: 128.1 },
  { name: '산청 지리산 중산리', region: '경상', type: 'mountain', lat: 35.32, lon: 127.78 },
  { name: '거제 학동 몽돌해변', region: '경상', type: 'sea', lat: 34.77, lon: 128.65 },
  { name: '통영 미륵도', region: '경상', type: 'sea', lat: 34.84, lon: 128.43 },
  { name: '남해 상주은모래비치', region: '경상', type: 'sea', lat: 34.72, lon: 127.99 },

  // 전라
  { name: '남원 지리산 달궁', region: '전라', type: 'mountain', lat: 35.29, lon: 127.6 },
  { name: '순천 순천만', region: '전라', type: 'sea', lat: 34.88, lon: 127.51 },
  { name: '여수 여수시', region: '전라', type: 'sea', lat: 34.74, lon: 127.74 },
  { name: '담양 메타세쿼이아길', region: '전라', type: 'plain', lat: 35.32, lon: 126.99 },
  { name: '부안 변산반도 격포', region: '전라', type: 'sea', lat: 35.62, lon: 126.47 },
  { name: '고창 선운산', region: '전라', type: 'mountain', lat: 35.49, lon: 126.59 },
  { name: '완도 완도읍', region: '전라', type: 'sea', lat: 34.31, lon: 126.75 },
  { name: '진안 마이산', region: '전라', type: 'mountain', lat: 35.75, lon: 127.42 },
  { name: '무주 덕유산 구천동', region: '전라', type: 'mountain', lat: 35.87, lon: 127.78 },

  // 제주
  { name: '제주 협재·금능해변', region: '제주', type: 'sea', lat: 33.39, lon: 126.23 },
  { name: '제주 함덕해변', region: '제주', type: 'sea', lat: 33.54, lon: 126.67 },
  { name: '제주 김녕해변', region: '제주', type: 'sea', lat: 33.56, lon: 126.76 },
  { name: '제주 성산일출봉', region: '제주', type: 'sea', lat: 33.46, lon: 126.93 },
  { name: '서귀포 중문', region: '제주', type: 'sea', lat: 33.25, lon: 126.41 },
  { name: '제주 한라산 성판악', region: '제주', type: 'mountain', lat: 33.38, lon: 126.62 },
];
