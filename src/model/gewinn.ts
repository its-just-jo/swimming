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
 *     Selbststaendigkeit. "Ohne Gewinn" heisst hier: ohne Kursgewinn UND ohne
 *     Lehreinkuenfte — beides ist selbststaendige Taetigkeit nach § 18 EStG,
 *     die Mehrsteuer beider zusammen ist die Steuerlast der Selbststaendigkeit.
 *     `lehreNetto` in simulation.ts fuehrt die Lehreinkuenfte deshalb brutto
 *     (unversteuert) fort — ihre Steuerwirkung steckt bereits hier.
 *  8. Gewerbesteuer inkl. Anrechnung nach § 35 EStG, falls Rechtsform Gewerbe
 *  9. Nettobeitrag der Selbststaendigkeit
 *
 * KRITISCH (ARCHITEKTUR.md 1.4): Der Gewinn wird an keiner Stelle dieser
 * Kette auf >= 0 begrenzt. Ein Verlust der Anlaufjahre mindert ueber die
 * gemeinsame Veranlagung das zu versteuernde Einkommen und erzeugt eine
 * Steuererstattung — `zusaetzlicheEinkommensteuer` wird in diesem Fall negativ.
 */

import type { Rechtsgroessen } from './konstanten';
import { berechneDrvBeitrag } from './steuer/rentenversicherung';
import { berechneEinkommensteuer } from './steuer/einkommensteuer';
import { berechneGewerbesteuer } from './steuer/gewerbesteuer';
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
  const indexfaktor = (1 + inflation) ** jahrIndex;
  const fixkostenSumme = fixkosten.reduce(
    (summe, position) =>
      summe + (position.indexiert ? position.betragProJahr * indexfaktor : position.betragProJahr),
    0,
  );
  const fahrtkostenSumme = fahrtkosten.kilometerProJahr * fahrtkosten.satzJeKilometer;
  return fixkostenSumme + fahrtkostenSumme;
}

export function investitionenImJahr(
  investitionen: readonly Einmalinvestition[],
  jahrIndex: number,
): Euro {
  return investitionen
    .filter((inv) => Math.floor(inv.monat / 12) === jahrIndex)
    .reduce((summe, inv) => summe + inv.betrag, 0);
}

export function berechneGewinn(eingabe: {
  produktErgebnisse: readonly ProduktErgebnis[];
  fixkosten: Euro;
  investitionen: Euro;
  lehreinkuenfte: Euro;
  anstellungOhneSelbstaendigkeit: AnstellungErgebnis;
  kirchensteuerpflichtig: boolean;
  steuer: SteuerSchalter;
  jahrIndex: number;
  rg: Rechtsgroessen;
}): GewinnErgebnis {
  const {
    produktErgebnisse,
    fixkosten,
    investitionen,
    lehreinkuenfte,
    anstellungOhneSelbstaendigkeit,
    kirchensteuerpflichtig,
    steuer,
    jahrIndex,
    rg,
  } = eingabe;

  const deckungsbeitragSumme = produktErgebnisse.reduce((summe, p) => summe + p.deckungsbeitrag, 0);
  const gewinnVorSteuern = deckungsbeitragSumme - fixkosten - investitionen;

  // § 3 Nr. 26 EStG ist mit eigenen Kursprodukten nicht vereinbar
  // (ARCHITEKTUR.md 1.5); die Warnung dafuer erzeugt warnungen.ts. Der
  // Rechenkern wendet den Freibetrag trotzdem an, wenn der Schalter aktiv
  // ist — er entscheidet nicht, er meldet nur.
  const uebungsleiterFreibetrag = steuer.uebungsleiterpauschale ? rg.uebungsleiterpauschale : 0;
  const steuerpflichtigerGewinn = gewinnVorSteuern - uebungsleiterFreibetrag;

  const drv = berechneDrvBeitrag({
    gewinn: steuerpflichtigerGewinn,
    bruttolohn: anstellungOhneSelbstaendigkeit.bruttoGesamt,
    drvPflicht: steuer.drvPflicht,
    befreiungExistenzgruender: steuer.drvBefreiungExistenzgruender,
    befreiungBisMonat: steuer.drvBefreiungBisMonat,
    monatImHorizont: jahrIndex * 12,
    rg,
  });

  // zvE ist additiv in Gewinn, Uebungsleiterfreibetrag, Lehreinkuenften und
  // DRV-Beitrag (siehe zuVersteuerndesEinkommen) — die Baseline-Veranlagung
  // (ohne Gewinn, ohne Lehre) liefert bereits den korrekten Rest (Lohn,
  // Vorsorgeaufwendungen, Kinderfreibetraege), sodass sich die Differenz ohne
  // erneute Kinderfreibetrag-Angabe bilden laesst.
  const zvEMitGewinn =
    anstellungOhneSelbstaendigkeit.steuer.zvE + steuerpflichtigerGewinn + lehreinkuenfte - drv.beitrag;
  const steuerMitGewinn = berechneEinkommensteuer(zvEMitGewinn, kirchensteuerpflichtig, rg);

  const zusaetzlicheEinkommensteuer = steuerMitGewinn.gesamt - anstellungOhneSelbstaendigkeit.steuer.gesamt;
  const zusaetzlicheEst = steuerMitGewinn.einkommensteuer - anstellungOhneSelbstaendigkeit.steuer.einkommensteuer;

  let gewerbesteuer = 0;
  let gewerbesteuerAnrechnung = 0;
  if (steuer.rechtsform === 'gewerbe') {
    const gs = berechneGewerbesteuer({
      gewinn: steuerpflichtigerGewinn,
      hebesatz: steuer.gewerbesteuerHebesatz,
      anrechenbareEinkommensteuer: Math.max(0, zusaetzlicheEst),
      rg,
    });
    gewerbesteuer = gs.gewerbesteuer;
    gewerbesteuerAnrechnung = gs.tatsaechlicheAnrechnung;
  }

  const nettoAusSelbstaendigkeit =
    gewinnVorSteuern - (gewerbesteuer - gewerbesteuerAnrechnung) - drv.beitrag - zusaetzlicheEinkommensteuer;

  return {
    deckungsbeitragSumme,
    fixkosten,
    investitionen,
    gewinnVorSteuern,
    uebungsleiterFreibetrag,
    steuerpflichtigerGewinn,
    gewerbesteuer,
    gewerbesteuerAnrechnung,
    drvBeitrag: drv.beitrag,
    zusaetzlicheEinkommensteuer,
    nettoAusSelbstaendigkeit,
  };
}
