/**
 * JSON-Export und -Import, Abschnitt 6. Rein lokal, kein Netzwerk.
 *
 * Export erzeugt einen Blob und einen Object-URL, der nach dem Klick wieder
 * freigegeben wird. Import liest ueber FileReader, migriert und normalisiert
 * den Inhalt und legt das Szenario als NEUES Szenario mit neuer ID an —
 * ein Import ueberschreibt niemals stillschweigend ein bestehendes.
 */

import type { Szenario } from '../model/typen';
import { migriere, normalisiere } from './migration';
import { SCHEMA_VERSION } from './speicher';

export interface ExportHuelle {
  readonly anwendung: 'szenariorechner-ausstiegspfad';
  readonly schemaVersion: number;
  readonly exportiertAm: string;
  readonly szenario: Szenario;
}

function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert);
}

export function exportiere(szenario: Szenario): ExportHuelle {
  return {
    anwendung: 'szenariorechner-ausstiegspfad',
    schemaVersion: SCHEMA_VERSION,
    exportiertAm: new Date().toISOString(),
    szenario,
  };
}

export function alsDatei(huelle: ExportHuelle): { dateiname: string; inhalt: string } {
  const sichererName =
    huelle.szenario.name.replace(/[^a-zA-Z0-9-_]+/g, '_').replace(/^_+|_+$/g, '') || 'szenario';
  const datum = huelle.exportiertAm.slice(0, 10);
  return { dateiname: `${sichererName}_${datum}.json`, inhalt: JSON.stringify(huelle, null, 2) };
}

export function importiere(text: string, neueId: string): Szenario | { fehler: string } {
  let roh: unknown;
  try {
    roh = JSON.parse(text);
  } catch {
    return { fehler: 'Die Datei enthaelt kein gueltiges JSON.' };
  }
  if (!istObjekt(roh)) {
    return { fehler: 'Unerwartetes Dateiformat.' };
  }

  // Toleriert sowohl eine vollstaendige Export-Huelle als auch eine Datei,
  // die nur das Szenario selbst enthaelt (z. B. von Hand bearbeitet).
  const szenarioRoh = istObjekt(roh.szenario) ? roh.szenario : roh;
  const version = typeof roh.schemaVersion === 'number' ? roh.schemaVersion : SCHEMA_VERSION;

  const migriert = migriere(szenarioRoh, version);
  const normalisiert = normalisiere(migriert);
  if (!normalisiert) {
    return { fehler: 'Die Datei konnte nicht als Szenario gelesen werden.' };
  }

  const jetzt = new Date().toISOString();
  return { ...normalisiert, id: neueId, erstelltAm: jetzt, geaendertAm: jetzt };
}
