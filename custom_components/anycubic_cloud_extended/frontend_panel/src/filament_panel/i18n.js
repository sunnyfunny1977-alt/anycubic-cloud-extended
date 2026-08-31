/**
 * Translation loading for the filament views.
 *
 * The JSON files are bundled at build time rather than fetched at runtime:
 * these views are now part of the Anycubic panel bundle, which is served as a
 * single file and has no directory of its own to fetch from. It also means
 * the same strings work inside the Lovelace card, which is loaded from a
 * completely different URL.
 */

import de from "./translations/de.json";
import en from "./translations/en.json";

const FALLBACK_LANGUAGE = "en";
const BUNDLED = { de, en };
const AVAILABLE = Object.keys(BUNDLED);

let strings = {};
let fallback = {};

/** Pick the best available file for a Home Assistant language code. */
function resolveLanguage(language) {
  if (!language) return FALLBACK_LANGUAGE;
  const lower = String(language).toLowerCase();
  if (AVAILABLE.includes(lower)) return lower;
  const base = lower.split("-")[0];
  return AVAILABLE.includes(base) ? base : FALLBACK_LANGUAGE;
}

/** Select the bundled dictionaries. Kept async for call-site compatibility. */
export async function loadTranslations(language) {
  const wanted = resolveLanguage(language);
  fallback = BUNDLED[FALLBACK_LANGUAGE];
  strings = BUNDLED[wanted] || fallback;
  return wanted;
}

/**
 * Translate a key, replacing {placeholders} with the given values.
 * Unknown keys fall back to English and finally to the key itself, so a missing
 * string is visible but never breaks the panel.
 */
export function t(key, params = {}) {
  const template = strings[key] ?? fallback[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(params, name) ? String(params[name]) : match
  );
}

/** Translate a backend error code into a readable message. */
export function translateError(error) {
  const code = error && error.code ? error.code : "unknown_error";
  const known = [
    "in_use",
    "not_found",
    "no_sealed_spools",
    "no_empty_weight",
    "duplicate",
    "invalid_data",
    "not_loaded",
    "unauthorized",
  ];
  if (known.includes(code)) return t(`error.${code}`);
  return t("error.generic", { message: (error && error.message) || code });
}
