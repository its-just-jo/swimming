/**
 * Gewerbesteuer und ihre Anrechnung nach § 35 EStG.
 *
 * Ohne die Anrechnung ueberzeichnet das Modell die Belastung der Rechtsform
 * "Gewerbe" deutlich: bis zu einem Hebesatz von rund 400 % wird die
 * Gewerbesteuer durch die Ermaessigung der Einkommensteuer weitgehend
 * neutralisiert. Die Anrechnung ist auf die tatsaechlich gezahlte
 * Gewerbesteuer und auf die anteilige Einkommensteuer begrenzt.
 */

import type { Rechtsgroessen } from '../konstanten';
import type { Euro } from '../typen';

export interface GewerbesteuerErgebnis {
  readonly gewerbeertrag: Euro;
  readonly nachFreibetrag: Euro;
  readonly messbetrag: Euro;
  readonly gewerbesteuer: Euro;
  readonly anrechnungsvolumen: Euro;
  readonly tatsaechlicheAnrechnung: Euro;
  readonly nettobelastung: Euro;
}

export function berechneGewerbesteuer(eingabe: {
  gewinn: Euro;
  hebesatz: number;
  anrechenbareEinkommensteuer: Euro;
  rg: Rechtsgroessen;
}): GewerbesteuerErgebnis {
  void eingabe;
  throw new Error('berechneGewerbesteuer: nicht implementiert');
}
