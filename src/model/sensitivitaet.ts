/**
 * Sensitivitaetsanalyse (Tornado), Abschnitt 5.
 *
 * Laut Spezifikation die wichtigste Ansicht des Tools: sie beantwortet die
 * Frage "Welche Variable kippt das Modell am schnellsten?".
 *
 * Verfahren: Fuer jede Kernvariable wird das VOLLSTAENDIGE Modell mit -20 %
 * und +20 % neu gerechnet. Keine analytische Naeherung und keine lokale
 * Ableitung — nur so werden Schwelleneffekte (USt-Grenze, BBG, Kapazitaets-
 * ueberschreitung) sichtbar, und genau die interessieren hier.
 *
 * Sortiert wird nach der Spannweite |plus20 - minus20|, absteigend.
 *
 * Bezugsgroesse ist standardmaessig das Gesamtnetto des letzten Jahres im
 * Horizont; alternativ waehlbar ist die Summe ueber alle Jahre.
 */

import type { SensitivitaetsZeile, Szenario } from './typen';

export type Bezugsgroesse = 'letztes_jahr' | 'summe_horizont';

/** Wendet eine relative Auslenkung auf eine Variable an. Rein, ohne Mutation. */
export function lenkeAus(
  szenario: Szenario,
  variable: SensitivitaetsZeile['variable'],
  faktor: number,
): Szenario {
  void szenario; void variable; void faktor;
  throw new Error('lenkeAus: nicht implementiert');
}

export function berechneSensitivitaet(
  szenario: Szenario,
  bezug: Bezugsgroesse,
): readonly SensitivitaetsZeile[] {
  void szenario; void bezug;
  throw new Error('berechneSensitivitaet: nicht implementiert');
}
