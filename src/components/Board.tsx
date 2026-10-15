import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sun } from 'lucide-react';
import { gearEmoji, PlacedItem } from '../presets';
import { BOARD_PADDING_M, isBodyOutOfSite, isRopeOutOfSite, SurfaceType } from '../analysis';

interface BoardProps {
  items: PlacedItem[];
  setItems: React.Dispatch<React.SetStateAction<PlacedItem[]>>;
  selectedUid: string | null;
  setSelectedUid: (uid: string | null) => void;
  siteWidthM: number;
  siteLengthM: number;
  surfaceType: SurfaceType;
  showRopes: boolean;
  windDirDeg: number;
  windGustMs: number;
  sunHour: number;
}

const SURFACE_LABEL: Record<SurfaceType, string> = { deck: '나무 데크', gravel: '파쇄석', grass: '잔디·흙' };

export default function Board(props: BoardProps) {
  const { items, setItems, selectedUid, setSelectedUid, siteWidthM, siteLengthM, surfaceType, showRopes } = props;
  const { windDirDeg, windGustMs, sunHour } = props;

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<{ uid: string; offsetX: number; offsetY: number } | null>(null);
  const [wrapW, setWrapW] = useState(640);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWrapW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 화면 폭에 맞춰 1m당 픽셀을 자동 조절 (가로 스크롤이 생기지 않게)
  const scale = Math.max(28, Math.min(80, (wrapW - 4) / (siteWidthM + BOARD_PADDING_M * 2)));
  const boardW = (siteWidthM + BOARD_PADDING_M * 2) * scale;
  const boardH = (siteLengthM + BOARD_PADDING_M * 2) * scale;

  const handlePointerDown = (e: React.PointerEvent, item: PlacedItem) => {
    e.stopPropagation();
    setSelectedUid(item.uid);
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    draggingRef.current = {
      uid: item.uid,
      offsetX: e.clientX - rect.left - (item.xM + BOARD_PADDING_M) * scale,
      offsetY: e.clientY - rect.top - (item.yM + BOARD_PADDING_M) * scale,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = draggingRef.current;
    if (!drag || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const xM = Number(((e.clientX - rect.left - drag.offsetX) / scale - BOARD_PADDING_M).toFixed(2));
    const yM = Number(((e.clientY - rect.top - drag.offsetY) / scale - BOARD_PADDING_M).toFixed(2));
    const limit = BOARD_PADDING_M - 0.3;
    setItems((prev) =>
      prev.map((it) =>
        it.uid === drag.uid
          ? {
              ...it,
              xM: Math.max(-limit, Math.min(siteWidthM + limit, xM)),
              yM: Math.max(-limit, Math.min(siteLengthM + limit, yM)),
            }
          : it
      )
    );
  };

  const stopDrag = () => {
    draggingRef.current = null;
  };

  // 해 위치: 동쪽(08시) → 남쪽(13시) → 서쪽(18시)
  const sunAz = 90 + ((sunHour - 8) / 10) * 180;
  const sunRad = (sunAz * Math.PI) / 180;
  const sunX = boardW / 2 + Math.sin(sunRad) * (boardW / 2 - 26);
  const sunY = boardH / 2 - Math.cos(sunRad) * (boardH / 2 - 26);
  const shadowLen = 5 + (18 * Math.abs(sunHour - 13)) / 5;

  const pBox = items.find((i) => i.id === 'power-box');
  const mainTent = items.find((i) => i.category === 'tent');

  return (
    <div ref={wrapRef} className="w-full flex justify-center">
      <div
        ref={boardRef}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onPointerLeave={stopDrag}
        onClick={() => setSelectedUid(null)}
        style={{ width: boardW, height: boardH }}
        className="canvas-ground relative rounded-xl border border-slate-300 shadow-inner select-none touch-pan-y overflow-hidden"
      >
        {/* 바람 줄기 */}
        <div
          className="absolute -inset-1/2 pointer-events-none z-0 flex items-center justify-around"
          style={{ transform: `rotate(${windDirDeg}deg)`, opacity: Math.min(0.8, 0.25 + windGustMs / 22) }}
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

        {/* 해 */}
        <div
          className="absolute z-10 pointer-events-none flex flex-col items-center"
          style={{ left: sunX, top: sunY, transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-9 h-9 rounded-full bg-amber-300 border-2 border-amber-500 flex items-center justify-center shadow-[0_0_22px_6px_rgba(251,191,36,0.55)]">
            <Sun className="w-5 h-5 text-amber-700" />
          </div>
          <span className="mt-0.5 text-[11px] font-bold text-amber-800 bg-white/80 rounded px-1">{sunHour}시 해</span>
        </div>

        {/* 나침반: 북쪽은 항상 위 / 파란 화살표는 바람이 가는 방향 */}
        <div className="absolute top-2 right-2 z-10 pointer-events-none w-14 h-14 rounded-full bg-white/85 border border-slate-300 flex items-center justify-center shadow">
          <span className="absolute top-0.5 text-[11px] font-extrabold text-rose-600">북</span>
          <span className="absolute bottom-0.5 text-[10px] font-bold text-slate-500">남</span>
          <span className="absolute left-1 text-[10px] font-bold text-slate-500">서</span>
          <span className="absolute right-1 text-[10px] font-bold text-slate-500">동</span>
          <ArrowUp className="w-6 h-6 text-sky-600" strokeWidth={3} style={{ transform: `rotate(${windDirDeg}deg)` }} />
        </div>

        {/* 축척 */}
        <div className="absolute bottom-2 left-3 z-10 pointer-events-none flex items-end gap-1.5 text-xs font-bold text-slate-700">
          <div className="h-2 border-x-2 border-b-2 border-slate-600" style={{ width: scale * 2 }} />
          <span>2m</span>
        </div>

        {/* 사이트(자리) */}
        <div
          style={{
            left: BOARD_PADDING_M * scale,
            top: BOARD_PADDING_M * scale,
            width: siteWidthM * scale,
            height: siteLengthM * scale,
            ['--grid' as string]: `${scale}px`,
          }}
          className={`absolute rounded-lg transition-colors ${
            surfaceType === 'deck' ? 'surface-deck' : surfaceType === 'gravel' ? 'surface-gravel' : 'surface-grass'
          }`}
        >
          <div className="absolute -top-7 left-0 text-sm font-bold text-slate-800 whitespace-nowrap">
            내 자리 {siteWidthM}m × {siteLengthM}m ({SURFACE_LABEL[surfaceType]})
          </div>
        </div>

        {/* 전기선 */}
        {pBox && mainTent && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <line
              x1={(pBox.xM + BOARD_PADDING_M) * scale}
              y1={(pBox.yM + BOARD_PADDING_M) * scale}
              x2={(mainTent.xM + BOARD_PADDING_M) * scale}
              y2={(mainTent.yM + BOARD_PADDING_M) * scale}
              stroke="#facc15"
              strokeWidth="3"
              strokeDasharray="6,5"
            />
          </svg>
        )}

        {/* 장비 */}
        {items.map((item) => {
          const bodyOut = isBodyOutOfSite(item, siteWidthM, siteLengthM);
          const ropeOut = isRopeOutOfSite(item, siteWidthM, siteLengthM);
          const windDanger = (item.category === 'tarp' || item.category === 'tent') && windGustMs >= item.windLimitMs;
          const selected = item.uid === selectedUid;

          const widthPx = item.widthM * scale;
          const lengthPx = item.lengthM * scale;
          const ropePx = item.ropeMarginM * scale;
          const small = Math.min(widthPx, lengthPx) < 70;

          // 해 반대 방향으로 그림자 (장비가 회전해도 그림자 방향이 유지되도록 보정)
          const sx = -Math.sin(sunRad) * shadowLen;
          const sy = Math.cos(sunRad) * shadowLen;
          const rot = (item.rotation * Math.PI) / 180;
          const lx = sx * Math.cos(rot) + sy * Math.sin(rot);
          const ly = -sx * Math.sin(rot) + sy * Math.cos(rot);
          const shadow = `${lx.toFixed(1)}px ${ly.toFixed(1)}px ${(shadowLen * 0.9).toFixed(1)}px rgba(0,0,0,0.45)`;

          return (
            <div
              key={item.uid}
              onPointerDown={(e) => handlePointerDown(e, item)}
              onClick={(e) => e.stopPropagation()}
              title={item.name}
              style={{
                left: (item.xM + BOARD_PADDING_M) * scale - widthPx / 2,
                top: (item.yM + BOARD_PADDING_M) * scale - lengthPx / 2,
                width: widthPx,
                height: lengthPx,
                transform: `rotate(${item.rotation}deg)`,
              }}
              className={`absolute z-20 cursor-grab active:cursor-grabbing touch-none rounded-md ${
                selected ? 'ring-4 ring-sky-500 ring-offset-2 ring-offset-white/40' : ''
              }`}
            >
              {showRopes && item.ropeMarginM > 0 && (
                <div
                  style={{ left: -ropePx, top: -ropePx, right: -ropePx, bottom: -ropePx }}
                  className={`absolute rounded-lg border-2 border-dashed pointer-events-none ${
                    ropeOut ? 'border-amber-500 bg-amber-400/20' : 'border-slate-500/60 bg-white/10'
                  }`}
                />
              )}

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
                } w-full h-full rounded-md border-2 relative ${
                  bodyOut ? 'border-rose-600 ring-2 ring-rose-500/70' : windDanger ? 'border-amber-500 ring-2 ring-amber-400/70' : 'border-white/70'
                }`}
              >
                {/* 텐트 출입구: 앞쪽(아래) 초록 막대 */}
                {item.category === 'tent' && (
                  <div className="absolute -bottom-1.5 left-1/4 right-1/4 h-2 rounded bg-lime-300 border border-lime-700" />
                )}

                {/* 글자는 장비가 돌아가도 똑바로 보이게 반대로 회전 */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 leading-tight"
                  style={{ transform: `rotate(${-item.rotation}deg)` }}
                >
                  {small ? (
                    <span className="text-2xl drop-shadow">{gearEmoji(item)}</span>
                  ) : (
                    <>
                      <span className="text-sm font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">{item.name.split(' (')[0]}</span>
                      <span className="text-xs font-semibold text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                        {item.widthM}×{item.lengthM}m
                      </span>
                    </>
                  )}
                  {bodyOut && <span className="mt-0.5 px-1.5 rounded bg-rose-600 text-white text-xs font-bold">자리 밖!</span>}
                  {!bodyOut && ropeOut && showRopes && (
                    <span className="mt-0.5 px-1.5 rounded bg-amber-600 text-white text-xs font-bold">줄이 밖으로</span>
                  )}
                  {windDanger && <span className="mt-0.5 px-1.5 rounded bg-rose-600 text-white text-xs font-bold animate-pulse">강풍 위험</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
