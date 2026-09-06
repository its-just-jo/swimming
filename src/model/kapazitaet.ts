/**
 * Kapazitaetspruefung, Abschnitt 4.3.
 *
 * Verfuegbare Wasserstunden je Saison:
 *   verfuegbar = wasserstundenProWoche x aktiveWochen x (1 - ausfallquote)
 *
 * Ohne Hallenbadzugang duerfen ausschliesslich die Freibadwochen gerechnet
 * werden. Produkte mit `saison: 'ganzjahr'` oder `saison: 'halle'` liefern in
 * diesem Fall keinen Erloes — und das Tool weist das als Saisonrisiko aus,
 * statt still weiterzurechnen.
 *
 * Stunden von Fremdlehrkraeften erhoehen die Kapazitaet und belasten das
 * eigene Zeitbudget nicht. Sie werden getrennt gefuehrt.
 *
 * Bei Ueberschreitung wird NICHT stillschweigend gedeckelt. Der Rechenkern
 * liefert den geplanten Wert und setzt `ueberschreitung: true`; die UI zeigt
 * beides — geplant und kapazitaetsgedeckelt — nebeneinander.
 */

import type { KapazitaetErgebnis, ProduktErgebnis, Stunden, Wasserkapazitaet } from './typen';

export function verfuegbareWasserstunden(
  wasser: Wasserkapazitaet,
  jahrIndex: number,
): { freibad: Stunden; halle: Stunden; gesamt: Stunden; hallenbadVerfuegbar: boolean } {
  const restfaktor = 1 - wasser.ausfallquote;
  const freibad = wasser.wasserstundenProWoche * wasser.aktiveWochenFreibad * restfaktor;

  const hallenbadVerfuegbar = wasser.hallenbadzugang && jahrIndex * 12 >= wasser.hallenbadAbMonat;
  const halle = hallenbadVerfuegbar
    ? wasser.wasserstundenProWoche * wasser.aktiveWochenHalle * restfaktor
    : 0;

  return { freibad, halle, gesamt: freibad + halle, hallenbadVerfuegbar };
}

/**
 * Benoetigte Wasserzeit je Saison aus den Produktergebnissen.
 * `ganzjahr`-Produkte werden im Verhaeltnis der aktiven Wochen auf Freibad
 * und Halle verteilt — dieselbe Verteilungslogik wie fuer die
 * Monats-Cashflow-Ansicht (ARCHITEKTUR.md 1.7 Nr. 5).
 */
function benoetigteWasserzeitJeSaison(
  produktErgebnisse: readonly ProduktErgebnis[],
  wasser: Wasserkapazitaet,
): { freibad: Stunden; halle: Stunden; fremd: Stunden } {
  const wochenGesamt = wasser.aktiveWochenFreibad + wasser.aktiveWochenHalle;
  const freibadAnteil = wochenGesamt > 0 ? wasser.aktiveWochenFreibad / wochenGesamt : 0;

  let freibad = 0;
  let halle = 0;
  let fremd = 0;

  for (const p of produktErgebnisse) {
    if (p.durchfuehrung === 'fremdlehrkraft') {
      fremd += p.wasserzeitGesamt;
      continue;
    }
    if (p.saison === 'freibad') {
      freibad += p.wasserzeitGesamt;
    } else if (p.saison === 'halle') {
      halle += p.wasserzeitGesamt;
    } else {
      freibad += p.wasserzeitGesamt * freibadAnteil;
      halle += p.wasserzeitGesamt * (1 - freibadAnteil);
    }
  }

  return { freibad, halle, fremd };
}

export function berechneKapazitaet(eingabe: {
  wasser: Wasserkapazitaet;
  produktErgebnisse: readonly ProduktErgebnis[];
  jahrIndex: number;
}): KapazitaetErgebnis {
  const { wasser, produktErgebnisse, jahrIndex } = eingabe;

  const verfuegbar = verfuegbareWasserstunden(wasser, jahrIndex);
  const benoetigt = benoetigteWasserzeitJeSaison(produktErgebnisse, wasser);
  const benoetigtGesamt = benoetigt.freibad + benoetigt.halle;

  return {
    verfuegbarFreibad: verfuegbar.freibad,
    verfuegbarHalle: verfuegbar.halle,
    verfuegbarGesamt: verfuegbar.gesamt,
    benoetigtFreibad: benoetigt.freibad,
    benoetigtHalle: benoetigt.halle,
    benoetigtGesamt,
    benoetigtFremd: benoetigt.fremd,
    auslastungFreibad: verfuegbar.freibad > 0 ? benoetigt.freibad / verfuegbar.freibad : 0,
    auslastungHalle: verfuegbar.halle > 0 ? benoetigt.halle / verfuegbar.halle : 0,
    ueberschreitung: benoetigt.freibad > verfuegbar.freibad || benoetigt.halle > verfuegbar.halle,
  };
}

