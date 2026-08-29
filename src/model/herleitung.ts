/**
 * Herleitung jeder Kennzahl, Abschnitt 5 ("Jede Kennzahl per Klick aufklappbar
 * mit vollstaendigem Rechenweg und den verwendeten Annahmen").
 *
 * ARCHITEKTUR: Die Herleitung ist eine reine SICHT auf das Ergebnisobjekt.
 * Rechenfunktionen protokollieren nichts — sie liefern lediglich alle
 * Zwischenwerte im Ergebnistyp mit. Vorteil: keine String-Erzeugung im
 * heissen Pfad der Sensitivitaetsanalyse, und die Herleitung kann nicht vom
 * tatsaechlichen Rechenweg abweichen, weil sie dieselben Werte liest.
 */

import type { Herleitung, JahresErgebnis, Szenario } from './typen';

export type Kennzahl =
  | 'gesamtnetto'
  | 'differenz_baseline'
  | 'db_je_wasserstunde'
  | 'kapazitaetsauslastung'
  | 'wochenbelastung'
  | 'deckungsgrad'
  | 'netto_anstellung'
  | 'gewinn'
  | 'rentendifferenz';

export function herleite(
  kennzahl: Kennzahl,
  szenario: Szenario,
  jahr: JahresErgebnis,
): Herleitung {
  void kennzahl; void szenario; void jahr;
  throw new Error('herleite: nicht implementiert');
}
