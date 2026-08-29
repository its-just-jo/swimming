/**
 * Deckungsbeitrag je Kursprodukt, Abschnitt 4.2 der Spezifikation.
 *
 *   Erloes      = TN x Auslastung x Preis          bzw. Pauschale
 *   Netto       = Erloes / 1,19                    falls USt-pflichtig
 *   Wasserzeit  = Einheiten x Dauer / 60
 *   Miete       = Wasserzeit x Flaeche x Mietsatz
 *   Honorar     = Wasserzeit x Satz                falls Fremdlehrkraft
 *   DB          = Netto - Miete - Honorar
 *
 * Zwei Modellregeln, die in der Spezifikation nicht ausformuliert sind und hier
 * bewusst festgelegt werden:
 *
 * 1. Bei `abrechnung: 'pauschale'` wirkt der Auslastungsgrad NICHT auf den
 *    Erloes. Eine Firmenpauschale wird unabhaengig von der Teilnehmerzahl
 *    gezahlt; andernfalls wuerde das BGM-Produkt systematisch unterschaetzt.
 * 2. `kurseParallelJeZyklus` erhoeht sowohl Erloes als auch Wasserzeit. Eine
 *    Lehrkraft kann keine zwei Gruppen gleichzeitig betreuen; die Zeit ist
 *    daher additiv. Wer echte Parallelitaet abbilden will, setzt das Produkt
 *    auf `durchfuehrung: 'fremdlehrkraft'`.
 */

import type { Rechtsgroessen } from './konstanten';
import type { Euro, Kursprodukt, ProduktErgebnis, Quote, Stunden } from './typen';

/** Wasserzeit eines einzelnen Kursdurchlaufs in Stunden. */
export function wasserzeitJeKurs(produkt: Kursprodukt): Stunden {
  void produkt;
  throw new Error('wasserzeitJeKurs: nicht implementiert');
}

/** Bruttoerloes eines einzelnen Kursdurchlaufs, inkl. ZPP-Aufschlag. */
export function erloesJeKurs(produkt: Kursprodukt): Euro {
  void produkt;
  throw new Error('erloesJeKurs: nicht implementiert');
}

/** Anzahl der Kursdurchlaeufe im Jahr, begrenzt durch Saison und Startmonat. */
export function kurseImJahr(
  produkt: Kursprodukt,
  jahrIndex: number,
  hallenbadVerfuegbar: boolean,
): number {
  void produkt; void jahrIndex; void hallenbadVerfuegbar;
  throw new Error('kurseImJahr: nicht implementiert');
}

/**
 * Vollstaendiges Produktergebnis eines Jahres.
 * `preisIndex` und `mietIndex` sind die kumulierten Steigerungsfaktoren.
 */
export function berechneProdukt(eingabe: {
  produkt: Kursprodukt;
  jahrIndex: number;
  preisIndex: number;
  mietIndex: number;
  ustpflichtig: boolean;
  ausfallquote: Quote;
  ausfallMindertErloes: boolean;
  hallenbadVerfuegbar: boolean;
  rg: Rechtsgroessen;
}): ProduktErgebnis {
  void eingabe;
  throw new Error('berechneProdukt: nicht implementiert');
}
