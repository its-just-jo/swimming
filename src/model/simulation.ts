/**
 * Orchestrierung des Gesamtmodells.
 *
 * ZWEISTUFIGE ZEITACHSE — die zentrale Architekturentscheidung:
 *
 * Steuern sind progressiv und jahresbezogen, Cashflow ist monatlich. Beides in
 * einem Durchlauf zu rechnen fuehrt zwangslaeufig zu falscher Progression.
 * Daher:
 *
 *   Stufe A  Monatliche Rohstroeme: Erloese, Beckenmiete, Honorare, Fixkosten,
 *            Investitionen — aus Produkten und Saisonkalender.
 *   Stufe B  Aggregation je KALENDERJAHR. Erst auf dieser Ebene werden
 *            Einkommensteuer, Gewerbesteuer und DRV-Beitrag berechnet, und zwar
 *            gemeinsam mit dem Arbeitsentgelt.
 *   Stufe C  Ruecktragung der Jahresabgaben auf die Monate (gleichmaessig,
 *            als Abgrenzung, nicht als Vorauszahlungstermin) fuer die
 *            Cashflow-Ansicht. Diese Vereinfachung ist an der Grafik
 *            auszuweisen.
 *
 * Das Steuerjahr ist das Kalenderjahr. Faellt der Startmonat nicht auf Januar,
 * ist das erste Simulationsjahr ein Rumpfjahr auf der Kursseite; das
 * Arbeitsentgelt laeuft ganzjaehrig weiter, weil die Anstellung bereits besteht.
 *
 * `berechneSzenario` ist eine reine Funktion ohne Seiteneffekte und muss schnell
 * genug bleiben, um von der Sensitivitaetsanalyse rund 25-mal je Interaktion
 * aufgerufen zu werden. Richtwert: unter 20 ms je Durchlauf.
 */

import type { Ergebnis, JahresErgebnis, MonatsErgebnis, Szenario } from './typen';

/** Reine Gesamtberechnung eines Szenarios ueber den vollen Horizont. */
export function berechneSzenario(szenario: Szenario): Ergebnis {
  void szenario;
  throw new Error('berechneSzenario: nicht implementiert');
}

/**
 * Vollzeit-Baseline: dasselbe Szenario mit beschaeftigungsgrad = 1,0 und ohne
 * jede selbststaendige Taetigkeit. Referenz fuer Luecke und Deckungsgrad.
 */
export function baselineSzenario(szenario: Szenario): Szenario {
  void szenario;
  throw new Error('baselineSzenario: nicht implementiert');
}

export function berechneJahr(szenario: Szenario, jahrIndex: number): JahresErgebnis {
  void szenario; void jahrIndex;
  throw new Error('berechneJahr: nicht implementiert');
}

/** Monatliche Aufloesung eines Musterjahres — macht die Saisonalitaet sichtbar. */
export function berechneMonate(szenario: Szenario, jahrIndex: number): readonly MonatsErgebnis[] {
  void szenario; void jahrIndex;
  throw new Error('berechneMonate: nicht implementiert');
}
