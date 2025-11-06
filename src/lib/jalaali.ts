// Lightweight Gregorian -> Jalaali (Solar Hijri) conversion
// Derived from the well-known jalaali-js algorithm (MIT). This file implements
// a minimal conversion function used to display the solar date for trips.

export interface JalaaliDate { jy: number; jm: number; jd: number }

function div(a: number, b: number) { return Math.floor(a / b); }

function gregorianToJalaali(gy: number, gm: number, gd: number): JalaaliDate {
  const g_d_m = [0,31, (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0) ? 29 : 28,31,30,31,30,31,31,30,31,30,31];

  let gy2 = gy - 1600;
  let gm2 = gm - 1;
  let gd2 = gd - 1;

  let g_day_no = 365 * gy2 + div((gy2 + 3), 4) - div((gy2 + 99), 100) + div((gy2 + 399), 400);
  for (let i = 0; i < gm2; ++i) g_day_no += g_d_m[i+1];
  g_day_no += gd2;

  let j_day_no = g_day_no - 79;

  const j_np = div(j_day_no, 12053); // 12053 = 33*365 + 8
  j_day_no = j_day_no % 12053;

  let jy = 979 + 33 * j_np + 4 * div(j_day_no, 1461);
  j_day_no = j_day_no % 1461;

  if (j_day_no >= 366) {
    jy += div((j_day_no - 1), 365);
    j_day_no = (j_day_no - 1) % 365;
  }

  const jm_arr = [31,31,31,31,31,31,30,30,30,30,30,29];
  let jm = 0;
  let jd = 0;
  for (let i = 0; i < 11 && j_day_no >= jm_arr[i]; ++i) {
    j_day_no -= jm_arr[i];
    jm++;
  }
  jd = j_day_no + 1;

  return { jy, jm: jm + 1, jd };
}

export function formatJalaaliFromISO(iso: string): string {
  if (!iso) return '';
  // Accept formats like '2025-11-04T12:30' or full ISO with timezone
  // We'll derive the Jalaali date from the Gregorian date, but preserve the
  // literal time portion from the input string when present. This prevents
  // the time-of-day from being shifted by timezone conversions when showing
  // the Jalaali representation.
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';

  const gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();

  // Try to extract a literal HH:MM from the iso string (handles both
  // 'YYYY-MM-DDTHH:MM' and full ISO with seconds/timezone). If present, use
  // those hour/minute values directly so we don't shift them by timezone.
  const timeMatch = iso.match(/T(\d{2}):(\d{2})/);
  let hh: number, mm: number;
  if (timeMatch) {
    hh = Number(timeMatch[1]);
    mm = Number(timeMatch[2]);
  } else {
    hh = d.getHours();
    mm = d.getMinutes();
  }

  const j = gregorianToJalaali(gy, gm, gd);
  const pad = (n: number) => n.toString().padStart(2, '0');
  // Convert to 12-hour time with AM/PM
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${j.jy}-${pad(j.jm)}-${pad(j.jd)} ${pad(hour12)}:${pad(mm)} ${ampm}`;
}

export function formatJalaaliDateOnlyFromISO(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const j = gregorianToJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${j.jy}-${pad(j.jm)}-${pad(j.jd)}`;
}
