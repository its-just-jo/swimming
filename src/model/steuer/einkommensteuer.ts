/**
 * Einkommensteuer, Solidaritaetszuschlag, Kirchensteuer.
 *
 * Vereinfachungen dieses Modells — sie sind in der UI unter jeder Kennzahl
 * als Annahme auszuweisen:
 *  - Einzelveranlagung (Steuerklasse I). Ehegattensplitting ist nicht abgebildet.
 *  - Vorsorgeaufwendungen werden ueber eine Naeherung angesetzt, nicht ueber
 *    die vollstaendige Hoechstbetragsrechnung des § 10 Abs. 3 EStG.
 *  - Kinderfreibetraege ohne Guenstigerpruefung gegen das Kindergeld.
 *  - Keine Werbungskosten ueber dem Arbeitnehmer-Pauschbetrag.
 */

import type { Rechtsgroessen } from '../konstanten';
import type { EinkommensteuerErgebnis, Euro, Satz } from '../typen';

/**
 * Tarifliche Einkommensteuer nach § 32a Abs. 1 EStG.
 * Das zu versteuernde Einkommen wird vor Anwendung auf volle Euro abgerundet,
 * das Ergebnis ebenfalls (§ 32a Abs. 1 Satz 6 EStG).
 */
export function einkommensteuerGrundtarif(zvE: Euro, rg: Rechtsgroessen): Euro {
  void zvE; void rg;
  throw new Error('einkommensteuerGrundtarif: nicht implementiert');
}

/** Liefert die Tarifzone 1..5 zu einem zvE — nur fuer die Herleitungsanzeige. */
export function tarifzone(zvE: Euro, rg: Rechtsgroessen): 1 | 2 | 3 | 4 | 5 {
  void zvE; void rg;
  throw new Error('tarifzone: nicht implementiert');
}

/**
 * Solidaritaetszuschlag mit Freigrenze und Milderungszone (§ 4 SolZG).
 * Ergebnis = min(soliSatz * ESt, milderungssatz * (ESt - Freigrenze)), nie negativ.
 */
export function solidaritaetszuschlag(einkommensteuer: Euro, rg: Rechtsgroessen): Euro {
  void einkommensteuer; void rg;
  throw new Error('solidaritaetszuschlag: nicht implementiert');
}

/** Kirchensteuer als Prozentsatz der Einkommensteuer, 0 wenn nicht pflichtig. */
export function kirchensteuer(
  einkommensteuer: Euro,
  pflichtig: boolean,
  rg: Rechtsgroessen,
): Euro {
  void einkommensteuer; void pflichtig; void rg;
  throw new Error('kirchensteuer: nicht implementiert');
}

/**
 * Grenzbelastung des naechsten Euro inklusive Soli und Kirchensteuer.
 * Numerisch als Differenzenquotient ueber 1 EUR — bewusst nicht analytisch,
 * damit Freigrenzen und Zonensprünge korrekt erfasst werden.
 */
export function grenzbelastung(
  zvE: Euro,
  kirchensteuerpflichtig: boolean,
  rg: Rechtsgroessen,
): Satz {
  void zvE; void kirchensteuerpflichtig; void rg;
  throw new Error('grenzbelastung: nicht implementiert');
}

/** Vollstaendige Steuerberechnung inklusive aller Zwischenwerte fuer die Herleitung. */
export function berechneEinkommensteuer(
  zvE: Euro,
  kirchensteuerpflichtig: boolean,
  rg: Rechtsgroessen,
): EinkommensteuerErgebnis {
  void zvE; void kirchensteuerpflichtig; void rg;
  throw new Error('berechneEinkommensteuer: nicht implementiert');
}

/**
 * Zu versteuerndes Einkommen aus Lohn und Gewinn — die gemeinsame Veranlagung
 * beider Einkunftsarten ist der Kern von Abschnitt 4.4 der Spezifikation.
 *
 * zvE = (Bruttolohn - Arbeitnehmer-Pauschbetrag - Vorsorgeaufwendungen)
 *     + (Gewinn - Uebungsleiterfreibetrag)
 *     + Lehreinkuenfte
 *     - abziehbare DRV-Pflichtbeitraege
 *     - Sonderausgaben-Pauschbetrag
 *     - Kinderfreibetraege
 */
export function zuVersteuerndesEinkommen(eingabe: {
  bruttolohn: Euro;
  arbeitnehmerSvBeitraege: Euro;
  gewinnSelbstaendigkeit: Euro;
  uebungsleiterFreibetrag: Euro;
  lehreinkuenfte: Euro;
  drvBeitragSelbstaendigkeit: Euro;
  kinderfreibetraege: number;
  rg: Rechtsgroessen;
}): Euro {
  void eingabe;
  throw new Error('zuVersteuerndesEinkommen: nicht implementiert');
}
