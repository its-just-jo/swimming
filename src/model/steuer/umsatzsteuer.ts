/**
 * Umsatzsteuer und Kleinunternehmerregelung § 19 UStG.
 *
 * Schwimmunterricht faellt nach EuGH C-373/19 und BFH V R 31/21 nicht unter die
 * Bildungsbefreiung des § 4 Nr. 21 UStG. Default ist deshalb steuerpflichtig.
 *
 * Da die Endkundenpreise brutto fixiert sind, MINDERT die Umsatzsteuer den
 * Erloes — sie wird nicht aufgeschlagen. Netto = Brutto / (1 + Satz).
 */

import type { Rechtsgroessen } from '../konstanten';
import type { Euro } from '../typen';

/** Nettoerloes aus einem brutto fixierten Preis. */
export function nettoAusBrutto(brutto: Euro, ustpflichtig: boolean, rg: Rechtsgroessen): Euro {
  void brutto; void ustpflichtig; void rg;
  throw new Error('nettoAusBrutto: nicht implementiert');
}

export interface KleinunternehmerStatus {
  readonly jahr: number;
  readonly kleinunternehmer: boolean;
  readonly vorjahresumsatz: Euro;
  readonly umsatzLaufendesJahr: Euro;
  readonly schwelleGerissen: boolean;
  readonly grund: 'vorjahr' | 'laufendes_jahr' | 'manuell_aus' | null;
}

/**
 * Zustandsmaschine ueber den Simulationshorizont.
 *
 * Regel ab 01.01.2025: Kleinunternehmer bleibt, wer im Vorjahr hoechstens
 * 25.000 EUR und im laufenden Jahr hoechstens 100.000 EUR umsetzt. Die
 * 100.000-EUR-Grenze wirkt unterjaehrig: ab ihrem Ueberschreiten sind
 * Folgeumsaetze steuerpflichtig. Die 25.000-EUR-Grenze wirkt zum Folgejahr.
 *
 * Einmal verlassen, wird der Status im Modell nicht automatisch zurueckgesetzt —
 * ein Rueckwechsel waere zwar moeglich, ist aber an einen Antrag gebunden und
 * wuerde das Ergebnis stillschweigend beschoenigen.
 */
export function kleinunternehmerVerlauf(
  bruttoumsaetzeJeJahr: readonly Euro[],
  startAlsKleinunternehmer: boolean,
  rg: Rechtsgroessen,
): readonly KleinunternehmerStatus[] {
  void bruttoumsaetzeJeJahr; void startAlsKleinunternehmer; void rg;
  throw new Error('kleinunternehmerVerlauf: nicht implementiert');
}

/** Abziehbare Vorsteuer aus Kostenpositionen, 0 wenn Kleinunternehmer. */
export function vorsteuer(
  bruttokosten: Euro,
  abzugsfaehig: boolean,
  rg: Rechtsgroessen,
): Euro {
  void bruttokosten; void abzugsfaehig; void rg;
  throw new Error('vorsteuer: nicht implementiert');
}
