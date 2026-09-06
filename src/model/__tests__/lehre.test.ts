import { describe, expect, it } from 'vitest';
import { LEHRE_DEFAULT } from '../defaults';
import { lehrauftragEinkuenfte, professurBrutto } from '../lehre';

describe('Lehrauftrag', () => {
  it('ist 0, wenn nicht aktiv', () => {
    expect(lehrauftragEinkuenfte(LEHRE_DEFAULT, 0)).toBe(0);
  });

  it('rechnet LVS je Semester * Satz je LVS * 2 Semester, wenn ganzjaehrig aktiv', () => {
    // 4 * 45 * 2 = 360
    const lehre = { ...LEHRE_DEFAULT, lehrauftragAktiv: true, startmonat: 0 };
    expect(lehrauftragEinkuenfte(lehre, 1)).toBeCloseTo(360, 2);
  });

  it('teilt anteilig, wenn der Lehrauftrag erst waehrend des Jahres beginnt', () => {
    // Start Monat 6 -> im ersten Jahr nur 6 von 12 Monaten aktiv -> halber Betrag
    const lehre = { ...LEHRE_DEFAULT, lehrauftragAktiv: true, startmonat: 6 };
    expect(lehrauftragEinkuenfte(lehre, 0)).toBeCloseTo(360 / 2, 2);
    expect(lehrauftragEinkuenfte(lehre, 1)).toBeCloseTo(360, 2);
  });
});

describe('Professurpfad', () => {
  it('ist 0, wenn nicht aktiv', () => {
    expect(professurBrutto(LEHRE_DEFAULT, 6)).toBe(0);
  });

  it('liefert 0 vor dem Startjahr und das volle Brutto ab dann', () => {
    const lehre = { ...LEHRE_DEFAULT, professurAktiv: true, professurStartjahr: 6, professurBeschaeftigungsgrad: 1.0 };
    expect(professurBrutto(lehre, 5)).toBe(0);
    expect(professurBrutto(lehre, 6)).toBeCloseTo(78_000, 2);
    expect(professurBrutto(lehre, 9)).toBeCloseTo(78_000, 2);
  });

  it('skaliert mit dem Beschaeftigungsgrad', () => {
    const lehre = { ...LEHRE_DEFAULT, professurAktiv: true, professurStartjahr: 0, professurBeschaeftigungsgrad: 0.5 };
    expect(professurBrutto(lehre, 0)).toBeCloseTo(39_000, 2);
  });
});
