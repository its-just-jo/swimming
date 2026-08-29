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
  void wasser; void jahrIndex;
  throw new Error('verfuegbareWasserstunden: nicht implementiert');
}

export function berechneKapazitaet(eingabe: {
  wasser: Wasserkapazitaet;
  produktErgebnisse: readonly ProduktErgebnis[];
  jahrIndex: number;
}): KapazitaetErgebnis {
  void eingabe;
  throw new Error('berechneKapazitaet: nicht implementiert');
}
