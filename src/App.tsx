import React, { useState, useRef, useMemo } from 'react';
import {
  Tent,
  Wind,
  Sun,
  Droplets,
  Flame,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  Trash2,
  Plus,
  Compass,
  Zap,
  CloudSun,
  Sparkles,
  Download,
  RefreshCw,
  MapPin,
  ShieldAlert,
  Layers
} from 'lucide-react';
import {
  CAMPGROUND_LOCATIONS,
  GEAR_PRESETS,
  GearPreset,
  PlacedItem,
  CampgroundLocation
} from './presets';

const SCALE_PX_PER_M = 64; // 1 meter = 64px on canvas
const CANVAS_PADDING_M = 1.8; // Extra space around deck/site to see guyropes & obstacles

const WIND_DIRECTIONS = [
  { label: '북풍 (N→S)', deg: 180, short: 'N' },
  { label: '북서풍 (NW→SE)', deg: 135, short: 'NW' },
  { label: '서풍 (W→E)', deg: 90, short: 'W' },
  { label: '남서풍 (SW→NE)', deg: 45, short: 'SW' },
  { label: '남풍 (S→N)', deg: 0, short: 'S' },
  { label: '북동풍 (NE→SW)', deg: 225, short: 'NE' },
  { label: '동풍 (E→W)', deg: 270, short: 'E' },
];

export default function App() {
  // 1. Site Config State
  const [siteWidthM, setSiteWidthM] = useState<number>(6.0);
  const [siteLengthM, setSiteLengthM] = useState<number>(4.5);
  const [surfaceType, setSurfaceType] = useState<'deck' | 'gravel' | 'grass'>('deck');
  const [selectedCampground, setSelectedCampground] = useState<CampgroundLocation>(CAMPGROUND_LOCATIONS[0]);
  const [showGuyropes, setShowGuyropes] = useState<boolean>(true);

  // 2. Weather & Environment Simulation State
  const [windDirDeg, setWindDirDeg] = useState<number>(135); // Default NW wind blowing SE
  const [windGustMs, setWindGustMs] = useState<number>(9.5); // m/s
  const [minTempC, setMinTempC] = useState<number>(6); // Base forecast temp
  const [humidityPct, setHumidityPct] = useState<number>(82); // %
  const [cloudCoverPct, setCloudCoverPct] = useState<number>(20); // %
  const [sunHour, setSunHour] = useState<number>(14); // 08:00 ~ 18:00
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherFetchedAt, setWeatherFetchedAt] = useState<string | null>(null);

  // 3. Placed Items on Canvas
  const [items, setItems] = useState<PlacedItem[]>([
    {
      ...GEAR_PRESETS[0], // 에르젠 이화지작
      uid: 'init-tent-1',
      xM: 2.3,
      yM: 2.25,
      rotation: 90,
    },
    {
      ...GEAR_PRESETS[7], // 화로대
      uid: 'init-fire-1',
      xM: 4.8,
      yM: 2.8,
      rotation: 0,
    },
    {
      ...GEAR_PRESETS[9], // 배전반
      uid: 'init-power-1',
      xM: -0.6,
      yM: 0.5,
      rotation: 0,
    },
    {
      ...GEAR_PRESETS[8], // 소나무
      uid: 'init-tree-1',
      xM: 5.5,
      yM: 0.6,
      rotation: 0,
    }
  ]);

  const [selectedUid, setSelectedUid] = useState<string | null>('init-tent-1');

  // Custom gear modal/form state
  const [customName, setCustomName] = useState('');
  const [customWidthM, setCustomWidthM] = useState(3.2);
  const [customLengthM, setCustomLengthM] = useState(4.8);

  // Dragging Ref
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<{ uid: string; offsetX: number; offsetY: number } | null>(null);

  // Fetch Real Weather from Open-Meteo API (No API key required!)
  const fetchLiveWeather = async (loc: CampgroundLocation) => {
    setIsLoadingWeather(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover&wind_speed_unit=ms&timezone=Asia%2FSeoul`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.current) {
        const cur = data.current;
        setWindGustMs(Number((cur.wind_gusts_10m ?? cur.wind_speed_10m ?? 6.5).toFixed(1)));
        setWindDirDeg(Math.round(cur.wind_direction_10m ?? 135));
        setMinTempC(Math.round((cur.temperature_2m ?? 10) - 4)); // Estimate dawn low
        setHumidityPct(Math.round(cur.relative_humidity_2m ?? 75));
        setCloudCoverPct(Math.round(cur.cloud_cover ?? 25));
        setWeatherFetchedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      console.error('Open-Meteo fetch failed, using simulation sliders:', e);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Add Preset Gear
  const handleAddGear = (preset: GearPreset) => {
    const newUid = `${preset.id}-${Date.now()}`;
    const newItem: PlacedItem = {
      ...preset,
      uid: newUid,
      xM: Number((siteWidthM / 2).toFixed(2)),
      yM: Number((siteLengthM / 2).toFixed(2)),
      rotation: 0,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedUid(newUid);
  };

  const handleAddCustomGear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newPreset: GearPreset = {
      id: 'custom-gear',
      brand: '커스텀',
      name: customName.trim(),
      category: 'tent',
      widthM: Number(customWidthM),
      lengthM: Number(customLengthM),
      ropeMarginM: 0.9,
      windLimitMs: 12,
      color: '#6366f1',
      badge: '⛺ 내 텐트',
    };
    handleAddGear(newPreset);
    setCustomName('');
  };

  // Rotate / Delete Selected Gear
  const rotateSelected = (deltaDeg: number) => {
    if (!selectedUid) return;
    setItems((prev) =>
      prev.map((item) =>
        item.uid === selectedUid
          ? { ...item, rotation: (item.rotation + deltaDeg + 360) % 360 }
          : item
      )
    );
  };

  const deleteSelected = () => {
    if (!selectedUid) return;
    setItems((prev) => prev.filter((item) => item.uid !== selectedUid));
    setSelectedUid(null);
  };

  // Dragging Handlers
  const handlePointerDown = (e: React.PointerEvent, item: PlacedItem) => {
    e.stopPropagation();
    setSelectedUid(item.uid);
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const itemPxX = (item.xM + CANVAS_PADDING_M) * SCALE_PX_PER_M;
    const itemPxY = (item.yM + CANVAS_PADDING_M) * SCALE_PX_PER_M;
    draggingRef.current = {
      uid: item.uid,
      offsetX: e.clientX - rect.left - itemPxX,
      offsetY: e.clientY - rect.top - itemPxY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const rawPxX = e.clientX - rect.left - draggingRef.current.offsetX;
    const rawPxY = e.clientY - rect.top - draggingRef.current.offsetY;

    const newXM = Number((rawPxX / SCALE_PX_PER_M - CANVAS_PADDING_M).toFixed(2));
    const newYM = Number((rawPxY / SCALE_PX_PER_M - CANVAS_PADDING_M).toFixed(2));

    setItems((prev) =>
      prev.map((it) =>
        it.uid === draggingRef.current?.uid
          ? {
              ...it,
              xM: Math.max(-CANVAS_PADDING_M + 0.3, Math.min(siteWidthM + CANVAS_PADDING_M - 0.3, newXM)),
              yM: Math.max(-CANVAS_PADDING_M + 0.3, Math.min(siteLengthM + CANVAS_PADDING_M - 0.3, newYM)),
            }
          : it
      )
    );
  };

  const handlePointerUp = () => {
    draggingRef.current = null;
  };

  // Bounding Box Helper (considers rotation)
  const getItemBounds = (item: PlacedItem, includeRope = false) => {
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
      effW,
      effL,
    };
  };

  const isBodyOutOfSite = (item: PlacedItem) => {
    if (item.category === 'obstacle') return false;
    const b = getItemBounds(item, false);
    return b.left < 0 || b.right > siteWidthM || b.top < 0 || b.bottom > siteLengthM;
  };

  const isRopeOutOfSite = (item: PlacedItem) => {
    if (item.ropeMarginM <= 0) return false;
    const b = getItemBounds(item, true);
    return b.left < 0 || b.right > siteWidthM || b.top < 0 || b.bottom > siteLengthM;
  };

  // --- 2+4 SYNERGY ANALYTICS ---
  const analysis = useMemo(() => {
    const tentsAndTarps = items.filter((i) => i.category === 'tent' || i.category === 'tarp');
    const tarps = items.filter((i) => i.category === 'tarp');
    const fires = items.filter((i) => i.category === 'fire');
    const powerBoxes = items.filter((i) => i.id === 'power-box');

    // 1. Out of deck check
    const bodyOutItems = tentsAndTarps.filter((i) => isBodyOutOfSite(i));
    const ropeOutItems = tentsAndTarps.filter((i) => !isBodyOutOfSite(i) && isRopeOutOfSite(i));

    // 2. Wind vs Tarp Danger
    const endangeredTarps = tarps.filter((t) => windGustMs >= t.windLimitMs);

    // 3. Fire Spark (불티) Downwind Check
    // windDirDeg is the direction the wind blows TOWARDS in our visual arrow (0=N, 90=E, 180=S, 270=W)
    const windRad = ((windDirDeg - 90) * Math.PI) / 180;
    const windVecX = Math.cos(windRad);
    const windVecY = Math.sin(windRad);

    let fireSparkWarning = false;
    fires.forEach((fire) => {
      tentsAndTarps.forEach((tent) => {
        const dx = tent.xM - fire.xM;
        const dy = tent.yM - fire.yM;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.2 && dist < 3.6) {
          // Dot product to see if tent is downwind of fire
          const dot = (dx * windVecX + dy * windVecY) / dist;
          if (dot > 0.55) {
            fireSparkWarning = true;
          }
        }
      });
    });

    // 4. Power Cord Length Calculation
    let maxPowerDistanceM: number | null = null;
    if (powerBoxes.length > 0 && tentsAndTarps.length > 0) {
      const p = powerBoxes[0];
      const mainTent = tentsAndTarps[0];
      const straightDist = Math.hypot(mainTent.xM - p.xM, mainTent.yM - p.yM);
      // Add 25% routing slack
      maxPowerDistanceM = Number((straightDist * 1.25).toFixed(1));
    }

    // 5. Elevation Temperature Correction (-0.65°C per 100m)
    const elevationDropC = Number(((selectedCampground.elevationM / 100) * 0.65).toFixed(1));
    const realFeelMinTempC = Number((minTempC - elevationDropC).toFixed(1));

    // 6. Dew Point & Condensation Risk (Magnus approximation)
    const dewPointC = Number((realFeelMinTempC - (100 - humidityPct) / 5).toFixed(1));
    const tempDewDiff = realFeelMinTempC - dewPointC;
    const condensationRisk =
      humidityPct >= 80 || tempDewDiff <= 2.5
        ? '매우 높음 (결로 폭탄 주의)'
        : humidityPct >= 65
        ? '보통 (환기/벤틸레이션 권장)'
        : '낮음 (쾌적)';

    // 7. Stargazing Score
    const starScore = Math.max(
      10,
      Math.min(100, Math.round(100 - cloudCoverPct * 0.8 - (humidityPct > 85 ? 15 : 0)))
    );

    // 8. Smart Packing Checklist Generation
    const checklist: { item: string; reason: string; urgent: boolean }[] = [];

    if (surfaceType === 'deck') {
      if (bodyOutItems.length > 0 || ropeOutItems.length > 0) {
        checklist.push({
          item: '오징어펙(데크펙) 10개 + 단조펙 30cm 8개 혼합',
          reason: '텐트/가이로프 일부가 데크 밖으로 나가 데크+노지 혼합 팩다운 필수',
          urgent: true,
        });
      } else {
        checklist.push({
          item: '오징어펙(데크펙) 12개 & 카라비너',
          reason: '우드 데크 사이트 전용 고정 장비',
          urgent: false,
        });
      }
    } else {
      checklist.push({
        item: windGustMs >= 8 ? '단조펙 30cm~40cm (강풍용)' : '단조펙 20~30cm 기본 세트',
        reason: `${surfaceType === 'gravel' ? '파쇄석' : '잔디/노지'} 바닥 및 풍속 ${windGustMs}m/s 대비`,
        urgent: windGustMs >= 8,
      });
    }

    if (windGustMs >= 8.5) {
      checklist.push({
        item: '메인폴 스트링 2줄 보강 + 스토퍼 & 스트링 가드',
        reason: `돌풍 ${windGustMs}m/s 예보로 폴대 휨/파손 방지 필수`,
        urgent: true,
      });
    }

    if (realFeelMinTempC <= 5) {
      checklist.push({
        item: '등유난로(또는 팬히터) + 일산화탄소 경보기 + 동계 침낭',
        reason: `해발 ${selectedCampground.elevationM}m 보정 새벽 체감온도 ${realFeelMinTempC}℃ 대비`,
        urgent: true,
      });
    } else if (realFeelMinTempC <= 13) {
      checklist.push({
        item: '전기장판 + 미니 팬히터 (간절기 난방)',
        reason: `새벽 체감온도 ${realFeelMinTempC}℃ 일교차 대비`,
        urgent: false,
      });
    }

    if (humidityPct >= 78) {
      checklist.push({
        item: '타프팬(실링팬) & 결로 닦이용 극세사 타월',
        reason: `습도 ${humidityPct}% (이슬점 ${dewPointC}℃)로 새벽 텐트 내부 결로 다량 발생 예고`,
        urgent: false,
      });
    }

    if (maxPowerDistanceM !== null) {
      const recommendedCord = maxPowerDistanceM > 15 ? '30m 리드선' : maxPowerDistanceM > 8 ? '20m 리드선' : '10m 리드선';
      checklist.push({
        item: `고용량 방수 전기 릴선 (${recommendedCord})`,
        reason: `배전반~텐트 여유 포함 예상 필요 길이 약 ${maxPowerDistanceM}m`,
        urgent: maxPowerDistanceM > 15,
      });
    }

    return {
      bodyOutItems,
      ropeOutItems,
      endangeredTarps,
      fireSparkWarning,
      maxPowerDistanceM,
      elevationDropC,
      realFeelMinTempC,
      dewPointC,
      condensationRisk,
      starScore,
      checklist,
    };
  }, [items, siteWidthM, siteLengthM, surfaceType, windGustMs, windDirDeg, minTempC, humidityPct, cloudCoverPct, selectedCampground]);

  // Sun angle visual calculation (08:00 East -> 13:00 South -> 18:00 West)
  const sunAzimuthDeg = useMemo(() => {
    // 8h -> 90deg (East), 13h -> 180deg (South), 18h -> 270deg (West)
    return 90 + ((sunHour - 8) / 10) * 180;
  }, [sunHour]);

  const selectedItem = items.find((i) => i.uid === selectedUid) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-sky-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-[0_0_18px_-2px_rgba(16,185,129,0.5)]">
            <Tent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                텐트리스 웨더 <span className="brand-gradient font-extrabold">Tentris Weather</span>
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                2+4 통합 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              실측 텐트 배치 시뮬레이터 & 실시간 풍향·결로·고도 기온 보정 스마트 피칭 가이드
            </p>
          </div>
        </div>

        {/* Location & Live Open-Meteo Sync */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <select
              className="bg-transparent text-xs font-medium text-slate-100 focus:outline-none"
              value={selectedCampground.name}
              onChange={(e) => {
                const found = CAMPGROUND_LOCATIONS.find((c) => c.name === e.target.value);
                if (found) {
                  setSelectedCampground(found);
                  fetchLiveWeather(found);
                }
              }}
            >
              {CAMPGROUND_LOCATIONS.map((loc) => (
                <option key={loc.name} value={loc.name} className="bg-slate-900 text-slate-100">
                  {loc.name} (해발 {loc.elevationM}m)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchLiveWeather(selectedCampground)}
            disabled={isLoadingWeather}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeather ? 'animate-spin' : ''}`} />
            {isLoadingWeather ? '기상청/Open-Meteo 수신중...' : '실시간 기상 연동'}
          </button>
          {weatherFetchedAt && (
            <span className="text-[11px] text-emerald-400">✓ {weatherFetchedAt} 실황 반영됨</span>
          )}
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 max-w-[1600px] w-full mx-auto">
        {/* LEFT PANEL: Site Settings & Gear Presets (3 cols) */}
        <section className="lg:col-span-3 space-y-4 flex flex-col">
          {/* Site Size & Surface */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              1. 사이트 규격 & 바닥 설정
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">가로 폭 (m)</label>
                <input
                  type="number"
                  step="0.5"
                  min="2.5"
                  max="12"
                  value={siteWidthM}
                  onChange={(e) => setSiteWidthM(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">세로 깊이 (m)</label>
                <input
                  type="number"
                  step="0.5"
                  min="2.5"
                  max="12"
                  value={siteLengthM}
                  onChange={(e) => setSiteLengthM(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">바닥 재질 (팩 추천 연동)</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'deck', label: '🪵 우드 데크' },
                  { id: 'gravel', label: '🪨 파쇄석' },
                  { id: 'grass', label: '🌿 노지/잔디' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSurfaceType(s.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                      surfaceType === s.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between pt-1 cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">가이로프(스트링) 안전 반경 표시</span>
              <input
                type="checkbox"
                checked={showGuyropes}
                onChange={(e) => setShowGuyropes(e.target.checked)}
                className="accent-emerald-500 w-4 h-4 rounded"
              />
            </label>
          </div>

          {/* Gear Presets */}
          <div className="glass-card rounded-xl p-4 space-y-3 flex-1">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Tent className="w-4 h-4 text-emerald-400" />
              2. 장비 꺼내기 (클릭 시 추가)
            </h2>

            <div className="grid grid-cols-1 gap-1.5 max-h-[310px] overflow-y-auto pr-1">
              {GEAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleAddGear(preset)}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800/90 text-left transition group"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {preset.badge}
                      </span>
                      <span className="text-xs font-semibold text-slate-100 group-hover:text-emerald-300">
                        {preset.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      규격 {preset.widthM}m × {preset.lengthM}m
                      {preset.ropeMarginM > 0 ? ` (스트링 +${preset.ropeMarginM}m)` : ''}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                </button>
              ))}
            </div>

            {/* Custom Gear Form */}
            <form onSubmit={handleAddCustomGear} className="pt-2 border-t border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-300">내 텐트 직접 입력 추가</p>
              <input
                type="text"
                placeholder="예: 코오롱 슈퍼팰리스"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="가로(m)"
                  value={customWidthM}
                  onChange={(e) => setCustomWidthM(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="세로(m)"
                  value={customLengthM}
                  onChange={(e) => setCustomLengthM(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 border border-slate-700 transition"
              >
                + 커스텀 텐트 캔버스에 올리기
              </button>
            </form>
          </div>
        </section>

        {/* CENTER PANEL: Interactive 2D Pitching & Weather Canvas (6 cols) */}
        <section className="lg:col-span-6 flex flex-col space-y-3">
          {/* Smart Pitching Real-Time Alert Banners */}
          <div className="space-y-1.5">
            {analysis.bodyOutItems.length > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>[데크 이탈 경고]</strong>{' '}
                  {analysis.bodyOutItems.map((i) => i.name).join(', ')} 본체가 사이트 영역 밖으로 나갔습니다! 회전하거나 위치를 조정하세요.
                </span>
              </div>
            )}

            {analysis.endangeredTarps.length > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>[돌풍 & 타프 파손 경고]</strong> 예상 최대풍속이 <strong>{windGustMs}m/s</strong>입니다! 타프 폴대 파손 위험이 높으니 설치를 피하거나 메인폴 스트링을 2줄씩 보강하세요.
                </span>
              </div>
            )}

            {analysis.fireSparkWarning && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500/20 border border-orange-500/50 text-orange-200 text-xs">
                <Flame className="w-4 h-4 text-orange-400 shrink-0" />
                <span>
                  <strong>[불티(불빵) 위험!]</strong> 현재 바람이 화로대에서 텐트 방향으로 불고 있습니다. 화로대를 바람 아래쪽(풍하측)으로 옮기세요!
                </span>
              </div>
            )}

            {analysis.bodyOutItems.length === 0 &&
              analysis.endangeredTarps.length === 0 &&
              !analysis.fireSparkWarning && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>[스마트 피칭 양호]</strong> 모든 장비가 사이트 내에 안정적으로 배치되었으며 풍향 대비 화로대 안전거리도 확보되었습니다.
                  </span>
                </div>
              )}
          </div>

          {/* Canvas Container */}
          <div className="glass-card rounded-2xl p-4 flex-1 flex flex-col items-center justify-between relative overflow-hidden">
            {/* Top Bar inside Canvas: Compass, Wind Indicator, Selected Gear Controls */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 z-10">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>방위: 북쪽(N) 상단</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300 bg-sky-950/50 px-2.5 py-1 rounded-lg border border-sky-800/60">
                  <Wind className="w-4 h-4 text-sky-400" />
                  <span>돌풍 {windGustMs}m/s</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/50">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>태양 {sunHour}:00</span>
                </div>
              </div>

              {/* Selected Item Toolbar */}
              {selectedItem ? (
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700">
                  <span className="text-xs font-bold text-emerald-400 mr-1">{selectedItem.name}</span>
                  <button
                    onClick={() => rotateSelected(-15)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1"
                    title="반시계 15도 회전"
                  >
                    <RotateCw className="w-3.5 h-3.5 -scale-x-100" /> -15°
                  </button>
                  <button
                    onClick={() => rotateSelected(15)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1"
                    title="시계방향 15도 회전"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> +15°
                  </button>
                  <button
                    onClick={deleteSelected}
                    className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 ml-1"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-500">장비를 클릭해 드래그 이동 및 15° 회전하세요</span>
              )}
            </div>

            {/* Interactive 2D Board */}
            <div className="my-auto py-4 overflow-auto max-w-full flex items-center justify-center">
              <div
                ref={canvasRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onClick={() => setSelectedUid(null)}
                style={{
                  width: (siteWidthM + CANVAS_PADDING_M * 2) * SCALE_PX_PER_M,
                  height: (siteLengthM + CANVAS_PADDING_M * 2) * SCALE_PX_PER_M,
                }}
                className="canvas-ground relative rounded-xl border border-slate-700/60 shadow-inner select-none touch-none overflow-hidden"
              >
                {/* Animated Wind Streak Overlay (density & speed follow gust strength) */}
                <div
                  className="absolute -inset-1/2 pointer-events-none z-0 flex items-center justify-around"
                  style={{
                    transform: `rotate(${windDirDeg}deg)`,
                    opacity: Math.min(0.75, 0.2 + windGustMs / 24),
                  }}
                >
                  {Array.from({ length: 14 }).map((_, col) => (
                    <div
                      key={col}
                      className="wind-streak"
                      style={{
                        animationDuration: `${Math.max(0.9, 3.4 - windGustMs / 6)}s`,
                        animationDelay: `${(col % 5) * -0.55}s`,
                        marginTop: `${((col * 37) % 11) * 22 - 110}px`,
                      }}
                    />
                  ))}
                </div>

                {/* Sun Position Badge on Perimeter */}
                <div
                  className="absolute z-10 pointer-events-none flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-bold shadow"
                  style={{
                    left: '50%',
                    top: '14px',
                    transform: `translateX(-50%) rotate(${sunAzimuthDeg - 180}deg) translateY(6px)`,
                  }}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  햇빛 방향 ({sunHour}시)
                </div>

                {/* Compass Rose (north is always up) */}
                <div className="absolute top-2 right-2 z-10 pointer-events-none w-12 h-12 rounded-full bg-slate-950/70 border border-slate-600/70 flex items-center justify-center">
                  <span className="absolute top-0.5 text-[9px] font-extrabold text-rose-400">N</span>
                  <span className="absolute bottom-0.5 text-[9px] font-bold text-slate-400">S</span>
                  <span className="absolute left-1 text-[9px] font-bold text-slate-400">W</span>
                  <span className="absolute right-1 text-[9px] font-bold text-slate-400">E</span>
                  <div
                    className="w-0.5 h-6 rounded bg-gradient-to-b from-rose-400 to-slate-500"
                    style={{ transform: `rotate(${windDirDeg}deg)` }}
                    title={`바람이 향하는 방향 ${windDirDeg}°`}
                  />
                </div>

                {/* Scale Bar (1m = SCALE_PX_PER_M px) */}
                <div className="absolute bottom-2 left-3 z-10 pointer-events-none flex items-end gap-1.5 text-[10px] font-semibold text-slate-300">
                  <div
                    className="h-1.5 border-x border-b border-slate-300"
                    style={{ width: SCALE_PX_PER_M * 2 }}
                  />
                  <span>2m</span>
                </div>

                {/* Actual Site Boundary (Deck / Gravel / Grass) */}
                <div
                  style={{
                    left: CANVAS_PADDING_M * SCALE_PX_PER_M,
                    top: CANVAS_PADDING_M * SCALE_PX_PER_M,
                    width: siteWidthM * SCALE_PX_PER_M,
                    height: siteLengthM * SCALE_PX_PER_M,
                    ['--grid' as string]: `${SCALE_PX_PER_M}px`,
                  }}
                  className={`absolute rounded-lg transition-colors ${
                    surfaceType === 'deck'
                      ? 'surface-deck'
                      : surfaceType === 'gravel'
                      ? 'surface-gravel'
                      : 'surface-grass'
                  }`}
                >
                  <div className="absolute -top-6 left-0 text-xs font-bold text-slate-300 flex items-center gap-2">
                    <span>
                      사이트 영역: {siteWidthM}m × {siteLengthM}m (
                      {surfaceType === 'deck' ? '우드 데크' : surfaceType === 'gravel' ? '파쇄석' : '잔디/노지'})
                    </span>
                    <span className="text-[11px] text-slate-500">(격자 1칸 = 1m × 1m)</span>
                  </div>
                </div>

                {/* Power Line Visualizer (if Power Box & Tent exist) */}
                {(() => {
                  const pBox = items.find((i) => i.id === 'power-box');
                  const mainTent = items.find((i) => i.category === 'tent');
                  if (!pBox || !mainTent) return null;
                  const x1 = (pBox.xM + CANVAS_PADDING_M) * SCALE_PX_PER_M;
                  const y1 = (pBox.yM + CANVAS_PADDING_M) * SCALE_PX_PER_M;
                  const x2 = (mainTent.xM + CANVAS_PADDING_M) * SCALE_PX_PER_M;
                  const y2 = (mainTent.yM + CANVAS_PADDING_M) * SCALE_PX_PER_M;
                  return (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#eab308"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    </svg>
                  );
                })()}

                {/* Placed Gear Items */}
                {items.map((item) => {
                  const bodyOut = isBodyOutOfSite(item);
                  const ropeOut = isRopeOutOfSite(item);
                  const isTarpDanger = item.category === 'tarp' && windGustMs >= item.windLimitMs;
                  const isSelected = item.uid === selectedUid;

                  const centerPxX = (item.xM + CANVAS_PADDING_M) * SCALE_PX_PER_M;
                  const centerPxY = (item.yM + CANVAS_PADDING_M) * SCALE_PX_PER_M;
                  const widthPx = item.widthM * SCALE_PX_PER_M;
                  const lengthPx = item.lengthM * SCALE_PX_PER_M;
                  const ropePx = item.ropeMarginM * SCALE_PX_PER_M;

                  // Cast a shadow away from the sun; offset is rotated back into the item's local frame.
                  const sunRad = (sunAzimuthDeg * Math.PI) / 180;
                  const shadowLen = 5 + (18 * Math.abs(sunHour - 13)) / 5;
                  const sx = -Math.sin(sunRad) * shadowLen;
                  const sy = Math.cos(sunRad) * shadowLen;
                  const rot = (item.rotation * Math.PI) / 180;
                  const lx = sx * Math.cos(rot) + sy * Math.sin(rot);
                  const ly = -sx * Math.sin(rot) + sy * Math.cos(rot);
                  const shadow = `${lx.toFixed(1)}px ${ly.toFixed(1)}px ${(shadowLen * 0.9).toFixed(1)}px rgba(0,0,0,0.5)`;

                  return (
                    <div
                      key={item.uid}
                      onPointerDown={(e) => handlePointerDown(e, item)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        left: centerPxX - widthPx / 2,
                        top: centerPxY - lengthPx / 2,
                        width: widthPx,
                        height: lengthPx,
                        transform: `rotate(${item.rotation}deg)`,
                      }}
                      className={`absolute z-20 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center rounded-md transition-shadow ${
                        isSelected ? 'ring-2 ring-white shadow-xl' : 'shadow-md'
                      }`}
                    >
                      {/* Guyrope Safety Radius Box */}
                      {showGuyropes && item.ropeMarginM > 0 && (
                        <div
                          style={{
                            left: -ropePx,
                            top: -ropePx,
                            right: -ropePx,
                            bottom: -ropePx,
                          }}
                          className={`absolute rounded-lg border border-dashed pointer-events-none ${
                            ropeOut
                              ? 'border-amber-400 bg-amber-500/10'
                              : 'border-slate-400/50 bg-slate-100/5'
                          }`}
                        >
                          <span className="absolute top-0.5 left-1 text-[9px] text-slate-300/80">
                            스트링 영역 (+{item.ropeMarginM}m)
                          </span>
                        </div>
                      )}

                      {/* Main Gear Body */}
                      <div
                        style={{ backgroundColor: item.color, boxShadow: shadow }}
                        className={`gear-body ${
                          item.category === 'tent'
                            ? 'gear-tent'
                            : item.category === 'tarp'
                            ? 'gear-tarp'
                            : item.category === 'fire'
                            ? 'gear-round gear-fire'
                            : item.id === 'tree-obstacle'
                            ? 'gear-round'
                            : ''
                        } w-full h-full rounded-md border-2 flex flex-col items-center justify-center p-1 text-center relative ${
                          bodyOut
                            ? 'border-rose-500 ring-2 ring-rose-500/60'
                            : isTarpDanger
                            ? 'border-amber-400 ring-2 ring-amber-400/60'
                            : 'border-white/40'
                        }`}
                      >
                        {/* Front Entrance Indicator for Tents */}
                        {item.category === 'tent' && (
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-slate-950 text-emerald-300 text-[9px] font-bold rounded border border-emerald-400/60">
                            ▼ 출입구
                          </div>
                        )}

                        <span className="text-[11px] font-extrabold text-white drop-shadow leading-tight">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-white/90 font-medium">
                          {item.widthM}×{item.lengthM}m ({item.rotation}°)
                        </span>

                        {bodyOut && (
                          <span className="mt-0.5 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold">
                            데크 이탈!
                          </span>
                        )}
                        {!bodyOut && ropeOut && showGuyropes && (
                          <span className="mt-0.5 px-1.5 py-0.5 rounded bg-amber-600 text-white text-[9px] font-bold">
                            오징어펙 필요
                          </span>
                        )}
                        {isTarpDanger && (
                          <span className="mt-0.5 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold animate-pulse">
                            🌪️ 강풍 위험
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Weather & Sun Simulation Controls */}
            <div className="w-full pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 z-10">
              <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">💨 풍향 설정</span>
                  <span className="text-sky-400 font-bold">{windDirDeg}°</span>
                </div>
                <select
                  value={windDirDeg}
                  onChange={(e) => setWindDirDeg(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                >
                  {WIND_DIRECTIONS.map((w) => (
                    <option key={w.deg} value={w.deg}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">🌪️ 최대 순간풍속(돌풍)</span>
                  <span className={`font-bold ${windGustMs >= 9 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {windGustMs} m/s
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="18"
                  step="0.5"
                  value={windGustMs}
                  onChange={(e) => setWindGustMs(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">☀️ 태양 시간대 (그늘 확인)</span>
                  <span className="text-amber-400 font-bold">{sunHour}:00 시</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="18"
                  step="1"
                  value={sunHour}
                  onChange={(e) => setSunHour(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: 4 Camping Weather Indices & Auto Packing List (3 cols) */}
        <section className="lg:col-span-3 space-y-4 flex flex-col">
          {/* Weather Sliders (Temp & Humidity) */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-emerald-400" />
              3. 캠핑 기상 지수 시뮬레이션
            </h2>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">평지 예보 최저기온</span>
                  <span className="text-white font-semibold">{minTempC}℃</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="25"
                  value={minTempC}
                  onChange={(e) => setMinTempC(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">새벽 상대습도 (결로 연동)</span>
                  <span className="text-sky-300 font-semibold">{humidityPct}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={humidityPct}
                  onChange={(e) => setHumidityPct(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>
            </div>

            {/* 4 Major Indices Cards */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* 1. Wind / Peg Index */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                  <Wind className="w-3.5 h-3.5" /> 타프/팩다운 지수
                </div>
                <p className="text-sm font-bold text-white mt-1">
                  {windGustMs >= 11 ? '위험 (타프 금지)' : windGustMs >= 8 ? '주의 (보강 필수)' : '양호 (안정)'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">돌풍 {windGustMs}m/s 예보</p>
              </div>

              {/* 2. Condensation Index */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                  <Droplets className="w-3.5 h-3.5" /> 새벽 결로 지수
                </div>
                <p className="text-sm font-bold text-white mt-1">
                  {humidityPct >= 80 ? '매우 높음' : humidityPct >= 65 ? '보통' : '쾌적'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">이슬점 {analysis.dewPointC}℃</p>
              </div>

              {/* 3. Elevation Heating Index */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-400">
                  <Flame className="w-3.5 h-3.5" /> 고도보정 체감온도
                </div>
                <p className="text-sm font-bold text-white mt-1">{analysis.realFeelMinTempC}℃</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  해발 {selectedCampground.elevationM}m (-{analysis.elevationDropC}℃)
                </p>
              </div>

              {/* 4. Stargazing & Power Cord */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                  <Sparkles className="w-3.5 h-3.5" /> 별보기 / 릴선
                </div>
                <p className="text-sm font-bold text-white mt-1">별 지수 {analysis.starScore}점</p>
                <p className="text-[11px] text-amber-300 mt-0.5">
                  ⚡ 릴선: {analysis.maxPowerDistanceM ? `최소 ${analysis.maxPowerDistanceM}m` : '배전반 없음'}
                </p>
              </div>
            </div>
          </div>

          {/* Auto-Generated Smart Packing Checklist */}
          <div className="glass-card rounded-xl p-4 space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                4. 배치+날씨 맞춤 장비 추천
              </h2>
              <span className="text-[11px] text-emerald-400 font-semibold">자동 생성됨</span>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {analysis.checklist.map((c, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-xs transition ${
                    c.urgent
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-100'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>✓ {c.item}</span>
                    {c.urgent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">
                        필수 대비
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{c.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
