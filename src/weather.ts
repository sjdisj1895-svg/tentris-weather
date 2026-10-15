// Open-Meteo 무료 API (키 불필요): 7일 예보, 장소 검색(지오코딩)

export interface Place {
  name: string;
  region: string;
  lat: number;
  lon: number;
}

export interface DayForecast {
  date: string; // YYYY-MM-DD
  dayLabel: string; // 오늘 / 내일 / 모레 / 토 ...
  dateLabel: string; // 10/18
  code: number;
  tMinC: number;
  tMaxC: number;
  gustMs: number;
  windToDeg: number; // 바람이 "향하는" 방향 (0=북, 90=동, 180=남, 270=서)
  rainProbPct: number;
  rainMm: number;
  humidityDawnPct: number;
  cloudEveningPct: number;
}

export interface Forecast {
  elevationM: number;
  days: DayForecast[];
}

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

export function weatherCodeInfo(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: '맑음' };
  if (code <= 2) return { emoji: '🌤️', label: '구름 조금' };
  if (code === 3) return { emoji: '☁️', label: '흐림' };
  if (code === 45 || code === 48) return { emoji: '🌫️', label: '안개' };
  if (code >= 51 && code <= 57) return { emoji: '🌦️', label: '이슬비' };
  if (code >= 61 && code <= 67) return { emoji: '🌧️', label: '비' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { emoji: '❄️', label: '눈' };
  if (code >= 80 && code <= 82) return { emoji: '🌦️', label: '소나기' };
  if (code >= 95) return { emoji: '⛈️', label: '천둥·번개' };
  return { emoji: '⛅', label: '구름 많음' };
}

export async function fetchForecast(lat: number, lon: number): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,wind_direction_10m_dominant',
    hourly: 'relative_humidity_2m,cloud_cover',
    wind_speed_unit: 'ms',
    timezone: 'Asia/Seoul',
    forecast_days: '7',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error(`weather http ${res.status}`);
  const data = await res.json();
  const daily = data?.daily;
  const hourly = data?.hourly;
  if (!daily?.time) throw new Error('weather: unexpected response');

  const days: DayForecast[] = (daily.time as string[]).map((date, i) => {
    const d = new Date(`${date}T00:00:00`);
    const dayLabel =
      i === 0 ? '오늘' : i === 1 ? '내일' : i === 2 ? '모레' : d.toLocaleDateString('ko-KR', { weekday: 'short' });

    const humidityDawn = num(hourly?.relative_humidity_2m?.[i * 24 + 5], 70);
    let cloudSum = 0;
    let cloudN = 0;
    for (let h = 18; h <= 23; h++) {
      const v = hourly?.cloud_cover?.[i * 24 + h];
      if (typeof v === 'number') {
        cloudSum += v;
        cloudN++;
      }
    }

    // API의 풍향은 "불어오는 쪽"이라 180°를 더해 "향하는 쪽"으로 바꿉니다.
    const windFrom = num(daily.wind_direction_10m_dominant?.[i], 0);

    return {
      date,
      dayLabel,
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      code: num(daily.weather_code?.[i], 0),
      tMinC: Math.round(num(daily.temperature_2m_min?.[i], 10)),
      tMaxC: Math.round(num(daily.temperature_2m_max?.[i], 20)),
      gustMs: Number(num(daily.wind_gusts_10m_max?.[i], 5).toFixed(1)),
      windToDeg: Math.round((windFrom + 180) % 360),
      rainProbPct: Math.round(num(daily.precipitation_probability_max?.[i], 0)),
      rainMm: Number(num(daily.precipitation_sum?.[i], 0).toFixed(1)),
      humidityDawnPct: Math.round(humidityDawn),
      cloudEveningPct: cloudN > 0 ? Math.round(cloudSum / cloudN) : 30,
    };
  });

  return { elevationM: Math.round(num(data.elevation, 0)), days };
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    name: q,
    count: '8',
    language: 'ko',
    countryCode: 'KR',
    format: 'json',
  });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  if (!res.ok) throw new Error(`geocoding http ${res.status}`);
  const data = await res.json();
  const results: any[] = data?.results ?? [];
  return results.map((r) => ({
    name: String(r.name),
    region: [r.admin1, r.admin2].filter(Boolean).join(' '),
    lat: Number(r.latitude),
    lon: Number(r.longitude),
  }));
}

/** 바람이 "향하는" 각도를 "○풍(○쪽에서 불어옴)" 문장으로 바꿔줍니다. */
export function windFromLabel(toDeg: number): string {
  const names = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  const fromDeg = (toDeg + 180) % 360;
  const idx = Math.round(fromDeg / 45) % 8;
  return `${names[idx]}쪽에서 불어옴`;
}
