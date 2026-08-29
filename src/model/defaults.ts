/**
 * Defaultwerte aus der Spezifikation, Abschnitte 3.1 bis 3.8.
 *
 * Diese Datei ist die einzige Quelle der Startwerte. "Auf Defaults
 * zuruecksetzen" (global und je Bereich) greift ausschliesslich hierauf zu.
 */

import { MODELL_KONSTANTEN, RECHTSGROESSEN_2025 } from './konstanten';
import type {
  Anstellung,
  Einmalinvestition,
  Fahrtkosten,
  Fixkostenposition,
  Kursprodukt,
  Lehre,
  Simulationsparameter,
  SteuerSchalter,
  Szenario,
  Wasserkapazitaet,
} from './typen';

export const ANSTELLUNG_DEFAULT: Anstellung = {
  bruttogrundgehaltVollzeit: 85_000,
  bonusProJahr: 12_500,
  bonusSkalierung: 0.8,
  beschaeftigungsgrad: 1.0,
  gehaltssteigerungProJahr: 0.025,
  steuerklasse: 'I',
  kirchensteuerpflichtig: false,
  kinderfreibetraege: 0,
  kinderlosZuschlagPflege: true,
  // Vom Nutzer bestaetigt. ACHTUNG: Bei 85.000 EUR Brutto liegt das Entgelt
  // ueber der JAEG (73.800 EUR) — dann besteht regelmaessig Versicherungsfreiheit
  // und die Mitgliedschaft ist freiwillig. Der Rechenkern warnt in diesem Fall
  // (WarnCode 'jaeg_ueberschritten') und laesst den Status ausdruecklich stehen,
  // statt ihn stillschweigend umzuschalten.
  kvStatus: 'gkv_pflicht',
  pkvBeitragProMonat: 750,
  wochenstundenVollzeit: 40,
};

export const WASSER_DEFAULT: Wasserkapazitaet = {
  wasserstundenProWoche: 8,
  davonSamstag: 4,
  aktiveWochenFreibad: 15,
  aktiveWochenHalle: 25,
  hallenbadzugang: false,
  hallenbadAbMonat: 0,
  ausfallquote: 0.08,
  ausfallWirkung: 'kapazitaet_und_erloes',
  vorbereitungsfaktor: 0.4,
  anfahrtJeTermin: 0.5,
  adminStundenProWoche: 2,
};

/**
 * Vorbefuellte Standardprodukte laut Spezifikation 3.3.
 * Beckenflaeche 1,0 = eine Bahn, wirkt als Faktor auf den Mietsatz.
 * `zyklenProJahr` ist ein Schaetzwert und in der Spezifikation nicht vorgegeben:
 * ein 10-Einheiten-Kurs im Wochenrhythmus belegt zehn Wochen, bei rund
 * 40 aktiven Wochen sind vier Zyklen realistisch.
 */
export const PRODUKTE_DEFAULT: readonly Kursprodukt[] = [
  {
    id: 'p-kinder-anfaenger',
    bezeichnung: 'Kinderschwimmkurs Anfänger',
    kategorie: 'Kinderkurs',
    aktiv: true,
    abMonat: 0,
    abrechnung: 'je_teilnehmer',
    teilnehmerJeKurs: 6,
    preisJeTeilnehmer: 180,
    pauschaleJeKurs: 0,
    einheitenJeKurs: 10,
    dauerJeEinheitMinuten: 45,
    beckenflaeche: 1,
    beckenmieteJeStunde: 60,
    auslastungsgrad: 0.9,
    kurseParallelJeZyklus: 1,
    zyklenProJahr: 4,
    saison: 'ganzjahr',
    zppFaehig: false,
    zppPreisaufschlag: 0,
    durchfuehrung: 'ich',
    honorarFremdlehrkraftJeStunde: 35,
  },
  {
    id: 'p-kinder-fortgeschritten',
    bezeichnung: 'Kinderkurs Fortgeschritten',
    kategorie: 'Kinderkurs',
    aktiv: true,
    abMonat: 0,
    abrechnung: 'je_teilnehmer',
    teilnehmerJeKurs: 8,
    preisJeTeilnehmer: 160,
    pauschaleJeKurs: 0,
    einheitenJeKurs: 10,
    dauerJeEinheitMinuten: 45,
    beckenflaeche: 1,
    beckenmieteJeStunde: 60,
    auslastungsgrad: 0.8,
    kurseParallelJeZyklus: 1,
    zyklenProJahr: 4,
    saison: 'ganzjahr',
    zppFaehig: false,
    zppPreisaufschlag: 0,
    durchfuehrung: 'ich',
    honorarFremdlehrkraftJeStunde: 35,
  },
  {
    id: 'p-erwachsene-nichtschwimmer',
    bezeichnung: 'Erwachsene Nichtschwimmer',
    kategorie: 'Erwachsene',
    aktiv: true,
    abMonat: 0,
    abrechnung: 'je_teilnehmer',
    teilnehmerJeKurs: 5,
    preisJeTeilnehmer: 250,
    pauschaleJeKurs: 0,
    einheitenJeKurs: 10,
    dauerJeEinheitMinuten: 60,
    beckenflaeche: 1,
    beckenmieteJeStunde: 60,
    auslastungsgrad: 0.7,
    kurseParallelJeZyklus: 1,
    zyklenProJahr: 3,
    saison: 'ganzjahr',
    zppFaehig: false,
    zppPreisaufschlag: 0,
    durchfuehrung: 'ich',
    honorarFremdlehrkraftJeStunde: 35,
  },
  {
    id: 'p-aqua-ohne-zpp',
    bezeichnung: 'Aquafitness ohne ZPP',
    kategorie: 'Aquafitness',
    aktiv: true,
    abMonat: 0,
    abrechnung: 'je_teilnehmer',
    teilnehmerJeKurs: 14,
    preisJeTeilnehmer: 120,
    pauschaleJeKurs: 0,
    einheitenJeKurs: 10,
    dauerJeEinheitMinuten: 45,
    beckenflaeche: 1.5,
    beckenmieteJeStunde: 90,
    auslastungsgrad: 0.75,
    kurseParallelJeZyklus: 1,
    zyklenProJahr: 4,
    saison: 'ganzjahr',
    zppFaehig: false,
    zppPreisaufschlag: 0,
    durchfuehrung: 'ich',
    honorarFremdlehrkraftJeStunde: 40,
  },
  {
    id: 'p-aqua-mit-zpp',
    bezeichnung: 'Aquafitness mit ZPP',
    kategorie: 'Aquafitness',
    aktiv: false,
    abMonat: 24,
    abrechnung: 'je_teilnehmer',
    teilnehmerJeKurs: 14,
    preisJeTeilnehmer: 180,
    pauschaleJeKurs: 0,
    einheitenJeKurs: 10,
    dauerJeEinheitMinuten: 45,
    beckenflaeche: 1.5,
    beckenmieteJeStunde: 90,
    auslastungsgrad: 0.85,
    kurseParallelJeZyklus: 1,
    zyklenProJahr: 4,
    saison: 'ganzjahr',
    zppFaehig: true,
    zppPreisaufschlag: 0,
    durchfuehrung: 'ich',
    honorarFremdlehrkraftJeStunde: 40,
  },
  {
    id: 'p-intensiv-ferien',
    bezeichnung: 'Intensivkurs Ferien',
    kategorie: 'Intensivkurs',
    aktiv: true,
    abMonat: 0,
    abrechnung: 'je_teilnehmer',
    teilnehmerJeKurs: 6,
    preisJeTeilnehmer: 200,
    pauschaleJeKurs: 0,
    einheitenJeKurs: 5,
    dauerJeEinheitMinuten: 45,
    beckenflaeche: 1,
    beckenmieteJeStunde: 60,
    auslastungsgrad: 0.95,
    kurseParallelJeZyklus: 2,
    zyklenProJahr: 3,
    saison: 'freibad',
    zppFaehig: false,
    zppPreisaufschlag: 0,
    durchfuehrung: 'ich',
    honorarFremdlehrkraftJeStunde: 35,
  },
  {
    id: 'p-bgm-firma',
    bezeichnung: 'BGM Firmenkurs',
    kategorie: 'BGM/Firma',
    aktiv: false,
    abMonat: 24,
    abrechnung: 'pauschale',
    teilnehmerJeKurs: 10,
    preisJeTeilnehmer: 0,
    pauschaleJeKurs: 2_500,
    einheitenJeKurs: 10,
    dauerJeEinheitMinuten: 60,
    beckenflaeche: 1.5,
    beckenmieteJeStunde: 90,
    auslastungsgrad: 1.0,
    kurseParallelJeZyklus: 1,
    zyklenProJahr: 2,
    saison: 'ganzjahr',
    zppFaehig: false,
    zppPreisaufschlag: 0,
    durchfuehrung: 'ich',
    honorarFremdlehrkraftJeStunde: 40,
  },
];

export const FIXKOSTEN_DEFAULT: readonly Fixkostenposition[] = [
  { id: 'f-haftpflicht', bezeichnung: 'Berufshaftpflicht', betragProJahr: 450, vorsteuerabzugsfaehig: false, indexiert: true },
  { id: 'f-steuerberatung', bezeichnung: 'Steuerberatung', betragProJahr: 900, vorsteuerabzugsfaehig: true, indexiert: true },
  { id: 'f-software', bezeichnung: 'Buchungssoftware / Website', betragProJahr: 480, vorsteuerabzugsfaehig: true, indexiert: true },
  { id: 'f-marketing', bezeichnung: 'Marketing', betragProJahr: 600, vorsteuerabzugsfaehig: true, indexiert: true },
  { id: 'f-material', bezeichnung: 'Material', betragProJahr: 400, vorsteuerabzugsfaehig: true, indexiert: true },
  { id: 'f-fortbildung', bezeichnung: 'Laufende Fortbildung', betragProJahr: 500, vorsteuerabzugsfaehig: true, indexiert: true },
  { id: 'f-sonstiges', bezeichnung: 'Sonstiges', betragProJahr: 300, vorsteuerabzugsfaehig: false, indexiert: true },
];

export const FAHRTKOSTEN_DEFAULT: Fahrtkosten = {
  kilometerProJahr: 3_000,
  satzJeKilometer: 0.3,
};

export const INVESTITIONEN_DEFAULT: readonly Einmalinvestition[] = [
  { id: 'i-trainer-c', bezeichnung: 'Trainer C Breitensport Schwimmen', betrag: 900, monat: 6, vorsteuerabzugsfaehig: false },
  { id: 'i-rs-silber', bezeichnung: 'Auffrischung Rettungsschwimmer Silber', betrag: 150, monat: 3, vorsteuerabzugsfaehig: false },
  { id: 'i-erste-hilfe', bezeichnung: 'Erste Hilfe Auffrischung', betrag: 60, monat: 3, vorsteuerabzugsfaehig: false },
  { id: 'i-zpp-lizenz', bezeichnung: 'ZPP-fähige Aqua-Lizenz', betrag: 2_500, monat: 24, vorsteuerabzugsfaehig: false },
  { id: 'i-website', bezeichnung: 'Website / Markenaufbau', betrag: 1_200, monat: 9, vorsteuerabzugsfaehig: true },
];

export const STEUER_DEFAULT: SteuerSchalter = {
  kleinunternehmer: true,
  umsatzsteuerpflichtig: true,
  preiseSindBrutto: true,
  vorsteuerabzug: false,
  rechtsform: 'freiberuflich',
  gewerbesteuerHebesatz: RECHTSGROESSEN_2025.gewerbesteuerHebesatzDefault,
  drvPflicht: true,
  drvBefreiungExistenzgruender: false,
  drvBefreiungBisMonat: 36,
  uebungsleiterpauschale: false,
};

export const LEHRE_DEFAULT: Lehre = {
  lehrauftragAktiv: false,
  lvsJeSemester: 4,
  satzJeLvs: 45,
  startmonat: 12,
  professurAktiv: false,
  professurBruttoProJahr: 78_000,
  professurBeschaeftigungsgrad: 1.0,
  professurStartjahr: 6,
};

export const SIMULATION_DEFAULT: Simulationsparameter = {
  horizontJahre: 10,
  startdatum: '2026-01-01',
  preissteigerungKurse: 0.02,
  beckenmietsteigerung: 0.04,
  inflation: 0.02,
  wochenbelastungWarnschwelle: 55,
  rechtsstand: 2025,
};

/** Vollstaendiges Defaultszenario. */
export function szenarioDefault(id: string, name = 'Basis'): Szenario {
  const jetzt = new Date().toISOString();
  return {
    id,
    name,
    erstelltAm: jetzt,
    geaendertAm: jetzt,
    anstellung: ANSTELLUNG_DEFAULT,
    wasser: WASSER_DEFAULT,
    produkte: PRODUKTE_DEFAULT,
    fixkosten: FIXKOSTEN_DEFAULT,
    fahrtkosten: FAHRTKOSTEN_DEFAULT,
    investitionen: INVESTITIONEN_DEFAULT,
    steuer: STEUER_DEFAULT,
    lehre: LEHRE_DEFAULT,
    simulation: SIMULATION_DEFAULT,
    rechtlicheUeberschreibungen: {},
  };
}

export const REDUKTIONSSTUFEN = MODELL_KONSTANTEN.reduktionsstufen;
