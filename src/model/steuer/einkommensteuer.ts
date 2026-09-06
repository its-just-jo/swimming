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

import type { EstTarifZone, Rechtsgroessen } from '../konstanten';
import type { EinkommensteuerErgebnis, Euro, Satz } from '../typen';

function zoneFuer(zvEGerundet: Euro, rg: Rechtsgroessen): EstTarifZone {
  for (const zone of rg.estTarif) {
    if (zvEGerundet <= zone.bis) return zone;
  }
  // estTarif deckt bis +Infinity ab; dieser Pfad ist unerreichbar.
  const letzte = rg.estTarif[rg.estTarif.length - 1];
  if (!letzte) throw new Error('estTarif ist leer');
  return letzte;
}

/**
 * Unrundierte tarifliche Steuer — dient als Basis fuer die numerische
 * Grenzbelastung, die auf der stetigen Kurve rechnen muss, nicht auf der
 * auf volle Euro gerundeten Anzeigegroesse (§ 32a Abs. 1 Satz 6 EStG rundet
 * nur das Anzeigeergebnis, nicht die tatsaechliche Steilheit des Tarifs).
 */
function steuerRoh(zvE: Euro, rg: Rechtsgroessen): number {
  const zvEGerundet = Math.floor(zvE);
  if (zvEGerundet <= 0) return 0;
  const zone = zoneFuer(zvEGerundet, rg);
  switch (zone.art) {
    case 'null':
      return 0;
    case 'progressiv': {
      const y = (zvEGerundet - (zone.basis ?? 0)) / 10_000;
      return (((zone.a ?? 0) * y + (zone.b ?? 0)) * y) + (zone.c ?? 0);
    }
    case 'linear':
      return (zone.satz ?? 0) * zvEGerundet - (zone.abzug ?? 0);
  }
}

/**
 * Tarifliche Einkommensteuer nach § 32a Abs. 1 EStG.
 * Das zu versteuernde Einkommen wird vor Anwendung auf volle Euro abgerundet,
 * das Ergebnis ebenfalls (§ 32a Abs. 1 Satz 6 EStG).
 */
export function einkommensteuerGrundtarif(zvE: Euro, rg: Rechtsgroessen): Euro {
  return Math.floor(steuerRoh(zvE, rg));
}

/** Liefert die Tarifzone 1..5 zu einem zvE — nur fuer die Herleitungsanzeige. */
export function tarifzone(zvE: Euro, rg: Rechtsgroessen): 1 | 2 | 3 | 4 | 5 {
  const zvEGerundet = Math.floor(zvE);
  for (let i = 0; i < rg.estTarif.length; i++) {
    if (zvEGerundet <= (rg.estTarif[i] as EstTarifZone).bis) {
      return (i + 1) as 1 | 2 | 3 | 4 | 5;
    }
  }
  return 5;
}

/**
 * Solidaritaetszuschlag mit Freigrenze und Milderungszone (§ 4 SolZG).
 * Ergebnis = min(soliSatz * ESt, milderungssatz * (ESt - Freigrenze)), nie negativ.
 */
export function solidaritaetszuschlag(einkommensteuer: Euro, rg: Rechtsgroessen): Euro {
  if (einkommensteuer <= rg.soliFreigrenzeEinzel) return 0;
  const regulaer = rg.soliSatz * einkommensteuer;
  const milderung = rg.soliMilderungssatz * (einkommensteuer - rg.soliFreigrenzeEinzel);
  return Math.max(0, Math.min(regulaer, milderung));
}

/** Kirchensteuer als Prozentsatz der Einkommensteuer, 0 wenn nicht pflichtig. */
export function kirchensteuer(
  einkommensteuer: Euro,
  pflichtig: boolean,
  rg: Rechtsgroessen,
): Euro {
  if (!pflichtig) return 0;
  return rg.kirchensteuersatz * einkommensteuer;
}

/**
 * Grenzbelastung des naechsten Euro inklusive Soli und Kirchensteuer.
 * Numerisch als Differenzenquotient ueber 1 EUR — bewusst nicht analytisch,
 * damit Freigrenzen und Zonensprünge korrekt erfasst werden. Rechnet auf der
 * unrundierten Steuerkurve, damit die Euro-Rundung des Anzeigewerts die
 * Ableitung nicht verrauscht.
 */
export function grenzbelastung(
  zvE: Euro,
  kirchensteuerpflichtig: boolean,
  rg: Rechtsgroessen,
): Satz {
  const gesamtBei = (z: Euro): number => {
    const est = steuerRoh(z, rg);
    const soli = solidaritaetszuschlag(est, rg);
    const kist = kirchensteuer(est, kirchensteuerpflichtig, rg);
    return est + soli + kist;
  };
  return gesamtBei(zvE + 1) - gesamtBei(zvE);
}

/** Vollstaendige Steuerberechnung inklusive aller Zwischenwerte fuer die Herleitung. */
export function berechneEinkommensteuer(
  zvE: Euro,
  kirchensteuerpflichtig: boolean,
  rg: Rechtsgroessen,
): EinkommensteuerErgebnis {
  const einkommensteuerBetrag = einkommensteuerGrundtarif(zvE, rg);
  const soli = solidaritaetszuschlag(einkommensteuerBetrag, rg);
  const kist = kirchensteuer(einkommensteuerBetrag, kirchensteuerpflichtig, rg);
  const gesamt = einkommensteuerBetrag + soli + kist;
  return {
    zvE,
    einkommensteuer: einkommensteuerBetrag,
    solidaritaetszuschlag: soli,
    kirchensteuer: kist,
    gesamt,
    grenzbelastung: grenzbelastung(zvE, kirchensteuerpflichtig, rg),
    durchschnittsbelastung: zvE > 0 ? gesamt / zvE : 0,
    zone: tarifzone(zvE, rg),
  };
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
  const {
    bruttolohn,
    arbeitnehmerSvBeitraege,
    gewinnSelbstaendigkeit,
    uebungsleiterFreibetrag,
    lehreinkuenfte,
    drvBeitragSelbstaendigkeit,
    kinderfreibetraege,
    rg,
  } = eingabe;

  const einkuenfteAusNichtselbstaendigerArbeit =
    bruttolohn - rg.arbeitnehmerPauschbetrag - arbeitnehmerSvBeitraege;
  const einkuenfteAusSelbstaendigkeit = gewinnSelbstaendigkeit - uebungsleiterFreibetrag;

  return (
    einkuenfteAusNichtselbstaendigerArbeit +
    einkuenfteAusSelbstaendigkeit +
    lehreinkuenfte -
    drvBeitragSelbstaendigkeit -
    rg.sonderausgabenPauschbetrag -
    kinderfreibetraege * rg.kinderfreibetragJeKind
  );
}
