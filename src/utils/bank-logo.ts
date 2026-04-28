import { BANKS } from "@/constants/membership";
import { normalizeBankKey } from "@/utils/membership-match";

/** Nombre canónico del listado BANKS o null si no coincide. */
export function resolveCanonicalBank(
  label: string
): (typeof BANKS)[number] | null {
  const key = normalizeBankKey(label);
  if (!key) return null;

  for (const bank of BANKS) {
    if (normalizeBankKey(bank) === key) return bank;
  }

  for (const bank of BANKS) {
    const bk = normalizeBankKey(bank);
    if (bk.length >= 4 && (key.includes(bk) || bk.includes(key))) {
      return bank;
    }
  }

  return null;
}

/** Bancos con archivo en `public/logos/bancos/<nombre>.svg` (ampliar al agregar SVGs). */
const BANK_LOGOS_AVAILABLE = new Set<(typeof BANKS)[number]>(["Galicia"]);

/** Ruta pública del logo solo si hay asset en el repo. */
export function resolveBankLogoPath(bankLabel: string): string | null {
  const canon = resolveCanonicalBank(bankLabel);
  if (!canon || !BANK_LOGOS_AVAILABLE.has(canon)) return null;
  return `/logos/bancos/${canon}.svg`;
}

/** Nombre corto para UI (sin prefijo "Banco "). */
export function bankDisplayName(bankLabel: string): string {
  const trimmed = bankLabel.trim();
  const canon = resolveCanonicalBank(trimmed);
  if (canon) return canon;
  return trimmed.replace(/^banco\s+/iu, "").trim() || trimmed;
}

const AVATAR_STYLES: { bg: string; text: string }[] = [
  { bg: "bg-violet-100", text: "text-violet-800" },
  { bg: "bg-sky-100", text: "text-sky-800" },
  { bg: "bg-emerald-100", text: "text-emerald-800" },
  { bg: "bg-amber-100", text: "text-amber-900" },
  { bg: "bg-rose-100", text: "text-rose-800" },
  { bg: "bg-indigo-100", text: "text-indigo-800" },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Iniciales y clases Tailwind para avatar sin logo. */
export function bankInitialsAvatar(bankLabel: string): {
  initials: string;
  className: string;
} {
  const display = bankDisplayName(bankLabel);
  const words = display.split(/\s+/).filter(Boolean);
  let initials = "";
  if (words.length >= 2) {
    initials = (
      words[0].charAt(0) + words[1].charAt(0)
    ).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    initials = words[0].slice(0, 2).toUpperCase();
  } else {
    initials = display.slice(0, 2).toUpperCase() || "?";
  }
  const idx = hashString(normalizeBankKey(display) || display) % AVATAR_STYLES.length;
  const { bg, text } = AVATAR_STYLES[idx];
  return { initials, className: `${bg} ${text}` };
}
