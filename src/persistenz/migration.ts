/**
 * Migrationspfad, Abschnitt 6: "damit gespeicherte Szenarien ein Update ueberleben".
 *
 * Verfahren: Migrationen sind eine geordnete Kette von Funktionen
 * `vonVersion -> vonVersion + 1`. Beim Laden wird die gespeicherte Version
 * gelesen und die Kette bis zur aktuellen Version durchlaufen. Faellt eine
 * Migration aus, wird das Szenario NICHT verworfen, sondern als
 * "nicht migrierbar" markiert und im Export weiterhin angeboten — der Nutzer
 * verliert seine Eingaben nicht.
 *
 * Unbekannte Felder werden beim Laden verworfen, fehlende aus den Defaults
 * ergaenzt. Damit ist auch ein von Hand bearbeitetes JSON belastbar.
 */

import type { Szenario } from '../model/typen';

export type Migration = (roh: unknown) => unknown;

/** Index 0 migriert Version 0 -> 1, Index 1 migriert 1 -> 2 usw. */
export const MIGRATIONEN: readonly Migration[] = [];

export function migriere(roh: unknown, vonVersion: number): unknown {
  void roh; void vonVersion;
  throw new Error('migriere: nicht implementiert');
}

/**
 * Prueft und vervollstaendigt ein rohes Objekt zu einem gueltigen Szenario.
 * Fehlende Felder werden aus den Defaults ergaenzt, unbekannte verworfen,
 * Zahlen gegen ihre Min/Max-Grenzen geprueft.
 */
export function normalisiere(roh: unknown): Szenario | null {
  void roh;
  throw new Error('normalisiere: nicht implementiert');
}
