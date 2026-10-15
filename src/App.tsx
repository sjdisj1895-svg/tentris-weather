import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Copy,
  Droplets,
  Info,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Search,
  ShieldAlert,
  Sparkles,
  Tent,
  Thermometer,
  Trash2,
  Wind,
  Zap,
} from 'lucide-react';
import Board from './components/Board';
import { analyze, BOARD_PADDING_M, Level, SurfaceType } from './analysis';
import { CAMPGROUNDS, PLACE_TYPE_INFO, REGION_GROUPS, RegionGroup } from './campgrounds';
import { GEAR_PRESETS, GearPreset, gearEmoji, PlacedItem } from './presets';
import { DayForecast, fetchForecast, Place, searchPlaces, weatherCodeInfo, windFromLabel } from './weather';

type Step = 1 | 2 | 3 | 4;
type WeatherStatus = 'idle' | 'loading' | 'ok' | 'error';
type GearTab = 'tent' | 'tarp' | 'etc';

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: '장소·날짜' },
  { n: 2, label: '자리 크기' },
  { n: 3, label: '장비 놓기' },
  { n: 4, label: '결과·준비물' },
];

const LEVEL_STYLE: Record<Level, { box: string; text: string; icon: React.ReactNode }> = {
  ok: { box: 'bg-emerald-50 border-emerald-300', text: 'text-emerald-900', icon: <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" /> },
  warn: { box: 'bg-amber-50 border-amber-300', text: 'text-amber-900', icon: <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0" /> },
  danger: { box: 'bg-rose-50 border-rose-300', text: 'text-rose-900', icon: <ShieldAlert className="w-7 h-7 text-rose-600 shrink-0" /> },
};

// 바람이 "불어오는 쪽" 기준으로 보여주고, 내부 값은 "향하는 방향"으로 저장
const WIND_OPTIONS = [
  { toDeg: 180, label: '북쪽에서 불어와요' },
  { toDeg: 225, label: '북동쪽에서 불어와요' },
  { toDeg: 270, label: '동쪽에서 불어와요' },
  { toDeg: 315, label: '남동쪽에서 불어와요' },
  { toDeg: 0, label: '남쪽에서 불어와요' },
  { toDeg: 45, label: '남서쪽에서 불어와요' },
  { toDeg: 90, label: '서쪽에서 불어와요' },
  { toDeg: 135, label: '북서쪽에서 불어와요' },
];

const SITE_PRESETS = [
  { label: '작은 자리', w: 4, l: 4 },
  { label: '보통 자리', w: 6, l: 4.5 },
  { label: '큰 자리', w: 8, l: 6 },
  { label: '아주 큰 자리', w: 10, l: 7 },
];

const SURFACES: { id: SurfaceType; emoji: string; label: string; hint: string }[] = [
  { id: 'deck', emoji: '🪵', label: '나무 데크', hint: '데크용 못(오징어펙)을 써요' },
  { id: 'gravel', emoji: '🪨', label: '파쇄석', hint: '길고 튼튼한 팩이 필요해요' },
  { id: 'grass', emoji: '🌿', label: '잔디·흙', hint: '일반 팩을 박을 수 있어요' },
];

const presetById = (id: string) => GEAR_PRESETS.find((g) => g.id === id)!;

const initialItems = (): PlacedItem[] => [
  { ...presetById('naturehike-dome'), uid: 'init-tent', xM: 2.4, yM: 2.25, rotation: 0 },
  { ...presetById('brazier-fire'), uid: 'init-fire', xM: 5.0, yM: 3.4, rotation: 0 },
  { ...presetById('power-box'), uid: 'init-power', xM: -0.6, yM: 0.5, rotation: 0 },
  { ...presetById('tree-obstacle'), uid: 'init-tree', xM: 5.5, yM: 0.6, rotation: 0 },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ---------- 작은 UI 조각 ----------
function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-sky-900">
      <Info className="w-5 h-5 mt-0.5 shrink-0 text-sky-600" />
      <p className="text-base leading-relaxed">{children}</p>
    </div>
  );
}

function SizeStepper(props: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  const { label, value, onChange, min, max } = props;
  const set = (v: number) => onChange(clamp(Number(v.toFixed(1)), min, max));
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
      <p className="text-base font-bold text-slate-700 mb-2">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => set(value - 0.5)}
          aria-label={`${label} 줄이기`}
          className="w-14 h-14 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center"
        >
          <Minus className="w-7 h-7" />
        </button>
        <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{value}m</span>
        <button
          onClick={() => set(value + 0.5)}
          aria-label={`${label} 늘리기`}
          className="w-14 h-14 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex items-center justify-center"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}

function IndexCard(props: { icon: React.ReactNode; title: string; level: Level; value: string; sub: string }) {
  const s = LEVEL_STYLE[props.level];
  return (
    <div className={`rounded-2xl border-2 p-4 ${s.box}`}>
      <div className={`flex items-center gap-2 text-base font-bold ${s.text}`}>
        {props.icon}
        {props.title}
      </div>
      <p className={`mt-1 text-xl font-extrabold ${s.text}`}>{props.value}</p>
      <p className="text-base text-slate-600 mt-0.5">{props.sub}</p>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState<Step>(1);

  // 1단계: 장소와 날씨
  const [place, setPlace] = useState<Place | null>(null);
  const [region, setRegion] = useState<RegionGroup | '전체'>('전체');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>('idle');
  const [days, setDays] = useState<DayForecast[]>([]);
  const [dayIdx, setDayIdx] = useState(0);
  const [elevationM, setElevationM] = useState(0);

  // 날씨 값 (예보에서 채워지고, 4단계에서 직접 고칠 수도 있음)
  const [windGustMs, setWindGustMs] = useState(6.5);
  const [windDirDeg, setWindDirDeg] = useState(135);
  const [minTempC, setMinTempC] = useState(10);
  const [humidityPct, setHumidityPct] = useState(70);
  const [cloudCoverPct, setCloudCoverPct] = useState(30);
  const [rainProbPct, setRainProbPct] = useState(10);
  const [rainMm, setRainMm] = useState(0);

  // 2단계: 자리
  const [siteWidthM, setSiteWidthM] = useState(6);
  const [siteLengthM, setSiteLengthM] = useState(4.5);
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('deck');
  const [showRopes, setShowRopes] = useState(true);

  // 3단계: 장비
  const [items, setItems] = useState<PlacedItem[]>(initialItems);
  const [selectedUid, setSelectedUid] = useState<string | null>('init-tent');
  const [gearTab, setGearTab] = useState<GearTab>('tent');
  const [sunHour, setSunHour] = useState(14);
  const [customName, setCustomName] = useState('');
  const [customWidthM, setCustomWidthM] = useState(3.2);
  const [customLengthM, setCustomLengthM] = useState(4.8);

  // 4단계
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // ---------- 날씨 ----------
  const applyDay = (d: DayForecast) => {
    setWindGustMs(d.gustMs);
    setWindDirDeg(d.windToDeg);
    setMinTempC(d.tMinC);
    setHumidityPct(d.humidityDawnPct);
    setCloudCoverPct(d.cloudEveningPct);
    setRainProbPct(d.rainProbPct);
    setRainMm(d.rainMm);
  };

  const loadPlace = async (p: Place) => {
    setPlace(p);
    setWeatherStatus('loading');
    try {
      const f = await fetchForecast(p.lat, p.lon);
      setDays(f.days);
      setElevationM(f.elevationM);
      setDayIdx(0);
      applyDay(f.days[0]);
      setWeatherStatus('ok');
    } catch (e) {
      console.error(e);
      setWeatherStatus('error');
    }
  };

  const pickDay = (i: number) => {
    setDayIdx(i);
    applyDay(days[i]);
  };

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    if (query.trim().length < 2) {
      setSearchError('두 글자 이상 입력해 주세요.');
      return;
    }
    setSearching(true);
    try {
      setSearchResults(await searchPlaces(query));
    } catch (err) {
      console.error(err);
      setSearchError('검색하지 못했어요. 인터넷 연결을 확인해 주세요.');
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  const useMyLocation = () => {
    setSearchError(null);
    if (!navigator.geolocation) {
      setSearchError('이 기기에서는 내 위치를 사용할 수 없어요.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => loadPlace({ name: '내 위치', region: '현재 위치 기준', lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setSearchError('위치를 가져오지 못했어요. 브라우저의 위치 허용을 확인해 주세요.'),
      { timeout: 10000 }
    );
  };

  // ---------- 장비 ----------
  const selectedItem = items.find((i) => i.uid === selectedUid) ?? null;

  const addGear = (preset: GearPreset) => {
    const uid = `${preset.id}-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      { ...preset, uid, xM: Number((siteWidthM / 2).toFixed(2)), yM: Number((siteLengthM / 2).toFixed(2)), rotation: 0 },
    ]);
    setSelectedUid(uid);
  };

  const addCustomTent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    addGear({
      id: 'custom-gear',
      brand: '직접 입력',
      name: customName.trim(),
      category: 'tent',
      widthM: customWidthM,
      lengthM: customLengthM,
      ropeMarginM: 0.9,
      windLimitMs: 12,
      color: '#6366f1',
      badge: '⛺ 내 텐트',
    });
    setCustomName('');
  };

  const updateSelected = (fn: (it: PlacedItem) => PlacedItem) => {
    if (!selectedUid) return;
    setItems((prev) => prev.map((it) => (it.uid === selectedUid ? fn(it) : it)));
  };

  const moveSelected = (dx: number, dy: number) => {
    const limit = BOARD_PADDING_M - 0.3;
    updateSelected((it) => ({
      ...it,
      xM: Number(clamp(it.xM + dx, -limit, siteWidthM + limit).toFixed(2)),
      yM: Number(clamp(it.yM + dy, -limit, siteLengthM + limit).toFixed(2)),
    }));
  };

  const rotateSelected = (deg: number) => updateSelected((it) => ({ ...it, rotation: (it.rotation + deg + 360) % 360 }));

  const deleteSelected = () => {
    if (!selectedUid) return;
    setItems((prev) => prev.filter((i) => i.uid !== selectedUid));
    setSelectedUid(null);
  };

  // ---------- 분석 ----------
  const analysis = useMemo(
    () =>
      analyze({ items, siteWidthM, siteLengthM, surfaceType, windGustMs, windDirDeg, minTempC, humidityPct, cloudCoverPct, rainProbPct, rainMm, elevationM }),
    [items, siteWidthM, siteLengthM, surfaceType, windGustMs, windDirDeg, minTempC, humidityPct, cloudCoverPct, rainProbPct, rainMm, elevationM]
  );

  const day = days[dayIdx] as DayForecast | undefined;
  const placeLabel = place ? place.name : '장소 미선택';
  const dateLabel = day ? `${day.dayLabel} (${day.dateLabel})` : '';

  const copySummary = async () => {
    const lines = [
      `⛺ 캠핑 준비 요약 - ${placeLabel}${dateLabel ? ` / ${dateLabel}` : ''}`,
      `결론: ${analysis.headline}`,
      `바람 ${windGustMs}m/s · 새벽 ${minTempC}℃ · 비 ${rainProbPct}% · 습도 ${humidityPct}%`,
      '',
      '[조심할 점]',
      ...(analysis.issues.length ? analysis.issues.map((i) => `- ${i.title}: ${i.detail}`) : ['- 특별히 없어요']),
      '',
      '[준비물]',
      ...analysis.checklist.map((c) => `- ${c.item} (${c.reason})`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('아래 내용을 복사해 주세요', lines.join('\n'));
    }
  };

  // ---------- 1단계 화면 ----------
  const localMatches = query.trim().length >= 1 ? CAMPGROUNDS.filter((c) => c.name.includes(query.trim())) : [];
  const visibleCampgrounds = CAMPGROUNDS.filter((c) => region === '전체' || c.region === region);

  const renderStep1 = () => (
    <div className="space-y-5">
      <Hint>
        가시려는 곳을 <strong>목록에서 누르거나</strong>, 동네·캠핑장 이름을 <strong>검색</strong>해 주세요. 장소를 고르면 날씨가 자동으로 나와요.
      </Hint>

      <form onSubmit={runSearch} className="card rounded-2xl p-4 space-y-3 no-print">
        <label htmlFor="place-q" className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Search className="w-6 h-6 text-emerald-600" /> 장소 찾기
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="place-q"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchResults(null);
            }}
            placeholder="예: 가평, 태안, 협재"
            className="flex-1 h-14 rounded-xl border-2 border-slate-300 px-4 text-lg focus:border-emerald-500 focus:outline-none"
          />
          <button type="submit" disabled={searching} className="h-14 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold disabled:opacity-60">
            {searching ? '찾는 중…' : '찾기'}
          </button>
          <button type="button" onClick={useMyLocation} className="h-14 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-lg font-bold flex items-center justify-center gap-2">
            <LocateFixed className="w-6 h-6" /> 내 위치
          </button>
        </div>
        {searchError && <p className="text-base font-semibold text-rose-600">{searchError}</p>}

        {(localMatches.length > 0 || (searchResults && searchResults.length > 0)) && (
          <div className="space-y-2 pt-1">
            {localMatches.map((c) => (
              <button
                key={c.name}
                onClick={() => loadPlace({ name: c.name, region: c.region, lat: c.lat, lon: c.lon })}
                className="w-full text-left rounded-xl border-2 border-slate-200 hover:border-emerald-400 bg-white px-4 py-3 text-lg font-semibold"
              >
                {PLACE_TYPE_INFO[c.type].emoji} {c.name} <span className="text-base font-normal text-slate-500">· {c.region}</span>
              </button>
            ))}
            {searchResults?.map((r) => (
              <button
                key={`${r.name}-${r.lat}-${r.lon}`}
                onClick={() => loadPlace(r)}
                className="w-full text-left rounded-xl border-2 border-slate-200 hover:border-emerald-400 bg-white px-4 py-3 text-lg font-semibold"
              >
                📍 {r.name} <span className="text-base font-normal text-slate-500">· {r.region}</span>
              </button>
            ))}
          </div>
        )}
        {searchResults && searchResults.length === 0 && localMatches.length === 0 && (
          <p className="text-base text-slate-600">검색 결과가 없어요. 더 큰 지명(예: 시·군 이름)으로 다시 찾아 보세요.</p>
        )}
      </form>

      <div className="card rounded-2xl p-4 space-y-3 no-print">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-emerald-600" /> 지역에서 고르기
        </h2>
        <div className="flex flex-wrap gap-2">
          {(['전체', ...REGION_GROUPS] as (RegionGroup | '전체')[]).map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`h-12 px-5 rounded-full text-base font-bold border-2 ${
                region === r ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
          {visibleCampgrounds.map((c) => {
            const active = place?.name === c.name;
            return (
              <button
                key={c.name}
                onClick={() => loadPlace({ name: c.name, region: c.region, lat: c.lat, lon: c.lon })}
                className={`text-left rounded-xl border-2 px-4 py-3 min-h-[64px] ${
                  active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <span className="block text-lg font-bold text-slate-900">{PLACE_TYPE_INFO[c.type].emoji} {c.name}</span>
                <span className="block text-sm text-slate-500">{c.region} · {PLACE_TYPE_INFO[c.type].label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-slate-500">위치는 지역 대표 지점 기준이에요. 정확한 캠핑장 동네는 위의 검색으로 찾아 주세요.</p>
      </div>

      {place && (
        <div className="card rounded-2xl p-4 space-y-3">
          <h2 className="text-lg font-bold text-slate-800">
            📅 언제 가세요? <span className="text-emerald-700">{place.name}</span>
            {weatherStatus === 'ok' && <span className="text-base font-normal text-slate-500"> · 해발 {elevationM}m</span>}
          </h2>

          {weatherStatus === 'loading' && (
            <p className="text-lg text-slate-600 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" /> 날씨를 불러오는 중이에요…
            </p>
          )}
          {weatherStatus === 'error' && (
            <div className="space-y-2">
              <p className="text-base font-semibold text-rose-600">날씨를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</p>
              <button onClick={() => loadPlace(place)} className="h-12 px-5 rounded-xl bg-emerald-600 text-white text-base font-bold">
                다시 시도
              </button>
            </div>
          )}
          {weatherStatus === 'ok' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {days.map((d, i) => {
                const w = weatherCodeInfo(d.code);
                const active = i === dayIdx;
                return (
                  <button
                    key={d.date}
                    onClick={() => pickDay(i)}
                    className={`rounded-xl border-2 p-2.5 text-center ${
                      active ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="text-lg font-extrabold text-slate-900">{d.dayLabel}</div>
                    <div className="text-sm text-slate-500">{d.dateLabel}</div>
                    <div className="text-3xl my-0.5">{w.emoji}</div>
                    <div className="text-sm font-semibold text-slate-700">{w.label}</div>
                    <div className="text-base font-bold text-slate-900">
                      <span className="text-sky-700">{d.tMinC}°</span> / <span className="text-rose-600">{d.tMaxC}°</span>
                    </div>
                    <div className="text-sm text-slate-600">☔ {d.rainProbPct}%</div>
                    <div className="text-sm text-slate-600">💨 {d.gustMs}m/s</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ---------- 2단계 화면 ----------
  const renderStep2 = () => (
    <div className="space-y-5">
      <Hint>
        예약한 자리(사이트)의 크기를 알려 주세요. 정확히 모르시면 <strong>아래 큰 버튼 중 가까운 것</strong>을 누르시면 돼요.
      </Hint>

      <div className="card rounded-2xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-slate-800">1. 자리 크기 (대략 이 정도예요)</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SITE_PRESETS.map((p) => {
            const active = p.w === siteWidthM && p.l === siteLengthM;
            return (
              <button
                key={p.label}
                onClick={() => {
                  setSiteWidthM(p.w);
                  setSiteLengthM(p.l);
                }}
                className={`rounded-xl border-2 py-4 px-2 text-center ${
                  active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <span className="block text-lg font-extrabold text-slate-900">{p.label}</span>
                <span className="block text-base text-slate-600">가로 {p.w}m × 세로 {p.l}m</span>
              </button>
            );
          })}
        </div>
        <p className="text-base font-semibold text-slate-700 pt-1">직접 맞추려면 − + 버튼을 누르세요</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SizeStepper label="가로 (옆으로 긴 쪽)" value={siteWidthM} onChange={setSiteWidthM} min={2.5} max={12} />
          <SizeStepper label="세로 (앞뒤로 깊은 쪽)" value={siteLengthM} onChange={setSiteLengthM} min={2.5} max={12} />
        </div>
      </div>

      <div className="card rounded-2xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-slate-800">2. 바닥은 어떤가요?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {SURFACES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSurfaceType(s.id)}
              className={`rounded-xl border-2 p-4 text-center ${
                surfaceType === s.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
            >
              <span className="block text-4xl">{s.emoji}</span>
              <span className="block text-lg font-extrabold text-slate-900 mt-1">{s.label}</span>
              <span className="block text-base text-slate-600">{s.hint}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 cursor-pointer">
          <span className="text-base font-semibold text-slate-800">텐트 줄이 닿는 범위를 점선으로 보기</span>
          <input type="checkbox" checked={showRopes} onChange={(e) => setShowRopes(e.target.checked)} className="w-7 h-7 accent-emerald-600" />
        </label>
      </div>
    </div>
  );

  // ---------- 3단계 화면 ----------
  const gearList = GEAR_PRESETS.filter((g) =>
    gearTab === 'tent' ? g.category === 'tent' : gearTab === 'tarp' ? g.category === 'tarp' : g.category !== 'tent' && g.category !== 'tarp'
  );

  const renderVerdict = (compact: boolean) => {
    const s = LEVEL_STYLE[analysis.level];
    return (
      <div className={`rounded-2xl border-2 p-4 ${s.box}`}>
        <div className="flex items-center gap-3">
          {s.icon}
          <p className={`text-xl font-extrabold ${s.text}`}>{analysis.headline}</p>
        </div>
        {!compact && analysis.issues.length === 0 && <p className="mt-2 text-base text-slate-700">장비 배치와 날씨 모두 걱정할 부분이 보이지 않아요.</p>}
        {analysis.issues.length > 0 && (
          <ul className="mt-3 space-y-2">
            {analysis.issues.map((i, idx) => (
              <li key={idx} className="rounded-xl bg-white/80 border border-white px-3.5 py-2.5">
                <p className={`text-lg font-bold ${LEVEL_STYLE[i.level].text}`}>
                  {i.level === 'danger' ? '⛔' : '⚠️'} {i.title}
                </p>
                <p className="text-base text-slate-700 leading-relaxed">{i.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-4">
      <Hint>
        <strong>① 오른쪽 아래 목록에서 장비를 눌러 추가</strong>하고, <strong>② 장비를 꾹 눌러 끌거나 방향 버튼</strong>으로 옮겨 보세요. 위험한 곳은 아래 빨간 글씨로 알려드려요.
      </Hint>

      <div className="flex flex-wrap gap-2 text-base font-semibold">
        <span className="rounded-full bg-sky-100 text-sky-900 px-3.5 py-1.5">💨 {windFromLabel(windDirDeg)} · {windGustMs}m/s</span>
        {day && <span className="rounded-full bg-slate-100 text-slate-800 px-3.5 py-1.5">{weatherCodeInfo(day.code).emoji} {dateLabel}</span>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-3">
          <div className="card rounded-2xl p-3 sm:p-4">
            <Board
              items={items}
              setItems={setItems}
              selectedUid={selectedUid}
              setSelectedUid={setSelectedUid}
              siteWidthM={siteWidthM}
              siteLengthM={siteLengthM}
              surfaceType={surfaceType}
              showRopes={showRopes}
              windDirDeg={windDirDeg}
              windGustMs={windGustMs}
              sunHour={sunHour}
            />
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600">
              <span>🟦 파란 줄기: 바람이 가는 방향</span>
              <span>🟩 장비 아래 초록 막대: 텐트 출입구</span>
              <span>⬜ 점선 네모: 텐트 줄이 닿는 범위</span>
              <span>🟨 노란 점선: 전기선 연결</span>
            </div>
          </div>

          <div className="card rounded-2xl p-4">
            <label className="flex items-center justify-between text-base font-bold text-slate-800 mb-1">
              <span>☀️ 해가 어디쯤 있을까요?</span>
              <span className="text-amber-700 text-xl">{sunHour}시</span>
            </label>
            <input type="range" min={8} max={18} value={sunHour} onChange={(e) => setSunHour(Number(e.target.value))} className="w-full h-10 accent-amber-500" />
            <p className="text-sm text-slate-500">장비 그림자가 드리운 쪽이 그늘이에요. 아침(8시)은 동쪽, 오후(18시)는 서쪽에 해가 있어요.</p>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-3">
          <div className="card rounded-2xl p-4 space-y-3">
            <h2 className="text-lg font-bold text-slate-800">
              선택한 장비 {selectedItem ? <span className="text-sky-700">· {selectedItem.name.split(' (')[0]}</span> : <span className="text-slate-400">· 없음</span>}
            </h2>
            {!selectedItem && <p className="text-base text-slate-600">캔버스의 장비나 아래 "놓인 장비"를 눌러 선택하세요.</p>}

            <div className={`grid grid-cols-[auto_auto_auto] gap-2 justify-center ${selectedItem ? '' : 'opacity-40 pointer-events-none'}`}>
              <span />
              <button onClick={() => moveSelected(0, -0.25)} aria-label="위로" className="w-16 h-16 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center">
                <ArrowUp className="w-8 h-8" />
              </button>
              <span />
              <button onClick={() => moveSelected(-0.25, 0)} aria-label="왼쪽으로" className="w-16 h-16 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center">
                <ArrowLeft className="w-8 h-8" />
              </button>
              <button onClick={() => moveSelected(0, 0.25)} aria-label="아래로" className="w-16 h-16 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center">
                <ArrowDown className="w-8 h-8" />
              </button>
              <button onClick={() => moveSelected(0.25, 0)} aria-label="오른쪽으로" className="w-16 h-16 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center">
                <ArrowRight className="w-8 h-8" />
              </button>
            </div>

            <div className={`grid grid-cols-2 gap-2 ${selectedItem ? '' : 'opacity-40 pointer-events-none'}`}>
              <button onClick={() => rotateSelected(-90)} className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 text-base font-bold flex items-center justify-center gap-1.5">
                <RotateCcw className="w-5 h-5" /> 왼쪽으로 90°
              </button>
              <button onClick={() => rotateSelected(90)} className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 text-base font-bold flex items-center justify-center gap-1.5">
                <RotateCw className="w-5 h-5" /> 오른쪽으로 90°
              </button>
              <button onClick={() => rotateSelected(-15)} className="h-12 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-base font-semibold">
                조금 왼쪽 (15°)
              </button>
              <button onClick={() => rotateSelected(15)} className="h-12 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-base font-semibold">
                조금 오른쪽 (15°)
              </button>
              <button onClick={deleteSelected} className="col-span-2 h-14 rounded-xl bg-rose-50 border-2 border-rose-200 hover:bg-rose-100 text-rose-700 text-base font-bold flex items-center justify-center gap-2">
                <Trash2 className="w-5 h-5" /> 이 장비 치우기
              </button>
            </div>

            {items.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <p className="text-base font-bold text-slate-700 mb-2">놓인 장비</p>
                <div className="flex flex-wrap gap-2">
                  {items.map((i) => (
                    <button
                      key={i.uid}
                      onClick={() => setSelectedUid(i.uid)}
                      className={`h-11 px-3 rounded-full border-2 text-base font-semibold ${
                        i.uid === selectedUid ? 'border-sky-500 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {gearEmoji(i)} {i.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card rounded-2xl p-4 space-y-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Tent className="w-6 h-6 text-emerald-600" /> 장비 꺼내기
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['tent', '⛺ 텐트'],
                ['tarp', '⛱️ 타프'],
                ['etc', '🚙 기타'],
              ] as [GearTab, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setGearTab(id)}
                  className={`h-12 rounded-xl border-2 text-base font-bold ${
                    gearTab === id ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {gearList.map((g) => (
                <button
                  key={g.id}
                  onClick={() => addGear(g)}
                  className="w-full flex items-center gap-3 rounded-xl border-2 border-slate-200 hover:border-emerald-400 bg-white px-3 py-3 text-left"
                >
                  <span className="text-3xl">{gearEmoji(g)}</span>
                  <span className="flex-1">
                    <span className="block text-base font-bold text-slate-900">{g.name}</span>
                    <span className="block text-sm text-slate-500">
                      {g.widthM}m × {g.lengthM}m
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 font-bold text-base">
                    <Plus className="w-5 h-5" /> 추가
                  </span>
                </button>
              ))}
            </div>

            {gearTab === 'tent' && (
              <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-base font-bold text-slate-800">내 텐트가 없나요? 크기를 직접 넣기</summary>
                <form onSubmit={addCustomTent} className="mt-3 space-y-2">
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="텐트 이름 (예: 코오롱 슈퍼팰리스)"
                    className="w-full h-12 rounded-xl border-2 border-slate-300 px-3 text-base"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-sm font-semibold text-slate-600">
                      가로(m)
                      <input type="number" step="0.1" min="0.5" value={customWidthM} onChange={(e) => setCustomWidthM(Number(e.target.value))} className="mt-1 w-full h-12 rounded-xl border-2 border-slate-300 px-3 text-base" />
                    </label>
                    <label className="text-sm font-semibold text-slate-600">
                      세로(m)
                      <input type="number" step="0.1" min="0.5" value={customLengthM} onChange={(e) => setCustomLengthM(Number(e.target.value))} className="mt-1 w-full h-12 rounded-xl border-2 border-slate-300 px-3 text-base" />
                    </label>
                  </div>
                  <button type="submit" className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-base font-bold">
                    내 텐트 올리기
                  </button>
                </form>
              </details>
            )}

            <button
              onClick={() => {
                setItems([]);
                setSelectedUid(null);
              }}
              className="w-full h-11 rounded-xl border border-slate-300 text-slate-600 text-base font-semibold hover:bg-slate-50"
            >
              모두 치우고 처음부터
            </button>
          </div>
        </div>
      </div>

      {renderVerdict(true)}
    </div>
  );

  // ---------- 4단계 화면 ----------
  const rainText = analysis.rainLevel === 'ok' ? '비 걱정 없어요' : analysis.rainLevel === 'warn' ? '비가 조금 올 수 있어요' : '비가 올 가능성이 커요';
  const windText = analysis.windLevel === 'ok' ? '안전해요' : analysis.windLevel === 'warn' ? '조심하세요' : '매우 위험해요';
  const coldText = analysis.coldLevel === 'ok' ? '포근해요' : analysis.coldLevel === 'warn' ? '쌀쌀해요' : '매우 추워요';
  const dewText = analysis.dewLevel === 'ok' ? '쾌적해요' : analysis.dewLevel === 'warn' ? '약간 젖을 수 있어요' : '많이 젖어요';

  const renderStep4 = () => (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-bold text-slate-800">
          📍 {placeLabel} {dateLabel && <span className="text-slate-500 font-semibold">· {dateLabel}</span>}
        </p>
        <div className="flex gap-2 no-print">
          <button onClick={copySummary} className="h-12 px-4 rounded-xl bg-yellow-300 hover:bg-yellow-200 text-slate-900 text-base font-bold flex items-center gap-2">
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? '복사했어요! 카톡에 붙여넣기' : '카톡으로 보내기용 복사'}
          </button>
          <button onClick={() => window.print()} className="h-12 px-4 rounded-xl bg-white border-2 border-slate-300 hover:bg-slate-50 text-base font-bold flex items-center gap-2">
            <Printer className="w-5 h-5" /> 인쇄
          </button>
        </div>
      </div>

      {renderVerdict(false)}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <IndexCard icon={<Wind className="w-5 h-5" />} title="바람" level={analysis.windLevel} value={windText} sub={`순간 ${windGustMs}m/s · ${windFromLabel(windDirDeg)}`} />
        <IndexCard icon={<CloudRain className="w-5 h-5" />} title="비" level={analysis.rainLevel} value={rainText} sub={`올 확률 ${rainProbPct}% · 예상 ${rainMm}mm`} />
        <IndexCard icon={<Thermometer className="w-5 h-5" />} title="새벽 기온" level={analysis.coldLevel} value={`${minTempC}℃ · ${coldText}`} sub={`해발 ${elevationM}m 지점 예보`} />
        <IndexCard icon={<Droplets className="w-5 h-5" />} title="텐트 안 이슬" level={analysis.dewLevel} value={dewText} sub={`습도 ${humidityPct}% · 이슬점 ${analysis.dewPointC}℃`} />
        <IndexCard
          icon={<Sparkles className="w-5 h-5" />}
          title="별 보기"
          level={analysis.starScore >= 70 ? 'ok' : analysis.starScore >= 40 ? 'warn' : 'danger'}
          value={`${analysis.starScore}점`}
          sub={`저녁 구름 ${cloudCoverPct}%`}
        />
        <IndexCard
          icon={<Zap className="w-5 h-5" />}
          title="전기 릴선"
          level={analysis.cordM !== null && analysis.cordM > 15 ? 'warn' : 'ok'}
          value={analysis.cordM !== null ? `약 ${analysis.cordM}m 필요` : '배전반 없음'}
          sub={analysis.cordM !== null ? '배전반~텐트 거리에 여유 포함' : '3단계에서 배전반을 놓으면 계산해요'}
        />
      </div>

      <div className="card rounded-2xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" /> 챙길 준비물 <span className="text-base font-normal text-slate-500">(챙기면 눌러서 체크하세요)</span>
        </h2>
        <ul className="space-y-2">
          {analysis.checklist.map((c) => {
            const on = !!checked[c.item];
            return (
              <li key={c.item}>
                <button
                  onClick={() => setChecked((prev) => ({ ...prev, [c.item]: !prev[c.item] }))}
                  className={`w-full flex items-start gap-3 rounded-xl border-2 px-3.5 py-3 text-left ${
                    on ? 'border-emerald-300 bg-emerald-50' : c.urgent ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <span className={`mt-0.5 w-8 h-8 shrink-0 rounded-lg border-2 flex items-center justify-center ${on ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-400'}`}>
                    {on && <Check className="w-5 h-5" strokeWidth={3} />}
                  </span>
                  <span className="flex-1">
                    <span className={`block text-lg font-bold ${on ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {c.item}
                      {c.urgent && !on && <span className="ml-2 align-middle text-sm px-2 py-0.5 rounded-full bg-amber-500 text-white">꼭 챙기세요</span>}
                    </span>
                    <span className="block text-base text-slate-600">{c.reason}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <details className="card rounded-2xl p-4 no-print">
        <summary className="cursor-pointer text-lg font-bold text-slate-800">⚙️ 날씨 수치를 직접 바꿔 보고 싶으세요? (눌러서 열기)</summary>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-base font-semibold text-slate-700">
            순간 바람 세기: <span className="text-sky-700 text-xl">{windGustMs}m/s</span>
            <input type="range" min={1} max={18} step={0.5} value={windGustMs} onChange={(e) => setWindGustMs(Number(e.target.value))} className="w-full h-10 accent-sky-500" />
          </label>
          <label className="block text-base font-semibold text-slate-700">
            바람 방향
            <select value={windDirDeg} onChange={(e) => setWindDirDeg(Number(e.target.value))} className="mt-1 w-full h-12 rounded-xl border-2 border-slate-300 px-3 text-base bg-white">
              {WIND_OPTIONS.map((w) => (
                <option key={w.toDeg} value={w.toDeg}>
                  {w.label}
                </option>
              ))}
              {!WIND_OPTIONS.some((w) => w.toDeg === windDirDeg) && <option value={windDirDeg}>{windFromLabel(windDirDeg)}</option>}
            </select>
          </label>
          <label className="block text-base font-semibold text-slate-700">
            새벽 기온: <span className="text-sky-700 text-xl">{minTempC}℃</span>
            <input type="range" min={-15} max={30} value={minTempC} onChange={(e) => setMinTempC(Number(e.target.value))} className="w-full h-10 accent-emerald-500" />
          </label>
          <label className="block text-base font-semibold text-slate-700">
            새벽 습도: <span className="text-sky-700 text-xl">{humidityPct}%</span>
            <input type="range" min={30} max={100} value={humidityPct} onChange={(e) => setHumidityPct(Number(e.target.value))} className="w-full h-10 accent-sky-500" />
          </label>
          <label className="block text-base font-semibold text-slate-700">
            비 올 확률: <span className="text-sky-700 text-xl">{rainProbPct}%</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={rainProbPct}
              onChange={(e) => {
                const v = Number(e.target.value);
                setRainProbPct(v);
                setRainMm(v >= 60 ? Math.max(rainMm, 10) : v >= 30 ? Math.max(Math.min(rainMm, 5), 1) : 0);
              }}
              className="w-full h-10 accent-sky-500"
            />
          </label>
          <label className="block text-base font-semibold text-slate-700">
            저녁 구름: <span className="text-sky-700 text-xl">{cloudCoverPct}%</span>
            <input type="range" min={0} max={100} value={cloudCoverPct} onChange={(e) => setCloudCoverPct(Number(e.target.value))} className="w-full h-10 accent-slate-500" />
          </label>
        </div>
      </details>
    </div>
  );

  // ---------- 화면 틀 ----------
  const canNext = step === 1 ? place !== null && weatherStatus !== 'loading' : true;
  const nextLabel = step < 4 ? STEPS[step].label : '';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="no-print border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-white shadow">
            <Tent className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
              텐트리스 웨더 <span className="brand-gradient">Tentris Weather</span>
            </h1>
            <p className="text-base text-slate-600 leading-tight">캠핑 자리 배치와 날씨를 한눈에 확인해요</p>
          </div>
          {place && weatherStatus === 'ok' && day && (
            <div className="hidden sm:block text-right text-base font-semibold text-slate-700">
              📍 {place.name}
              <br />
              {weatherCodeInfo(day.code).emoji} {dateLabel}
            </div>
          )}
        </div>

        <nav className="max-w-5xl mx-auto px-4 pb-3 grid grid-cols-4 gap-2" aria-label="진행 단계">
          {STEPS.map((s) => {
            const active = s.n === step;
            const done = s.n < step;
            return (
              <button
                key={s.n}
                onClick={() => setStep(s.n)}
                aria-current={active ? 'step' : undefined}
                className={`h-14 rounded-xl border-2 flex items-center justify-center gap-2 text-base font-bold px-1 ${
                  active
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow'
                    : done
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-300 text-slate-600'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${active ? 'bg-white text-emerald-700' : done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {done ? <Check className="w-4 h-4" strokeWidth={3} /> : s.n}
                </span>
                <span className="leading-tight">{s.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-5 pb-32">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-4">
          {step}단계. {step === 1 ? '어디로, 언제 가세요?' : step === 2 ? '자리(사이트) 크기를 알려 주세요' : step === 3 ? '장비를 자리에 놓아 보세요' : '결과와 준비물을 확인하세요'}
        </h2>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </main>

      <footer className="no-print fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setStep((s) => (Math.max(1, s - 1) as Step))}
            disabled={step === 1}
            className="h-14 px-5 rounded-xl border-2 border-slate-300 bg-white text-lg font-bold text-slate-700 flex items-center gap-1 disabled:opacity-30"
          >
            <ChevronLeft className="w-6 h-6" /> 이전
          </button>
          <div className="flex-1 text-center">
            {step === 1 && !place && (
              <button onClick={() => setStep(2)} className="text-base font-semibold text-slate-500 underline underline-offset-4">
                날씨 없이 배치만 해볼게요
              </button>
            )}
          </div>
          {step < 4 ? (
            <button
              onClick={() => setStep((s) => (Math.min(4, s + 1) as Step))}
              disabled={!canNext}
              className="h-14 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-extrabold flex items-center gap-1 shadow disabled:opacity-40"
            >
              다음: {nextLabel} <ChevronRight className="w-6 h-6" />
            </button>
          ) : (
            <button onClick={() => setStep(1)} className="h-14 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-lg font-extrabold">
              처음부터 다시
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
