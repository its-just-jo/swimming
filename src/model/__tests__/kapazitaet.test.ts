import { describe, expect, it } from 'vitest';
import { WASSER_DEFAULT } from '../defaults';
import { berechneKapazitaet, verfuegbareWasserstunden } from '../kapazitaet';
import type { ProduktErgebnis } from '../typen';

describe('Verfuegbare Wasserstunden', () => {
  it('rechnet ohne Hallenbadzugang nur die Freibadwochen', () => {
    // 8 h/Woche * 15 Wochen * (1 - 8 % Ausfall) = 110,4 h
    const e = verfuegbareWasserstunden({ ...WASSER_DEFAULT, hallenbadzugang: false }, 0);
    expect(e.freibad).toBeCloseTo(110.4, 4);
    expect(e.halle).toBe(0);
    expect(e.gesamt).toBeCloseTo(110.4, 4);
    expect(e.hallenbadVerfuegbar).toBe(false);
  });

  it('addiert die Hallenwochen bei vorhandenem Zugang', () => {
    // Halle: 8 * 25 * 0,92 = 184,0; gesamt 294,4
    const e = verfuegbareWasserstunden(
      { ...WASSER_DEFAULT, hallenbadzugang: true, hallenbadAbMonat: 0 },
      0,
    );
    expect(e.halle).toBeCloseTo(184, 4);
    expect(e.gesamt).toBeCloseTo(294.4, 4);
  });

  it('beruecksichtigt den Startmonat des Hallenbadzugangs', () => {
    // Zugang ab Monat 12 -> im ersten Jahr (Index 0) noch nicht verfuegbar
    const jahr0 = verfuegbareWasserstunden(
      { ...WASSER_DEFAULT, hallenbadzugang: true, hallenbadAbMonat: 12 },
      0,
    );
    const jahr1 = verfuegbareWasserstunden(
      { ...WASSER_DEFAULT, hallenbadzugang: true, hallenbadAbMonat: 12 },
      1,
    );
    expect(jahr0.hallenbadVerfuegbar).toBe(false);
    expect(jahr0.halle).toBe(0);
    expect(jahr1.hallenbadVerfuegbar).toBe(true);
    expect(jahr1.halle).toBeCloseTo(184, 4);
  });

  it('eine Ausfallquote von 0 laesst die Kapazitaet unberuehrt', () => {
    const e = verfuegbareWasserstunden(
      { ...WASSER_DEFAULT, hallenbadzugang: true, hallenbadAbMonat: 0, ausfallquote: 0 },
      0,
    );
    expect(e.gesamt).toBeCloseTo(8 * 40, 4);
  });
});

function produktErgebnis(teil: Partial<ProduktErgebnis>): ProduktErgebnis {
  return {
    produktId: 'p',
    bezeichnung: 'Test',
    erloesBrutto: 0,
    umsatzsteuer: 0,
    erloesNetto: 0,
    wasserzeitJeKurs: 0,
    wasserzeitGesamt: 0,
    miete: 0,
    honorar: 0,
    deckungsbeitrag: 0,
    deckungsbeitragJeWasserstunde: 0,
    anzahlKurseProJahr: 0,
    durchfuehrung: 'ich',
    saison: 'ganzjahr',
    stummGrund: null,
    ...teil,
  };
}

describe('berechneKapazitaet', () => {
  it('auslastungGesamt ist die benoetigte durch die verfuegbare Gesamtzeit (Kursplan-Kopfzeile, design.md 5.1)', () => {
    // verfuegbar gesamt bei WASSER_DEFAULT mit Hallenbadzugang: 110,4 + 184 = 294,4 h
    // ein Ganzjahresprodukt mit 131 h Wasserzeit wird im Verhaeltnis der aktiven
    // Wochen (15 : 25) auf Freibad/Halle verteilt — die Summe bleibt aber 131 h,
    // die Aufteilung auf die Pools ist fuer auslastungGesamt ohne Belang.
    const e = berechneKapazitaet({
      wasser: { ...WASSER_DEFAULT, hallenbadzugang: true, hallenbadAbMonat: 0 },
      produktErgebnisse: [produktErgebnis({ saison: 'ganzjahr', wasserzeitGesamt: 131 })],
      jahrIndex: 0,
    });
    expect(e.benoetigtGesamt).toBeCloseTo(131, 6);
    expect(e.verfuegbarGesamt).toBeCloseTo(294.4, 4);
    expect(e.auslastungGesamt).toBeCloseTo(131 / 294.4, 6);
  });

  it('auslastungGesamt ist 0, wenn keine Wasserzeit verfuegbar ist', () => {
    const e = berechneKapazitaet({
      wasser: { ...WASSER_DEFAULT, hallenbadzugang: false, aktiveWochenFreibad: 0 },
      produktErgebnisse: [],
      jahrIndex: 0,
    });
    expect(e.verfuegbarGesamt).toBe(0);
    expect(e.auslastungGesamt).toBe(0);
  });
});
