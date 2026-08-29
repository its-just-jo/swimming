import { describe, expect, it } from 'vitest';
import { WASSER_DEFAULT } from '../defaults';
import { verfuegbareWasserstunden } from '../kapazitaet';

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
