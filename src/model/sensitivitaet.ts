/**
 * Sensitivitaetsanalyse (Tornado), Abschnitt 5.
 *
 * Laut Spezifikation die wichtigste Ansicht des Tools: sie beantwortet die
 * Frage "Welche Variable kippt das Modell am schnellsten?".
 *
 * Verfahren: Fuer jede Kernvariable wird das VOLLSTAENDIGE Modell mit -20 %
 * und +20 % neu gerechnet. Keine analytische Naeherung und keine lokale
 * Ableitung — nur so werden Schwelleneffekte (USt-Grenze, BBG, Kapazitaets-
 * ueberschreitung) sichtbar, und genau die interessieren hier.
 *
 * Sortiert wird nach der Spannweite |plus20 - minus20|, absteigend.
 *
 * Bezugsgroesse ist standardmaessig das Gesamtnetto des letzten Jahres im
 * Horizont; alternativ waehlbar ist die Summe ueber alle Jahre.
 */

import { MODELL_KONSTANTEN } from './konstanten';
import { berechneSzenario } from './simulation';
import type { Ergebnis, Kursprodukt, SensitivitaetsVariable, SensitivitaetsZeile, Szenario } from './typen';

export type Bezugsgroesse = 'letztes_jahr' | 'summe_horizont';

const VARIABLEN: readonly { variable: SensitivitaetsVariable; label: string }[] = [
  { variable: 'auslastungsgrad', label: 'Auslastungsgrad' },
  { variable: 'preisJeTeilnehmer', label: 'Preis je Teilnehmer' },
  { variable: 'beckenmieteJeStunde', label: 'Beckenmiete je Stunde' },
  { variable: 'wasserstundenProWoche', label: 'Wasserstunden pro Woche' },
  { variable: 'ausfallquote', label: 'Ausfallquote' },
  { variable: 'aktiveWochenHalle', label: 'Aktive Wochen Halle' },
  { variable: 'fixkosten', label: 'Fixkosten' },
  { variable: 'bonusSkalierung', label: 'Bonusskalierung' },
  { variable: 'gehaltssteigerungProJahr', label: 'Gehaltssteigerung pro Jahr' },
  { variable: 'preissteigerungKurse', label: 'Preissteigerung Kurse' },
  { variable: 'beckenmietsteigerung', label: 'Beckenmietsteigerung' },
  { variable: 'honorarFremdlehrkraftJeStunde', label: 'Honorar Fremdlehrkraft je Stunde' },
];

/** 0..1 begrenzte Quoten duerfen durch die Auslenkung nicht ueber 1 hinauswachsen. */
function begrenzeQuote(wert: number): number {
  return Math.max(0, Math.min(1, wert));
}

function lenkeProdukt(produkt: Kursprodukt, variable: SensitivitaetsVariable, faktor: number): Kursprodukt {
  switch (variable) {
    case 'auslastungsgrad':
      return { ...produkt, auslastungsgrad: begrenzeQuote(produkt.auslastungsgrad * faktor) };
    case 'preisJeTeilnehmer':
      return { ...produkt, preisJeTeilnehmer: produkt.preisJeTeilnehmer * faktor };
    case 'beckenmieteJeStunde':
      return { ...produkt, beckenmieteJeStunde: produkt.beckenmieteJeStunde * faktor };
    case 'honorarFremdlehrkraftJeStunde':
      return { ...produkt, honorarFremdlehrkraftJeStunde: produkt.honorarFremdlehrkraftJeStunde * faktor };
    default:
      return produkt;
  }
}

/** Wendet eine relative Auslenkung auf eine Variable an. Rein, ohne Mutation. */
export function lenkeAus(szenario: Szenario, variable: SensitivitaetsVariable, faktor: number): Szenario {
  switch (variable) {
    case 'auslastungsgrad':
    case 'preisJeTeilnehmer':
    case 'beckenmieteJeStunde':
    case 'honorarFremdlehrkraftJeStunde':
      return {
        ...szenario,
        produkte: szenario.produkte.map((p) => lenkeProdukt(p, variable, faktor)),
      };
    case 'wasserstundenProWoche':
      return {
        ...szenario,
        wasser: { ...szenario.wasser, wasserstundenProWoche: szenario.wasser.wasserstundenProWoche * faktor },
      };
    case 'ausfallquote':
      return {
        ...szenario,
        wasser: { ...szenario.wasser, ausfallquote: begrenzeQuote(szenario.wasser.ausfallquote * faktor) },
      };
    case 'aktiveWochenHalle':
      return {
        ...szenario,
        wasser: { ...szenario.wasser, aktiveWochenHalle: szenario.wasser.aktiveWochenHalle * faktor },
      };
    case 'fixkosten':
      return {
        ...szenario,
        fixkosten: szenario.fixkosten.map((f) => ({ ...f, betragProJahr: f.betragProJahr * faktor })),
      };
    case 'bonusSkalierung':
      return {
        ...szenario,
        anstellung: { ...szenario.anstellung, bonusSkalierung: szenario.anstellung.bonusSkalierung * faktor },
      };
    case 'gehaltssteigerungProJahr':
      return {
        ...szenario,
        anstellung: {
          ...szenario.anstellung,
          gehaltssteigerungProJahr: szenario.anstellung.gehaltssteigerungProJahr * faktor,
        },
      };
    case 'preissteigerungKurse':
      return {
        ...szenario,
        simulation: {
          ...szenario.simulation,
          preissteigerungKurse: szenario.simulation.preissteigerungKurse * faktor,
        },
      };
    case 'beckenmietsteigerung':
      return {
        ...szenario,
        simulation: {
          ...szenario.simulation,
          beckenmietsteigerung: szenario.simulation.beckenmietsteigerung * faktor,
        },
      };
  }
}

function bezugswert(ergebnis: Ergebnis, bezug: Bezugsgroesse): number {
  if (ergebnis.jahre.length === 0) return 0;
  if (bezug === 'letztes_jahr') {
    return ergebnis.jahre[ergebnis.jahre.length - 1]?.gesamtnetto ?? 0;
  }
  return ergebnis.jahre.reduce((summe, j) => summe + j.gesamtnetto, 0);
}

export function berechneSensitivitaet(
  szenario: Szenario,
  bezug: Bezugsgroesse,
): readonly SensitivitaetsZeile[] {
  const basiswert = bezugswert(berechneSzenario(szenario), bezug);
  const auslenkung = MODELL_KONSTANTEN.sensitivitaetsAuslenkung;

  const zeilen = VARIABLEN.map(({ variable, label }) => {
    const beiMinus = bezugswert(berechneSzenario(lenkeAus(szenario, variable, 1 - auslenkung)), bezug);
    const beiPlus = bezugswert(berechneSzenario(lenkeAus(szenario, variable, 1 + auslenkung)), bezug);
    return {
      variable,
      label,
      basiswert,
      bei_minus20: beiMinus,
      bei_plus20: beiPlus,
      spannweite: Math.abs(beiPlus - beiMinus),
    };
  });

  return [...zeilen].sort((a, b) => b.spannweite - a.spannweite);
}
