export type Zone = { label: string; tz: string };
export type TimezoneData = {
  /** The instant being converted (now when no time was given). */
  instant: Date | null;
  isNow: boolean;
  from: Zone;
  to: Zone | null;
  /** A place after "in"/"to" that isn't in the list, e.g. "Atlantis". */
  unknown: string | null;
};

/** Abbreviations and cities → IANA zones. Labels are what the card shows. */
const MANUAL: Record<string, Zone> = {
  pst: { label: "PT", tz: "America/Los_Angeles" },
  pdt: { label: "PT", tz: "America/Los_Angeles" },
  pt: { label: "PT", tz: "America/Los_Angeles" },
  "san francisco": { label: "San Francisco", tz: "America/Los_Angeles" },
  sf: { label: "San Francisco", tz: "America/Los_Angeles" },
  "los angeles": { label: "Los Angeles", tz: "America/Los_Angeles" },
  la: { label: "Los Angeles", tz: "America/Los_Angeles" },
  seattle: { label: "Seattle", tz: "America/Los_Angeles" },
  mst: { label: "MT", tz: "America/Denver" },
  denver: { label: "Denver", tz: "America/Denver" },
  cst: { label: "CT", tz: "America/Chicago" },
  chicago: { label: "Chicago", tz: "America/Chicago" },
  est: { label: "ET", tz: "America/New_York" },
  edt: { label: "ET", tz: "America/New_York" },
  et: { label: "ET", tz: "America/New_York" },
  "new york": { label: "New York", tz: "America/New_York" },
  nyc: { label: "New York", tz: "America/New_York" },
  toronto: { label: "Toronto", tz: "America/Toronto" },
  utc: { label: "UTC", tz: "UTC" },
  gmt: { label: "GMT", tz: "Europe/London" },
  london: { label: "London", tz: "Europe/London" },
  lisbon: { label: "Lisbon", tz: "Europe/Lisbon" },
  lisboa: { label: "Lisbon", tz: "Europe/Lisbon" },
  porto: { label: "Porto", tz: "Europe/Lisbon" },
  portugal: { label: "Portugal", tz: "Europe/Lisbon" },
  madrid: { label: "Madrid", tz: "Europe/Madrid" },
  barcelona: { label: "Barcelona", tz: "Europe/Madrid" },
  "são paulo": { label: "São Paulo", tz: "America/Sao_Paulo" },
  "sao paulo": { label: "São Paulo", tz: "America/Sao_Paulo" },
  bst: { label: "London", tz: "Europe/London" },
  cet: { label: "CET", tz: "Europe/Paris" },
  paris: { label: "Paris", tz: "Europe/Paris" },
  berlin: { label: "Berlin", tz: "Europe/Berlin" },
  amsterdam: { label: "Amsterdam", tz: "Europe/Amsterdam" },
  dubai: { label: "Dubai", tz: "Asia/Dubai" },
  ist: { label: "IST", tz: "Asia/Kolkata" },
  india: { label: "India", tz: "Asia/Kolkata" },
  mumbai: { label: "Mumbai", tz: "Asia/Kolkata" },
  delhi: { label: "Delhi", tz: "Asia/Kolkata" },
  bangalore: { label: "Bangalore", tz: "Asia/Kolkata" },
  bengaluru: { label: "Bengaluru", tz: "Asia/Kolkata" },
  singapore: { label: "Singapore", tz: "Asia/Singapore" },
  sgt: { label: "Singapore", tz: "Asia/Singapore" },
  "hong kong": { label: "Hong Kong", tz: "Asia/Hong_Kong" },
  tokyo: { label: "Tokyo", tz: "Asia/Tokyo" },
  jst: { label: "Tokyo", tz: "Asia/Tokyo" },
  seoul: { label: "Seoul", tz: "Asia/Seoul" },
  sydney: { label: "Sydney", tz: "Australia/Sydney" },
  aest: { label: "Sydney", tz: "Australia/Sydney" },
  auckland: { label: "Auckland", tz: "Pacific/Auckland" },
  // Big cities and countries without their own IANA name.
  "rio de janeiro": { label: "Rio de Janeiro", tz: "America/Sao_Paulo" },
  rio: { label: "Rio de Janeiro", tz: "America/Sao_Paulo" },
  brasilia: { label: "Brasília", tz: "America/Sao_Paulo" },
  brazil: { label: "Brazil", tz: "America/Sao_Paulo" },
  brt: { label: "Brazil", tz: "America/Sao_Paulo" },
  valencia: { label: "Valencia", tz: "Europe/Madrid" },
  seville: { label: "Seville", tz: "Europe/Madrid" },
  spain: { label: "Spain", tz: "Europe/Madrid" },
  munich: { label: "Munich", tz: "Europe/Berlin" },
  frankfurt: { label: "Frankfurt", tz: "Europe/Berlin" },
  hamburg: { label: "Hamburg", tz: "Europe/Berlin" },
  cologne: { label: "Cologne", tz: "Europe/Berlin" },
  germany: { label: "Germany", tz: "Europe/Berlin" },
  milan: { label: "Milan", tz: "Europe/Rome" },
  florence: { label: "Florence", tz: "Europe/Rome" },
  naples: { label: "Naples", tz: "Europe/Rome" },
  venice: { label: "Venice", tz: "Europe/Rome" },
  italy: { label: "Italy", tz: "Europe/Rome" },
  geneva: { label: "Geneva", tz: "Europe/Zurich" },
  switzerland: { label: "Switzerland", tz: "Europe/Zurich" },
  lyon: { label: "Lyon", tz: "Europe/Paris" },
  marseille: { label: "Marseille", tz: "Europe/Paris" },
  france: { label: "France", tz: "Europe/Paris" },
  manchester: { label: "Manchester", tz: "Europe/London" },
  edinburgh: { label: "Edinburgh", tz: "Europe/London" },
  glasgow: { label: "Glasgow", tz: "Europe/London" },
  uk: { label: "UK", tz: "Europe/London" },
  england: { label: "England", tz: "Europe/London" },
  cork: { label: "Cork", tz: "Europe/Dublin" },
  ireland: { label: "Ireland", tz: "Europe/Dublin" },
  rotterdam: { label: "Rotterdam", tz: "Europe/Amsterdam" },
  "the hague": { label: "The Hague", tz: "Europe/Amsterdam" },
  netherlands: { label: "Netherlands", tz: "Europe/Amsterdam" },
  antwerp: { label: "Antwerp", tz: "Europe/Brussels" },
  belgium: { label: "Belgium", tz: "Europe/Brussels" },
  krakow: { label: "Kraków", tz: "Europe/Warsaw" },
  poland: { label: "Poland", tz: "Europe/Warsaw" },
  "st petersburg": { label: "St Petersburg", tz: "Europe/Moscow" },
  greece: { label: "Greece", tz: "Europe/Athens" },
  sweden: { label: "Sweden", tz: "Europe/Stockholm" },
  norway: { label: "Norway", tz: "Europe/Oslo" },
  denmark: { label: "Denmark", tz: "Europe/Copenhagen" },
  finland: { label: "Finland", tz: "Europe/Helsinki" },
  austria: { label: "Austria", tz: "Europe/Vienna" },
  turkey: { label: "Turkey", tz: "Europe/Istanbul" },
  cest: { label: "CET", tz: "Europe/Paris" },
  boston: { label: "Boston", tz: "America/New_York" },
  miami: { label: "Miami", tz: "America/New_York" },
  atlanta: { label: "Atlanta", tz: "America/New_York" },
  washington: { label: "Washington", tz: "America/New_York" },
  dc: { label: "Washington", tz: "America/New_York" },
  philadelphia: { label: "Philadelphia", tz: "America/New_York" },
  "east coast": { label: "East Coast", tz: "America/New_York" },
  austin: { label: "Austin", tz: "America/Chicago" },
  dallas: { label: "Dallas", tz: "America/Chicago" },
  houston: { label: "Houston", tz: "America/Chicago" },
  cdt: { label: "CT", tz: "America/Chicago" },
  mdt: { label: "MT", tz: "America/Denver" },
  "san diego": { label: "San Diego", tz: "America/Los_Angeles" },
  "las vegas": { label: "Las Vegas", tz: "America/Los_Angeles" },
  "san jose": { label: "San Jose", tz: "America/Los_Angeles" },
  "silicon valley": { label: "Silicon Valley", tz: "America/Los_Angeles" },
  "west coast": { label: "West Coast", tz: "America/Los_Angeles" },
  montreal: { label: "Montreal", tz: "America/Toronto" },
  ottawa: { label: "Ottawa", tz: "America/Toronto" },
  calgary: { label: "Calgary", tz: "America/Edmonton" },
  hst: { label: "Hawaii", tz: "Pacific/Honolulu" },
  hawaii: { label: "Hawaii", tz: "Pacific/Honolulu" },
  mexico: { label: "Mexico", tz: "America/Mexico_City" },
  argentina: { label: "Argentina", tz: "America/Argentina/Buenos_Aires" },
  chile: { label: "Chile", tz: "America/Santiago" },
  colombia: { label: "Colombia", tz: "America/Bogota" },
  peru: { label: "Peru", tz: "America/Lima" },
  "cape town": { label: "Cape Town", tz: "Africa/Johannesburg" },
  durban: { label: "Durban", tz: "Africa/Johannesburg" },
  "south africa": { label: "South Africa", tz: "Africa/Johannesburg" },
  marrakech: { label: "Marrakech", tz: "Africa/Casablanca" },
  nigeria: { label: "Nigeria", tz: "Africa/Lagos" },
  kenya: { label: "Kenya", tz: "Africa/Nairobi" },
  egypt: { label: "Egypt", tz: "Africa/Cairo" },
  "tel aviv": { label: "Tel Aviv", tz: "Asia/Jerusalem" },
  israel: { label: "Israel", tz: "Asia/Jerusalem" },
  "abu dhabi": { label: "Abu Dhabi", tz: "Asia/Dubai" },
  uae: { label: "UAE", tz: "Asia/Dubai" },
  doha: { label: "Doha", tz: "Asia/Qatar" },
  "saudi arabia": { label: "Saudi Arabia", tz: "Asia/Riyadh" },
  hyderabad: { label: "Hyderabad", tz: "Asia/Kolkata" },
  chennai: { label: "Chennai", tz: "Asia/Kolkata" },
  pune: { label: "Pune", tz: "Asia/Kolkata" },
  beijing: { label: "Beijing", tz: "Asia/Shanghai" },
  shenzhen: { label: "Shenzhen", tz: "Asia/Shanghai" },
  guangzhou: { label: "Guangzhou", tz: "Asia/Shanghai" },
  china: { label: "China", tz: "Asia/Shanghai" },
  hkt: { label: "Hong Kong", tz: "Asia/Hong_Kong" },
  taiwan: { label: "Taiwan", tz: "Asia/Taipei" },
  osaka: { label: "Osaka", tz: "Asia/Tokyo" },
  kyoto: { label: "Kyoto", tz: "Asia/Tokyo" },
  japan: { label: "Japan", tz: "Asia/Tokyo" },
  korea: { label: "South Korea", tz: "Asia/Seoul" },
  "south korea": { label: "South Korea", tz: "Asia/Seoul" },
  kst: { label: "Seoul", tz: "Asia/Seoul" },
  thailand: { label: "Thailand", tz: "Asia/Bangkok" },
  vietnam: { label: "Vietnam", tz: "Asia/Ho_Chi_Minh" },
  hanoi: { label: "Hanoi", tz: "Asia/Ho_Chi_Minh" },
  "ho chi minh city": { label: "Ho Chi Minh City", tz: "Asia/Ho_Chi_Minh" },
  saigon: { label: "Ho Chi Minh City", tz: "Asia/Ho_Chi_Minh" },
  indonesia: { label: "Indonesia", tz: "Asia/Jakarta" },
  bali: { label: "Bali", tz: "Asia/Makassar" },
  philippines: { label: "Philippines", tz: "Asia/Manila" },
  malaysia: { label: "Malaysia", tz: "Asia/Kuala_Lumpur" },
  canberra: { label: "Canberra", tz: "Australia/Sydney" },
  "gold coast": { label: "Gold Coast", tz: "Australia/Brisbane" },
  aedt: { label: "Sydney", tz: "Australia/Sydney" },
  australia: { label: "Australia", tz: "Australia/Sydney" },
  "new zealand": { label: "New Zealand", tz: "Pacific/Auckland" },
  nzst: { label: "New Zealand", tz: "Pacific/Auckland" },
  nzdt: { label: "New Zealand", tz: "Pacific/Auckland" },
};

/** IANA city names that are also everyday words; typing "christmas" should not mean a time zone. */
const COMMON_WORDS = new Set([
  "center", "knox", "salem", "new salem", "easter", "wake", "troll", "casey", "palmer", "darwin", "christmas",
  "stanley", "reunion", "regina", "marengo", "monticello", "vevay", "winamac", "tell city", "beulah", "creston",
  "nome", "davis", "mawson", "vostok", "rothera", "syowa", "macquarie", "chatham", "midway", "yap", "truk",
  "phoenix", "victoria", "mendoza", "lindeman", "eucla", "broken hill", "currie", "lord howe", "mahe",
  "oral", "resolute", "cayenne", "chihuahua", "thule", "hovd", "rainy river", "swift current", "goose bay",
]);

const plain = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Every IANA zone named after a city ("America/Sao_Paulo" → "sao paulo"), unless the name is a common word. */
function ianaCities(): Record<string, Zone> {
  const out: Record<string, Zone> = {};
  let all: string[] = [];
  try {
    all = Intl.supportedValuesOf("timeZone");
  } catch {
    return out;
  }
  for (const tz of all) {
    if (!/^(America|Europe|Asia|Africa|Australia|Pacific|Atlantic|Indian)\//.test(tz)) continue;
    const city = tz.split("/").pop()!.replace(/_/g, " ");
    const key = plain(city);
    if (key.length < 3 || COMMON_WORDS.has(key)) continue;
    out[key] = { label: city, tz };
  }
  return out;
}

/** Abbreviations, cities and countries → IANA zones. Hand-written entries win over generated ones. */
export const ZONES: Record<string, Zone> = { ...ianaCities(), ...MANUAL };

const escape = (k: string) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const ZONE_PATTERN = Object.keys(ZONES)
  .sort((a, b) => b.length - a.length)
  .map(escape)
  .join("|");
const ZONE_RE = new RegExp(`\\b(${ZONE_PATTERN})\\b`, "gi");

export function localZone(): Zone {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return { label: "Local", tz };
}

/** Minutes the zone is ahead of UTC at that instant. */
export function tzOffset(tz: string, at: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/** Calendar date (y/m/d) of an instant as seen in a zone. */
function ymdIn(tz: string, at: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(at).map((x) => [x.type, x.value]),
  );
  return { y: +p.year, m: +p.month - 1, d: +p.day };
}

/** The instant when the wall clock in `tz` reads h:m on the zone's current date. */
export function wallTimeToInstant(tz: string, h: number, m: number, ref: Date) {
  const { y, m: mo, d } = ymdIn(tz, ref);
  const guess = Date.UTC(y, mo, d, h, m);
  let at = new Date(guess - tzOffset(tz, new Date(guess)) * 60_000);
  at = new Date(guess - tzOffset(tz, at) * 60_000); // settle across DST edges
  return at;
}

export function formatIn(tz: string, at: Date) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(at);
}

/** −1, 0 or +1: which day the target sees relative to the source. */
export function dayShift(fromTz: string, toTz: string, at: Date) {
  const a = ymdIn(fromTz, at);
  const b = ymdIn(toTz, at);
  return Math.sign(Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d));
}

export function parseTimezone(text: string, ref: Date = new Date()): TimezoneData {
  const t = plain(text);
  const hits = [...t.matchAll(ZONE_RE)].map((m) => ({ zone: ZONES[m[1]], index: m.index ?? 0 }));

  const time = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(\d{1,2}):(\d{2})\b|\b(noon|midnight)\b/);
  let hm: [number, number] | null = null;
  if (time) {
    if (time[6]) hm = time[6] === "noon" ? [12, 0] : [0, 0];
    else if (time[3]) {
      let h = Number(time[1]) % 12;
      if (time[3] === "pm") h += 12;
      hm = [h, Number(time[2] ?? 0)];
    } else hm = [Number(time[4]), Number(time[5])];
  }

  // "3pm pst in ist" → pst → ist.
  // One zone: "in/to tokyo" (or no time given) converts local → tokyo; "3pm pst" reads pst → local.
  let from: Zone;
  let to: Zone | null;
  if (hits.length >= 2) {
    from = hits[0].zone;
    to = hits[1].zone;
  } else if (hits.length === 1) {
    const before = t.slice(0, hits[0].index).trimEnd();
    const isTarget = /\b(?:in|to|into|for|at)$/.test(before) || !hm;
    from = isTarget ? localZone() : hits[0].zone;
    to = isTarget ? hits[0].zone : localZone();
  } else {
    from = localZone();
    to = null;
  }

  // "3pm lisbon to atlantis": say the place is unknown instead of quietly converting to local time.
  let unknown: string | null = null;
  const target = t.match(/\b(?:in|to|into)\s+([a-z][a-z .'-]{1,40}?)\s*\??\s*$/);
  if (target && target.index !== undefined && !hits.some((h) => h.index > target.index!) && !/^(now|the|my|your)\b/.test(target[1])) {
    unknown = target[1].replace(/\b\w/g, (c) => c.toUpperCase());
    to = null;
  }

  const instant = hm ? wallTimeToInstant(from.tz, hm[0], hm[1], ref) : ref;
  return { instant, isNow: !hm, from, to, unknown };
}

export function completeTimezone(d: TimezoneData) {
  return (d.to ? 0.7 : 0) + (d.isNow ? 0.1 : 0.3);
}
