/**
 * Zahlenformatierung, Sprache de-DE.
 *
 * Regel aus der Spezifikation: keine Nachkommastellen bei Betraegen ueber
 * 1.000 EUR. Darunter zwei Nachkommastellen, weil dort die Genauigkeit
 * inhaltlich traegt (Deckungsbeitrag je Wasserstunde, Beitragssaetze).
 *
 * Dieses Modul ist bewusst implementiert und getestet, waehrend der uebrige
 * Rechenkern nur als Signatur vorliegt: die Formatregel ist eine
 * Spezifikationsanforderung mit Interpretationsspielraum, und der ist hier
 * verbindlich festgelegt.
 */

const EURO_OHNE_NACHKOMMA = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const EURO_MIT_NACHKOMMA = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Schwelle, ab der Betraege ohne Nachkommastellen dargestellt werden. */
export const NACHKOMMA_SCHWELLE = 1000;

/** Betrag in EUR nach de-DE. Ueber 1.000 EUR ohne Nachkommastellen. */
export function euro(betrag: number): string {
  if (!Number.isFinite(betrag)) return '—';
  const format =
    Math.abs(betrag) > NACHKOMMA_SCHWELLE ? EURO_OHNE_NACHKOMMA : EURO_MIT_NACHKOMMA;
  return format.format(betrag);
}

/** Betrag mit explizitem Vorzeichen — fuer Differenzen zur Baseline. */
export function euroMitVorzeichen(betrag: number): string {
  if (!Number.isFinite(betrag)) return '—';
  const formatiert = euro(Math.abs(betrag));
  if (betrag > 0) return `+${formatiert}`;
  if (betrag < 0) return `−${formatiert}`;
  return formatiert;
}

/** Quote als Prozentangabe. 0,085 -> "8,5 %". */
export function prozent(quote: number, nachkommastellen = 1): string {
  if (!Number.isFinite(quote)) return '—';
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: nachkommastellen,
    maximumFractionDigits: nachkommastellen,
  }).format(quote);
}

/** Stundenangabe, eine Nachkommastelle. */
export function stunden(wert: number): string {
  if (!Number.isFinite(wert)) return '—';
  return `${new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(wert)} h`;
}

/** Ganze Zahl nach de-DE. */
export function zahl(wert: number, nachkommastellen = 0): string {
  if (!Number.isFinite(wert)) return '—';
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: nachkommastellen,
    maximumFractionDigits: nachkommastellen,
  }).format(wert);
}
