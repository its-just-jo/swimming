import { describe, expect, it } from 'vitest';
import { RECHTSGROESSEN_2025 as RG } from '../konstanten';
import { berechneRentenwirkung } from '../rente';

describe('Rentenwirkung', () => {
  it('gleicher Bruttolohn wie die Baseline und keine Selbststaendigkeit ergibt Differenz 0', () => {
    const e = berechneRentenwirkung({
      bruttolohnSzenario: 85_000,
      bruttolohnBaseline: 85_000,
      drvBeitragSelbstaendigkeit: 0,
      jahre: 1,
      rg: RG,
    });
    expect(e.differenzEntgeltpunkte).toBeCloseTo(0, 6);
    expect(e.rentendifferenzProMonat).toBeCloseTo(0, 6);
  });

  it('weniger Lohn ohne Ausgleich durch Selbststaendigkeit senkt die Rente', () => {
    // EP Anstellung = 51.000 / 50.493 = 1,01004; EP Baseline = 85.000 / 50.493 = 1,68337
    // (85.000 > BBG RV 96.600 nicht relevant hier, kein Deckel noetig)
    const e = berechneRentenwirkung({
      bruttolohnSzenario: 51_000,
      bruttolohnBaseline: 85_000,
      drvBeitragSelbstaendigkeit: 0,
      jahre: 1,
      rg: RG,
    });
    expect(e.entgeltpunkteAnstellung).toBeCloseTo(51_000 / RG.durchschnittsentgeltRv, 4);
    expect(e.entgeltpunkteBaseline).toBeCloseTo(85_000 / RG.durchschnittsentgeltRv, 4);
    expect(e.differenzEntgeltpunkte).toBeLessThan(0);
    expect(e.rentendifferenzProMonat).toBeLessThan(0);
  });

  it('DRV-Beitrag aus Selbststaendigkeit gleicht die Luecke teilweise aus', () => {
    const ohneAusgleich = berechneRentenwirkung({
      bruttolohnSzenario: 51_000,
      bruttolohnBaseline: 85_000,
      drvBeitragSelbstaendigkeit: 0,
      jahre: 1,
      rg: RG,
    });
    const mitAusgleich = berechneRentenwirkung({
      bruttolohnSzenario: 51_000,
      bruttolohnBaseline: 85_000,
      drvBeitragSelbstaendigkeit: 5_580, // 30.000 * 18,6 %
      jahre: 1,
      rg: RG,
    });
    expect(mitAusgleich.entgeltpunkteSelbstaendigkeit).toBeCloseTo(
      5_580 / (RG.durchschnittsentgeltRv * RG.rvSatz),
      4,
    );
    expect(mitAusgleich.differenzEntgeltpunkte).toBeGreaterThan(ohneAusgleich.differenzEntgeltpunkte);
  });

  it('deckelt Entgeltpunkte auf die BBG RV/ALV', () => {
    const e = berechneRentenwirkung({
      bruttolohnSzenario: 200_000,
      bruttolohnBaseline: 85_000,
      drvBeitragSelbstaendigkeit: 0,
      jahre: 1,
      rg: RG,
    });
    expect(e.entgeltpunkteAnstellung).toBeCloseTo(RG.bbgRvAlv / RG.durchschnittsentgeltRv, 4);
  });

  it('skaliert die Entgeltpunkte mit der Anzahl der Jahre', () => {
    const einJahr = berechneRentenwirkung({
      bruttolohnSzenario: 85_000,
      bruttolohnBaseline: 51_000,
      drvBeitragSelbstaendigkeit: 0,
      jahre: 1,
      rg: RG,
    });
    const dreiJahre = berechneRentenwirkung({
      bruttolohnSzenario: 85_000,
      bruttolohnBaseline: 51_000,
      drvBeitragSelbstaendigkeit: 0,
      jahre: 3,
      rg: RG,
    });
    expect(dreiJahre.differenzEntgeltpunkte).toBeCloseTo(einJahr.differenzEntgeltpunkte * 3, 6);
  });
});
