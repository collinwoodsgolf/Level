/**
 * Weather service with multi-API fallback chain
 * Open-Meteo → NWS api.weather.gov → seasonal fallback
 */

import { WMO_DESC, WMO_PRECIP } from './ratingEngine';

/** Convert wind direction degrees → 16-point compass (N, NNE, NE, …) */
export function degToCompass(deg) {
  if (deg == null || isNaN(deg)) return '—';
  const pts = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return pts[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

const SEASONAL_AVG = [
  { temp: 32, hum: 60, wind: 10, gust: 18, dir: 290, desc: 'Winter' },
  { temp: 35, hum: 58, wind: 10, gust: 18, dir: 290, desc: 'Late winter' },
  { temp: 44, hum: 55, wind: 11, gust: 19, dir: 280, desc: 'Early spring' },
  { temp: 55, hum: 52, wind: 10, gust: 17, dir: 220, desc: 'Spring' },
  { temp: 66, hum: 55, wind: 9,  gust: 15, dir: 200, desc: 'Late spring' },
  { temp: 75, hum: 60, wind: 8,  gust: 13, dir: 210, desc: 'Early summer' },
  { temp: 82, hum: 62, wind: 7,  gust: 12, dir: 220, desc: 'Summer' },
  { temp: 80, hum: 63, wind: 7,  gust: 12, dir: 210, desc: 'Late summer' },
  { temp: 72, hum: 58, wind: 8,  gust: 14, dir: 230, desc: 'Early fall' },
  { temp: 60, hum: 55, wind: 9,  gust: 16, dir: 260, desc: 'Fall' },
  { temp: 48, hum: 58, wind: 10, gust: 17, dir: 280, desc: 'Late fall' },
  { temp: 36, hum: 60, wind: 10, gust: 18, dir: 290, desc: 'Early winter' },
];

function getSeasonalFallback() {
  const m = new Date().getMonth();
  const s = SEASONAL_AVG[m];
  return {
    wind_speed_mph: s.wind, wind_direction_deg: s.dir, wind_gusts_mph: s.gust,
    temperature_f: s.temp, humidity_pct: s.hum, precipitation: 'none',
    description: s.desc, source: 'Seasonal Average', live: false,
  };
}

async function tryOpenMeteo(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America/New_York`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const d = await resp.json();
    if (!d.current) throw new Error('No current data');
    const c = d.current;
    return {
      wind_speed_mph: Math.round(c.wind_speed_10m * 10) / 10,
      wind_direction_deg: c.wind_direction_10m,
      wind_gusts_mph: Math.round(c.wind_gusts_10m * 10) / 10,
      temperature_f: Math.round(c.temperature_2m * 10) / 10,
      humidity_pct: c.relative_humidity_2m,
      precipitation: WMO_PRECIP[c.weather_code] || 'none',
      description: WMO_DESC[c.weather_code] || 'Unknown',
      source: 'Open-Meteo', live: true,
    };
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

async function tryNWS(lat, lon) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const pts = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
      headers: { 'User-Agent': 'ATTESTED-App' }, signal: controller.signal,
    });
    if (!pts.ok) throw new Error(`NWS points ${pts.status}`);
    const pj = await pts.json();
    const stnUrl = pj.properties?.observationStations;
    if (!stnUrl) throw new Error('No station URL');
    const stns = await fetch(stnUrl, { headers: { 'User-Agent': 'ATTESTED-App' }, signal: controller.signal });
    const sj = await stns.json();
    const stn = sj.features?.[0]?.properties?.stationIdentifier;
    if (!stn) throw new Error('No station');
    const obs = await fetch(`https://api.weather.gov/stations/${stn}/observations/latest`, {
      headers: { 'User-Agent': 'ATTESTED-App' }, signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!obs.ok) throw new Error(`NWS obs ${obs.status}`);
    const oj = await obs.json();
    const p = oj.properties;
    const toF = c => c != null ? Math.round(c * 9 / 5 + 32) : null;
    const toMph = ms => ms != null ? Math.round(ms * 2.237 * 10) / 10 : null;
    const desc = p.textDescription || '';
    const hasRain = /rain|shower|drizzle/i.test(desc);
    const heavyRain = /heavy|thunder|storm/i.test(desc);
    return {
      wind_speed_mph: toMph(p.windSpeed?.value) || 8,
      wind_direction_deg: p.windDirection?.value || 220,
      wind_gusts_mph: toMph(p.windGust?.value) || 14,
      temperature_f: toF(p.temperature?.value) || 65,
      humidity_pct: p.relativeHumidity?.value != null ? Math.round(p.relativeHumidity.value) : 50,
      precipitation: heavyRain ? 'heavy_rain' : hasRain ? 'rain' : 'none',
      description: desc || 'NWS observation',
      source: 'NWS', live: true,
    };
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

export async function fetchWeather(lat, lon) {
  const apis = [
    { name: 'Open-Meteo', fn: () => tryOpenMeteo(lat, lon) },
    { name: 'NWS', fn: () => tryNWS(lat, lon) },
  ];
  for (const api of apis) {
    try {
      return await api.fn();
    } catch (e) {
      console.warn(`${api.name} failed:`, e.message);
    }
  }
  return getSeasonalFallback();
}
