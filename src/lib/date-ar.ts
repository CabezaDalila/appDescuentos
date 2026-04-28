/**
 * Fechas en calendario local (Argentina): mostrar/editar como dd/mm/aaaa.
 */

function expandTwoDigitYear(y: number): number {
  if (y >= 100) return y;
  return 2000 + y;
}

function buildValidLocalDate(day: number, month: number, year: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (
    Number.isNaN(d.getTime()) ||
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

/** Parsea `YYYY-MM-DD` como fecha local (sin desfase UTC). */
export function parseIsoYmdLocal(input: string): Date | null {
  const m = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number.parseInt(m[1], 10);
  const mo = Number.parseInt(m[2], 10);
  const d = Number.parseInt(m[3], 10);
  return buildValidLocalDate(d, mo, y);
}

/**
 * Parsea `d/m/aa` o `dd/mm/aaaa` (día/mes/año).
 * Acepta año de 2 dígitos como 20xx (igual que scraping / admin legacy).
 */
export function parseDateDdMmYyyy(input: string): Date | null {
  const m = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const day = Number.parseInt(m[1], 10);
  const month = Number.parseInt(m[2], 10);
  const yearPart = Number.parseInt(m[3], 10);
  const year = expandTwoDigitYear(yearPart);
  return buildValidLocalDate(day, month, year);
}

export function formatDateDdMmYyyy(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear());
  return `${d}/${mo}/${y}`;
}

export function startOfTodayLocal(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

export function isDateOnOrAfterToday(date: Date): boolean {
  if (Number.isNaN(date.getTime())) return false;
  const t = startOfTodayLocal();
  const c = new Date(date);
  c.setHours(0, 0, 0, 0);
  return c.getTime() >= t.getTime();
}

/** Formulario admin: `dd/mm/aaaa` o `YYYY-MM-DD` (legado). */
export function parseAdminExpirationInput(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const fromSlash = parseDateDdMmYyyy(trimmed);
  if (fromSlash) return fromSlash;
  const fromIso = parseIsoYmdLocal(trimmed);
  if (fromIso) return fromIso;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
