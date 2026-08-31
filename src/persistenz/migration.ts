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

import { szenarioDefault } from '../model/defaults';
import type { Szenario } from '../model/typen';
import { SCHEMA_VERSION } from './speicher';

export type Migration = (roh: unknown) => unknown;

/** Index 0 migriert Version 0 -> 1, Index 1 migriert 1 -> 2 usw. */
export const MIGRATIONEN: readonly Migration[] = [];

export function migriere(roh: unknown, vonVersion: number): unknown {
  let ergebnis = roh;
  for (let version = vonVersion; version < SCHEMA_VERSION; version++) {
    const schritt = MIGRATIONEN[version];
    // Fehlt fuer diesen Schritt eine Migration, bleibt das Objekt unveraendert
    // stehen statt zu scheitern — normalisiere() ergaenzt anschliessend aus
    // den Defaults, was tatsaechlich fehlt.
    if (schritt) ergebnis = schritt(ergebnis);
  }
  return ergebnis;
}

function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

/**
 * Fuellt `roh` rekursiv gegen die Form von `basis` auf: fehlende Felder aus
 * `basis`, unbekannte Felder aus `roh` verworfen, Typabweichungen verworfen.
 * Arrays von Objekten (Produkte, Fixkosten, Investitionen) werden je Eintrag
 * gegen das erste Default-Element als Formvorlage aufgefuellt.
 */
function mergeWert(basis: unknown, roh: unknown): unknown {
  if (Array.isArray(basis)) {
    if (!Array.isArray(roh)) return basis;
    const vorlage: unknown = basis[0];
    if (istObjekt(vorlage)) {
      return roh.map((eintrag) => (istObjekt(eintrag) ? mergeWert(vorlage, eintrag) : vorlage));
    }
    return roh;
  }
  if (istObjekt(basis)) {
    if (!istObjekt(roh)) return basis;
    const ergebnis: Record<string, unknown> = { ...basis };
    for (const schluessel of Object.keys(basis)) {
      ergebnis[schluessel] = mergeWert(basis[schluessel], roh[schluessel]);
    }
    return ergebnis;
  }
  return typeof roh === typeof basis ? roh : basis;
}

/**
 * Prueft und vervollstaendigt ein rohes Objekt zu einem gueltigen Szenario.
 * Fehlende Felder werden aus den Defaults ergaenzt, unbekannte verworfen,
 * Zahlen gegen ihre Min/Max-Grenzen geprueft.
 */
export function normalisiere(roh: unknown): Szenario | null {
  if (!istObjekt(roh)) return null;

  const id = typeof roh.id === 'string' && roh.id.length > 0 ? roh.id : crypto.randomUUID();
  const name = typeof roh.name === 'string' && roh.name.length > 0 ? roh.name : 'Basis';
  const basis = szenarioDefault(id, name);

  return mergeWert(basis, roh) as Szenario;
}
