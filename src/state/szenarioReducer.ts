/**
 * Zustandsverwaltung. Bewusst ohne externe Bibliothek.
 *
 * Ein `useReducer` ueber dem Szenario plus ein begrenzter Undo-Stapel deckt
 * die Anforderung "Aenderungsverlauf innerhalb einer Sitzung, mindestens Undo"
 * vollstaendig ab. Redux oder Zustand waeren hier zusaetzliche Abhaengigkeit
 * ohne Gegenwert: es gibt genau einen Nutzer, einen Zustandsbaum und keine
 * asynchronen Effekte.
 *
 * Der Undo-Stapel haelt maximal 50 Zustaende. Aufeinanderfolgende Aenderungen
 * am selben Feld innerhalb von 800 ms werden zu einem Eintrag zusammengefasst —
 * sonst erzeugt jeder Tastendruck in einem Zahlenfeld einen eigenen Schritt.
 */

import { szenarioDefault } from '../model/defaults';
import { ausPreset } from '../model/presets';
import type {
  Einmalinvestition,
  Fixkostenposition,
  Id,
  Kursprodukt,
  Szenario,
} from '../model/typen';

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
  /** Fuer die 800-ms-Zusammenfassung aufeinanderfolgender 'setze' auf dasselbe Feld. */
  readonly letzterSetzePfad: string | null;
  readonly letzteSetzeZeit: number;
}

const MAX_VERLAUF = 50;
const MERGE_FENSTER_MS = 800;

export function anfangsZustand(szenario: Szenario): ZustandMitVerlauf {
  return { gegenwart: szenario, vergangenheit: [], zukunft: [], letzterSetzePfad: null, letzteSetzeZeit: 0 };
}

function setzeTief(objekt: unknown, pfad: readonly string[], wert: unknown): unknown {
  if (pfad.length === 0) return wert;
  const [kopf, ...rest] = pfad as [string, ...string[]];

  if (Array.isArray(objekt)) {
    const index = Number(kopf);
    if (!Number.isInteger(index) || index < 0 || index >= objekt.length) {
      throw new Error(`Ungueltiger Array-Index im Pfad: ${kopf}`);
    }
    const kopie = [...objekt];
    kopie[index] = setzeTief(objekt[index], rest, wert);
    return kopie;
  }

  if (typeof objekt === 'object' && objekt !== null) {
    const quelle = objekt as Record<string, unknown>;
    return { ...quelle, [kopf]: setzeTief(quelle[kopf], rest, wert) };
  }

  throw new Error(`Pfad fuehrt auf einen Nicht-Objekt-Wert: ${pfad.join('.')}`);
}

function mitNeuemSzenario(zustand: ZustandMitVerlauf, neuesSzenario: Szenario): ZustandMitVerlauf {
  return {
    gegenwart: neuesSzenario,
    vergangenheit: [...zustand.vergangenheit, zustand.gegenwart].slice(-MAX_VERLAUF),
    zukunft: [],
    letzterSetzePfad: null,
    letzteSetzeZeit: 0,
  };
}

function neueId(): Id {
  return crypto.randomUUID();
}

const NEUES_PRODUKT_VORLAGE: Omit<Kursprodukt, 'id'> = {
  bezeichnung: 'Neues Produkt',
  kategorie: 'Kinderkurs',
  aktiv: true,
  abMonat: 0,
  abrechnung: 'je_teilnehmer',
  teilnehmerJeKurs: 6,
  preisJeTeilnehmer: 150,
  pauschaleJeKurs: 0,
  einheitenJeKurs: 10,
  dauerJeEinheitMinuten: 45,
  beckenflaeche: 1,
  beckenmieteJeStunde: 60,
  auslastungsgrad: 0.8,
  kurseParallelJeZyklus: 1,
  zyklenProJahr: 4,
  saison: 'ganzjahr',
  zppFaehig: false,
  zppPreisaufschlag: 0,
  durchfuehrung: 'ich',
  honorarFremdlehrkraftJeStunde: 35,
};

const NEUE_FIXKOSTEN_VORLAGE: Omit<Fixkostenposition, 'id'> = {
  bezeichnung: 'Neue Position',
  betragProJahr: 100,
  vorsteuerabzugsfaehig: false,
  indexiert: true,
};

const NEUE_INVESTITION_VORLAGE: Omit<Einmalinvestition, 'id'> = {
  bezeichnung: 'Neue Investition',
  betrag: 500,
  monat: 0,
  vorsteuerabzugsfaehig: false,
};

export function reduziere(zustand: ZustandMitVerlauf, aktion: Aktion): ZustandMitVerlauf {
  switch (aktion.typ) {
    case 'setze': {
      const jetzt = Date.now();
      const gleichesFeldKuerzlich =
        aktion.pfad === zustand.letzterSetzePfad && jetzt - zustand.letzteSetzeZeit < MERGE_FENSTER_MS;
      const neuesSzenario: Szenario = {
        ...(setzeTief(zustand.gegenwart, aktion.pfad.split('.'), aktion.wert) as Szenario),
        geaendertAm: new Date().toISOString(),
      };
      return {
        gegenwart: neuesSzenario,
        vergangenheit: gleichesFeldKuerzlich
          ? zustand.vergangenheit
          : [...zustand.vergangenheit, zustand.gegenwart].slice(-MAX_VERLAUF),
        zukunft: [],
        letzterSetzePfad: aktion.pfad,
        letzteSetzeZeit: jetzt,
      };
    }

    case 'produkt_hinzufuegen': {
      const produkt: Kursprodukt = { id: neueId(), ...NEUES_PRODUKT_VORLAGE };
      return mitNeuemSzenario(zustand, {
        ...zustand.gegenwart,
        produkte: [...zustand.gegenwart.produkte, produkt],
      });
    }

    case 'produkt_loeschen': {
      return mitNeuemSzenario(zustand, {
        ...zustand.gegenwart,
        produkte: zustand.gegenwart.produkte.filter((p) => p.id !== aktion.id),
      });
    }

    case 'fixkosten_hinzufuegen': {
      const position: Fixkostenposition = { id: neueId(), ...NEUE_FIXKOSTEN_VORLAGE };
      return mitNeuemSzenario(zustand, {
        ...zustand.gegenwart,
        fixkosten: [...zustand.gegenwart.fixkosten, position],
      });
    }

    case 'fixkosten_loeschen': {
      return mitNeuemSzenario(zustand, {
        ...zustand.gegenwart,
        fixkosten: zustand.gegenwart.fixkosten.filter((f) => f.id !== aktion.id),
      });
    }

    case 'investition_hinzufuegen': {
      const investition: Einmalinvestition = { id: neueId(), ...NEUE_INVESTITION_VORLAGE };
      return mitNeuemSzenario(zustand, {
        ...zustand.gegenwart,
        investitionen: [...zustand.gegenwart.investitionen, investition],
      });
    }

    case 'investition_loeschen': {
      return mitNeuemSzenario(zustand, {
        ...zustand.gegenwart,
        investitionen: zustand.gegenwart.investitionen.filter((i) => i.id !== aktion.id),
      });
    }

    case 'preset_laden': {
      const neuesSzenario = ausPreset(aktion.schluessel, zustand.gegenwart.id);
      return mitNeuemSzenario(zustand, { ...neuesSzenario, name: zustand.gegenwart.name });
    }

    case 'zuruecksetzen': {
      const frisch = szenarioDefault(zustand.gegenwart.id, zustand.gegenwart.name);
      if (aktion.bereich === 'alle') {
        return mitNeuemSzenario(zustand, frisch);
      }
      return mitNeuemSzenario(zustand, { ...zustand.gegenwart, [aktion.bereich]: frisch[aktion.bereich] });
    }

    case 'szenario_ersetzen': {
      return {
        gegenwart: aktion.szenario,
        vergangenheit: [],
        zukunft: [],
        letzterSetzePfad: null,
        letzteSetzeZeit: 0,
      };
    }

    case 'undo': {
      const letztes = zustand.vergangenheit.at(-1);
      if (!letztes) return zustand;
      return {
        gegenwart: letztes,
        vergangenheit: zustand.vergangenheit.slice(0, -1),
        zukunft: [zustand.gegenwart, ...zustand.zukunft],
        letzterSetzePfad: null,
        letzteSetzeZeit: 0,
      };
    }

    case 'redo': {
      const naechstes = zustand.zukunft[0];
      if (!naechstes) return zustand;
      return {
        gegenwart: naechstes,
        vergangenheit: [...zustand.vergangenheit, zustand.gegenwart].slice(-MAX_VERLAUF),
        zukunft: zustand.zukunft.slice(1),
        letzterSetzePfad: null,
        letzteSetzeZeit: 0,
      };
    }
  }
}
