import type { GearLookupResult } from '../api/gear-lookup';

export type { GearLookupResult };

/** 서버(/api/gear-lookup)에 장비 규격 검색을 요청합니다. 실패하면 화면에 보여줄 쉬운 말로 Error를 던집니다. */
export async function lookupGear(query: string, signal?: AbortSignal): Promise<GearLookupResult> {
  let res: Response;
  try {
    res = await fetch('/api/gear-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
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
  if (!data?.result) throw new Error('결과를 읽지 못했어요. 다시 해 보세요.');
  return data.result as GearLookupResult;
}
