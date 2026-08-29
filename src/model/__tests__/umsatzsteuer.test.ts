import { describe, expect, it } from 'vitest';
import { RECHTSGROESSEN_2025 as RG } from '../konstanten';
import { kleinunternehmerVerlauf, nettoAusBrutto } from '../steuer/umsatzsteuer';

describe('Umsatzsteuer bei brutto fixierten Endkundenpreisen', () => {
  it('mindert den Erloes, statt ihn aufzuschlagen', () => {
    // 2.142 / 1,19 = 1.800,00 — der Preis bleibt, der Erloes sinkt.
    expect(nettoAusBrutto(2_142, true, RG)).toBeCloseTo(1_800, 2);
  });

  it('laesst den Erloes unberuehrt, wenn nicht steuerpflichtig', () => {
    expect(nettoAusBrutto(2_142, false, RG)).toBe(2_142);
  });

  it('schlaegt die Steuer nicht auf (Gegenprobe)', () => {
    expect(nettoAusBrutto(1_000, true, RG)).toBeLessThan(1_000);
  });
});

describe('Kleinunternehmerregelung § 19 UStG ab 2025', () => {
  it('bleibt bestehen, solange Vorjahr <= 25.000 und laufendes Jahr <= 100.000', () => {
    const verlauf = kleinunternehmerVerlauf([20_000, 24_000, 22_000], true, RG);
    expect(verlauf.map((v) => v.kleinunternehmer)).toEqual([true, true, true]);
  });

  it('entfaellt im Folgejahr, sobald die Vorjahresgrenze gerissen wird', () => {
    // Jahr 0: 20.000 -> KU. Jahr 1: 26.000 -> im Jahr selbst noch KU
    // (100.000 nicht gerissen), aber ab Jahr 2 entfaellt die Regelung.
    const verlauf = kleinunternehmerVerlauf([20_000, 26_000, 30_000, 30_000], true, RG);
    expect(verlauf[0]?.kleinunternehmer).toBe(true);
    expect(verlauf[1]?.kleinunternehmer).toBe(true);
    expect(verlauf[2]?.kleinunternehmer).toBe(false);
    expect(verlauf[2]?.grund).toBe('vorjahr');
  });

  it('entfaellt sofort, wenn die 100.000-EUR-Grenze im laufenden Jahr faellt', () => {
    const verlauf = kleinunternehmerVerlauf([120_000, 130_000], true, RG);
    expect(verlauf[0]?.kleinunternehmer).toBe(false);
    expect(verlauf[0]?.grund).toBe('laufendes_jahr');
    expect(verlauf[0]?.schwelleGerissen).toBe(true);
  });

  it('kehrt nicht automatisch in die Kleinunternehmerregelung zurueck', () => {
    // Ein Rueckwechsel waere antragsgebunden. Automatik wuerde das Ergebnis
    // stillschweigend beschoenigen.
    const verlauf = kleinunternehmerVerlauf([20_000, 40_000, 10_000, 10_000], true, RG);
    expect(verlauf[2]?.kleinunternehmer).toBe(false);
    expect(verlauf[3]?.kleinunternehmer).toBe(false);
  });

  it('bleibt aus, wenn die Regelung nicht gewaehlt wurde', () => {
    const verlauf = kleinunternehmerVerlauf([5_000, 5_000], false, RG);
    expect(verlauf.every((v) => !v.kleinunternehmer)).toBe(true);
    expect(verlauf[0]?.grund).toBe('manuell_aus');
  });
});
