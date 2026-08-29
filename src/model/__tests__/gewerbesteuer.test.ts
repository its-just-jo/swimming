import { describe, expect, it } from 'vitest';
import { RECHTSGROESSEN_2025 as RG } from '../konstanten';
import { berechneGewerbesteuer } from '../steuer/gewerbesteuer';

describe('Gewerbesteuer und Anrechnung nach § 35 EStG', () => {
  it('zieht den Freibetrag von 24.500 EUR ab', () => {
    // Gewinn 40.000 - 24.500 = 15.500; Messbetrag 15.500 * 3,5 % = 542,50
    const e = berechneGewerbesteuer({
      gewinn: 40_000,
      hebesatz: 360,
      anrechenbareEinkommensteuer: 20_000,
      rg: RG,
    });
    expect(e.nachFreibetrag).toBeCloseTo(15_500, 2);
    expect(e.messbetrag).toBeCloseTo(542.5, 2);
    // 542,50 * 3,60 = 1.953,00
    expect(e.gewerbesteuer).toBeCloseTo(1_953, 2);
  });

  it('neutralisiert die Belastung bei Hebesatz 360 % vollstaendig', () => {
    // Anrechnungsvolumen 542,50 * 4,0 = 2.170 > gezahlte 1.953
    // -> Anrechnung 1.953, Nettobelastung 0
    const e = berechneGewerbesteuer({
      gewinn: 40_000,
      hebesatz: 360,
      anrechenbareEinkommensteuer: 20_000,
      rg: RG,
    });
    expect(e.tatsaechlicheAnrechnung).toBeCloseTo(1_953, 2);
    expect(e.nettobelastung).toBeCloseTo(0, 2);
  });

  it('laesst oberhalb von rund 400 % Hebesatz eine Restbelastung stehen', () => {
    // 542,50 * 4,60 = 2.495,50 gezahlt, Anrechnung gedeckelt auf 2.170
    const e = berechneGewerbesteuer({
      gewinn: 40_000,
      hebesatz: 460,
      anrechenbareEinkommensteuer: 20_000,
      rg: RG,
    });
    expect(e.gewerbesteuer).toBeCloseTo(2_495.5, 2);
    expect(e.tatsaechlicheAnrechnung).toBeCloseTo(2_170, 2);
    expect(e.nettobelastung).toBeCloseTo(325.5, 2);
  });

  it('faellt unterhalb des Freibetrags nicht an', () => {
    const e = berechneGewerbesteuer({
      gewinn: 20_000,
      hebesatz: 360,
      anrechenbareEinkommensteuer: 5_000,
      rg: RG,
    });
    expect(e.gewerbesteuer).toBe(0);
    expect(e.nettobelastung).toBe(0);
  });

  it('begrenzt die Anrechnung auf die tatsaechlich anfallende Einkommensteuer', () => {
    const e = berechneGewerbesteuer({
      gewinn: 40_000,
      hebesatz: 360,
      anrechenbareEinkommensteuer: 500,
      rg: RG,
    });
    expect(e.tatsaechlicheAnrechnung).toBeCloseTo(500, 2);
    expect(e.nettobelastung).toBeCloseTo(1_453, 2);
  });
});
