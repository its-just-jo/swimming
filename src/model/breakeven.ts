/**
 * Break-even je Reduktionsstufe, Abschnitt 5.
 *
 * Beantwortet Kernfrage 2 der Spezifikation: "Wie viele Kurseinheiten pro Woche
 * schliessen die Luecke, und passt das in mein Zeitbudget?"
 *
 * Verfahren je Stufe (100 / 80 / 60 / 50 / 0 %):
 *  1. Nettoluecke gegenueber der Vollzeit-Baseline ermitteln.
 *  2. Den NETTO-Deckungsbeitrag je Wasserstunde bestimmen — also nach
 *     Einkommensteuer und DRV-Beitrag. Der Bruttodeckungsbeitrag wuerde die
 *     benoetigte Stundenzahl systematisch unterschaetzen, weil die zusaetzliche
 *     Grenzbelastung bei diesem Gehaltsniveau erheblich ist.
 *  3. benoetigteStunden = Luecke / NettoDB je Stunde.
 *  4. Gegen das verfuegbare Zeitbudget der Stufe pruefen.
 *
 * Schritt 2 ist iterativ, weil der Gewinn die Grenzbelastung mitbestimmt:
 * Fixpunktiteration mit maximal 20 Schritten, Abbruch bei Aenderung < 1 EUR.
 */

import type { BreakEvenPunkt, Szenario } from './typen';

export function berechneBreakEven(
  szenario: Szenario,
  jahrIndex: number,
): readonly BreakEvenPunkt[] {
  void szenario; void jahrIndex;
  throw new Error('berechneBreakEven: nicht implementiert');
}
