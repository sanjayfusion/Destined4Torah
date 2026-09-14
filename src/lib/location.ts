export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Representative coordinates for common IANA time zones, used to approximate
 * "where the viewer is" without prompting for geolocation permission. Good
 * enough for a sunset estimate — within a time zone, actual sunset varies by
 * at most ~30-60 minutes from a zone's representative city.
 */
const TIMEZONE_COORDS: Record<string, Coordinates> = {
  'America/New_York': { latitude: 40.7128, longitude: -74.006 },
  'America/Chicago': { latitude: 41.8781, longitude: -87.6298 },
  'America/Denver': { latitude: 39.7392, longitude: -104.9903 },
  'America/Phoenix': { latitude: 33.4484, longitude: -112.074 },
  'America/Los_Angeles': { latitude: 34.0522, longitude: -118.2437 },
  'America/Anchorage': { latitude: 61.2181, longitude: -149.9003 },
  'Pacific/Honolulu': { latitude: 21.3069, longitude: -157.8583 },
  'America/Toronto': { latitude: 43.6532, longitude: -79.3832 },
  'America/Vancouver': { latitude: 49.2827, longitude: -123.1207 },
  'America/Mexico_City': { latitude: 19.4326, longitude: -99.1332 },
  'America/Sao_Paulo': { latitude: -23.5505, longitude: -46.6333 },
  'America/Argentina/Buenos_Aires': { latitude: -34.6037, longitude: -58.3816 },
  'Europe/London': { latitude: 51.5074, longitude: -0.1278 },
  'Europe/Paris': { latitude: 48.8566, longitude: 2.3522 },
  'Europe/Berlin': { latitude: 52.52, longitude: 13.405 },
  'Europe/Madrid': { latitude: 40.4168, longitude: -3.7038 },
  'Europe/Rome': { latitude: 41.9028, longitude: 12.4964 },
  'Europe/Amsterdam': { latitude: 52.3676, longitude: 4.9041 },
  'Europe/Moscow': { latitude: 55.7558, longitude: 37.6173 },
  'Asia/Jerusalem': { latitude: 31.7683, longitude: 35.2137 },
  'Asia/Dubai': { latitude: 25.2048, longitude: 55.2708 },
  'Asia/Kolkata': { latitude: 28.6139, longitude: 77.209 },
  'Asia/Shanghai': { latitude: 31.2304, longitude: 121.4737 },
  'Asia/Tokyo': { latitude: 35.6762, longitude: 139.6503 },
  'Asia/Seoul': { latitude: 37.5665, longitude: 126.978 },
  'Asia/Singapore': { latitude: 1.3521, longitude: 103.8198 },
  'Asia/Bangkok': { latitude: 13.7563, longitude: 100.5018 },
  'Australia/Sydney': { latitude: -33.8688, longitude: 151.2093 },
  'Australia/Melbourne': { latitude: -37.8136, longitude: 144.9631 },
  'Australia/Perth': { latitude: -31.9505, longitude: 115.8605 },
  'Pacific/Auckland': { latitude: -36.8485, longitude: 174.7633 },
  'Africa/Johannesburg': { latitude: -26.2041, longitude: 28.0473 },
  'Africa/Cairo': { latitude: 30.0444, longitude: 31.2357 },
}

const DEFAULT_COORDS: Coordinates = TIMEZONE_COORDS['America/New_York']

/**
 * Rough fallback when the viewer's exact time zone isn't in our table:
 * derive a longitude from the zone's current UTC offset (15° per hour) and
 * assume a mid-northern latitude, which matches most of the zones above.
 */
function estimateFromUtcOffset(): Coordinates {
  const offsetMinutes = -new Date().getTimezoneOffset()
  const longitude = Math.max(-180, Math.min(180, (offsetMinutes / 60) * 15))
  return { latitude: 40, longitude }
}

/** Best-effort guess at the viewer's location, from their browser time zone — no permission prompt required. */
export function getApproxCoordinates(): Coordinates {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return TIMEZONE_COORDS[timeZone] ?? estimateFromUtcOffset()
  } catch {
    return DEFAULT_COORDS
  }
}
