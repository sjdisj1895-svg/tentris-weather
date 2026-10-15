import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, MapPin, RefreshCw, Sparkles } from 'lucide-react';
import { PLACE_TYPE_INFO, PlaceType } from '../campgrounds';
import { lookupPlace, PlaceLookupResult } from '../lookup';

export interface PickedPlace {
  name: string;
  region: string;
  lat: number;
  lon: number;
  kind: PlaceType;
}

interface Props {
  /** 위쪽 검색 입력칸의 글자를 그대로 씁니다. */
  query: string;
  onPick: (place: PickedPlace) => void;
  /** 값이 바뀔 때마다 검색을 자동으로 실행합니다. (일반 검색에 결과가 없을 때 이어서 AI가 찾게 함) */
  autoRun?: number;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

const BASIS_INFO: Record<PlaceLookupResult['basis'], { text: string; cls: string }> = {
  verified: { text: '찾은 위치를 지도 자료와 맞춰 보았어요', cls: 'bg-emerald-100 text-emerald-900' },
  address: { text: '주소로 찾은 위치예요 (몇백 m쯤 다를 수 있어요)', cls: 'bg-emerald-100 text-emerald-900' },
  area: { text: '동네·시군 중심 위치예요. 날씨는 비슷하지만 산·바다 가까운 곳은 조금 다를 수 있어요', cls: 'bg-amber-100 text-amber-900' },
  unchecked: { text: '다른 자료로 확인하지 못했어요. 지도 링크로 꼭 확인하세요', cls: 'bg-amber-100 text-amber-900' },
};

export default function PlaceLookup({ query, onPick, autoRun = 0 }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<PlaceLookupResult | null>(null);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const q = query.trim();

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = async () => {
    if (q.length < 2) {
      setError('위쪽 칸에 캠핑장 이름을 먼저 써 주세요. (예: 가평 자라섬 캠핑장)');
      setStatus('error');
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setError('');
    try {
      const r = await lookupPlace(q, controller.signal);
      if (controller.signal.aborted) return;
      setResult(r);
      setStatus('done');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'AI 검색을 하지 못했어요.');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (autoRun > 0) run();
    // run은 매 렌더마다 새로 만들어지므로 autoRun이 바뀔 때만 실행합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const sourceList = (r: PlaceLookupResult) =>
    r.sources.length > 0 && (
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

  const renderBody = () => {
    if (status === 'idle') return null;

    if (status === 'loading') {
      return (
        <div className="rounded-xl border-2 border-violet-300 bg-white px-4 py-4 text-base text-violet-900 flex items-center gap-3" role="status">
          <RefreshCw className="w-6 h-6 animate-spin shrink-0" />
          <span>
            인터넷에서 캠핑장을 찾는 중이에요…
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
          {q.length >= 2 && (
            <button type="button" onClick={run} className="h-12 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-base font-bold">
              다시 찾기
            </button>
          )}
        </div>
      );
    }

    const r = result!;
    if (!r.found || r.lat === null || r.lon === null) {
      return (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
          <p className="text-base font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" /> 캠핑장 위치를 찾지 못했어요
          </p>
          {r.notes && <p className="text-base text-slate-800 leading-relaxed">{r.notes}</p>}
          <p className="text-sm text-slate-600">이름을 더 자세히 쓰거나(예: "시·군 + 캠핑장 이름"), 위의 목록·동네 검색을 써 보세요.</p>
          {sourceList(r)}
          <button type="button" onClick={run} className="h-12 px-4 rounded-xl border-2 border-slate-300 bg-white text-base font-bold text-slate-700">
            다시 찾기
          </button>
        </div>
      );
    }

    const basis = BASIS_INFO[r.basis];
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lon}`;
    return (
      <div className="rounded-xl border-2 border-violet-300 bg-white p-4 space-y-3">
        <p className="text-base font-bold text-violet-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" /> AI가 찾았어요
        </p>

        <div>
          <p className="text-xl font-extrabold text-slate-900">
            {PLACE_TYPE_INFO[r.kind].emoji} {r.name}
          </p>
          {r.address && <p className="text-base text-slate-600">{r.address}</p>}
        </div>

        {!r.nameMatch && (
          <div className="rounded-lg bg-amber-50 border border-amber-300 px-3 py-2 text-base text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <span>
              입력하신 이름과 <strong>다른 곳일 수 있어요.</strong> 이름과 주소를 꼭 확인하세요.
            </span>
          </div>
        )}

        <p className={`text-sm font-semibold rounded-lg px-3 py-2 ${basis.cls}`}>{basis.text}</p>
        {r.notes && <p className="text-base text-slate-800 leading-relaxed">{r.notes}</p>}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-sky-700 underline underline-offset-2 inline-flex items-center gap-1">
            <MapPin className="w-4 h-4" /> 지도에서 위치 확인
          </a>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(`${r.name} ${r.address}`.trim())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold text-sky-700 underline underline-offset-2 inline-flex items-center gap-1"
          >
            <ExternalLink className="w-4 h-4" /> 구글로 검색해서 확인
          </a>
        </div>
        {sourceList(r)}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onPick({ name: r.name, region: r.address || '직접 찾은 곳', lat: r.lat!, lon: r.lon!, kind: r.kind })}
            className="h-12 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-base font-bold flex-1 min-w-[10rem]"
          >
            이 장소로 날씨 보기
          </button>
          <button type="button" onClick={run} className="h-12 px-4 rounded-xl border-2 border-slate-300 bg-white text-base font-bold text-slate-700">
            다시 찾기
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="rounded-2xl border-2 border-violet-300 bg-violet-50 p-3 space-y-3" aria-label="AI로 캠핑장 찾기">
      <button
        type="button"
        onClick={run}
        disabled={status === 'loading'}
        className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white px-4 py-3 text-left flex items-center gap-3"
      >
        <Sparkles className="w-7 h-7 shrink-0" />
        <span>
          <span className="block text-lg font-extrabold">AI로 캠핑장 찾기</span>
          <span className="block text-sm text-violet-100">위 칸에 캠핑장 이름을 쓰고 누르면, 전국 어느 캠핑장이든 인터넷에서 위치를 찾아 줘요.</span>
        </span>
      </button>
      {renderBody()}
    </section>
  );
}
