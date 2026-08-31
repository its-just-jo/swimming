import { describe, expect, it } from 'vitest';
import { berechneBreakEven } from '../breakeven';
import { szenarioDefault } from '../defaults';

describe('berechneBreakEven', () => {
  it('liefert einen Punkt je Reduktionsstufe (100/80/60/50/0 %)', () => {
    const szenario = szenarioDefault('b1');
    const punkte = berechneBreakEven(szenario, 0);
    expect(punkte.map((p) => p.beschaeftigungsgrad)).toEqual([1.0, 0.8, 0.6, 0.5, 0.0]);
  });

  it('bei Vollzeit (100 %) ist die Luecke gegenueber der Baseline 0', () => {
    const szenario = szenarioDefault('b2');
    const punkte = berechneBreakEven(szenario, 0);
    expect(punkte[0]?.luecke).toBeCloseTo(0, 2);
    expect(punkte[0]?.benoetigteWasserstundenProWoche).toBeCloseTo(0, 2);
  });

  it('die Luecke waechst mit sinkendem Beschaeftigungsgrad', () => {
    const szenario = szenarioDefault('b3');
    const punkte = berechneBreakEven(szenario, 0);
    const luecken = punkte.map((p) => p.luecke);
    for (let i = 1; i < luecken.length; i++) {
      expect(luecken[i]!).toBeGreaterThan(luecken[i - 1]!);
    }
  });

  it('benoetigt bei 0 % Beschaeftigungsgrad mehr Wasserstunden als bei 80 %', () => {
    const szenario = szenarioDefault('b4');
    const punkte = berechneBreakEven(szenario, 0);
    const bei80 = punkte.find((p) => p.beschaeftigungsgrad === 0.8)!;
    const bei0 = punkte.find((p) => p.beschaeftigungsgrad === 0.0)!;
    expect(bei0.benoetigteWasserstundenProWoche).toBeGreaterThan(bei80.benoetigteWasserstundenProWoche);
  });
});
