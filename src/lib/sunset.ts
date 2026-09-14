const RAD = Math.PI / 180
const J2000 = 2451545.0
const DAY_MS = 86400000
const UNIX_EPOCH_JULIAN_DAY = 2440588

function toJulianDay(date: Date): number {
  return date.getTime() / DAY_MS - 0.5 + UNIX_EPOCH_JULIAN_DAY
}

function fromJulianDay(julianDay: number): Date {
  return new Date((julianDay + 0.5 - UNIX_EPOCH_JULIAN_DAY) * DAY_MS)
}

/**
 * Approximate UTC sunset for a given calendar date and location, via the
 * standard solar-position equations (mean anomaly -> ecliptic longitude ->
 * declination -> hour angle at the horizon). Accurate to within a few
 * minutes, which is plenty for a "time until holiday" display — this isn't
 * meant to substitute for a halachic zmanim calculation.
 */
export function getSunsetUtc(date: Date, latitude: number, longitude: number): Date {
  // Anchor to local noon of the given calendar day. The day-identification
  // step below rounds to the nearest whole solar day, and local midnight
  // sits right on that rounding boundary — a few thousandths of a day of
  // floating-point slop there is enough to attribute it to the wrong day.
  // Noon sits safely in the middle of the correct day instead.
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)

  const lw = -longitude * RAD
  const phi = latitude * RAD

  const meanSolarNoon = toJulianDay(noon) - J2000 - 0.0009 - lw / (2 * Math.PI)
  const solarDay = Math.round(meanSolarNoon)
  const approxNoon = J2000 + 0.0009 + lw / (2 * Math.PI) + solarDay

  const M = RAD * (357.5291 + 0.98560028 * (approxNoon - J2000))
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M))
  const eclipticLongitude = M + C + RAD * 102.9372 + Math.PI

  const solarTransit = approxNoon + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * eclipticLongitude)

  const declination = Math.asin(Math.sin(eclipticLongitude) * Math.sin(RAD * 23.4397))

  // -0.833° accounts for atmospheric refraction and the sun's radius, so
  // "sunset" means the disk fully below the horizon, not just its center.
  const cosHourAngle =
    (Math.sin(RAD * -0.833) - Math.sin(phi) * Math.sin(declination)) / (Math.cos(phi) * Math.cos(declination))
  const hourAngle = Math.acos(Math.min(1, Math.max(-1, cosHourAngle)))

  const sunsetJulianDay = solarTransit + hourAngle / (2 * Math.PI)

  return fromJulianDay(sunsetJulianDay)
}
