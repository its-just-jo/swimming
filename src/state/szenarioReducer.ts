/**
 * Zustandsverwaltung. Bewusst ohne externe Bibliothek.
 *
 * Ein `useReducer` ueber dem Szenario plus ein begrenzter Undo-Stapel decken
 * die Anforderung "Aenderungsverlauf innerhalb einer Sitzung, mindestens Undo"
 * vollstaendig ab. Redux oder Zustand waeren hier zusaetzliche Abhaengigkeit
 * ohne Gegenwert: es gibt genau einen Nutzer, einen Zustandsbaum und keine
 * asynchronen Effekte.
 *
 * Der Undo-Stapel haelt maximal 50 Zustaende. Aufeinanderfolgende Aenderungen
 * am selben Feld innerhalb von 800 ms werden zu einem Eintrag zusammengefasst —
 * sonst erzeugt jeder Tastendruck in einem Zahlenfeld einen eigenen Schritt.
 */

import type { Id, Szenario } from '../model/typen';

export type Aktion =
  | { typ: 'setze'; pfad: string; wert: unknown }
  | { typ: 'produkt_hinzufuegen' }
  | { typ: 'produkt_loeschen'; id: Id }
  | { typ: 'fixkosten_hinzufuegen' }
  | { typ: 'fixkosten_loeschen'; id: Id }
  | { typ: 'investition_hinzufuegen' }
  | { typ: 'investition_loeschen'; id: Id }
  | { typ: 'preset_laden'; schluessel: string }
  | { typ: 'zuruecksetzen'; bereich: 'alle' | keyof Szenario }
  | { typ: 'szenario_ersetzen'; szenario: Szenario }
  | { typ: 'undo' }
  | { typ: 'redo' };

export interface ZustandMitVerlauf {
  readonly gegenwart: Szenario;
  readonly vergangenheit: readonly Szenario[];
  readonly zukunft: readonly Szenario[];
}

export function reduziere(zustand: ZustandMitVerlauf, aktion: Aktion): ZustandMitVerlauf {
  void zustand; void aktion;
  throw new Error('reduziere: nicht implementiert');
}
