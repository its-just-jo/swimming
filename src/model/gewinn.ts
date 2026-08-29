/**
 * Gewinn und Gesamtnetto, Abschnitt 4.4.
 *
 * Reihenfolge der Berechnung — sie ist nicht beliebig:
 *  1. Summe der Deckungsbeitraege
 *  2. abzueglich Fixkosten (indexiert) und Fahrtkosten
 *  3. abzueglich Einmalinvestitionen des Jahres (Sofortabzug; eine AfA ueber
 *     Nutzungsdauer ist bewusst nicht modelliert, weil alle vorgesehenen
 *     Positionen Fortbildungs- und Marketingaufwand sind)
 *  4. = Gewinn vor Steuern
 *  5. abzueglich Uebungsleiterfreibetrag, falls aktiviert
 *  6. DRV-Beitrag ermitteln (mindert als Sonderausgabe das zvE)
 *  7. Einkommensteuer GEMEINSAM mit dem Lohn ermitteln; die Mehrsteuer
 *     gegenueber der Veranlagung ohne Gewinn ist die Steuerlast der
 *     Selbststaendigkeit
 *  8. Gewerbesteuer inkl. Anrechnung nach § 35 EStG, falls Rechtsform Gewerbe
 *  9. Nettobeitrag der Selbststaendigkeit
 */

import type { Rechtsgroessen } from './konstanten';
import type {
  AnstellungErgebnis,
  Einmalinvestition,
  Euro,
  Fahrtkosten,
  Fixkostenposition,
  GewinnErgebnis,
  ProduktErgebnis,
  SteuerSchalter,
} from './typen';

export function fixkostenImJahr(
  fixkosten: readonly Fixkostenposition[],
  fahrtkosten: Fahrtkosten,
  jahrIndex: number,
  inflation: number,
): Euro {
  void fixkosten; void fahrtkosten; void jahrIndex; void inflation;
  throw new Error('fixkostenImJahr: nicht implementiert');
}

export function investitionenImJahr(
  investitionen: readonly Einmalinvestition[],
  jahrIndex: number,
): Euro {
  void investitionen; void jahrIndex;
  throw new Error('investitionenImJahr: nicht implementiert');
}

export function berechneGewinn(eingabe: {
  produktErgebnisse: readonly ProduktErgebnis[];
  fixkosten: Euro;
  investitionen: Euro;
  lehreinkuenfte: Euro;
  anstellungOhneSelbstaendigkeit: AnstellungErgebnis;
  steuer: SteuerSchalter;
  jahrIndex: number;
  rg: Rechtsgroessen;
}): GewinnErgebnis {
  void eingabe;
  throw new Error('berechneGewinn: nicht implementiert');
}
