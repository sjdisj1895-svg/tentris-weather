import { PlacedItem } from './presets';

export const BOARD_PADDING_M = 1.8; // 사이트 바깥으로 보여줄 여백(줄·장애물 확인용)

export type SurfaceType = 'deck' | 'gravel' | 'grass';
export type Level = 'ok' | 'warn' | 'danger';

export interface Issue {
  level: Level;
  title: string;
  detail: string;
}

export interface ChecklistItem {
  item: string;
  reason: string;
  urgent: boolean;
}

export interface AnalysisInput {
  items: PlacedItem[];
  siteWidthM: number;
  siteLengthM: number;
  surfaceType: SurfaceType;
  windGustMs: number;
  windDirDeg: number; // 바람이 향하는 방향
  minTempC: number;
  humidityPct: number;
  cloudCoverPct: number;
  rainProbPct: number;
  rainMm: number;
  elevationM: number;
}

// ---------- 배치 기하 ----------
export function getItemBounds(item: PlacedItem, includeRope = false) {
  const rad = (item.rotation * Math.PI) / 180;
  const margin = includeRope ? item.ropeMarginM * 2 : 0;
  const w = item.widthM + margin;
  const l = item.lengthM + margin;
  const effW = Math.abs(w * Math.cos(rad)) + Math.abs(l * Math.sin(rad));
  const effL = Math.abs(w * Math.sin(rad)) + Math.abs(l * Math.cos(rad));
  return {
    left: item.xM - effW / 2,
    right: item.xM + effW / 2,
    top: item.yM - effL / 2,
    bottom: item.yM + effL / 2,
  };
}

export function isBodyOutOfSite(item: PlacedItem, siteW: number, siteL: number): boolean {
  if (item.category === 'obstacle') return false;
  const b = getItemBounds(item, false);
  return b.left < 0 || b.right > siteW || b.top < 0 || b.bottom > siteL;
}

export function isRopeOutOfSite(item: PlacedItem, siteW: number, siteL: number): boolean {
  if (item.ropeMarginM <= 0) return false;
  const b = getItemBounds(item, true);
  return b.left < 0 || b.right > siteW || b.top < 0 || b.bottom > siteL;
}

// ---------- 종합 분석 ----------
export function analyze(input: AnalysisInput) {
  const { items, siteWidthM: sw, siteLengthM: sl, surfaceType, windGustMs, windDirDeg, minTempC, humidityPct } = input;
  const { cloudCoverPct, rainProbPct, rainMm, elevationM } = input;

  const shelters = items.filter((i) => i.category === 'tent' || i.category === 'tarp');
  const fires = items.filter((i) => i.category === 'fire');
  const powerBox = items.find((i) => i.id === 'power-box');

  const bodyOutItems = shelters.filter((i) => isBodyOutOfSite(i, sw, sl));
  const ropeOutItems = shelters.filter((i) => !isBodyOutOfSite(i, sw, sl) && isRopeOutOfSite(i, sw, sl));
  const windRiskItems = shelters.filter((i) => windGustMs >= i.windLimitMs);

  // 불티: 바람이 화로에서 텐트/타프 쪽으로 향하는지
  const windRad = ((windDirDeg - 90) * Math.PI) / 180;
  const wx = Math.cos(windRad);
  const wy = Math.sin(windRad);
  const sparkTargets = new Set<string>();
  fires.forEach((fire) => {
    shelters.forEach((s) => {
      const dx = s.xM - fire.xM;
      const dy = s.yM - fire.yM;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.2 && dist < 3.6 && (dx * wx + dy * wy) / dist > 0.55) sparkTargets.add(s.name);
    });
  });
  const fireSparkWarning = sparkTargets.size > 0;

  // 릴선
  const mainTent = shelters.find((i) => i.category === 'tent') ?? shelters[0];
  let cordM: number | null = null;
  if (powerBox && mainTent) {
    cordM = Number((Math.hypot(mainTent.xM - powerBox.xM, mainTent.yM - powerBox.yM) * 1.25).toFixed(1));
  }

  // 이슬 맺힘(결로): 이슬점 근사
  const dewPointC = Number((minTempC - (100 - humidityPct) / 5).toFixed(1));
  const dewGap = minTempC - dewPointC;
  const dewLevel: Level = humidityPct >= 80 || dewGap <= 2.5 ? 'danger' : humidityPct >= 65 ? 'warn' : 'ok';

  const starScore = Math.max(10, Math.min(100, Math.round(100 - cloudCoverPct * 0.8 - (humidityPct > 85 ? 15 : 0))));

  const windLevel: Level = windGustMs >= 11 ? 'danger' : windGustMs >= 8 ? 'warn' : 'ok';
  const rainLevel: Level = rainMm >= 10 || (rainProbPct >= 60 && rainMm >= 3) ? 'danger' : rainProbPct >= 30 || rainMm >= 1 ? 'warn' : 'ok';
  const coldLevel: Level = minTempC <= -3 ? 'danger' : minTempC <= 5 ? 'warn' : 'ok';

  // ---------- 알림(쉬운 말) ----------
  const issues: Issue[] = [];
  if (bodyOutItems.length > 0) {
    issues.push({
      level: 'danger',
      title: '텐트가 자리 밖으로 나갔어요',
      detail: `${bodyOutItems.map((i) => i.name).join(', ')}이(가) 정해 둔 자리 밖에 있어요. 안쪽으로 옮기거나 돌려 보세요.`,
    });
  }
  if (windRiskItems.length > 0) {
    issues.push({
      level: 'danger',
      title: '바람이 이 장비에는 너무 세요',
      detail: `순간 바람 ${windGustMs}m/s는 ${windRiskItems.map((i) => i.name).join(', ')}이(가) 견디는 한계(약 ${Math.min(...windRiskItems.map((i) => i.windLimitMs))}m/s) 이상이에요. 설치를 미루거나 줄을 더 단단히 묶으세요.`,
    });
  } else if (windLevel === 'warn') {
    issues.push({ level: 'warn', title: '바람이 제법 불어요', detail: `순간 바람 ${windGustMs}m/s 예상이에요. 팩은 길고 튼튼한 것으로 쓰세요.` });
  }
  if (fireSparkWarning) {
    issues.push({
      level: 'danger',
      title: '불똥이 텐트로 날아갈 수 있어요',
      detail: `바람이 화로에서 ${[...sparkTargets].join(', ')} 쪽으로 불어요. 화로를 바람이 불어가는 반대쪽으로 옮기거나 멀리 두세요.`,
    });
  }
  if (ropeOutItems.length > 0) {
    issues.push({
      level: 'warn',
      title: '텐트 줄이 자리 밖으로 나가요',
      detail: `${ropeOutItems.map((i) => i.name).join(', ')}의 줄을 자리 밖 땅에 박아야 해요. 데크용 못과 일반 팩을 같이 챙기세요.`,
    });
  }
  if (rainLevel !== 'ok') {
    issues.push({
      level: rainLevel,
      title: '비 소식이 있어요',
      detail: `비 올 확률 ${rainProbPct}%, 예상 강수량 ${rainMm}mm예요. 방수 준비를 해 주세요.`,
    });
  }
  if (coldLevel !== 'ok') {
    issues.push({
      level: coldLevel,
      title: '새벽에 추워요',
      detail: `새벽 기온 약 ${minTempC}℃예요. 따뜻한 침낭과 난방 준비를 하세요.`,
    });
  }
  if (dewLevel === 'danger') {
    issues.push({ level: 'warn', title: '텐트 안에 이슬이 많이 맺혀요', detail: `습도 ${humidityPct}%라 새벽에 텐트 안쪽이 젖을 수 있어요. 환기구를 열어 두세요.` });
  }

  const level: Level = issues.some((i) => i.level === 'danger') ? 'danger' : issues.some((i) => i.level === 'warn') ? 'warn' : 'ok';
  const headline =
    level === 'danger'
      ? '조심하세요! 꼭 확인할 것이 있어요'
      : level === 'warn'
      ? '가실 수 있어요. 몇 가지만 챙기세요'
      : '이대로 가셔도 좋아요';

  // ---------- 준비물 ----------
  const checklist: ChecklistItem[] = [];

  if (surfaceType === 'deck') {
    if (bodyOutItems.length > 0 || ropeOutItems.length > 0) {
      checklist.push({ item: '데크용 못(오징어펙) 10개 + 일반 단조팩 8개', reason: '줄 일부가 데크 밖으로 나가서 데크와 흙 두 곳에 모두 고정해야 해요', urgent: true });
    } else {
      checklist.push({ item: '데크용 못(오징어펙) 12개 + 카라비너', reason: '나무 데크 자리에 쓰는 고정 도구예요', urgent: false });
    }
  } else {
    checklist.push({
      item: windGustMs >= 8 ? '길고 튼튼한 단조팩 30~40cm' : '단조팩 20~30cm 기본 세트',
      reason: `${surfaceType === 'gravel' ? '파쇄석' : '잔디·흙'} 바닥이고 순간 바람이 ${windGustMs}m/s예요`,
      urgent: windGustMs >= 8,
    });
  }

  if (windGustMs >= 8.5) {
    checklist.push({ item: '텐트 줄(스트링) 추가 + 줄 보호대', reason: `순간 바람 ${windGustMs}m/s라 폴대가 휘거나 부러지는 것을 막아야 해요`, urgent: true });
  }

  if (rainLevel !== 'ok') {
    checklist.push({ item: '우비·방수 매트·여벌 수건', reason: `비 올 확률 ${rainProbPct}% (예상 ${rainMm}mm)`, urgent: rainLevel === 'danger' });
    checklist.push({ item: '타프는 한쪽을 낮게 쳐서 물이 흘러내리게 하기', reason: '고인 빗물 무게로 타프가 처지는 것을 막아요', urgent: false });
  }

  if (minTempC <= 5) {
    checklist.push({ item: '난방기 + 일산화탄소 경보기 + 겨울 침낭', reason: `새벽 기온 ${minTempC}℃ (해발 ${elevationM}m)`, urgent: true });
  } else if (minTempC <= 13) {
    checklist.push({ item: '전기장판 + 작은 온풍기', reason: `새벽 기온 ${minTempC}℃로 낮과 차이가 커요`, urgent: false });
  }

  if (humidityPct >= 78) {
    checklist.push({ item: '서큘레이터(선풍기) + 마른 수건', reason: `습도 ${humidityPct}%라 새벽에 텐트 안쪽에 물방울이 맺혀요`, urgent: false });
  }

  if (cordM !== null) {
    const cord = cordM > 15 ? '30m' : cordM > 8 ? '20m' : '10m';
    checklist.push({ item: `방수 전기 릴선 (${cord})`, reason: `배전반에서 텐트까지 여유를 포함해 약 ${cordM}m가 필요해요`, urgent: cordM > 15 });
  }

  return {
    level,
    headline,
    issues,
    bodyOutItems,
    ropeOutItems,
    windRiskItems,
    fireSparkWarning,
    cordM,
    dewPointC,
    dewLevel,
    windLevel,
    rainLevel,
    coldLevel,
    starScore,
    checklist,
  };
}

export type Analysis = ReturnType<typeof analyze>;
