/**
 * A curated set of major cities, not the full ~400-zone IANA list — wide enough that
 * most visitors find their own city without scrolling forever, deliberately weighted
 * so Africa, Asia and South America get the same real coverage Europe and North
 * America usually do in tools like this, not an afterthought entry each.
 *
 * Every `zone` here is checked against real zone resolution (not just Node's bundled
 * `Intl.supportedValuesOf` enumeration, which still lists several pre-2022 aliases —
 * Asia/Calcutta, Asia/Kiev and the like still resolve, but the names below are the
 * current canonical ones, which is what a modern browser reports and what a visitor
 * searching by city actually expects to see).
 */
export interface CityEntry {
  readonly city: string;
  readonly country: string;
  readonly zone: string;
}

export const CITIES: readonly CityEntry[] = [
  // Africa
  { city: 'Lagos', country: 'Nigeria', zone: 'Africa/Lagos' },
  { city: 'Abuja', country: 'Nigeria', zone: 'Africa/Lagos' },
  { city: 'Cairo', country: 'Egypt', zone: 'Africa/Cairo' },
  { city: 'Nairobi', country: 'Kenya', zone: 'Africa/Nairobi' },
  { city: 'Johannesburg', country: 'South Africa', zone: 'Africa/Johannesburg' },
  { city: 'Cape Town', country: 'South Africa', zone: 'Africa/Johannesburg' },
  { city: 'Accra', country: 'Ghana', zone: 'Africa/Accra' },
  { city: 'Casablanca', country: 'Morocco', zone: 'Africa/Casablanca' },
  { city: 'Addis Ababa', country: 'Ethiopia', zone: 'Africa/Addis_Ababa' },
  { city: 'Kinshasa', country: 'DR Congo', zone: 'Africa/Kinshasa' },
  { city: 'Algiers', country: 'Algeria', zone: 'Africa/Algiers' },
  { city: 'Tunis', country: 'Tunisia', zone: 'Africa/Tunis' },
  { city: 'Dakar', country: 'Senegal', zone: 'Africa/Dakar' },
  { city: 'Kampala', country: 'Uganda', zone: 'Africa/Kampala' },
  { city: 'Dar es Salaam', country: 'Tanzania', zone: 'Africa/Dar_es_Salaam' },
  { city: 'Abidjan', country: 'Ivory Coast', zone: 'Africa/Abidjan' },
  { city: 'Khartoum', country: 'Sudan', zone: 'Africa/Khartoum' },

  // Middle East
  { city: 'Dubai', country: 'UAE', zone: 'Asia/Dubai' },
  { city: 'Riyadh', country: 'Saudi Arabia', zone: 'Asia/Riyadh' },
  { city: 'Tel Aviv', country: 'Israel', zone: 'Asia/Jerusalem' },
  { city: 'Istanbul', country: 'Turkey', zone: 'Europe/Istanbul' },
  { city: 'Doha', country: 'Qatar', zone: 'Asia/Qatar' },
  { city: 'Tehran', country: 'Iran', zone: 'Asia/Tehran' },
  { city: 'Baghdad', country: 'Iraq', zone: 'Asia/Baghdad' },
  { city: 'Amman', country: 'Jordan', zone: 'Asia/Amman' },
  { city: 'Beirut', country: 'Lebanon', zone: 'Asia/Beirut' },
  { city: 'Kuwait City', country: 'Kuwait', zone: 'Asia/Kuwait' },

  // Asia
  { city: 'Tokyo', country: 'Japan', zone: 'Asia/Tokyo' },
  { city: 'Shanghai', country: 'China', zone: 'Asia/Shanghai' },
  { city: 'Beijing', country: 'China', zone: 'Asia/Shanghai' },
  { city: 'Hong Kong', country: 'Hong Kong', zone: 'Asia/Hong_Kong' },
  { city: 'Singapore', country: 'Singapore', zone: 'Asia/Singapore' },
  { city: 'Seoul', country: 'South Korea', zone: 'Asia/Seoul' },
  { city: 'Mumbai', country: 'India', zone: 'Asia/Kolkata' },
  { city: 'New Delhi', country: 'India', zone: 'Asia/Kolkata' },
  { city: 'Bangalore', country: 'India', zone: 'Asia/Kolkata' },
  { city: 'Bangkok', country: 'Thailand', zone: 'Asia/Bangkok' },
  { city: 'Jakarta', country: 'Indonesia', zone: 'Asia/Jakarta' },
  { city: 'Manila', country: 'Philippines', zone: 'Asia/Manila' },
  { city: 'Kuala Lumpur', country: 'Malaysia', zone: 'Asia/Kuala_Lumpur' },
  { city: 'Karachi', country: 'Pakistan', zone: 'Asia/Karachi' },
  { city: 'Islamabad', country: 'Pakistan', zone: 'Asia/Karachi' },
  { city: 'Dhaka', country: 'Bangladesh', zone: 'Asia/Dhaka' },
  { city: 'Ho Chi Minh City', country: 'Vietnam', zone: 'Asia/Ho_Chi_Minh' },
  { city: 'Taipei', country: 'Taiwan', zone: 'Asia/Taipei' },
  { city: 'Yangon', country: 'Myanmar', zone: 'Asia/Yangon' },
  { city: 'Colombo', country: 'Sri Lanka', zone: 'Asia/Colombo' },
  { city: 'Kathmandu', country: 'Nepal', zone: 'Asia/Kathmandu' },
  { city: 'Almaty', country: 'Kazakhstan', zone: 'Asia/Almaty' },

  // Europe
  { city: 'London', country: 'United Kingdom', zone: 'Europe/London' },
  { city: 'Edinburgh', country: 'United Kingdom', zone: 'Europe/London' },
  { city: 'Paris', country: 'France', zone: 'Europe/Paris' },
  { city: 'Berlin', country: 'Germany', zone: 'Europe/Berlin' },
  { city: 'Madrid', country: 'Spain', zone: 'Europe/Madrid' },
  { city: 'Rome', country: 'Italy', zone: 'Europe/Rome' },
  { city: 'Amsterdam', country: 'Netherlands', zone: 'Europe/Amsterdam' },
  { city: 'Brussels', country: 'Belgium', zone: 'Europe/Brussels' },
  { city: 'Zurich', country: 'Switzerland', zone: 'Europe/Zurich' },
  { city: 'Vienna', country: 'Austria', zone: 'Europe/Vienna' },
  { city: 'Stockholm', country: 'Sweden', zone: 'Europe/Stockholm' },
  { city: 'Oslo', country: 'Norway', zone: 'Europe/Oslo' },
  { city: 'Copenhagen', country: 'Denmark', zone: 'Europe/Copenhagen' },
  { city: 'Helsinki', country: 'Finland', zone: 'Europe/Helsinki' },
  { city: 'Warsaw', country: 'Poland', zone: 'Europe/Warsaw' },
  { city: 'Prague', country: 'Czechia', zone: 'Europe/Prague' },
  { city: 'Budapest', country: 'Hungary', zone: 'Europe/Budapest' },
  { city: 'Athens', country: 'Greece', zone: 'Europe/Athens' },
  { city: 'Lisbon', country: 'Portugal', zone: 'Europe/Lisbon' },
  { city: 'Dublin', country: 'Ireland', zone: 'Europe/Dublin' },
  { city: 'Moscow', country: 'Russia', zone: 'Europe/Moscow' },
  { city: 'Kyiv', country: 'Ukraine', zone: 'Europe/Kyiv' },
  { city: 'Bucharest', country: 'Romania', zone: 'Europe/Bucharest' },

  // North America
  { city: 'New York', country: 'United States', zone: 'America/New_York' },
  { city: 'Boston', country: 'United States', zone: 'America/New_York' },
  { city: 'Miami', country: 'United States', zone: 'America/New_York' },
  { city: 'Atlanta', country: 'United States', zone: 'America/New_York' },
  { city: 'Washington, D.C.', country: 'United States', zone: 'America/New_York' },
  { city: 'Chicago', country: 'United States', zone: 'America/Chicago' },
  { city: 'Houston', country: 'United States', zone: 'America/Chicago' },
  { city: 'Dallas', country: 'United States', zone: 'America/Chicago' },
  { city: 'Denver', country: 'United States', zone: 'America/Denver' },
  { city: 'Los Angeles', country: 'United States', zone: 'America/Los_Angeles' },
  { city: 'San Francisco', country: 'United States', zone: 'America/Los_Angeles' },
  { city: 'Seattle', country: 'United States', zone: 'America/Los_Angeles' },
  { city: 'Honolulu', country: 'United States', zone: 'Pacific/Honolulu' },
  { city: 'Anchorage', country: 'United States', zone: 'America/Anchorage' },
  { city: 'Toronto', country: 'Canada', zone: 'America/Toronto' },
  { city: 'Montreal', country: 'Canada', zone: 'America/Toronto' },
  { city: 'Vancouver', country: 'Canada', zone: 'America/Vancouver' },
  { city: 'Mexico City', country: 'Mexico', zone: 'America/Mexico_City' },

  // South America
  { city: 'São Paulo', country: 'Brazil', zone: 'America/Sao_Paulo' },
  { city: 'Rio de Janeiro', country: 'Brazil', zone: 'America/Sao_Paulo' },
  { city: 'Buenos Aires', country: 'Argentina', zone: 'America/Argentina/Buenos_Aires' },
  { city: 'Santiago', country: 'Chile', zone: 'America/Santiago' },
  { city: 'Bogotá', country: 'Colombia', zone: 'America/Bogota' },
  { city: 'Lima', country: 'Peru', zone: 'America/Lima' },
  { city: 'Caracas', country: 'Venezuela', zone: 'America/Caracas' },
  { city: 'Montevideo', country: 'Uruguay', zone: 'America/Montevideo' },
  { city: 'Quito', country: 'Ecuador', zone: 'America/Guayaquil' },

  // Oceania
  { city: 'Sydney', country: 'Australia', zone: 'Australia/Sydney' },
  { city: 'Melbourne', country: 'Australia', zone: 'Australia/Melbourne' },
  { city: 'Brisbane', country: 'Australia', zone: 'Australia/Brisbane' },
  { city: 'Perth', country: 'Australia', zone: 'Australia/Perth' },
  { city: 'Adelaide', country: 'Australia', zone: 'Australia/Adelaide' },
  { city: 'Auckland', country: 'New Zealand', zone: 'Pacific/Auckland' },
  { city: 'Suva', country: 'Fiji', zone: 'Pacific/Fiji' },

  // Caribbean and Central America
  { city: 'Havana', country: 'Cuba', zone: 'America/Havana' },
  { city: 'Kingston', country: 'Jamaica', zone: 'America/Jamaica' },
  { city: 'San José', country: 'Costa Rica', zone: 'America/Costa_Rica' },
  { city: 'Panama City', country: 'Panama', zone: 'America/Panama' },
  { city: 'Santo Domingo', country: 'Dominican Republic', zone: 'America/Santo_Domingo' },
] as const;

/** A stable, URL-safe identifier — lowercase, accents stripped, comma-free — since
 *  the display label ("City, Country") is exactly the kind of string a comma-joined
 *  URL query param would misparse. */
export function citySlug(entry: Pick<CityEntry, 'city' | 'country'>): string {
  return `${entry.city}-${entry.country}`
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findCityBySlug(slug: string): CityEntry | undefined {
  return CITIES.find((entry) => citySlug(entry) === slug);
}
