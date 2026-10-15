import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import { GearCategory, GearPreset } from '../presets';
import { GearLookupResult, lookupGear } from '../lookup';

interface Props {
  onSave: (preset: GearPreset) => void;
  onManual: (name: string) => void;
}

// 종류별 기본값 (줄 여유, 바람 한계, 색, 이모지)
const CATEGORY_INFO: Record<GearCategory, { label: string; emoji: string; color: string; rope: number; wind: number }> = {
  tent: { label: '텐트', emoji: '⛺', color: '#6366f1', rope: 0.8, wind: 12 },
  tarp: { label: '타프', emoji: '⛱️', color: '#f59e0b', rope: 1.1, wind: 8.5 },
  vehicle: { label: '차량', emoji: '🚙', color: '#64748b', rope: 0, wind: 99 },
  fire: { label: '화로·그릴', emoji: '🔥', color: '#ef4444', rope: 0, wind: 9 },
  furniture: { label: '가구', emoji: '🪑', color: '#a16207', rope: 0, wind: 99 },
  obstacle: { label: '시설·장애물', emoji: '🌲', color: '#15803d', rope: 0, wind: 99 },
};

const CONFIDENCE_TEXT: Record<GearLookupResult['confidence'], { text: string; cls: string }> = {
  high: { text: '판매 정보에 적혀 있어요', cls: 'bg-emerald-100 text-emerald-900' },
  medium: { text: '한 곳에서만 확인됐어요', cls: 'bg-amber-100 text-amber-900' },
  low: { text: '불확실해요. 꼭 직접 확인하세요', cls: 'bg-rose-100 text-rose-900' },
};

type Status = 'idle' | 'loading' | 'done' | 'error';

export default function GearLookup({ onSave, onManual }: Props) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<GearLookupResult | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [lengthCm, setLengthCm] = useState('');
  const [category, setCategory] = useState<GearCategory>('tent');
  const [formError, setFormError] = useState('');
  const [savedName, setSavedName] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const q = text.trim();

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = async () => {
    if (q.length < 2) {
      setError('장비 이름을 두 글자 이상 입력해 주세요.');
      setStatus('error');
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setSavedName('');
    setError('');
    setFormError('');
    try {
      const r = await lookupGear(q, controller.signal);
      if (controller.signal.aborted) return;
      setResult(r);
      setName(r.name);
      setCategory(r.category);
      setWidthCm(r.widthM !== null ? String(Math.round(r.widthM * 100)) : '');
      setLengthCm(r.lengthM !== null ? String(Math.round(r.lengthM * 100)) : '');
      setStatus('done');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'AI 검색을 하지 못했어요.');
      setStatus('error');
    }
  };

  const save = () => {
    const w = Number(widthCm);
    const l = Number(lengthCm);
    if (!name.trim()) return setFormError('이름을 입력해 주세요.');
    if (!(w >= 20 && w <= 1500 && l >= 20 && l <= 1500)) return setFormError('가로·세로는 20~1500cm 사이 숫자로 넣어 주세요.');
    const info = CATEGORY_INFO[category];
    onSave({
      id: `custom-${Date.now()}`,
      brand: result?.brand || 'AI 검색',
      name: name.trim().slice(0, 60),
      category,
      group: 'AI로 찾은 장비',
      keywords: `AI 검색 ${result?.brand ?? ''} ${result?.capacity ?? ''}`,
      widthM: Number((w / 100).toFixed(2)),
      lengthM: Number((l / 100).toFixed(2)),
      ropeMarginM: info.rope,
      windLimitMs: info.wind,
      color: info.color,
      badge: `${info.emoji} AI검색`,
    });
    // 저장하면 칸을 닫고 안내만 남깁니다.
    setSavedName(name.trim().slice(0, 60));
    setStatus('idle');
    setResult(null);
    setText('');
    setFormError('');
  };

  const renderBody = () => {
    if (status === 'idle') return null;

    if (status === 'loading') {
      return (
        <div className="rounded-xl border-2 border-violet-300 bg-white px-4 py-4 text-base text-violet-900 flex items-center gap-3" role="status">
          <RefreshCw className="w-6 h-6 animate-spin shrink-0" />
          <span>
            인터넷에서 찾는 중이에요…
            <span className="block text-sm text-violet-700">보통 10~30초 걸려요. 잠시만 기다려 주세요.</span>
          </span>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-4 space-y-3">
          <p className="text-base font-semibold text-rose-800 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" /> {error}
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={run} className="h-12 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-base font-bold">
              다시 찾기
            </button>
            <button onClick={() => onManual(q)} className="h-12 px-4 rounded-xl border-2 border-slate-300 bg-white text-base font-bold text-slate-700">
              크기 직접 넣기
            </button>
          </div>
        </div>
      );
    }

    const r = result!;
    const sourceList = r.sources.length > 0 && (
      <div>
        <p className="text-sm font-bold text-slate-700 mb-1">AI가 참고한 페이지 (눌러서 직접 확인해 보세요)</p>
        <ul className="space-y-1">
          {r.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-700 underline underline-offset-2 break-all inline-flex items-start gap-1">
                <ExternalLink className="w-4 h-4 mt-0.5 shrink-0" /> {s.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );

    if (!r.found) {
      return (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
          <p className="text-base font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" /> 정확한 크기를 찾지 못했어요
          </p>
          {r.notes && <p className="text-base text-slate-800 leading-relaxed">{r.notes}</p>}
          {sourceList}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onManual(q)} className="h-12 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-base font-bold">
              크기 직접 넣기
            </button>
            <button onClick={run} className="h-12 px-4 rounded-xl border-2 border-slate-300 bg-white text-base font-bold text-slate-700">
              다시 찾기
            </button>
          </div>
        </div>
      );
    }

    const conf = CONFIDENCE_TEXT[r.confidence];
    return (
      <div className="rounded-xl border-2 border-violet-300 bg-white p-4 space-y-3">
        <p className="text-base font-bold text-violet-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" /> AI가 찾았어요
          <span className={`ml-auto text-sm px-2.5 py-0.5 rounded-full font-semibold ${conf.cls}`}>{conf.text}</span>
        </p>

        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
          AI가 찾은 값이라 <strong>틀릴 수 있어요.</strong> 아래 페이지에서 확인하고, 다르면 숫자를 고쳐 주세요.
        </div>

        {r.notes && <p className="text-base text-slate-800 leading-relaxed">{r.notes}</p>}

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-600">
            이름
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full h-12 rounded-xl border-2 border-slate-300 px-3 text-base" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold text-slate-600">
              가로 (cm)
              <input type="number" inputMode="numeric" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} className="mt-1 w-full h-12 rounded-xl border-2 border-slate-300 px-3 text-base" />
            </label>
            <label className="block text-sm font-semibold text-slate-600">
              세로 (cm)
              <input type="number" inputMode="numeric" value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} className="mt-1 w-full h-12 rounded-xl border-2 border-slate-300 px-3 text-base" />
            </label>
          </div>
          <label className="block text-sm font-semibold text-slate-600">
            종류
            <select value={category} onChange={(e) => setCategory(e.target.value as GearCategory)} className="mt-1 w-full h-12 rounded-xl border-2 border-slate-300 px-3 text-base bg-white">
              {(Object.keys(CATEGORY_INFO) as GearCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_INFO[c].emoji} {CATEGORY_INFO[c].label}
                </option>
              ))}
            </select>
          </label>
          {r.capacity && <p className="text-sm text-slate-600">수용 인원: {r.capacity}</p>}
        </div>

        {sourceList}
        {formError && <p className="text-base font-semibold text-rose-600">{formError}</p>}

        <div className="flex flex-wrap gap-2">
          <button onClick={save} className="h-12 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-base font-bold flex-1 min-w-[10rem]">
            저장하고 자리에 올리기
          </button>
          <button onClick={run} className="h-12 px-4 rounded-xl border-2 border-slate-300 bg-white text-base font-bold text-slate-700">
            다시 찾기
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="rounded-2xl border-2 border-violet-300 bg-violet-50 p-3 space-y-3" aria-label="AI로 장비 규격 찾기">
      <div>
        <h3 className="text-lg font-extrabold text-violet-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-600" /> AI로 장비 규격 찾기
        </h3>
        <p className="text-sm text-violet-800 mt-0.5">목록에 없는 장비도 이름만 쓰면 인터넷에서 크기를 찾아 줘요.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예: 고투 머쉬룸 쉘터"
          aria-label="AI로 찾을 장비 이름"
          className="flex-1 min-w-0 h-12 rounded-xl border-2 border-violet-300 bg-white px-3 text-base focus:border-violet-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="h-12 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-base font-bold disabled:opacity-60 shrink-0"
        >
          찾기
        </button>
      </form>
      {savedName && status === 'idle' && (
        <p className="rounded-xl bg-emerald-50 border-2 border-emerald-300 px-3 py-2.5 text-base font-semibold text-emerald-900" role="status">
          ✓ "{savedName}"을(를) 자리에 올렸어요. 장비 목록의 "AI로 찾은 장비"에도 저장됐어요.
        </p>
      )}
      {renderBody()}
    </section>
  );
}
