/**
 * localStorage-Zugriff, Abschnitt 6.
 *
 * Schema:
 *   szenario:<uuid>     vollstaendiger Parametersatz
 *   szenario:index      Liste aller IDs mit Name und Zeitstempel
 *   app:einstellungen   aktives Szenario, UI-Zustand
 *   app:version         Schemaversion fuer Migrationen
 *
 * Jeder Zugriff liegt in try/catch. Ist localStorage nicht verfuegbar
 * (Privatmodus, blockierte Cookies, Kontingent erschoepft), faellt das Modul in
 * den Nur-Speicher-Modus zurueck: die App laeuft vollstaendig weiter, meldet den
 * Zustand aber sichtbar und dauerhaft in der Kopfzeile. Kein stiller Datenverlust.
 *
 * Schreibvorgaenge sind gedrosselt (debounce 400 ms, zusaetzlich Flush bei
 * `visibilitychange` und `pagehide` — ohne diesen Flush geht die letzte
 * Aenderung beim Schliessen des Tabs verloren).
 */

import type { AppEinstellungen, Id, SpeicherModus, Szenario, SzenarioIndexEintrag } from '../model/typen';

export const SCHLUESSEL = {
  szenario: (id: Id) => `szenario:${id}`,
  index: 'szenario:index',
  einstellungen: 'app:einstellungen',
  version: 'app:version',
} as const;

/** Aktuelle Schemaversion. Bei jeder inkompatiblen Aenderung erhoehen. */
export const SCHEMA_VERSION = 1;

/** Schattenspeicher fuer den Nur-Speicher-Modus — nie fuer Lesevorgaenge im Normalfall genutzt. */
const fallbackSpeicher = new Map<string, string>();
let modus: SpeicherModus | null = null;

function ermittleModus(): SpeicherModus {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return 'nur_speicher';
    const testSchluessel = '__szenariorechner_test__';
    ls.setItem(testSchluessel, '1');
    ls.removeItem(testSchluessel);
    return 'localstorage';
  } catch {
    return 'nur_speicher';
  }
}

export function pruefeSpeicher(): SpeicherModus {
  modus ??= ermittleModus();
  return modus;
}

function lese(schluessel: string): string | null {
  if (pruefeSpeicher() === 'nur_speicher') return fallbackSpeicher.get(schluessel) ?? null;
  try {
    return globalThis.localStorage.getItem(schluessel);
  } catch {
    modus = 'nur_speicher';
    return fallbackSpeicher.get(schluessel) ?? null;
  }
}

function schreibe(schluessel: string, wert: string): void {
  if (pruefeSpeicher() === 'nur_speicher') {
    fallbackSpeicher.set(schluessel, wert);
    return;
  }
  try {
    globalThis.localStorage.setItem(schluessel, wert);
  } catch {
    modus = 'nur_speicher';
    fallbackSpeicher.set(schluessel, wert);
  }
}

function entferne(schluessel: string): void {
  fallbackSpeicher.delete(schluessel);
  if (pruefeSpeicher() === 'nur_speicher') return;
  try {
    globalThis.localStorage.removeItem(schluessel);
  } catch {
    modus = 'nur_speicher';
  }
}

function leseJSON<T>(schluessel: string): T | null {
  const roh = lese(schluessel);
  if (roh === null) return null;
  try {
    return JSON.parse(roh) as T;
  } catch {
    return null;
  }
}

function schreibeJSON(schluessel: string, wert: unknown): void {
  schreibe(schluessel, JSON.stringify(wert));
}

export function ladeIndex(): readonly SzenarioIndexEintrag[] {
  return leseJSON<SzenarioIndexEintrag[]>(SCHLUESSEL.index) ?? [];
}

export function ladeSzenario(id: Id): Szenario | null {
  return leseJSON<Szenario>(SCHLUESSEL.szenario(id));
}

export function speichereSzenario(szenario: Szenario): void {
  schreibeJSON(SCHLUESSEL.szenario(szenario.id), szenario);

  const index = [...ladeIndex()];
  const eintrag: SzenarioIndexEintrag = {
    id: szenario.id,
    name: szenario.name,
    geaendertAm: szenario.geaendertAm,
  };
  const position = index.findIndex((e) => e.id === szenario.id);
  if (position >= 0) index[position] = eintrag;
  else index.push(eintrag);
  schreibeJSON(SCHLUESSEL.index, index);

  schreibe(SCHLUESSEL.version, String(SCHEMA_VERSION));
}

export function loescheSzenario(id: Id): void {
  entferne(SCHLUESSEL.szenario(id));
  const index = ladeIndex().filter((e) => e.id !== id);
  schreibeJSON(SCHLUESSEL.index, index);
}

export function ladeEinstellungen(): AppEinstellungen | null {
  return leseJSON<AppEinstellungen>(SCHLUESSEL.einstellungen);
}

export function speichereEinstellungen(einstellungen: AppEinstellungen): void {
  schreibeJSON(SCHLUESSEL.einstellungen, einstellungen);
}

/** Erzeugt eine gedrosselte Schreibfunktion inklusive Flush-Handhabe. */
export function drossle<T>(
  schreiben: (wert: T) => void,
  verzoegerungMs: number,
): { schreibe: (wert: T) => void; flush: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let ausstehenderWert: T | undefined;
  let hatAusstehenden = false;

  const flush = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (hatAusstehenden) {
      schreiben(ausstehenderWert as T);
      hatAusstehenden = false;
    }
  };

  const schreibeGedrosselt = (wert: T): void => {
    ausstehenderWert = wert;
    hatAusstehenden = true;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(flush, verzoegerungMs);
  };

  return { schreibe: schreibeGedrosselt, flush };
}
