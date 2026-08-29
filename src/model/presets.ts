/**
 * Voreingestellte Szenarien, Abschnitt 7.
 *
 * Presets sind als Transformationen des Defaultszenarios formuliert, nicht als
 * vollstaendige Kopien. Damit wirken spaetere Aenderungen an den Defaults auf
 * alle Presets durch, und die Abweichung eines Presets bleibt an genau einer
 * Stelle lesbar — das ist zugleich die Dokumentation, was das Preset zeigen soll.
 */

import { szenarioDefault } from './defaults';
import type { Szenario } from './typen';

export interface PresetDefinition {
  readonly schluessel: string;
  readonly name: string;
  /** Was dieses Preset zeigen soll — wird in der UI als Untertitel angezeigt. */
  readonly aussage: string;
  readonly anwenden: (basis: Szenario) => Szenario;
}

export const PRESETS: readonly PresetDefinition[] = [
  {
    schluessel: 'basis',
    name: 'Basis',
    aussage: '80 %, Hallenbadzugang ab Monat 12, 8 Wasserstunden.',
    anwenden: (s) => ({
      ...s,
      anstellung: { ...s.anstellung, beschaeftigungsgrad: 0.8 },
      wasser: {
        ...s.wasser,
        hallenbadzugang: true,
        hallenbadAbMonat: 12,
        wasserstundenProWoche: 8,
      },
    }),
  },
  {
    schluessel: 'nur-freibad',
    name: 'Nur Freibad',
    aussage:
      'Kein Hallenbadzugang, 15 aktive Wochen. Zeigt, warum der Saisonbetrieb allein nicht traegt.',
    anwenden: (s) => ({
      ...s,
      anstellung: { ...s.anstellung, beschaeftigungsgrad: 0.8 },
      wasser: { ...s.wasser, hallenbadzugang: false, aktiveWochenFreibad: 15 },
    }),
  },
  {
    schluessel: 'konservativ',
    name: 'Konservativ',
    aussage: 'Auslastung minus 20 %, Beckenmiete plus 30 %, Ausfallquote 15 %.',
    anwenden: (s) => ({
      ...s,
      anstellung: { ...s.anstellung, beschaeftigungsgrad: 0.8 },
      wasser: { ...s.wasser, hallenbadzugang: true, hallenbadAbMonat: 12, ausfallquote: 0.15 },
      produkte: s.produkte.map((p) => ({
        ...p,
        auslastungsgrad: p.auslastungsgrad * 0.8,
        beckenmieteJeStunde: p.beckenmieteJeStunde * 1.3,
      })),
    }),
  },
  {
    schluessel: 'ambitioniert',
    name: 'Ambitioniert',
    aussage: '60 % Beschäftigungsgrad, ZPP-Aquafitness und BGM-Kunde ab Jahr 2.',
    anwenden: (s) => ({
      ...s,
      anstellung: { ...s.anstellung, beschaeftigungsgrad: 0.6 },
      wasser: { ...s.wasser, hallenbadzugang: true, hallenbadAbMonat: 12 },
      produkte: s.produkte.map((p) =>
        p.id === 'p-aqua-mit-zpp' || p.id === 'p-bgm-firma'
          ? { ...p, aktiv: true, abMonat: 12 }
          : p,
      ),
    }),
  },
  {
    schluessel: 'fremdlehrkraft',
    name: 'Mit Fremdlehrkraft',
    aussage:
      'Zweite Lehrkraft ab Jahr 3. Kapazität verdoppelt, Deckungsbeitrag je Stunde sinkt um das Honorar.',
    anwenden: (s) => ({
      ...s,
      anstellung: { ...s.anstellung, beschaeftigungsgrad: 0.6 },
      wasser: { ...s.wasser, hallenbadzugang: true, hallenbadAbMonat: 12 },
      produkte: [
        ...s.produkte,
        ...s.produkte
          .filter((p) => p.aktiv && p.kategorie === 'Kinderkurs')
          .map((p) => ({
            ...p,
            id: `${p.id}-fremd`,
            bezeichnung: `${p.bezeichnung} (Fremdlehrkraft)`,
            durchfuehrung: 'fremdlehrkraft' as const,
            abMonat: 24,
          })),
      ],
    }),
  },
  {
    schluessel: 'portfolio',
    name: 'Portfolio',
    aussage: '60 % plus Lehrauftrag, Professurpfad ab Jahr 6.',
    anwenden: (s) => ({
      ...s,
      anstellung: { ...s.anstellung, beschaeftigungsgrad: 0.6 },
      wasser: { ...s.wasser, hallenbadzugang: true, hallenbadAbMonat: 12 },
      lehre: {
        ...s.lehre,
        lehrauftragAktiv: true,
        professurAktiv: true,
        professurStartjahr: 6,
      },
    }),
  },
];

/** Erzeugt ein Szenario aus einem Preset-Schluessel. */
export function ausPreset(schluessel: string, id: string): Szenario {
  const preset = PRESETS.find((p) => p.schluessel === schluessel);
  if (!preset) throw new Error(`Unbekanntes Preset: ${schluessel}`);
  const basis = szenarioDefault(id, preset.name);
  return preset.anwenden(basis);
}
