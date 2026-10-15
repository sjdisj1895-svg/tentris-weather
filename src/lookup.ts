import type { GearLookupResult, LookupType, PlaceLookupResult } from '../api/ai-lookup';

export type { GearLookupResult, PlaceLookupResult };

/** 서버(/api/ai-lookup)에 AI 검색을 요청합니다. 실패하면 화면에 보여줄 쉬운 말로 Error를 던집니다. */
async function postLookup(type: LookupType, query: string, signal?: AbortSignal): Promise<any> {
  let res: Response;
  try {
    res = await fetch('/api/ai-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, query }),
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new Error('인터넷 연결을 확인해 주세요.');
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* 본문이 JSON이 아닌 경우 아래에서 처리 */
  }
  if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'AI 검색을 하지 못했어요. 잠시 뒤에 다시 해 보세요.');
  return data;
}

export async function lookupGear(query: string, signal?: AbortSignal): Promise<GearLookupResult> {
  const data = await postLookup('gear', query, signal);
  if (!data?.gear) throw new Error('결과를 읽지 못했어요. 다시 해 보세요.');
  return data.gear as GearLookupResult;
}

export async function lookupPlace(query: string, signal?: AbortSignal): Promise<PlaceLookupResult> {
  const data = await postLookup('place', query, signal);
  if (!data?.place) throw new Error('결과를 읽지 못했어요. 다시 해 보세요.');
  return data.place as PlaceLookupResult;
}
