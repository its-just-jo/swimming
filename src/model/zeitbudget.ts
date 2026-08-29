/**
 * Wochenbelastung, Abschnitt 4.5.
 *
 *   gesamt = Hauptjobstunden
 *          + eigene Wasserstunden x (1 + Vorbereitungsfaktor)
 *          + Anfahrt
 *          + Adminpauschale
 *
 * Anfahrt: Die Zahl der Kurstermine je Woche wird aus den eigenen
 * Wasserstunden und der mengengewichteten mittleren Termindauer abgeleitet.
 * Ein 45-Minuten-Termin bedeutet bei acht Wasserstunden rund elf Anfahrten
 * je Woche — dieser Effekt ist gross genug, um ihn nicht zu pauschalieren.
 */

import type { Anstellung, ProduktErgebnis, Stunden, Wasserkapazitaet, ZeitbudgetErgebnis } from './typen';

/** Mengengewichtete mittlere Dauer eines Kurstermins in Stunden. */
export function mittlereTerminlaenge(produktErgebnisse: readonly ProduktErgebnis[], produkte: readonly { id: string; dauerJeEinheitMinuten: number }[]): Stunden {
  void produktErgebnisse; void produkte;
  throw new Error('mittlereTerminlaenge: nicht implementiert');
}

export function berechneZeitbudget(eingabe: {
  anstellung: Anstellung;
  wasser: Wasserkapazitaet;
  eigeneWasserstundenProJahr: Stunden;
  mittlereTerminlaengeStunden: Stunden;
  aktiveWochen: number;
  warnschwelle: Stunden;
}): ZeitbudgetErgebnis {
  void eingabe;
  throw new Error('berechneZeitbudget: nicht implementiert');
}
