import { describe, expect, it } from 'vitest';
import { bonusFaktor, bruttoImJahr } from '../anstellung';
import { ANSTELLUNG_DEFAULT } from '../defaults';

describe('Bonusskalierung bei Teilzeit', () => {
  it('zahlt bei Vollzeit immer den vollen Bonus', () => {
    // Der haeufigste Modellfehler waere `bonus * grad * skalierung` — das
    // wuerde den Bonus schon bei Vollzeit kuerzen.
    expect(bonusFaktor(1.0, 0.8)).toBeCloseTo(1.0, 6);
    expect(bonusFaktor(1.0, 1.0)).toBeCloseTo(1.0, 6);
  });

  it('faellt bei Skalierung 1,0 exakt proportional', () => {
    expect(bonusFaktor(0.8, 1.0)).toBeCloseTo(0.8, 6);
    expect(bonusFaktor(0.6, 1.0)).toBeCloseTo(0.6, 6);
  });

  it('faellt bei Skalierung 0,8 ueberproportional', () => {
    // 1 - (1 - 0,8) / 0,8 = 1 - 0,25 = 0,75
    expect(bonusFaktor(0.8, 0.8)).toBeCloseTo(0.75, 6);
    // 1 - (1 - 0,6) / 0,8 = 1 - 0,5 = 0,5
    expect(bonusFaktor(0.6, 0.8)).toBeCloseTo(0.5, 6);
  });

  it('wird nie negativ', () => {
    // 1 - 0,5 / 0,4 = -0,25 -> auf 0 begrenzt
    expect(bonusFaktor(0.5, 0.4)).toBe(0);
    expect(bonusFaktor(0, 0.8)).toBe(0);
  });
});

describe('Bruttoentgelt im Jahresverlauf', () => {
  it('Vollzeit im ersten Jahr entspricht den Defaults', () => {
    const e = bruttoImJahr(ANSTELLUNG_DEFAULT, 0);
    expect(e.grundgehalt).toBeCloseTo(85_000, 2);
    expect(e.bonus).toBeCloseTo(12_500, 2);
    expect(e.gesamt).toBeCloseTo(97_500, 2);
  });

  it('80 % Beschaeftigungsgrad mit Skalierung 0,8', () => {
    // Grundgehalt 85.000 * 0,8 = 68.000
    // Bonus       12.500 * 0,75 = 9.375
    // Gesamt      77.375
    const e = bruttoImJahr({ ...ANSTELLUNG_DEFAULT, beschaeftigungsgrad: 0.8 }, 0);
    expect(e.grundgehalt).toBeCloseTo(68_000, 2);
    expect(e.bonus).toBeCloseTo(9_375, 2);
    expect(e.gesamt).toBeCloseTo(77_375, 2);
  });

  it('60 % Beschaeftigungsgrad faellt unter die Beitragsbemessungsgrenze', () => {
    // 85.000 * 0,6 = 51.000 < 66.150 — die entscheidende Kante des Modells
    const e = bruttoImJahr({ ...ANSTELLUNG_DEFAULT, beschaeftigungsgrad: 0.6 }, 0);
    expect(e.grundgehalt).toBeCloseTo(51_000, 2);
    expect(e.bonus).toBeCloseTo(6_250, 2);
  });

  it('schreibt das Gehalt mit 2,5 % p. a. fort', () => {
    // 85.000 * 1,025^5 = 96.168,86
    const e = bruttoImJahr(ANSTELLUNG_DEFAULT, 5);
    expect(e.grundgehalt).toBeCloseTo(85_000 * 1.025 ** 5, 2);
  });
});
