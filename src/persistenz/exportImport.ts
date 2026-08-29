/**
 * JSON-Export und -Import, Abschnitt 6. Rein lokal, kein Netzwerk.
 *
 * Export erzeugt einen Blob und einen Object-URL, der nach dem Klick wieder
 * freigegeben wird. Import liest ueber FileReader, migriert und normalisiert
 * den Inhalt und legt das Szenario als NEUES Szenario mit neuer ID an —
 * ein Import ueberschreibt niemals stillschweigend ein bestehendes.
 */

import type { Szenario } from '../model/typen';

export interface ExportHuelle {
  readonly anwendung: 'szenariorechner-ausstiegspfad';
  readonly schemaVersion: number;
  readonly exportiertAm: string;
  readonly szenario: Szenario;
}

export function exportiere(szenario: Szenario): ExportHuelle {
  void szenario;
  throw new Error('exportiere: nicht implementiert');
}

export function alsDatei(huelle: ExportHuelle): { dateiname: string; inhalt: string } {
  void huelle;
  throw new Error('alsDatei: nicht implementiert');
}

export function importiere(text: string, neueId: string): Szenario | { fehler: string } {
  void text; void neueId;
  throw new Error('importiere: nicht implementiert');
}
