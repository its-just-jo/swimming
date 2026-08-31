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
 */

import type { Rechtsgroessen } from './konstanten';
import { nettoAusBrutto } from './steuer/umsatzsteuer';
import type { Euro, Kursprodukt, ProduktErgebnis, Quote, Stunden } from './typen';

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

/** Anzahl der Kursdurchlaeufe im Jahr, begrenzt durch Saison und Startmonat. */
export function kurseImJahr(
  produkt: Kursprodukt,
  jahrIndex: number,
  hallenbadVerfuegbar: boolean,
): number {
  if (!produkt.aktiv) return 0;
  if ((produkt.saison === 'ganzjahr' || produkt.saison === 'halle') && !hallenbadVerfuegbar) {
    return 0;
  }

  const jahresStart = jahrIndex * 12;
  const jahresEnde = jahresStart + 12;
  const aktivAb = Math.max(produkt.abMonat, jahresStart);
  const aktiveMonate = Math.min(12, Math.max(0, jahresEnde - aktivAb));

  return produkt.zyklenProJahr * (aktiveMonate / 12);
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
  const {
    produkt,
    jahrIndex,
    preisIndex,
    mietIndex,
    ustpflichtig,
    ausfallquote,
    ausfallMindertErloes,
    hallenbadVerfuegbar,
    rg,
  } = eingabe;

  const kurse = kurseImJahr(produkt, jahrIndex, hallenbadVerfuegbar);
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
  };
}
