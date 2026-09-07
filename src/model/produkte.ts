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
 *
 * Ausfallquote (ARCHITEKTUR.md, Abschnitt 1.7 Nr. 4): mindert IMMER die
 * tatsaechlich genutzte Wasserzeit (die "nur_kapazitaet"-Grundwirkung ist in
 * beiden Modi enthalten) und zusaetzlich den Erloes, wenn
 * `ausfallWirkung === 'kapazitaet_und_erloes'` — der Aufrufer uebersetzt den
 * Schalter in das Flag `ausfallMindertErloes`.
 *
 * stummGrund (design.md 5.2): macht sichtbar, WARUM ein Produkt 0 EUR liefert,
 * statt es stillschweigend als "0 €" auszuweisen. `aktiveWochenFreibad` und
 * `aktiveWochenHalle` sind optional (Default 1 = unbegrenzt) und ausschliesslich
 * fuer dieses Feld relevant — sie wirken NICHT auf die Kurszahl selbst, ausser
 * eine Saison ist vollstaendig auf 0 Wochen gesetzt (dann kann dort real kein
 * Kurs stattfinden, siehe `kurseImJahr`).
 */

import { MODELL_KONSTANTEN, type Rechtsgroessen } from './konstanten';
import { nettoAusBrutto } from './steuer/umsatzsteuer';
import type { Euro, Kursprodukt, MonatsIndex, ProduktErgebnis, Quote, StummGrund, Stunden } from './typen';

/** Wasserzeit eines einzelnen Kursdurchlaufs in Stunden. */
export function wasserzeitJeKurs(produkt: Kursprodukt): Stunden {
  return (produkt.einheitenJeKurs * produkt.dauerJeEinheitMinuten) / 60;
}

/** Bruttoerloes eines einzelnen Kursdurchlaufs, inkl. ZPP-Aufschlag. */
export function erloesJeKurs(produkt: Kursprodukt): Euro {
  if (produkt.abrechnung === 'pauschale') return produkt.pauschaleJeKurs;
  const preis = produkt.preisJeTeilnehmer + (produkt.zppFaehig ? produkt.zppPreisaufschlag : 0);
  return produkt.teilnehmerJeKurs * produkt.auslastungsgrad * preis;
}

/** Anteil des Jahres (0..1), in dem das Produkt bereits gestartet ist. */
function aktiverJahresanteil(produkt: Kursprodukt, jahrIndex: number): Quote {
  const jahresStart = jahrIndex * 12;
  const jahresEnde = jahresStart + 12;
  const aktivAb = Math.max(produkt.abMonat, jahresStart);
  const aktiveMonate = Math.min(12, Math.max(0, jahresEnde - aktivAb));
  return aktiveMonate / 12;
}

/** Anzahl der Kursdurchlaeufe im Jahr, begrenzt durch Saison und Startmonat. */
export function kurseImJahr(
  produkt: Kursprodukt,
  jahrIndex: number,
  hallenbadVerfuegbar: boolean,
  aktiveWochenFreibad = 1,
  aktiveWochenHalle = 1,
): number {
  if (!produkt.aktiv) return 0;
  if ((produkt.saison === 'ganzjahr' || produkt.saison === 'halle') && !hallenbadVerfuegbar) {
    return 0;
  }
  // Eine Saison mit 0 aktiven Wochen kann real keinen Kurs tragen — unabhaengig
  // vom Hallenbadzugang, der nur ueber "ganzjahr"/"halle" entscheidet.
  if (produkt.saison === 'freibad' && aktiveWochenFreibad <= 0) return 0;
  if (produkt.saison === 'halle' && aktiveWochenHalle <= 0) return 0;
  if (produkt.saison === 'ganzjahr' && aktiveWochenFreibad <= 0 && aktiveWochenHalle <= 0) return 0;

  return produkt.zyklenProJahr * aktiverJahresanteil(produkt, jahrIndex);
}

/**
 * Grund, warum ein Produkt in diesem Jahr keinen Erloes liefert — dieselben
 * Gates wie `kurseImJahr`, aber als benanntes Ergebnis statt einer blossen 0.
 * `null` heisst: das Produkt traegt bei (Kurszahl > 0).
 */
export function ermittleStummGrund(
  produkt: Kursprodukt,
  jahrIndex: number,
  hallenbadVerfuegbar: boolean,
  aktiveWochenFreibad = 1,
  aktiveWochenHalle = 1,
): StummGrund {
  if (!produkt.aktiv) return 'inaktiv';
  if (aktiverJahresanteil(produkt, jahrIndex) <= 0) return 'vor_startmonat';
  if ((produkt.saison === 'ganzjahr' || produkt.saison === 'halle') && !hallenbadVerfuegbar) {
    return 'kein_hallenbad';
  }
  if (produkt.saison === 'freibad' && aktiveWochenFreibad <= 0) return 'ausserhalb_saison';
  if (produkt.saison === 'halle' && aktiveWochenHalle <= 0) return 'ausserhalb_saison';
  if (produkt.saison === 'ganzjahr' && aktiveWochenFreibad <= 0 && aktiveWochenHalle <= 0) {
    return 'ausserhalb_saison';
  }
  return null;
}

/**
 * Kalenderjahr und -monat, in dem ein Simulationsmonat (0-basiert, wie
 * `abMonat`) faellt — dieselbe Umrechnung wie in `simulation.ts`
 * (`berechneMonate`), hier fuer die Begruendungszeile "startet MM/JJJJ"
 * stumm gestellter Produkte (design.md 5.2) und fuer `ermittleAktiveMonate`.
 */
export function kalenderVonSimulationsmonat(
  simulationsmonat: number,
  startdatum: string,
): { readonly kalenderjahr: number; readonly kalendermonat: number } {
  const start = new Date(startdatum);
  const monatAbsolut = start.getUTCMonth() + simulationsmonat;
  return {
    kalenderjahr: start.getUTCFullYear() + Math.floor(monatAbsolut / 12),
    kalendermonat: (monatAbsolut % 12) + 1,
  };
}

/**
 * Kalendermonate (1 = Januar … 12 = Dezember), in denen ein Produkt in
 * diesem Jahr aktiv ist — fuer das Saisonband im Kursplan (design.md 5.2).
 * Nutzt dieselbe Monatszuordnung wie `berechneMonate` (ARCHITEKTUR.md 1.7
 * Nr. 5: Freibad = Mai-September, Halle = uebrige Monate) und dieselben
 * Gates wie `ermittleStummGrund`, zusaetzlich je Monat begrenzt durch den
 * Startmonat des Produkts — ein Produkt, das mitten im Jahr startet, zeigt
 * nur die Monate ab seinem Start.
 */
export function ermittleAktiveMonate(
  produkt: Kursprodukt,
  jahrIndex: number,
  startdatum: string,
  hallenbadVerfuegbar: boolean,
  aktiveWochenFreibad = 1,
  aktiveWochenHalle = 1,
): readonly MonatsIndex[] {
  if (ermittleStummGrund(produkt, jahrIndex, hallenbadVerfuegbar, aktiveWochenFreibad, aktiveWochenHalle) !== null) {
    return [];
  }

  const { freibadMonate, hallenMonate } = MODELL_KONSTANTEN;
  const saisonMonate = new Set(
    produkt.saison === 'freibad' ? freibadMonate : produkt.saison === 'halle' ? hallenMonate : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  );

  const jahresStart = jahrIndex * 12;

  const aktiveMonate: MonatsIndex[] = [];
  for (let m = 0; m < 12; m++) {
    const absolutesMonat = jahresStart + m;
    if (absolutesMonat < produkt.abMonat) continue;
    const { kalendermonat } = kalenderVonSimulationsmonat(absolutesMonat, startdatum);
    if (saisonMonate.has(kalendermonat)) aktiveMonate.push(kalendermonat);
  }
  return aktiveMonate;
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
  aktiveWochenFreibad?: number;
  aktiveWochenHalle?: number;
  rg: Rechtsgroessen;
}): ProduktErgebnis {
  const {
    produkt,
    jahrIndex,
    preisIndex,
    mietIndex,
    ustpflichtig,
    ausfallquote,
    ausfallMindertErloes,
    hallenbadVerfuegbar,
    aktiveWochenFreibad = 1,
    aktiveWochenHalle = 1,
    rg,
  } = eingabe;

  const kurse = kurseImJahr(produkt, jahrIndex, hallenbadVerfuegbar, aktiveWochenFreibad, aktiveWochenHalle);
  const parallel = produkt.kurseParallelJeZyklus;
  const zeitJeKurs = wasserzeitJeKurs(produkt);

  const wasserzeitGesamtRoh = zeitJeKurs * kurse * parallel;
  const wasserzeitGesamt = wasserzeitGesamtRoh * (1 - ausfallquote);

  const erloesBruttoRoh = erloesJeKurs(produkt) * preisIndex * kurse * parallel;
  const erloesBrutto = erloesBruttoRoh * (ausfallMindertErloes ? 1 - ausfallquote : 1);

  const erloesNetto = nettoAusBrutto(erloesBrutto, ustpflichtig, rg);
  const umsatzsteuer = erloesBrutto - erloesNetto;

  const miete = wasserzeitGesamt * produkt.beckenflaeche * produkt.beckenmieteJeStunde * mietIndex;
  const honorar =
    produkt.durchfuehrung === 'fremdlehrkraft'
      ? wasserzeitGesamt * produkt.honorarFremdlehrkraftJeStunde
      : 0;

  const deckungsbeitrag = erloesNetto - miete - honorar;
  const deckungsbeitragJeWasserstunde = wasserzeitGesamt > 0 ? deckungsbeitrag / wasserzeitGesamt : 0;

  return {
    produktId: produkt.id,
    bezeichnung: produkt.bezeichnung,
    erloesBrutto,
    umsatzsteuer,
    erloesNetto,
    wasserzeitJeKurs: zeitJeKurs,
    wasserzeitGesamt,
    miete,
    honorar,
    deckungsbeitrag,
    deckungsbeitragJeWasserstunde,
    anzahlKurseProJahr: kurse,
    durchfuehrung: produkt.durchfuehrung,
    saison: produkt.saison,
    stummGrund: ermittleStummGrund(produkt, jahrIndex, hallenbadVerfuegbar, aktiveWochenFreibad, aktiveWochenHalle),
  };
}
