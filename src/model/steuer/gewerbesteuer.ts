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
  const { gewinn, hebesatz, anrechenbareEinkommensteuer, rg } = eingabe;

  // § 11 Abs. 1 Satz 3 Nr. 1 GewStG: Abrundung auf volle 100 EUR.
  const gewerbeertrag = Math.floor(Math.max(0, gewinn) / 100) * 100;
  const nachFreibetrag = Math.max(0, gewerbeertrag - rg.gewerbesteuerFreibetrag);
  const messbetrag = nachFreibetrag * rg.gewerbesteuerMesszahl;
  const gewerbesteuer = messbetrag * (hebesatz / 100);
  const anrechnungsvolumen = messbetrag * rg.gewerbesteuerAnrechnungsfaktor;

  // § 35 EStG: doppelt begrenzt — auf das 4,0-fache des Messbetrags UND auf
  // die tatsaechlich gezahlte Gewerbesteuer UND auf die anrechenbare ESt.
  const tatsaechlicheAnrechnung = Math.max(
    0,
    Math.min(anrechnungsvolumen, gewerbesteuer, anrechenbareEinkommensteuer),
  );
  const nettobelastung = gewerbesteuer - tatsaechlicheAnrechnung;

  return {
    gewerbeertrag,
    nachFreibetrag,
    messbetrag,
    gewerbesteuer,
    anrechnungsvolumen,
    tatsaechlicheAnrechnung,
    nettobelastung,
  };
}
